import { describe, expect, it } from "vitest";
import type { MasterCycleState } from "../src/contracts/cycle.js";
import {
  type PlaybookGenerateInput,
  playbookOutputSchema,
} from "../src/contracts/playbook.js";
import {
  assertNoUnsupportedOptimism,
  canTransition,
  validateCycleIntegrity,
} from "../src/cycle/governance.js";
import type { EvidenceReading, MethodologicalRoute } from "../src/contracts/results.js";
import { prototypeMatrix } from "../src/prototype/matrix.js";
import { prototypeRouteSchema } from "../src/contracts/prototype.js";

describe("Gobierno interno del ciclo", () => {
  it("bloquea avanzar a Señales sin Diagnóstico confirmado", () => {
    const cycle = buildCycle({
      currentPhase: "diagnosis",
      registration: { companyId: "company-1" },
      diagnosis: null,
    });

    const transition = canTransition("diagnosis", "signals", cycle);

    expect(transition.allowed).toBe(false);
    expect(transition.blockingIssues.join(" ")).toMatch(/Diagnóstico/i);
  });

  it("bloquea Playbook cuando la ruta metodológica no es Avanzar", () => {
    const cycle = buildReadyCycle("iterate");

    const transition = canTransition("reading", "playbook", cycle);

    expect(transition.allowed).toBe(false);
    expect(transition.blockingIssues.join(" ")).toMatch(/Playbook solo aplica/i);
  });

  it("permite cerrar memoria para iterar, descartar o invalidar sin Playbook", () => {
    for (const route of [
      "iterate",
      "discard",
      "invalidate_challenge",
      "invalidate_signal",
    ] as const) {
      const report = validateCycleIntegrity({
        ...buildReadyCycle(route),
        status: "closed",
        currentPhase: "memory",
        playbook: null,
        finalMethodologicalRoute: route,
      });

      expect(report.ready).toBe(true);
    }
  });

  it("detecta cierre sin lectura de evidencia", () => {
    const report = validateCycleIntegrity({
      ...buildReadyCycle("iterate"),
      currentPhase: "memory",
      results: {
        cycleId: "cycle-1",
        prototypeRouteId: "commercial_offer",
        records: [buildRecord()],
        evidenceReading: null,
        methodologicalRoute: "iterate",
      },
      finalMethodologicalRoute: "iterate",
    });

    expect(report.ready).toBe(false);
    expect(report.blockingIssues.join(" ")).toMatch(/Lectura de evidencia/i);
  });

  it("anti-optimismo permite límites explícitos y rechaza validaciones no soportadas", () => {
    const input = buildPlaybookInput();
    const prudentOutput = playbookOutputSchema.parse({
      ...buildPlaybookOutput(),
      whyNow:
        "La evidencia no valida escala completa, pero permite un piloto ampliado controlado.",
    });
    const overOptimisticOutput = playbookOutputSchema.parse({
      ...buildPlaybookOutput(),
      executiveDecision:
        "Avanzar porque la escala completa quedó probada y la adopción sostenida quedó validada.",
    });

    expect(() => assertNoUnsupportedOptimism(prudentOutput, input)).not.toThrow();
    expect(() =>
      assertNoUnsupportedOptimism(overOptimisticOutput, input),
    ).toThrow(/contradice limites/i);
  });
});

function buildCycle(
  overrides: Partial<MasterCycleState> = {},
): MasterCycleState {
  return {
    cycleId: "cycle-1",
    status: "in_progress",
    currentPhase: "registration",
    registration: null,
    diagnosis: null,
    signals: null,
    ideation: null,
    evaluationConfirmed: false,
    evaluationWinnerId: null,
    prototype: null,
    results: null,
    playbook: null,
    finalMethodologicalRoute: null,
    traceability: [],
    ...overrides,
  };
}

function buildReadyCycle(
  route: MethodologicalRoute,
): MasterCycleState {
  const selectedRoute = prototypeRouteSchema.parse(
    prototypeMatrix.find((item) => item.id === "commercial_offer"),
  );

  return buildCycle({
    status: "in_progress",
    currentPhase: "reading",
    registration: { companyId: "company-1" },
    diagnosis: { recommendedChallenge: "Hacer visible el valor preventivo." },
    signals: {
      gaps: [{ title: "Prevención invisible" }],
      insights: [{ title: "Comprador necesita evidencia defendible" }],
    },
    ideation: { ideas: [{ idea: "Contrato con garantía de visibilidad" }] },
    evaluationConfirmed: true,
    evaluationWinnerId: "idea-1",
    prototype: {
      cycleId: "cycle-1",
      prototypeRouteId: selectedRoute.id,
      prototypeIdeaType: selectedRoute.ideaType,
      prototypeClassification: null,
      prototypeBuilderValues: {},
      prototypeArtifact: {
        routeId: selectedRoute.id,
        artifact: buildArtifact(),
      },
    },
    results: {
      cycleId: "cycle-1",
      prototypeRouteId: selectedRoute.id,
      records: [buildRecord()],
      evidenceReading: buildEvidenceReading(route ?? "iterate"),
      methodologicalRoute: route,
    },
    finalMethodologicalRoute: route,
  });
}

