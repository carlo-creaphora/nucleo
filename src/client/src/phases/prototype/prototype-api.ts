import {
  type IdeationIdea,
  type PrototypeArtifact,
  type PrototypeArtifactState,
  type PrototypeClassification,
  type PrototypeIdeaType,
  type PrototypeRoute,
} from "../../app-state.js";

export type PrototypeRecord = {
  prototypeArtifact?: PrototypeArtifactState | null;
  prototypeBuilderValues?: Record<string, Record<string, string>>;
  prototypeClassification?: PrototypeClassification | null;
  prototypeIdeaType?: PrototypeIdeaType | null;
  prototypeRouteId?: string | null;
};

export async function getPrototypeState(cycleId: string) {
  const response = await fetch(
    `/api/prototype/cycles/${encodeURIComponent(cycleId)}`,
  );

  const data = (await response.json().catch(() => null)) as {
    prototype?: PrototypeRecord;
    message?: string;
  } | null;

  if (response.status === 404) return null;

  if (!response.ok || !data?.prototype) {
    throw new Error(data?.message ?? "No se pudo cargar Prototipado.");
  }

  return data.prototype;
}

export async function savePrototypeState(
  cycleId: string,
  state: PrototypeRecord,
) {
  const response = await fetch(
    `/api/prototype/cycles/${encodeURIComponent(cycleId)}`,
    {
      body: JSON.stringify({
        prototypeArtifact: state.prototypeArtifact ?? null,
        prototypeBuilderValues: state.prototypeBuilderValues ?? {},
        prototypeClassification: state.prototypeClassification ?? null,
        prototypeIdeaType: state.prototypeIdeaType ?? null,
        prototypeRouteId: state.prototypeRouteId ?? null,
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    },
  );

  const data = (await response.json().catch(() => null)) as {
    message?: string;
  } | null;

  if (!response.ok) {
    throw new Error(data?.message ?? "No se pudo guardar Prototipado.");
  }
}

export async function buildPrototypeArtifact({
  builderValues,
  cycleId,
  diagnosis,
  evaluationDecision,
  idea,
  route,
  signals,
}: {
  builderValues: Record<string, string>;
  cycleId: string;
  diagnosis: unknown;
  evaluationDecision: {
    criticalAssumptions: string;
    firstThingToTest: string;
    risksToWatch: string;
  };
  idea: IdeationIdea;
  route: PrototypeRoute;
  signals: unknown;
}) {
  const response = await fetch("/api/prototype/build", {
    body: JSON.stringify({
      builderValues,
      cycleId,
      diagnosis,
      evaluationDecision,
      idea,
      route,
      signals,
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  const data = (await response.json().catch(() => null)) as {
    artifact?: PrototypeArtifact;
    message?: string;
  } | null;

  if (!response.ok || !data?.artifact) {
    throw new Error(data?.message ?? "No se pudo generar el artefacto.");
  }

  return data.artifact;
}
