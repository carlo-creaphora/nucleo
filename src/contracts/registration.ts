import { z } from "zod";
import {
  categorySchema,
  companySchema,
  profileLicenseSchema,
  uploadedDocumentSchema,
} from "./diagnosis.js";

const outputProfileLicenseSchema = z.object({
  licenseId: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  area: z.string().min(1),
  email: z.string().min(1),
  country: z.string().min(1),
  peopleManaged: z.number().int().min(0).optional(),
});

const outputCompanySchema = z.object({
  companyId: z.string().min(1),
  name: z.string().min(1),
  sectorCategory: z.string().min(1),
  employeeCount: z.number().int().min(1).optional(),
  yearsInMarket: z.number().int().min(0).optional(),
  operatingCountries: z.array(z.string().min(1)).default([]),
  sellsTo: z.string().min(1),
  revenueModel: z.string().min(1),
  website: z.string().optional(),
  acquisitionChannels: z.array(z.string().min(1)).default([]),
});

const outputCategorySchema = z.object({
  averageTicket: z.string().optional(),
  averageSalesCycleDays: z.number().int().min(0).optional(),
  competitors: z
    .array(
      z.object({
        name: z.string().min(1),
        website: z.string().min(1),
      }),
    )
    .max(3)
    .default([]),
  notes: z.string().optional(),
});

const outputUploadedDocumentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  mimeType: z.string().optional(),
  sizeBytes: z.number().int().min(0).optional(),
  sourceUrl: z.string().optional(),
  extractionStatus: z
    .enum(["EXTRACTED", "TEXT_PROVIDED", "UNSUPPORTED", "EMPTY"])
    .optional(),
  summary: z.string().optional(),
  extractedText: z.string().optional(),
});

export const registrationInputSchema = z.object({
  registrationId: z.string().min(1).optional(),
  cycleId: z.string().min(1),
  profileLicense: profileLicenseSchema,
  company: companySchema,
  category: categorySchema,
  uploadedDocuments: z.array(uploadedDocumentSchema).default([]),
});

export const registrationDocumentUploadSchema = z.object({
  cycleId: z.string().min(1),
  documents: z
    .array(
      z.object({
        name: z.string().min(1),
        mimeType: z.string().optional(),
        sizeBytes: z.number().int().min(0).optional(),
        sourceUrl: z.string().url().optional(),
        text: z.string().optional(),
        dataBase64: z.string().optional(),
        summary: z.string().optional(),
      }),
    )
    .min(1),
});

export const registrationOutputSchema = z.object({
  contextForDiagnosis: z.object({
    profileLicense: outputProfileLicenseSchema,
    company: outputCompanySchema,
    category: outputCategorySchema,
    uploadedDocuments: z.array(outputUploadedDocumentSchema).default([]),
  }),
  categoryInformation: z.object({
    summary: z.string().min(1),
    evidence: z.array(z.string()).default([]),
    unknowns: z.array(z.string()).default([]),
  }),
  competitorEvaluationFrame: z.object({
    criteria: z.array(z.string().min(1)).min(1),
    notes: z.array(z.string()).default([]),
    comparisonAxes: z.array(z.string().min(1)).min(1),
    signalQuestions: z.array(z.string().min(1)).min(1),
    evidenceGaps: z.array(z.string()).default([]),
  }),
  readiness: z.object({
    isReadyForDiagnosis: z.boolean(),
    blockingIssues: z.array(z.string()).default([]),
    warnings: z.array(z.string()).default([]),
  }),
});

export const registrationRecordSchema = z.object({
  id: z.string().min(1),
  cycleId: z.string().min(1),
  companyId: z.string().min(1),
  licenseId: z.string().min(1),
  input: registrationInputSchema,
  output: registrationOutputSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type RegistrationInput = z.infer<typeof registrationInputSchema>;
export type RegistrationOutput = z.infer<typeof registrationOutputSchema>;
export type RegistrationRecord = z.infer<typeof registrationRecordSchema>;
export type RegistrationDocumentUpload = z.infer<
  typeof registrationDocumentUploadSchema
>;
