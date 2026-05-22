import { randomUUID } from "node:crypto";
import {
  type RegistrationInput,
  type RegistrationOutput,
  type RegistrationRecord,
  registrationDocumentUploadSchema,
  registrationInputSchema,
} from "../contracts/registration.js";
import type { UploadedDocument } from "../contracts/diagnosis.js";
import type { RegistrationEngine } from "./engine.js";
import { extractDocumentText } from "./document-extractor.js";
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
    const output = finalizeRegistrationOutput(
      input,
      await this.engine.prepare(input),
    );
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
    const documents: UploadedDocument[] = await Promise.all(
      input.documents.map(async (document) => {
        const extraction = await extractDocumentText(document);

        return {
          id: `doc_${randomUUID()}`,
          name: document.name.trim(),
          mimeType: document.mimeType?.trim() || undefined,
          sizeBytes: document.sizeBytes,
          sourceUrl: document.sourceUrl,
          extractionStatus: extraction.status,
          summary: extraction.summary,
          extractedText: extraction.text || undefined,
        };
      }),
    );

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

function finalizeRegistrationOutput(
  input: RegistrationInput,
  output: RegistrationOutput,
): RegistrationOutput {
  const blockingIssues = [
    input.profileLicense.name ? "" : "perfil sin nombre",
    input.profileLicense.role ? "" : "cargo del perfil faltante",
    input.profileLicense.area ? "" : "area del perfil faltante",
    input.profileLicense.email ? "" : "mail del perfil faltante",
    input.company.name ? "" : "empresa sin nombre",
    input.company.sectorCategory ? "" : "sector/categoria faltante",
    input.company.sellsTo ? "" : "actor comprador no declarado",
    input.company.revenueModel ? "" : "modelo de cobro no declarado",
  ].filter(Boolean);
  const warnings = [
    ...output.readiness.warnings,
    input.category.competitors.length === 3
      ? ""
      : "menos de tres competidores declarados",
    input.category.averageTicket ? "" : "ticket promedio no declarado",
    typeof input.category.averageSalesCycleDays === "number"
      ? ""
      : "ciclo de venta no declarado",
    input.uploadedDocuments.length > 0 || input.category.notes
      ? ""
      : "sin notas o documentos de categoria",
    ...output.readiness.blockingIssues.filter(
      (issue) => !blockingIssues.includes(issue),
    ),
  ].filter(Boolean);

  return {
    ...output,
    contextForDiagnosis: {
      profileLicense: input.profileLicense,
      company: input.company,
      category: input.category,
      uploadedDocuments: input.uploadedDocuments,
    },
    readiness: {
      isReadyForDiagnosis: blockingIssues.length === 0,
      blockingIssues,
      warnings: [...new Set(warnings)],
    },
  };
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
