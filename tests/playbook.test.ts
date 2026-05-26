import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type PlaybookGenerateInput,
  type PlaybookOutput,
  playbookGenerateInputSchema,
  playbookOutputSchema,
} from "../src/contracts/playbook.js";
import { createApp } from "../src/http/app.js";
import type { PlaybookEngine } from "../src/playbook/engine.js";
import { PlaybookService } from "../src/playbook/service.js";
import { buildCycleMemory } from "../src/playbook/service.js";
import { prototypeMatrix } from "../src/prototype/matrix.js";
import { prototypeRouteSchema } from "../src/contracts/prototype.js";
import { FileStore } from "../src/storage/file-store.js";

let tempDir: string;
let store: FileStore;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "nucleo-playbook-test-"));
  store = new FileStore(join(tempDir, "store.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("Playbook y memoria de ciclo", () => {
  it("genera Playbook solo para ruta Avanzar y cierra memoria colectiva", async () => {
    const service = new PlaybookService(new FakePlaybookEngine(), store);
    const input = buildInput("advance");

    const record = await service.generate(input);
    const stored = await service.get(input.cycleId);
    const memories = await service.listCompanyMemory("company-1");
    const audit = await store.listAuditEvents(input.cycleId);

    expect(record.playbook?.validatedMove).toContain("piloto ampliado");
    expect(record.memory.visibility).toBe("company_readonly");
    expect(stored?.playbook).not.toBeNull();
    expect(memories).toHaveLength(1);
    expect(memories[0]?.memory.selectedIdea).toBe("Contrato con garantía de visibilidad");
    expect(audit.some((event) => event.stage === "PLAYBOOK")).toBe(true);
    expect(audit.some((event) => event.stage === "MEMORY")).toBe(true);
  });

  it("si la ruta no avanza, guarda memoria sin Playbook de escala", async () => {
    const service = new PlaybookService(new ThrowingPlaybookEngine(), store);
    const input = buildInput("iterate");

    const record = await service.generate(input);

    expect(record.playbook).toBeNull();
    expect(record.memory.methodologicalRoute).toBe("iterate");
    expect(record.memory.nextRecommendedMove).toContain("Iterar");
  });

  it("exige override ejecutivo para avanzar contra la recomendación IA", async () => {
    const service = new PlaybookService(new FakePlaybookEngine(), store);

    await expect(
      service.generate({
        ...buildInput("iterate"),
        methodologicalRoute: "advance",
      }),
    ).rejects.toThrow(/override/i);
  });

  it("permite override ejecutivo trazable y guarda recomendación original", async () => {
    const service = new PlaybookService(new FakePlaybookEngine(), store);
    const record = await service.generate({
      ...buildInput("iterate"),
      methodologicalRoute: "advance",
      override: {
        reason:
          "Dirección decide avanzar por oportunidad comercial crítica aunque la IA recomendó iterar.",
        changedBy: "license-1",
        changedAt: new Date().toISOString(),
      },
    });

    expect(record.playbook).not.toBeNull();
    expect(record.recommendedRoute).toBe("iterate");
    expect(record.methodologicalRoute).toBe("advance");
    expect(record.override?.reason).toContain("oportunidad comercial");
  });

  it("rechaza Playbook que contradice lo que el artefacto no valida", async () => {
    const service = new PlaybookService(new OverOptimisticPlaybookEngine(), store);

    await expect(service.generate(buildInput("advance"))).rejects.toThrow(
      /contradice limites/i,
    );
  });

  it("construye memoria de ciclo con contrato explícito para rutas sin avance", () => {
    const memory = buildCycleMemory(buildInput("invalidate_signal"));

    expect(memory.visibility).toBe("company_readonly");
    expect(memory.methodologicalRoute).toBe("invalidate_signal");
    expect(memory.validatedAssumptions).toEqual([]);
    expect(memory.patternsToAvoid.join(" ")).toMatch(/evidencia insuficiente/i);
  });

  it("rechaza rutas metodológicas fuera del contrato", () => {
    expect(() =>
      playbookGenerateInputSchema.parse({
        ...buildInput("advance"),
        methodologicalRoute: "green_gate",
      }),
    ).toThrow();
  });

  it("mantiene health con Playbook y memoria listos", async () => {
    const response = await createApp().request("/api/health");
    const body = await response.json();

    expect(body.playbook).toBe("ready");
    expect(body.cycleMemory).toBe("ready");
  });

  it("expone capacidades internas sin filtrar secretos", async () => {
    const response = await createApp().request("/api/system/capabilities");
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(body.phases.playbook).toBe("ready");
    expect(body.ai.openaiConfigured).toEqual(expect.any(Boolean));
    expect(body.contracts).toContain("masterCycleState");
    expect(serialized).not.toMatch(/sk-/i);
    expect(serialized).not.toContain(process.env.OPENAI_API_KEY ?? "not-a-real-key");
  });
});

