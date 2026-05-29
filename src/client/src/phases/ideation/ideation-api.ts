import {
  type CompleteIdeationSelection,
  type IdeationIdea,
  type IdeationOptions,
  type IdeationRoute,
  type IdeationSet,
} from "../../app-state.js";

export type IdeationOutput = {
  generatedAt: string;
  route: IdeationRoute;
  ideas: IdeationIdea[];
  internal: {
    caseScreening: {
      translatedCaseReferences: Array<{
        caseName: string;
        transferableMechanism: string;
        reinterpretationForThisIdea: string;
        caveat: string;
      }>;
      rejectedCaseFamilies: string[];
    };
    consultedKnowledge: {
      assumptionsByIndustry: number;
      antiPatterns: number;
      disruptiveCases: number;
      weirdBusinessModels: number;
    };
    rejectedAntiPatternMatches: string[];
  };
};

export async function getIdeationOptions(cycleId: string) {
  const response = await fetch(
    `/api/ideation/cycles/${encodeURIComponent(cycleId)}/options`,
  );

  const data = (await response.json().catch(() => null)) as {
    options?: IdeationOptions;
    message?: string;
  } | null;

  if (!response.ok || !data?.options) {
    throw new Error(data?.message ?? "No se pudieron cargar opciones de Ideación.");
  }

  return data.options;
}

export async function getIdeationRun(cycleId: string): Promise<IdeationSet | null> {
  const response = await fetch(
    `/api/ideation/cycles/${encodeURIComponent(cycleId)}`,
  );

  const data = (await response.json().catch(() => null)) as {
    ideation?: {
      input: { selection: CompleteIdeationSelection };
      output: IdeationOutput;
    };
    message?: string;
  } | null;

  if (response.status === 404) return null;

  if (!response.ok || !data?.ideation) {
    throw new Error(data?.message ?? "No se pudo cargar Ideación guardada.");
  }

  return {
    id: routeKey(data.ideation.input.selection),
    ideas: data.ideation.output.ideas.map((idea) => ({
      ...idea,
      selectedForEvaluation: Boolean(idea.selectedForEvaluation),
      source: idea.source ?? "ai",
    })),
    route: data.ideation.output.route,
    selection: data.ideation.input.selection,
  };
}

export async function generateIdeation(
  cycleId: string,
  selection: CompleteIdeationSelection,
) {
  const response = await fetch(
    `/api/ideation/cycles/${encodeURIComponent(cycleId)}/generate`,
    {
      body: JSON.stringify({ selection }),
      headers: { "content-type": "application/json" },
      method: "POST",
    },
  );

  const data = (await response.json().catch(() => null)) as {
    ideation?: { output: IdeationOutput };
    message?: string;
  } | null;

  if (!response.ok || !data?.ideation?.output) {
    throw new Error(data?.message ?? "No se pudo generar Ideación.");
  }

  return data.ideation.output;
}

export async function saveIdeationSet(cycleId: string, set: IdeationSet) {
  const response = await fetch(
    `/api/ideation/cycles/${encodeURIComponent(cycleId)}`,
    {
      body: JSON.stringify({
        ideas: set.ideas,
        route: set.route,
        selection: set.selection,
      }),
      headers: { "content-type": "application/json" },
      method: "PUT",
    },
  );

  const data = (await response.json().catch(() => null)) as {
    ideation?: { output: IdeationOutput };
    message?: string;
  } | null;

  if (!response.ok || !data?.ideation?.output) {
    throw new Error(data?.message ?? "No se pudo guardar Ideación.");
  }

  return data.ideation.output;
}

function routeKey(selection: CompleteIdeationSelection) {
  return `${selection.ruptureType}::${selection.gapTitle}::${selection.insightTitle}`;
}
