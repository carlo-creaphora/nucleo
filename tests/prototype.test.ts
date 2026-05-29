import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  prototypeArtifactSchema,
  prototypeBuildInputSchema,
  prototypeIdeaTypeSchema,
  prototypePhaseStateSchema,
  prototypeRouteSchema,
  type PrototypeArtifact,
  type PrototypeBuildInput,
  type PrototypeClassifyInput,
  type PrototypeClassification,
} from "../src/contracts/prototype.js";
import { createApp } from "../src/http/app.js";
import type { PrototypeEngine } from "../src/prototype/engine.js";
import { prototypeIdeaTypes, prototypeMatrix } from "../src/prototype/matrix.js";
import { PrototypeService } from "../src/prototype/service.js";
import {
  prototypeTemplates,
  renderPrototypeTemplatesForPrompt,
} from "../src/prototype/templates.js";
import { FileStore } from "../src/storage/file-store.js";

let tempDir: string;
let store: FileStore;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "nucleo-prototype-test-"));
  store = new FileStore(join(tempDir, "store.json"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("Prototipado", () => {
  it("mantiene una matriz completa: 5 tipos, 2 rutas por tipo y campos críticos por ruta", () => {
    expect(prototypeIdeaTypes).toEqual(prototypeIdeaTypeSchema.options);

    for (const ideaType of prototypeIdeaTypeSchema.options) {
      expect(
        prototypeMatrix.filter((route) => route.ideaType === ideaType),
      ).toHaveLength(2);
    }

    for (const route of prototypeMatrix) {
      const parsed = prototypeRouteSchema.parse(route);
      expect(route.buildFields.length).toBeGreaterThanOrEqual(5);
      expect(parsed.output.length).toBeGreaterThanOrEqual(4);
      expect(parsed.questions.length).toBeGreaterThanOrEqual(4);
      expect(parsed.advanceSignals.length).toBeGreaterThanOrEqual(2);
      expect(parsed.stopSignals.length).toBeGreaterThanOrEqual(2);
      expect(parsed.avoidMisread.length).toBeGreaterThanOrEqual(2);
      expect(parsed.evidenceScope.sampleTargetMin).toBeGreaterThan(0);
      expect(parsed.evidenceScope.sampleTargetMax).toBeGreaterThanOrEqual(
        parsed.evidenceScope.sampleTargetMin,
      );
      expect(parsed.evidenceScope.thresholds.advance).toContain("Avanzar");
      expect(parsed.evidenceScope.thresholds.iterate).toContain("Iterar");
      expect(parsed.evidenceScope.thresholds.rethink).toContain("Replantear");
    }
  });

  it("mantiene una plantilla operativa por cada ruta de prototipado", () => {
    const routeIds = prototypeMatrix.map((route) => route.id).sort();
    const templateRouteIds = prototypeTemplates
      .map((template) => template.routeId)
      .sort();

    expect(templateRouteIds).toEqual(routeIds);

    for (const template of prototypeTemplates) {
      expect(template.requiredPieces.length).toBeGreaterThanOrEqual(8);
      expect(template.guidance.length).toBeGreaterThan(80);
    }
  });

  it("inyecta las plantillas de ruta en el prompt de prototipado", () => {
    const rendered = renderPrototypeTemplatesForPrompt();

    for (const route of prototypeMatrix) {
      expect(rendered).toContain(`Ruta: ${route.id}`);
    }

    expect(rendered).toContain("Piezas obligatorias");
    expect(rendered).toContain("Guia");
  });

  it("rechaza rutas con tipos de idea fuera de la matriz", () => {
    expect(() =>
      prototypeRouteSchema.parse({
        ...prototypeMatrix[0],
        ideaType: "Pilar heredado",
      }),
    ).toThrow();
  });

  it("exige artefactos completos con alcance, umbrales, preguntas y riesgo de mala lectura", () => {
    const artifact = buildArtifact();

    expect(() => prototypeArtifactSchema.parse(artifact)).not.toThrow();

    const incomplete = {
      ...artifact,
      evidenceScope: undefined,
    };

    expect(() => prototypeArtifactSchema.parse(incomplete)).toThrow();
  });

  it("valida el contrato de input para generación sin aceptar rutas incompletas", () => {
    const input = buildInput();

    expect(() => prototypeBuildInputSchema.parse(input)).not.toThrow();
    expect(() =>
      prototypeBuildInputSchema.parse({
        ...input,
        route: {
          ...input.route,
          evidenceScope: undefined,
        },
      }),
    ).toThrow();
  });

  it("persiste clasificación, ruta, campos del constructor y artefacto generado", async () => {
    const service = new PrototypeService(new FakePrototypeEngine(), store);
    const input = buildInput();

    await service.save({
      cycleId: input.cycleId,
      prototypeRouteId: input.route.id,
      prototypeIdeaType: input.route.ideaType,
      prototypeClassification: {
        evaluationDecision: buildEvaluationDecision(),
        ideaId: "idea-1",
        ideaType: input.route.ideaType,
        rationale: "La idea modifica el paquete comercial y la forma de acceso.",
      },
      prototypeBuilderValues: {
        [input.route.id]: {
          comprador: "Administrador de edificio",
        },
      },
    });

    const artifact = await service.build(input);
    const stored = await service.get(input.cycleId);
    const audit = await store.listAuditEvents(input.cycleId);

    expect(artifact.title).toBe("Ficha de oferta testeable");
    expect(stored?.prototypeRouteId).toBe(input.route.id);
    expect(stored?.prototypeIdeaType).toBe("Modelo comercial / acceso");
    expect(stored?.prototypeClassification?.ideaId).toBe("idea-1");
    expect(stored?.prototypeBuilderValues[input.route.id]?.comprador).toBe(
      "Administrador de edificio",
    );
    expect(stored?.prototypeBuilderValues[input.route.id]?.paquete).toBe(
      "Garantía mensual de visibilidad",
    );
    expect(stored?.prototypeArtifact?.artifact.title).toBe(
      "Ficha de oferta testeable",
    );
    expect(audit.some((event) => event.stage === "PROTOTYPE")).toBe(true);
  });

  it("normaliza estado parcial de fase con builderValues vacío", () => {
    const parsed = prototypePhaseStateSchema.parse({
      cycleId: "cycle-prototype",
    });

    expect(parsed.prototypeBuilderValues).toEqual({});
  });

  it("mantiene health con Prototipado listo", async () => {
    const response = await createApp().request("/api/health");
    const body = await response.json();

    expect(body.prototype).toBe("ready");
  });
});

class FakePrototypeEngine implements PrototypeEngine {
  async build(input: PrototypeBuildInput): Promise<PrototypeArtifact> {
    return {
      ...buildArtifact(),
      method: input.route.method,
      artifactType: input.route.artifact,
      evidenceScope: input.route.evidenceScope,
    };
  }

  async classify(input: PrototypeClassifyInput): Promise<PrototypeClassification> {
    return {
      evaluationDecision: buildEvaluationDecision(),
      ideaType: input.availableIdeaTypes[0]!,
      rationale: "Clasificación válida dentro de los tipos permitidos por la matriz.",
    };
  }
}

function buildEvaluationDecision() {
  return {
    criticalAssumptions:
      "El comprador necesita evidencia temprana antes de aprobar una implementacion completa.",
    firstThingToTest:
      "Probar una oferta acotada con compradores reales y registrar si aceptan un siguiente paso observable.",
    risksToWatch:
      "No leer interes verbal como decision de compra ni extrapolar resultados con muestra insuficiente.",
  };
}

function buildInput(): PrototypeBuildInput {
  const route = prototypeRouteSchema.parse(
    prototypeMatrix.find((item) => item.id === "commercial_offer"),
  );

  return {
    cycleId: "cycle-prototype",
    route,
    idea: {
      idea: "Contrato con garantía de visibilidad",
      supuestoQueRompe: "El mantenimiento solo vale cuando ocurre una falla.",
      mecanicaConcreta: "Paquete mensual con tablero visible de riesgo evitado.",
      porQueFunciona: "Hace defendible la continuidad antes de la falla.",
      casoAnalogo: "Garantías de uptime en software empresarial.",
      metricaQueMueve: "Renovación mensual",
      primerPasoEjecutable: "Probar con cinco administradores próximos a renovar.",
      antiPatronesAEvitar: ["Prometer automatización no construida."],
    },
    diagnosis: {
      recommendedChallenge: "Hacer visible el valor preventivo.",
    },
    signals: {
      gaps: [],
      insights: [],
    },
    evaluationDecision: {
      criticalAssumptions: "El comprador paga por evidencia defendible.",
      firstThingToTest: "Si pide reunión, propuesta o piloto.",
      risksToWatch: "Confundir agrado declarado con intención comercial.",
    },
    builderValues: {
      comprador: "Administrador de edificio",
      paquete: "Garantía mensual de visibilidad",
    },
  };
}

function buildArtifact(): PrototypeArtifact {
  return {
    title: "Ficha de oferta testeable",
    artifactType: "Ficha de oferta",
    method: "Offer test",
    objective:
      "Validar si el comprador entiende el paquete, percibe diferenciación y acepta un siguiente paso comercial.",
    howToUse:
      "Presenta la ficha en conversaciones reales y cierra con una solicitud observable de reunión, propuesta o piloto.",
    validates: [
      "Claridad de paquete",
      "Valor percibido",
      "Interés comercial inicial",
    ],
    doesNotValidate: [
      "Retención sostenida",
      "Margen real completo",
      "Capacidad de entrega a escala",
    ],
    artifact: [
      {
        label: "Promesa",
        content: "Reducir discusiones de mantenimiento con evidencia visible.",
      },
      {
        label: "Paquete",
        content: "Incluye tablero mensual, alertas y reunión ejecutiva corta.",
      },
      {
        label: "Garantía",
        content: "Si no hay evidencia útil en 30 días, se ajusta el alcance.",
      },
      {
        label: "CTA",
        content: "Solicitar una reunión con decisor para revisar piloto.",
      },
    ],
    testQuestions: [
      "¿Qué entiendes que incluye?",
      "¿Qué parte te parece más valiosa?",
      "¿Qué te impediría aprobarlo?",
    ],
    advanceSignals: [
      "Solicita propuesta o reunión.",
      "Identifica valor diferencial.",
    ],
    stopSignals: [
      "No identifica pagador claro.",
      "No diferencia la oferta del contrato actual.",
    ],
    falsePositive:
      "El comprador elogia la oferta por relación comercial, pero no tiene urgencia ni presupuesto.",
    falseNegative:
      "La oferta falla por empaque inicial aunque el problema económico sí existe.",
    avoidMisread: [
      "Pedir siguiente paso concreto.",
      "Separar objeción de precio de objeción de valor.",
    ],
    decisionReading: {
      advance:
        "Avanzar si al menos tres compradores piden propuesta, reunión o piloto concreto.",
      iterate:
        "Iterar si hay interés, pero aparecen dudas repetidas de paquete o precio.",
      rethink:
        "Replantear si no aparece pagador claro ni diferenciación frente al contrato actual.",
    },
    evidenceScope: {
      sample: "5 a 8 conversaciones con compradores reales durante 1 a 2 semanas.",
      sampleTargetMin: 5,
      sampleTargetMax: 8,
      validates:
        "Si el paquete se entiende, si el valor justifica conversación comercial y si aparece intención de siguiente paso.",
      doesNotValidate:
        "No valida cierre sostenido, retención, margen real completo ni capacidad de entrega a escala.",
      thresholds: {
        advance:
          "Avanzar si al menos 3 compradores piden propuesta, reunión con decisor o piloto con condición concreta.",
        iterate:
          "Iterar si hay valor, pero se repiten dudas de paquete, precio, garantía o evidencia requerida.",
        rethink:
          "Replantear si no aparece pagador claro o la oferta no se diferencia del contrato actual.",
      },
    },
    limits: [
      "No es contrato final.",
      "No demuestra operación a escala.",
    ],
    nextStep:
      "Realizar cinco conversaciones comerciales con compradores próximos a renovar.",
  };
}