class FakePlaybookEngine implements PlaybookEngine {
  async generate(): Promise<PlaybookOutput> {
    return playbookOutputSchema.parse({
      executiveDecision:
        "Avanzar con un piloto ampliado porque la evidencia muestra compromiso observable y riesgo controlable dentro del alcance probado.",
      validatedMove:
        "Ejecutar piloto ampliado de la oferta con visibilidad mensual.",
      whyNow:
        "La evidencia no valida escala completa, pero sí justifica pasar de conversación aislada a ejecución controlada con revisión gerencial.",
      evidenceChain: {
        prototype: "Ficha de oferta",
        result: "1 registro con siguiente paso concreto.",
        reading: "Avanzar con control de falso positivo.",
        action: "Piloto ampliado con revisión semanal.",
      },
      operatingPrinciple:
        "Mantener visible el supuesto probado y no vender escala antes de repetir evidencia.",
      implementationPlan: [
        {
          horizon: "0-30 días",
          objective: "Preparar piloto ampliado controlado.",
          actions: ["Ajustar ficha con ejemplo real.", "Elegir clientes próximos a renovación."],
          owner: "Líder comercial",
          decisionMetric: "Reuniones con decisor agendadas.",
        },
        {
          horizon: "31-60 días",
          objective: "Ejecutar y comparar evidencia.",
          actions: ["Registrar señales cerradas.", "Revisar objeciones corregibles."],
          owner: "Equipo comercial",
          decisionMetric: "Compromisos observables repetidos.",
        },
        {
          horizon: "61-90 días",
          objective: "Decidir integración o nueva iteración.",
          actions: ["Revisar condiciones de avance.", "Documentar aprendizajes no repetibles."],
          owner: "Gerencia",
          decisionMetric: "Decisión gerencial trazable.",
        },
      ],
      owners: ["Gerencia comercial", "Operación"],
      requiredResources: ["Ficha ajustada", "Ejemplo de tablero"],
      metricsToMonitor: [
        {
          label: "Siguiente paso",
          target: "3+",
          evidenceSource: "Registros de compradores.",
        },
        {
          label: "Objeción corregible",
          target: "Mayoría",
          evidenceSource: "Lectura de evidencia.",
        },
      ],
      risksAndControls: [
        {
          risk: "Confundir cortesía con compromiso.",
          control: "Exigir acción fechada o decisor identificado.",
        },
        {
          risk: "Prometer tablero no construido.",
          control: "Mostrar solo ejemplo mínimo y alcance limitado.",
        },
      ],
      reviewCadence: "Revisión semanal durante el piloto ampliado.",
      stopOrIterateConditions: [
        "Iterar si no aparece decisor claro.",
        "Detener si el valor no se diferencia del contrato actual.",
      ],
      whatNotToRepeat: ["No vender software separado.", "No ocultar límites de la prueba."],
      exportSummary:
        "Playbook ejecutivo para ampliar el piloto con trazabilidad de evidencia, responsables, recursos, riesgos y criterios de revisión.",
    });
  }
}

class ThrowingPlaybookEngine implements PlaybookEngine {
  async generate(): Promise<PlaybookOutput> {
    throw new Error("No debe generar Playbook cuando la ruta no avanza.");
  }
}

class OverOptimisticPlaybookEngine implements PlaybookEngine {
  async generate(): Promise<PlaybookOutput> {
    return {
      ...(await new FakePlaybookEngine().generate()),
      executiveDecision:
        "Avanzar porque la escala completa y la adopción sostenida quedaron probadas con este artefacto.",
    };
  }
}

