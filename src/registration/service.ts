import { randomUUID } from "node:crypto";
import {
  type RegistrationRecord,
  registrationDocumentUploadSchema,
  registrationInputSchema,
} from "../contracts/registration.js";
import type { UploadedDocument } from "../contracts/diagnosis.js";
import type { RegistrationEngine } from "./engine.js";
import type { NucleoStore } from "../storage/store.js";

export class RegistrationService {
  constructor(
    private readonly engine: RegistrationEngine,
    private readonly store: NucleoStore,
  ) {}

  async create(rawInput: unknown) {
    const input = this.normalizeRegistrationInput(
      registrationInputSchema.parse(rawInput),
    );
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
        readiness: output.readiness,
      },
      createdAt: now,
    });

    return { registration: record };
  }

  async uploadDocuments(rawInput: unknown) {
    const input = registrationDocumentUploadSchema.parse(rawInput);
    const documents: UploadedDocument[] = input.documents.map((document) => {
      const text = document.text?.trim() ?? "";
      const summary = document.summary?.trim() || summarizeText(text);

      return {
        id: `doc_${randomUUID()}`,
        name: document.name.trim(),
        mimeType: document.mimeType?.trim() || undefined,
        sizeBytes: document.sizeBytes,
        sourceUrl: document.sourceUrl,
        extractionStatus: text
          ? "EXTRACTED"
          : summary
            ? "TEXT_PROVIDED"
            : "UNSUPPORTED",
        summary: summary || undefined,
        extractedText: text || undefined,
      };
    });

    const now = new Date().toISOString();
    await this.store.saveAuditEvent({
      id: `aud_${randomUUID()}`,
      cycleId: input.cycleId,
      stage: "REGISTRATION",
      action: "REGISTRATION_DOCUMENTS_UPLOADED",
      summary: "Documentos recibidos para contexto de Registro.",
      metadata: {
        documentCount: documents.length,
        unsupportedCount: documents.filter(
          (document) => document.extractionStatus === "UNSUPPORTED",
        ).length,
      },
      createdAt: now,
    });

    return { documents };
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

  private normalizeRegistrationInput(
    input: ReturnType<typeof registrationInputSchema.parse>,
  ) {
    const countries = input.company.operatingCountries.map(normalizeText);
    const acquisitionChannels = input.company.acquisitionChannels.map(
      normalizeText,
    );

    return {
      ...input,
      profileLicense: {
        ...input.profileLicense,
        name: normalizeText(input.profileLicense.name),
        role: normalizeText(input.profileLicense.role),
        area: normalizeText(input.profileLicense.area),
        country: normalizeText(input.profileLicense.country),
        email: input.profileLicense.email.trim().toLowerCase(),
      },
      company: {
        ...input.company,
        companyId: slug(input.company.companyId),
        name: normalizeText(input.company.name),
        sectorCategory: normalizeText(input.company.sectorCategory),
        operatingCountries: countries,
        sellsTo: normalizeText(input.company.sellsTo),
        revenueModel: normalizeText(input.company.revenueModel),
        website: input.company.website?.trim(),
        acquisitionChannels,
      },
      category: {
        ...input.category,
        averageTicket: input.category.averageTicket?.trim(),
        competitors: input.category.competitors.map((competitor) => ({
          name: normalizeText(competitor.name),
          website: competitor.website.trim(),
        })),
        notes: input.category.notes?.trim(),
      },
      uploadedDocuments: input.uploadedDocuments.map((document) => ({
        ...document,
        name: normalizeText(document.name),
        summary: document.summary?.trim(),
        extractedText: document.extractedText?.trim(),
      })),
    };
  }
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function summarizeText(text: string) {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 360 ? `${clean.slice(0, 357)}...` : clean;
}
