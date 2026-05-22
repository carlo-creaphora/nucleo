import { randomUUID } from "node:crypto";
import {
  type SignalsInput,
  type SignalsRecord,
  signalsInputSchema,
} from "../contracts/signals.js";
import type { DiagnosisService } from "../diagnosis/service.js";
import type { NucleoStore } from "../storage/store.js";
import type { SignalsEngine } from "./engine.js";

export class SignalsService {
  constructor(
    private readonly engine: SignalsEngine,
    private readonly store: NucleoStore,
    private readonly diagnosisService: DiagnosisService,
  ) {}

  async generate(cycleId: string) {
    const input = await this.buildInput(cycleId);
    const output = await this.engine.generate(input);
    const existing = await this.store.getSignalsRun(cycleId);
    const now = new Date().toISOString();
    const record: SignalsRecord = {
      id: existing?.id ?? `sigrun_${randomUUID()}`,
      cycleId,
      companyId: input.ideationInput.companyId,
      licenseId: input.ideationInput.licenseId,
      input,
      output,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await this.store.saveSignalsRun(record);
    await this.store.saveAuditEvent({
      id: `aud_${randomUUID()}`,
      cycleId,
      companyId: record.companyId,
      licenseId: record.licenseId,
      stage: "SIGNALS",
      action: existing ? "SIGNALS_REGENERATED" : "SIGNALS_GENERATED",
      summary:
        "Senales genero social listening, tendencias, competidores, gaps e insights.",
      metadata: {
        searchDepth: output.searchDepth,
        baseSignals: output.internal.senalesBase.length,
        gaps: output.gaps.length,
        insights: output.insights.length,
        sourceCount: output.internal.fuentesConsultadas.length,
      },
      createdAt: now,
    });

    return { signals: record };
  }

  get(cycleId: string) {
    return this.store.getSignalsRun(cycleId);
  }

  async buildInput(cycleId: string): Promise<SignalsInput> {
    const ideationInput = await this.diagnosisService.buildIdeationInput(cycleId);

    if (!ideationInput) {
      throw new Error(
        "Senales requiere Diagnostico cerrado antes de buscar fuentes publicas.",
      );
    }

    if (!ideationInput.registration) {
      throw new Error("Senales requiere Registro completo asociado al ciclo.");
    }

    return signalsInputSchema.parse({
      cycleId,
      searchDepth: "standard",
      registration: ideationInput.registration,
      ideationInput,
    });
  }
}
