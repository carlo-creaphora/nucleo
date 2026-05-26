import {
  type CycleMemory,
  type EvidenceReading,
  type IdeationIdea,
  type MethodologicalOverride,
  type PlaybookOverride,
  type PlaybookPhaseRecord,
  type PrototypeArtifact,
  type PrototypeRoute,
  type ResultRecord,
} from "../../app-state.js";

export type PlaybookGeneratePayload = {
  artifact?: PrototypeArtifact;
  companyId?: string;
  cycleId: string;
  diagnosis?: unknown;
  evaluationDecision?: unknown;
  evidenceReading: EvidenceReading;
  idea?: IdeationIdea;
  licenseId?: string;
  methodologicalRoute: EvidenceReading["methodologicalRoute"];
  override?: PlaybookOverride;
  records: ResultRecord[];
  registration?: unknown;
  route: PrototypeRoute;
  signals?: unknown;
};

export async function getPlaybook(cycleId: string) {
  const response = await fetch(`/api/playbook/cycles/${encodeURIComponent(cycleId)}`);

  const data = (await response.json().catch(() => null)) as {
    message?: string;
    playbook?: PlaybookPhaseRecord;
  } | null;

  if (response.status === 404) return null;

  if (!response.ok || !data?.playbook) {
    throw new Error(data?.message ?? "No se pudo cargar Playbook.");
  }

  return data.playbook;
}

export async function generatePlaybook(payload: PlaybookGeneratePayload) {
  const response = await fetch("/api/playbook/generate", {
    body: JSON.stringify({
      ...payload,
      override: payload.override ?? undefined,
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  const data = (await response.json().catch(() => null)) as {
    message?: string;
    playbook?: PlaybookPhaseRecord;
  } | null;

  if (!response.ok || !data?.playbook) {
    throw new Error(data?.message ?? "No se pudo cerrar el ciclo.");
  }

  return data.playbook;
}

export async function listCompanyMemories(companyId: string) {
  const response = await fetch(
    `/api/companies/${encodeURIComponent(companyId)}/cycle-memories`,
  );

  const data = (await response.json().catch(() => null)) as {
    memories?: PlaybookPhaseRecord[];
    message?: string;
  } | null;

  if (!response.ok || !data?.memories) {
    throw new Error(data?.message ?? "No se pudo cargar memoria de ciclos.");
  }

  return data.memories;
}

export function toPlaybookOverride(
  override: MethodologicalOverride | null,
): PlaybookOverride | undefined {
  if (!override) return undefined;

  return {
    changedAt: override.changedAt,
    changedBy: "user",
    reason: override.reason,
  };
}

export function memoryDecision(memory: CycleMemory | null | undefined) {
  return memory?.decision ?? "Ciclo sin memoria cerrada";
}
