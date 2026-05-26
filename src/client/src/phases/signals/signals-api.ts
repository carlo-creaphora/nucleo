import { type SignalsOutput } from "../../app-state.js";

export type SignalsRecord = {
  id: string;
  cycleId: string;
  companyId: string;
  licenseId: string;
  output: SignalsOutput;
  createdAt: string;
  updatedAt: string;
};

export async function generateSignals(cycleId: string) {
  const response = await fetch(
    `/api/signals/cycles/${encodeURIComponent(cycleId)}/generate`,
    {
      headers: { "content-type": "application/json" },
      method: "POST",
    },
  );

  const data = (await response.json().catch(() => null)) as {
    signals?: SignalsRecord;
    message?: string;
  } | null;

  if (!response.ok || !data?.signals) {
    throw new Error(data?.message ?? "No se pudo consultar Señales.");
  }

  return data.signals;
}

export async function getSignals(cycleId: string) {
  const response = await fetch(
    `/api/signals/cycles/${encodeURIComponent(cycleId)}`,
  );

  if (!response.ok) return null;

  return (await response.json()) as { signals: SignalsRecord };
}
