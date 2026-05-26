import {
  type EvidenceReading,
  type MethodologicalOverride,
  type PrototypeArtifact,
  type PrototypeClosedQuestion,
  type PrototypeRoute,
  type ResultRecord,
} from "../../app-state.js";

export type ResultsRecord = {
  evidenceReading?: EvidenceReading | null;
  methodologicalOverride?: MethodologicalOverride | null;
  methodologicalRoute?: EvidenceReading["methodologicalRoute"] | null;
  prototypeRouteId?: string | null;
  records?: ResultRecord[];
};

export async function getResultsState(cycleId: string) {
  const response = await fetch(`/api/results/cycles/${encodeURIComponent(cycleId)}`);

  const data = (await response.json().catch(() => null)) as {
    message?: string;
    results?: ResultsRecord;
  } | null;

  if (response.status === 404) return null;

  if (!response.ok || !data?.results) {
    throw new Error(data?.message ?? "No se pudieron cargar resultados.");
  }

  return data.results;
}

export async function saveResultsState({
  cycleId,
  evidenceReading,
  methodologicalRoute,
  methodologicalOverride,
  prototypeRouteId,
  records,
}: {
  cycleId: string;
  evidenceReading?: EvidenceReading | null;
  methodologicalOverride?: MethodologicalOverride | null;
  methodologicalRoute?: EvidenceReading["methodologicalRoute"] | null;
  prototypeRouteId: string | null;
  records: ResultRecord[];
}) {
  const response = await fetch(`/api/results/cycles/${encodeURIComponent(cycleId)}`, {
    body: JSON.stringify({
      evidenceReading: evidenceReading ?? null,
      methodologicalOverride: methodologicalOverride ?? null,
      methodologicalRoute: methodologicalRoute ?? null,
      prototypeRouteId,
      records,
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  const data = (await response.json().catch(() => null)) as {
    message?: string;
  } | null;

  if (!response.ok) {
    throw new Error(data?.message ?? "No se pudieron guardar resultados.");
  }
}

export async function readEvidence({
  artifact,
  closedQuestions,
  cycleId,
  idea,
  records,
  route,
}: {
  artifact?: PrototypeArtifact;
  closedQuestions: PrototypeClosedQuestion[];
  cycleId: string;
  idea?: {
    idea: string;
    supuestoQueRompe?: string;
    mecanicaConcreta?: string;
    porQueFunciona?: string;
    metricaQueMueve?: string;
    primerPasoEjecutable?: string;
  };
  records: ResultRecord[];
  route: PrototypeRoute;
}) {
  const response = await fetch("/api/results/read", {
    body: JSON.stringify({
      artifact,
      closedQuestions,
      cycleId,
      idea,
      records,
      route,
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  const data = (await response.json().catch(() => null)) as {
    evidenceReading?: EvidenceReading;
    message?: string;
  } | null;

  if (!response.ok || !data?.evidenceReading) {
    throw new Error(data?.message ?? "No se pudo leer evidencia.");
  }

  return data.evidenceReading;
}
