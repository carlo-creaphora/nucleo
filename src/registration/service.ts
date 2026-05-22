import { randomUUID } from "node:crypto";
import {
  type RegistrationRecord,
  registrationInputSchema,
} from "../contracts/registration.js";
import type { RegistrationEngine } from "./engine.js";
import type { NucleoStore } from "../storage/store.js";

export class RegistrationService {
  constructor(
    private readonly engine: RegistrationEngine,
    private readonly store: NucleoStore,
  ) {}

  async create(rawInput: unknown) {
    const input = registrationInputSchema.parse(rawInput);
    const existing = await this.store.getRegistrationByCycle(input.cycleId);
    const output = await this.engine.prepare(input);
    const now = new Date().toISOString();
    const record: RegistrationRecord = {
      id: existing?.id ?? input.registrationId ?? `reg_${randomUUID()}`,
      cycleId: input.cycleId,
      companyId: input.company.companyId,
      licenseId: input.profileLicense.licenseId,
      input,
      output,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await this.store.saveRegistration(record);
    await this.store.saveAuditEvent({
      id: `aud_${randomUUID()}`,
      cycleId: input.cycleId,
      companyId: input.company.companyId,
      licenseId: input.profileLicense.licenseId,
      stage: "REGISTRATION",
      action: existing ? "REGISTRATION_UPDATED" : "REGISTRATION_CREATED",
      summary: "Registro preparado para Diagnostico.",
      metadata: {
        registrationId: record.id,
        competitorCount: input.category.competitors.length,
        documentCount: input.uploadedDocuments.length,
      },
      createdAt: now,
    });

    return { registration: record };
  }

  get(id: string) {
    return this.store.getRegistration(id);
  }

  getByCycle(cycleId: string) {
    return this.store.getRegistrationByCycle(cycleId);
  }

  listCompany(companyId: string) {
    return this.store.listCompanyRegistrations(companyId);
  }
}