function buildInput(
  methodologicalRoute: PlaybookGenerateInput["methodologicalRoute"],
): PlaybookGenerateInput {
  const route = prototypeRouteSchema.parse(
    prototypeMatrix.find((item) => item.id === "commercial_offer"),
  );
  return {
    cycleId: "cycle-playbook",
    companyId: "company-1",
    licenseId: "license-1",
    registration: {
      companyId: "company-1",
      licenseId: "license-1",
    },
    diagnosis: {
      recommendedChallenge: "Hacer visible el valor preventivo.",
    },
    signals: {
      gaps: [{ title: "Prevención invisible" }],
      insights: [{ title: "El administrador necesita evidencia defendible" }],
    },
    idea: {
      idea: "Contrato con garantía de visibilidad",
      supuestoQueRompe: "La renovación depende de precio y relación.",
      mecanicaConcreta: "Ritual mensual de evidencia visible.",
    },
    route,
    artifact: {
      title: "Ficha de oferta con visibilidad",
      artifactType: "Ficha de oferta",
      method: "Conversación comercial",
      objective:
        "Probar si la visibilidad mensual aumenta intención de siguiente paso.",
      howToUse:
        "Presentar la ficha en conversación comercial y registrar compromiso observable.",
      validates: ["Comprensión de valor", "Interés observable"],
      doesNotValidate: ["Escala completa", "Adopción sostenida"],
      artifact: [
        { label: "Promesa", content: "Visibilidad mensual para renovar con evidencia." },
        { label: "Comparación", content: "Contrato actual versus nuevo paquete." },
        { label: "Prueba", content: "Ejemplo mínimo de tablero mensual." },
        { label: "Cierre", content: "Solicitud de siguiente paso concreto." },
      ],
      testQuestions: [
        "¿Pidió siguiente paso concreto?",
        "¿Identificó valor diferencial?",
        "¿Apareció pagador claro?",
      ],
      advanceSignals: ["Reunión agendada", "Pagador identificado"],
      stopSignals: ["No entiende valor", "Lo compara con capacitación"],
      falsePositive:
        "El comprador puede aceptar reunión por cortesía y no por compromiso.",
      falseNegative:
        "El ejemplo puede ser insuficiente aunque el concepto tenga valor.",
      avoidMisread: [
        "No confundir interés verbal con compromiso.",
        "No extrapolar a escala desde una conversación.",
      ],
      decisionReading: {
        advance: "Avanzar si aparecen compromisos repetidos.",
        iterate: "Iterar si hay interés sin pagador claro.",
        rethink: "Replantear si no se entiende el valor.",
      },
      evidenceScope: {
        sample: "5 a 8 conversaciones con compradores reales.",
        sampleTargetMin: 5,
        sampleTargetMax: 8,
        validates:
          "Comprensión inicial del valor y posibilidad de siguiente paso comercial.",
        doesNotValidate:
          "Escala completa, adopción sostenida ni impacto financiero final.",
        thresholds: {
          advance: "3 o más compromisos observables.",
          iterate: "1 a 2 compromisos o objeciones corregibles.",
          rethink: "Sin compromisos ni valor diferencial claro.",
        },
      },
      limits: ["No prueba escala.", "No prueba retención final."],
      nextStep: "Ejecutar conversaciones con compradores reales.",
    },
    records: [
      {
        id: "record-1",
        closedValues: { asked_next_step: "Sí" },
        values: { resultado: "Pidió reunión con comité." },
        createdAt: new Date().toISOString(),
      },
    ],
    evidenceReading: {
      decision: methodologicalRoute === "advance" ? "Avanzar" : "Iterar",
      confidence: methodologicalRoute === "advance" ? "Media" : "Baja",
      testedAssumption: "La renovación depende de precio y relación.",
      methodologicalRoute,
      methodologicalRationale:
        methodologicalRoute === "advance"
          ? "La evidencia justifica avanzar de forma controlada."
          : "Iterar antes de avanzar porque la muestra sigue siendo insuficiente.",
      rationale:
        "La evidencia muestra acción observable, pero debe mantenerse dentro del alcance del artefacto.",
      evidenceSupports: ["Pidió reunión con comité."],
      weakOrMissingEvidence: ["Falta ampliar la muestra."],
      falsePositiveRisk:
        "Puede ser cortesía si no se confirma con más compradores.",
      falseNegativeRisk:
        "La ficha puede ocultar valor si no muestra ejemplo visual.",
      learning:
        "El valor de visibilidad se entiende cuando se conecta con renovación.",
      nextStep: "Iterar la ficha y ampliar conversaciones.",
    },
    methodologicalRoute,
  };
}