function buildPlaybookInput(): PlaybookGenerateInput {
  const route = prototypeRouteSchema.parse(
    prototypeMatrix.find((item) => item.id === "commercial_offer"),
  );

  return {
    cycleId: "cycle-1",
    route,
    artifact: buildArtifact(),
    records: [buildRecord()],
    evidenceReading: buildEvidenceReading("advance"),
    methodologicalRoute: "advance",
  };
}

function buildRecord() {
  return {
    id: "record-1",
    closedValues: { asked_next_step: "Sí" },
    values: { resultado: "Pidió reunión con comité." },
    createdAt: new Date().toISOString(),
  };
}

function buildEvidenceReading(route: MethodologicalRoute): EvidenceReading {
  return {
    decision: route === "advance" ? "Avanzar" : "Iterar",
    confidence: route === "advance" ? "Media" : "Baja",
    testedAssumption: "La renovación depende principalmente de precio.",
    methodologicalRoute: route,
    methodologicalRationale:
      route === "advance"
        ? "La evidencia permite avanzar con control gerencial."
        : "La evidencia todavía exige ajustar el artefacto.",
    rationale:
      "La evidencia muestra compromiso observable dentro del alcance del artefacto, sin extrapolar a escala.",
    evidenceSupports: ["Pidió reunión con comité."],
    weakOrMissingEvidence: ["Falta repetir la señal en más compradores."],
    falsePositiveRisk:
      "La reunión puede ser cortesía si no aparece decisión posterior.",
    falseNegativeRisk:
      "El valor puede no verse si la ficha no muestra ejemplo concreto.",
    learning:
      "La visibilidad mensual ayuda a defender renovación cuando hay evidencia.",
    nextStep: "Ampliar muestra sin cambiar el supuesto probado.",
  };
}

function buildArtifact() {
  return {
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
  };
}

function buildPlaybookOutput() {
  return {
    executiveDecision:
      "Avanzar con piloto ampliado porque existe compromiso observable dentro del alcance probado.",
    validatedMove: "Ejecutar piloto ampliado de visibilidad mensual.",
    whyNow:
      "La evidencia justifica pasar a piloto sin extrapolar más allá de la muestra.",
    evidenceChain: {
      prototype: "Ficha de oferta",
      result: "Un registro con compromiso observable.",
      reading: "Avanzar de forma controlada.",
      action: "Piloto ampliado con revisión semanal.",
    },
    operatingPrinciple:
      "Mantener visible el supuesto probado y sus límites de evidencia.",
    implementationPlan: [
      {
        horizon: "0-30 días",
        objective: "Preparar piloto ampliado controlado.",
        actions: ["Ajustar ficha.", "Elegir compradores próximos a renovación."],
        owner: "Gerencia comercial",
        decisionMetric: "Reuniones con decisor agendadas.",
      },
      {
        horizon: "31-60 días",
        objective: "Ejecutar piloto y registrar señales.",
        actions: ["Usar ficha.", "Registrar objeciones corregibles."],
        owner: "Equipo comercial",
        decisionMetric: "Compromisos observables repetidos.",
      },
      {
        horizon: "61-90 días",
        objective: "Decidir integración o nueva iteración.",
        actions: ["Comparar evidencia.", "Documentar límites."],
        owner: "Gerencia",
        decisionMetric: "Decisión gerencial trazable.",
      },
    ],
    owners: ["Gerencia comercial"],
    requiredResources: ["Ficha ajustada", "Ejemplo de tablero"],
    metricsToMonitor: [
      {
        label: "Siguiente paso",
        target: "3+",
        evidenceSource: "Registros comerciales.",
      },
      {
        label: "Pagador claro",
        target: "Mayoría",
        evidenceSource: "Lectura de evidencia.",
      },
    ],
    risksAndControls: [
      {
        risk: "Confundir cortesía con compromiso.",
        control: "Exigir acción fechada.",
      },
      {
        risk: "Prometer funcionalidad no construida.",
        control: "Mostrar solo ejemplo mínimo.",
      },
    ],
    reviewCadence: "Revisión semanal durante el piloto ampliado.",
    stopOrIterateConditions: [
      "Iterar si no aparece decisor claro.",
      "Detener si no se diferencia del contrato actual.",
    ],
    whatNotToRepeat: ["No vender software separado."],
    exportSummary:
      "Playbook ejecutivo para ampliar el piloto con trazabilidad de evidencia, responsables, recursos, riesgos y criterios de revisión.",
  };
}
