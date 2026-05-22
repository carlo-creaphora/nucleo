import { z } from "zod";
import {
  categorySchema,
  companySchema,
  profileLicenseSchema,
  uploadedDocumentSchema,
} from "./diagnosis.js";

export const registrationInputSchema = z.object({
  registrationId: z.string().min(1).optional(),
  cycleId: z.string().min(1),
  profileLicense: profileLicenseSchema,
  company: companySchema,
  category: categorySchema,
  uploadedDocuments: z.array(uploadedDocumentSchema).default([]),
});

export const registrationOutputSchema = z.object({
  contextForDiagnosis: z.object({
    profileLicense: profileLicenseSchema,
    company: companySchema,
    category: categorySchema,
    uploadedDocuments: z.array(uploadedDocumentSchema).default([]),
  }),
  categoryInformation: z.object({
    summary: z.string().min(1),
    evidence: z.array(z.string()).default([]),
    unknowns: z.array(z.string()).default([]),
  }),
  competitorEvaluationFrame: z.object({
    criteria: z.array(z.string().min(1)).min(1),
    notes: z.array(z.string()).default([]),
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
