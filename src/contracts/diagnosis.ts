import { z } from "zod";

export const profileLicenseSchema = z.object({
  licenseId: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  area: z.string().min(1),
  email: z.string().email(),
  country: z.string().min(1),
  peopleManaged: z.number().int().min(0).optional(),
});

export const companySchema = z.object({
  companyId: z.string().min(1),
  name: z.string().min(1),
  sectorCategory: z.string().min(1),
  employeeCount: z.number().int().min(1).optional(),
  yearsInMarket: z.number().int().min(0).optional(),
  operatingCountries: z.array(z.string().min(1)).default([]),
  sellsTo: z.string().min(1),
  revenueModel: z.string().min(1),
  website: z.string().url().optional(),
  acquisitionChannels: z.array(z.string().min(1)).default([]),
});

export const competitorSchema = z.object({
  name: z.string().min(1),
  website: z.string().url(),
});

export const categorySchema = z.object({
  averageTicket: z.string().optional(),
  averageSalesCycleDays: z.number().int().min(0).optional(),
  competitors: z.array(competitorSchema).max(3).default([]),
  notes: z.string().optional(),
});

export const uploadedDocumentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  mimeType: z.string().optional(),
  sizeBytes: z.number().int().min(0).optional(),
  sourceUrl: z.string().url().optional(),
  extractionStatus: z
    .enum(["EXTRACTED", "TEXT_PROVIDED", "UNSUPPORTED", "EMPTY"])
    .optional(),
  summary: z.string().optional(),
  extractedText: z.string().optional(),
});

export const dialogMessageSchema = z.object({
  role: z.enum(["assistant", "user"]),
  content: z.string().min(1),
  createdAt: z.string().datetime().optional(),
});

export const diagnosisSectionKeySchema = z.enum([
  "recommendedChallenge",
  "whyThisChallenge",
  "symptoms",
  "causes",
  "tensions",
  "metrics",
  "restrictions",
  "notWorthAttackingYet",
  "assumptionToQuestion",
  "ideationBrief",
]);

export const diagnosisCorrectionSchema = z.object({
  section: diagnosisSectionKeySchema,
  clarification: z.string().min(1),
});

export const companyMemorySchema = z.object({
  summary: z.string().optional(),
  repeatedPatterns: z.array(z.string()).default([]),
  previousLearnings: z.array(z.string()).default([]),
});

export const cycleLearningSchema = z.object({
  cycleId: z.string().min(1),
  title: z.string().min(1),
  learning: z.string().min(1),
  avoidRepeating: z.array(z.string()).default([]),
});

export const diagnosisInputSchema = z.object({
  cycleId: z.string().min(1),
  profileLicense: profileLicenseSchema,
  company: companySchema,
  category: categorySchema,
  uploadedDocuments: z.array(uploadedDocumentSchema).default([]),
  dialogMessages: z.array(dialogMessageSchema).default([]),
  userClarifications: z.array(z.string()).default([]),
  companyMemory: companyMemorySchema.optional(),
  previousCycleLearnings: z.array(cycleLearningSchema).default([]),
  correctedSections: z.array(diagnosisCorrectionSchema).default([]),
});

export const diagnosisQuestionOutputSchema = z.object({
  question: z.string().min(12),
  whyItMatters: z.string().min(12),
  suggestedAngles: z.array(z.string().min(1)).min(1).max(4),
  coveredFacts: z.array(z.string()).default([]),
  nextFocus: z.string().min(1),
  shouldCloseDiagnosis: z.boolean(),
});

export const diagnosisOutputSchema = z.object({
  recommendedChallenge: z.string().min(12),
  whyThisChallenge: z.string().min(12),
  symptoms: z.array(z.string().min(1)).min(1),
  causes: z.array(z.string().min(1)).min(1),
  tensions: z.array(z.string().min(1)).min(1),
  metrics: z.array(z.string().min(1)).min(1),
  restrictions: z.array(z.string()).default([]),
  notWorthAttackingYet: z.array(z.string()).default([]),
  assumptionToQuestion: z.string().min(8),
  ideationBrief: z.string().min(20),
});

export type DiagnosisInput = z.infer<typeof diagnosisInputSchema>;
export type DiagnosisOutput = z.infer<typeof diagnosisOutputSchema>;
export type UploadedDocument = z.infer<typeof uploadedDocumentSchema>;
export type DiagnosisQuestionOutput = z.infer<
  typeof diagnosisQuestionOutputSchema
>;
export type DiagnosisCorrection = z.infer<typeof diagnosisCorrectionSchema>;
