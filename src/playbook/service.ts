import {
  type CycleMemory,
  type PlaybookGenerateInput,
  type PlaybookOutput,
  type PlaybookPhaseRecord,
  playbookGenerateInputSchema,
} from "../contracts/playbook.js";
import {
  assertNoUnsupportedOptimism,
  buildDecisionAuditMetadata,
  validateCycleIntegrity,
} from "../cycle/governance.js";
import type { NucleoStore } from "../storage/store.js";
import type { PlaybookEngine } from "./engine.js";

export class PlaybookService {
  constructor(
    private readonly engine: PlaybookEngine,
    private readonly store: NucleoStore,
  ) {}

  async generate(rawInput: PlaybookGenerateInput): Promise<PlaybookPhaseRecord> {
    const parsedInput = playbookGenerateInputSchema.parse(rawInput);
    const storedRegistration = parsedInput.registration
      ? null
      : await this.store.getRegistrationByCycle(parsedInput.cycleId);
    const input: PlaybookGenerateInput = {
      ...parsedInput,
      companyId: parsedInput.companyId ?? storedRegistration?.companyId,
      licenseId: parsedInput.licenseId ?? storedRegistration?.licenseId,
      registration: parsedInput.registration ?? storedRegistration ?? undefined,
    };
    const existing = await this.store.getPlaybookRun(input.cycleId);
    const now = new Date().toISOString();
    const playbook =
      input.methodologicalRoute === "advance"
        ? await this.engine.generate(input)
        : null;
    if (playbook) assertNoUnsupportedOptimism(playbook, input);
    const memory = buildCycleMemory(input, playbook);
    const registrationIds = readRegistrationIds(input);
    const record: PlaybookPhaseRecord = {
      id: existing?.id ?? `playbook-${input.cycleId}`,
      cycleId: input.cycleId,
      companyId: input.companyId ?? registrationIds.companyId ?? null,
      licenseId: input.licenseId ?? registrationIds.licenseId ?? null,
      recommendedRoute: input.evidenceReading.methodologicalRoute,
      methodologicalRoute: input.methodologicalRoute,
      override: input.override
        ? {
            ...input.override,
            changedAt: input.override.changedAt ?? now,
          }
        : null,
      playbook,
      memory,
      closedAt: existing?.closedAt ?? now,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const integrity = validateCycleIntegrity({
      cycleId: input.cycleId,
      status: "closed",
      currentPhase: "memory",
      registration: input.registration ?? null,
      diagnosis: input.diagnosis ?? null,
      signals: input.signals ?? null,
      evaluationConfirmed: true,
      evaluationWinnerId: input.idea?.idea ?? null,
      prototype: {
        cycleId: input.cycleId,
        prototypeRouteId: input.route.id,
        prototypeIdeaType: input.route.ideaType,
        prototypeClassification: null,
        prototypeBuilderValues: {},
        prototypeArtifact: input.artifact
          ? { routeId: input.route.id, artifact: input.artifact }
          : null,
      },
      results: {
        cycleId: input.cycleId,
        prototypeRouteId: input.route.id,
        records: input.records,
        evidenceReading: input.evidenceReading,
        methodologicalRoute: input.methodologicalRoute,
      },
      playbook: record,
      finalMethodologicalRoute: input.methodologicalRoute,
      traceability: [
        {
          sourcePhase: "playbook",
          inputRefs: ["registration", "diagnosis", "signals", "idea", "prototype", "results", "evidenceReading"],
          evidenceUsed: [
            input.evidenceReading.rationale,
            ...input.evidenceReading.evidenceSupports,
          ],
          inferences: [input.evidenceReading.methodologicalRationale],
          decision: input.methodologicalRoute,
          limitations: input.evidenceReading.weakOrMissingEvidence,
        },
      ],
    });

    if (!integrity.ready) {
      throw new Error(`Ciclo no puede cerrarse: ${integrity.blockingIssues.join(" ")}`);
    }

    await this.store.savePlaybookRun(record);
    await this.store.saveCycleMemory(record);
    const auditMetadata = {
      methodologicalRoute: input.methodologicalRoute,
      recommendedRoute: input.evidenceReading.methodologicalRoute,
      override: record.override,
      hasPlaybook: Boolean(playbook),
      visibility: memory.visibility,
      closedAt: record.closedAt,
      traceability: integrity,
      decisionAudit: buildDecisionAuditMetadata({
        phase: "playbook",
        decision: input.methodologicalRoute,
        recommendedDecision: input.evidenceReading.methodologicalRoute,
        selectedDecision: input.methodologicalRoute,
        overrideReason: record.override?.reason ?? null,
      }),
    };

    await this.store.saveAuditEvent({
      id: `audit-${record.id}-${Date.now()}`,
      cycleId: record.cycleId,
      companyId: record.companyId ?? undefined,
      licenseId: record.licenseId ?? undefined,
      stage: "PLAYBOOK",
      action: input.methodologicalRoute === "advance" ? "generate_playbook" : "close_cycle_memory",
      summary:
        input.methodologicalRoute === "advance"
          ? "Playbook generado y ciclo cerrado en memoria."
          : "Ciclo cerrado en memoria sin Playbook de avance.",
      metadata: auditMetadata,
      createdAt: now,
    });
    await this.store.saveAuditEvent({
      id: `audit-memory-${record.id}-${Date.now()}`,
      cycleId: record.cycleId,
      companyId: record.companyId ?? undefined,
      licenseId: record.licenseId ?? undefined,
      stage: "MEMORY",
      action: "close_cycle",
      summary: "Ciclo cerrado y guardado en memoria de ciclos.",
      metadata: auditMetadata,
      createdAt: now,
    });

    return record;
  }

  get(cycleId: string) {
    return this.store.getPlaybookRun(cycleId);
  }

  listCompanyMemory(companyId: string) {
    return this.store.listCompanyCycleMemories(companyId);
  }
}

export function buildCycleMemory(
  input: PlaybookGenerateInput,
  playbook?: PlaybookOutput | null,
): CycleMemory {
  const diagnosisSummary = summarizeDiagnosis(input.diagnosis);
  const signalSummary = summarizeSignals(input.signals);
  const selectedIdea = input.idea?.idea || "Idea seleccionada pendiente de nombrar.";
  const artifactName = input.artifact?.artifactType || input.route.artifact;
  const evidenceReading = [
    input.evidenceReading.rationale,
    input.evidenceReading.methodologicalRationale,
  ].filter(Boolean).join(" ");
  const validatedAssumptions =
    input.methodologicalRoute === "advance"
      ? [input.evidenceReading.testedAssumption]
      : [];
  const unresolvedAssumptions =
    input.methodologicalRoute === "advance"
      ? input.evidenceReading.weakOrMissingEvidence.slice(0, 4)
      : [
          input.evidenceReading.testedAssumption,
          ...input.evidenceReading.weakOrMissingEvidence.slice(0, 3),
        ];

  return {
    title: selectedIdea,
    status: "closed",
    visibility: "company_readonly",
    methodologicalRoute: input.methodologicalRoute,
    decision: routeDecisionLabel(input.methodologicalRoute),
    problem: diagnosisSummary,
    diagnosisSummary,
    signalSummary,
    selectedIdea,
    prototypeArtifact: artifactName,
    evidenceReading,
    nextRecommendedMove:
      input.methodologicalRoute === "advance" && playbook
        ? "Ejecutar Playbook con revisión gerencial explícita."
        : input.evidenceReading.nextStep,
    keyLearnings: unique([
      input.evidenceReading.learning,
      ...input.evidenceReading.evidenceSupports,
    ]).slice(0, 8),
    validatedAssumptions,
    unresolvedAssumptions: unique(unresolvedAssumptions).slice(0, 8),
    risks: unique([
      input.evidenceReading.falsePositiveRisk,
      input.evidenceReading.falseNegativeRisk,
    ]).slice(0, 8),
    patternsToAvoid: unique([
      ...input.route.avoidMisread,
      "Convertir evidencia insuficiente en avance por entusiasmo.",
    ]).slice(0, 8),
  };
}

function routeDecisionLabel(route: PlaybookGenerateInput["methodologicalRoute"]) {
  if (route === "advance") return "Avanzar";
  if (route === "iterate") return "Iterar o ajustar";
  if (route === "discard") return "Descartar idea";
  if (route === "invalidate_challenge") return "Invalidar reto";
  return "Invalidar señal";
}

function summarizeDiagnosis(value: unknown) {
  if (!value || typeof value !== "object") return "Diagnóstico no disponible en el cierre.";
  const diagnosis = value as Record<string, unknown>;
  return String(
    diagnosis.recommendedChallenge ??
      diagnosis.challenge ??
      diagnosis.brief ??
      diagnosis.summary ??
      "Diagnóstico registrado como contexto del ciclo.",
  );
}

function summarizeSignals(value: unknown) {
  if (!value || typeof value !== "object") return "Señales no disponibles en el cierre.";
  const signals = value as Record<string, unknown>;
  const gaps = Array.isArray(signals.gaps)
    ? signals.gaps.map((item) => readTitle(item)).filter(Boolean)
    : [];
  const insights = Array.isArray(signals.insights)
    ? signals.insights.map((item) => readTitle(item)).filter(Boolean)
    : [];
  const summary = [...gaps, ...insights].slice(0, 4).join(" · ");
  return summary || "Señales registradas como contexto del ciclo.";
}

function readTitle(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const item = value as Record<string, unknown>;
  return String(item.title ?? item.titulo ?? item.brecha ?? item.insight ?? "");
}

function readRegistrationIds(input: PlaybookGenerateInput) {
  const registration = input.registration;
  if (!registration || typeof registration !== "object") {
    return { companyId: null, licenseId: null };
  }
  const record = registration as Record<string, unknown>;
  return {
    companyId: typeof record.companyId === "string" ? record.companyId : null,
    licenseId: typeof record.licenseId === "string" ? record.licenseId : null,
  };
}

function unique(items: string[]) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}
