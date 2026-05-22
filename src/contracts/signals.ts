import { z } from "zod";
import { ideationInputSchema } from "./ideation.js";
import { registrationOutputSchema } from "./registration.js";

export const signalsSearchDepthSchema = z.literal("standard");

export const signalLensSchema = z.enum([
  "SOCIAL_LISTENING",
  "TREND",
  "COMPETITOR",
]);

export const signalConfidenceSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);

export const signalEvidenceSchema = z.object({
  id: z.string().min(1),
  lens: signalLensSchema,
  title: z.string().min(8),
  observedText: z.string().min(12),
  sourceLabel: z.string().min(3),
  sourceUrl: z.string().url().optional(),
  sourceDate: z.string().optional(),
  query: z.string().optional(),
  isNegative: z.boolean(),
  confidence: signalConfidenceSchema,
});

export const signalsAnalysisSectionSchema = z.object({
  summary: z.string().min(20),
  findings: z.array(z.string().min(1)).default([]),
  evidenceIds: z.array(z.string().min(1)).default([]),
  limitations: z.array(z.string()).default([]),
});

export const signalGapSchema = z.object({
  title: z.string().min(8),
  summary: z.string().min(20),
  contradiction: z.string().min(12),
  evidenceIds: z.array(z.string().min(1)).min(1),
  implicationForIdeation: z.string().min(12),
});

export const signalInsightSchema = z.object({
  title: z.string().min(8),
  summary: z.string().min(20),
  actionableTruth: z.string().min(12),
  evidenceIds: z.array(z.string().min(1)).min(1),
  ideationPrompt: z.string().min(12),
});

export const signalsMemorySchema = z.object({
  companyPatterns: z.array(z.string()).default([]),
  previousLearnings: z.array(z.string()).default([]),
  avoidRepeating: z.array(z.string()).default([]),
});

export const signalsInputSchema = z.object({
  cycleId: z.string().min(1),
  searchDepth: signalsSearchDepthSchema.default("standard"),
  registration: registrationOutputSchema,
  ideationInput: ideationInputSchema,
});

export const signalsOutputSchema = z.object({
  searchDepth: signalsSearchDepthSchema,
  generatedAt: z.string().datetime(),
  analisisSocialListening: signalsAnalysisSectionSchema,
  analisisTendencias: signalsAnalysisSectionSchema,
  analisisCompetidores: signalsAnalysisSectionSchema,
  gaps: z.array(signalGapSchema).min(1).max(6),
  insights: z.array(signalInsightSchema).min(1).max(6),
  memoriaEmpresa: signalsMemorySchema,
  internal: z.object({
    fuentesConsultadas: z.array(z.string()).default([]),
    senalesBase: z.array(signalEvidenceSchema).default([]),
    vaciosDeEvidencia: z.array(z.string()).default([]),
  }),
});

export const signalsRecordSchema = z.object({
  id: z.string().min(1),
  cycleId: z.string().min(1),
  companyId: z.string().min(1),
  licenseId: z.string().min(1),
  input: signalsInputSchema,
  output: signalsOutputSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type SignalLens = z.infer<typeof signalLensSchema>;
export type SignalEvidence = z.infer<typeof signalEvidenceSchema>;
export type SignalsInput = z.infer<typeof signalsInputSchema>;
export type SignalsOutput = z.infer<typeof signalsOutputSchema>;
export type SignalsRecord = z.infer<typeof signalsRecordSchema>;
