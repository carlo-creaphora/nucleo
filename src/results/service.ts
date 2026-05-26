import {
  type EvidenceReadInput,
  type ResultsPhaseRecord,
  type ResultsPhaseState,
  resultsPhaseStateSchema,
} from "../contracts/results.js";
import type { NucleoStore } from "../storage/store.js";
import type { ResultsEngine } from "./engine.js";

export class ResultsService {
  constructor(
    private readonly store: NucleoStore,
    private readonly engine?: ResultsEngine,
  ) {}

  async read(input: EvidenceReadInput) {
    if (!this.engine) {
      throw new Error("Lectura de evidencias no tiene motor IA configurado.");
    }

    const evidenceReading = enforceEvidenceScope(input, await this.engine.read(input));
    return this.save({
      cycleId: input.cycleId,
      prototypeRouteId: input.route.id,
      records: input.records,
      evidenceReading,
      methodologicalRoute: evidenceReading.methodologicalRoute,
    });
  }

  async save(rawState: ResultsPhaseState): Promise<ResultsPhaseRecord> {
    const state = resultsPhaseStateSchema.parse(rawState);
    const existing = await this.store.getResultsRun(state.cycleId);
    const now = new Date().toISOString();
    const record: ResultsPhaseRecord = {
      id: existing?.id ?? `results-${state.cycleId}`,
      cycleId: state.cycleId,
      prototypeRouteId: state.prototypeRouteId ?? null,
      records: state.records ?? [],
      evidenceReading: state.evidenceReading ?? existing?.evidenceReading ?? null,
      methodologicalRoute:
        state.methodologicalRoute ??
        state.evidenceReading?.methodologicalRoute ??
        existing?.methodologicalRoute ??
        null,
      methodologicalOverride:
        state.methodologicalOverride ?? existing?.methodologicalOverride ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await this.store.saveResultsRun(record);
    await this.store.saveAuditEvent({
      id: `audit-${record.id}-${Date.now()}`,
      cycleId: record.cycleId,
      stage: "RESULTS",
      action: "save_results",
      summary: `Registro de resultados actualizado con ${record.records.length} registro(s).`,
      metadata: {
        prototypeRouteId: record.prototypeRouteId,
        recordsCount: record.records.length,
        hasEvidenceReading: Boolean(record.evidenceReading),
        methodologicalRoute: record.methodologicalRoute,
        hasMethodologicalOverride: Boolean(record.methodologicalOverride),
      },
      createdAt: now,
    });

    return record;
  }

  get(cycleId: string) {
    return this.store.getResultsRun(cycleId);
  }
}

function enforceEvidenceScope(
  input: EvidenceReadInput,
  reading: Awaited<ReturnType<ResultsEngine["read"]>>,
) {
  const minSample = input.route.evidenceScope?.sampleTargetMin ?? 0;

  if (
    minSample > 0 &&
    input.records.length < minSample &&
    (reading.decision === "Avanzar" || reading.confidence === "Alta")
  ) {
    return {
      ...reading,
      confidence: "Baja" as const,
      decision: "Iterar" as const,
      methodologicalRoute: "iterate" as const,
      methodologicalRationale: [
        "La lectura original contiene señales positivas, pero la muestra está por debajo del mínimo definido por la matriz.",
        `Registros observados: ${input.records.length}/${minSample}.`,
        "Núcleo bloquea avanzar con confianza alta cuando el alcance de evidencia no se cumple.",
      ].join(" "),
      rationale: [
        reading.rationale,
        `Aun así, la muestra registrada (${input.records.length}/${minSample}) no alcanza el mínimo del artefacto, por lo que la decisión se limita a Iterar antes de avanzar.`,
      ].join(" "),
      weakOrMissingEvidence: [
        `Falta completar la muestra mínima del artefacto: ${input.records.length}/${minSample}.`,
        ...reading.weakOrMissingEvidence,
      ].slice(0, 8),
      nextStep:
        "Completar la muestra mínima definida por la matriz y repetir la lectura antes de avanzar.",
    };
  }

  return reading;
}
