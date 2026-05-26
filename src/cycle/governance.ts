import type { MasterCycleState, CyclePhase } from "../contracts/cycle.js";
import type { PlaybookGenerateInput, PlaybookOutput } from "../contracts/playbook.js";
import type { MethodologicalRoute } from "../contracts/results.js";

export type CycleIntegrityReport = {
  ready: boolean;
  warnings: string[];
  blockingIssues: string[];
};

const phaseOrder: CyclePhase[] = [
  "registration",
  "diagnosis",
  "signals",
  "ideation",
  "evaluation",
  "prototype",
  "results",
  "reading",
  "playbook",
  "memory",
];

export function canTransition(
  fromPhase: CyclePhase,
  toPhase: CyclePhase,
  cycle: MasterCycleState,
) {
  const report = validateCycleIntegrity({
    ...cycle,
    currentPhase: toPhase,
  });
  const fromIndex = phaseOrder.indexOf(fromPhase);
  const toIndex = phaseOrder.indexOf(toPhase);
  const isBackNavigation = toIndex <= fromIndex;

  return {
    allowed: isBackNavigation || report.blockingIssues.length === 0,
    blockingIssues: isBackNavigation ? [] : report.blockingIssues,
    warnings: report.warnings,
  };
}

export function validateCycleIntegrity(
  cycle: MasterCycleState,
): CycleIntegrityReport {
  const blockingIssues: string[] = [];
  const warnings: string[] = [];
  const phaseIndex = phaseOrder.indexOf(cycle.currentPhase);
  const requires = (phase: CyclePhase) => phaseIndex >= phaseOrder.indexOf(phase);
  const finalRoute = readFinalRoute(cycle);

  if (requires("diagnosis") && !cycle.registration) {
    blockingIssues.push("Registro requerido antes de Diagnóstico.");
  }
  if (requires("signals") && !cycle.diagnosis) {
    blockingIssues.push("Diagnóstico confirmado requerido antes de Señales.");
  }
  if (requires("ideation") && !cycle.signals) {
    blockingIssues.push("Señales con gaps e insights requeridas antes de Ideación.");
  }
  if (requires("prototype") && (!cycle.evaluationConfirmed || !cycle.evaluationWinnerId)) {
    blockingIssues.push("Idea ganadora confirmada requerida antes de Prototipado.");
  }
  if (requires("results") && !cycle.prototype?.prototypeArtifact) {
    blockingIssues.push("Artefacto prototipado requerido antes de Resultados.");
  }
  if (requires("reading") && !cycle.results?.records?.length) {
    blockingIssues.push("Registros de evidencia requeridos antes de Lectura.");
  }
  if (requires("playbook") && !cycle.results?.evidenceReading) {
    blockingIssues.push("Lectura de evidencia requerida antes de Playbook o cierre.");
  }
  if (cycle.currentPhase === "playbook" && finalRoute !== "advance") {
    blockingIssues.push("Playbook solo aplica cuando la ruta metodologica final es Avanzar.");
  }
  if (requires("memory") && !cycle.playbook?.memory && !finalRoute) {
    blockingIssues.push("Ruta metodológica final requerida antes de Memoria.");
  }
  if (cycle.status === "closed" && !finalRoute) {
    blockingIssues.push("Un ciclo cerrado debe tener ruta metodológica final.");
  }
  if (
    finalRoute === "advance" &&
    !cycle.playbook?.playbook
  ) {
    blockingIssues.push("Ruta Avanzar requiere Playbook generado.");
  }
  if (
    finalRoute &&
    finalRoute !== "advance" &&
    cycle.playbook?.playbook
  ) {
    blockingIssues.push("Rutas sin avance no pueden tener Playbook de escala.");
  }
  if (cycle.results?.evidenceReading?.confidence === "Baja") {
    warnings.push("La lectura de evidencia tiene confianza baja.");
  }

  return {
    ready: blockingIssues.length === 0,
    warnings,
    blockingIssues,
  };
}

function readFinalRoute(cycle: MasterCycleState): MethodologicalRoute | null {
  return (
    cycle.finalMethodologicalRoute ??
    cycle.playbook?.methodologicalRoute ??
    cycle.results?.methodologicalRoute ??
    cycle.results?.evidenceReading?.methodologicalRoute ??
    null
  );
}

export function assertNoUnsupportedOptimism(
  playbook: PlaybookOutput,
  input: PlaybookGenerateInput,
) {
  const claims = [
    "escala completa",
    "adopción sostenida",
    "adopcion sostenida",
    "impacto financiero",
    "retención",
    "retencion",
    "margen",
    "capacidad de entrega a escala",
  ];
  const limitsText = [
    ...(input.route.doesNotValidate ?? []),
    input.route.evidenceScope.doesNotValidate,
    ...(input.artifact?.doesNotValidate ?? []),
  ].join(" ").toLowerCase();
  const outputText = JSON.stringify(playbook).toLowerCase();
  const validationVerbs = [
    "quedo probado",
    "quedó probado",
    "quedaron probadas",
    "queda validado",
    "queda validada",
    "quedo validado",
    "quedó validado",
    "validado",
    "validada",
    "probado",
    "probada",
    "confirmado",
    "confirmada",
  ];

  const contradiction = claims.find((claim) => {
    if (!limitsText.includes(claim.split(" ")[0] ?? claim)) return false;
    const index = outputText.indexOf(claim);
    if (index < 0) return false;
    const context = outputText.slice(Math.max(0, index - 90), index + claim.length + 90);
    const prudentNegation =
      context.includes(`no valida ${claim}`) ||
      context.includes(`no prueba ${claim}`) ||
      context.includes(`no demuestra ${claim}`) ||
      context.includes(`no confirma ${claim}`);
    if (prudentNegation) return false;
    return validationVerbs.some((verb) => context.includes(verb));
  });

  if (contradiction) {
    throw new Error(`Salida contradice limites de evidencia: ${contradiction}.`);
  }
}

export function buildDecisionAuditMetadata(input: {
  phase: CyclePhase;
  decision: string;
  recommendedDecision?: string | null;
  selectedDecision?: string | null;
  overrideReason?: string | null;
}) {
  return {
    decisionPhase: input.phase,
    decision: input.decision,
    recommendedDecision: input.recommendedDecision ?? null,
    selectedDecision: input.selectedDecision ?? input.decision,
    overrideReason: input.overrideReason ?? null,
    requiresTraceability: Boolean(
      input.recommendedDecision &&
        input.selectedDecision &&
        input.recommendedDecision !== input.selectedDecision,
    ),
  };
}
