import {
  type DiagnosisCorrection,
  type DiagnosisOutput,
  type DialogMessage,
  type RegistrationRecord,
} from "../../app-state.js";

export type DiagnosisPayload = {
  cycleId: string;
  dialogMessages: DialogMessage[];
  userClarifications: string[];
  previousCycleLearnings: unknown[];
  correctedSections: DiagnosisCorrection[];
} & NonNullable<RegistrationRecord["output"]>["contextForDiagnosis"];

export type CriticalMissingPiece = {
  key: string;
  reason: string;
};

export type DiagnosisQuestion = {
  question: string;
  whyItMatters: string;
  suggestedAngles: string[];
  coveredFacts: string[];
  nextFocus: string;
  shouldCloseDiagnosis: boolean;
};

export type DiagnosisVersion = {
  id: string;
  version: number;
  reason: "complete" | "max_questions" | "reinterpret";
  createdAt: string;
};

export type DiagnosisDraft = {
  cycleId: string;
  dialogMessages: DialogMessage[];
  correctedSections: DiagnosisCorrection[];
  lastQuestion: DiagnosisQuestion | null;
  composer: string;
  updatedAt: string;
};

export type AuditEvent = {
  id: string;
  stage: string;
  action: string;
  summary: string;
  createdAt: string;
};

export async function requestDiagnosisQuestion(payload: DiagnosisPayload) {
  const response = await fetch("/api/diagnosis/question", {
    body: JSON.stringify(payload),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  return parseDiagnosisResponse(response);
}

export async function completeDiagnosis(payload: DiagnosisPayload) {
  const response = await fetch("/api/diagnosis/complete", {
    body: JSON.stringify(payload),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  return parseDiagnosisResponse(response);
}

export async function reinterpretDiagnosis({
  input,
  previousDiagnosis,
}: {
  input: DiagnosisPayload;
  previousDiagnosis: DiagnosisOutput;
}) {
  const response = await fetch("/api/diagnosis/reinterpret", {
    body: JSON.stringify({ input, previousDiagnosis }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  return parseDiagnosisResponse(response);
}

export async function getDiagnosisVersions(cycleId: string) {
  const response = await fetch(
    `/api/diagnosis/cycles/${encodeURIComponent(cycleId)}/versions`,
  );

  if (!response.ok) return { versions: [] as DiagnosisVersion[] };

  return (await response.json()) as { versions: DiagnosisVersion[] };
}

export async function getDiagnosisAudit(cycleId: string) {
  const response = await fetch(
    `/api/diagnosis/cycles/${encodeURIComponent(cycleId)}/audit`,
  );

  if (!response.ok) return { events: [] as AuditEvent[] };

  return (await response.json()) as { events: AuditEvent[] };
}

export async function getDiagnosisDraft(cycleId: string) {
  const response = await fetch(
    `/api/diagnosis/cycles/${encodeURIComponent(cycleId)}/draft`,
  );

  if (!response.ok) return null;

  const data = (await response.json().catch(() => null)) as {
    draft?: DiagnosisDraft | null;
  } | null;

  return data?.draft ?? null;
}

export async function saveDiagnosisDraft(
  cycleId: string,
  draft: Omit<DiagnosisDraft, "cycleId" | "updatedAt">,
) {
  const response = await fetch(
    `/api/diagnosis/cycles/${encodeURIComponent(cycleId)}/draft`,
    {
      body: JSON.stringify(draft),
      headers: { "content-type": "application/json" },
      method: "PUT",
    },
  );

  if (!response.ok) {
    throw new Error("No se pudo guardar el chat en progreso.");
  }

  return (await response.json()) as { draft: DiagnosisDraft };
}

export async function getDiagnosisCycle(cycleId: string) {
  const response = await fetch(
    `/api/diagnosis/cycles/${encodeURIComponent(cycleId)}`,
  );

  const data = (await response.json().catch(() => null)) as {
    cycle?: {
      diagnosis?: DiagnosisOutput;
      input?: unknown;
      companyId?: string;
      licenseId?: string;
    };
    message?: string;
  } | null;

  if (response.status === 404) return null;

  if (!response.ok || !data?.cycle) {
    throw new Error(data?.message ?? "No se pudo recuperar Diagnóstico.");
  }

  return data.cycle;
}

async function parseDiagnosisResponse(response: Response) {
  const data = (await response.json().catch(() => null)) as {
    diagnosis?: DiagnosisOutput;
    question?: DiagnosisQuestion | null;
    criticalMissing?: CriticalMissingPiece[];
    changeSummary?: { summary?: string };
    message?: string;
  } | null;

  if (!response.ok) {
    const error = new Error(data?.message ?? "No se pudo cerrar Diagnóstico.");
    Object.assign(error, {
      criticalMissing: data?.criticalMissing ?? [],
    });
    throw error;
  }

  return {
    diagnosis: data?.diagnosis,
    question: data?.question ?? null,
    criticalMissing: data?.criticalMissing ?? [],
    changeSummary: data?.changeSummary,
  };
}

export async function getRegistration(registrationId: string) {
  const response = await fetch(
    `/api/registration/${encodeURIComponent(registrationId)}`,
  );

  if (!response.ok) {
    throw new Error("No se pudo recuperar el Registro guardado.");
  }

  return (await response.json()) as { registration: RegistrationRecord };
}

export async function getRegistrationByCycle(cycleId: string) {
  const response = await fetch(
    `/api/registration/cycles/${encodeURIComponent(cycleId)}`,
  );

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error("No se pudo recuperar el Registro guardado.");
  }

  return (await response.json()) as { registration: RegistrationRecord };
}
