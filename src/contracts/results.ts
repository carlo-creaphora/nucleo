import { z } from "zod";
import { prototypeArtifactSchema, prototypeRouteSchema } from "./prototype.js";

export const closedQuestionTypeSchema = z.enum(["boolean", "choice"]);

export const closedQuestionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(8),
  type: closedQuestionTypeSchema,
  options: z.array(z.string().min(1)).min(2),
  evidenceRole: z.string().min(8),
});

export const evidenceReadingDecisionSchema = z.enum([
  "Avanzar",
  "Iterar",
  "Replantear",
]);

export const evidenceConfidenceSchema = z.enum(["Baja", "Media", "Alta"]);

export const methodologicalRouteSchema = z.enum([
  "advance",
  "iterate",
  "discard",
  "invalidate_challenge",
  "invalidate_signal",
]);

export const evidenceReadingSchema = z.object({
  decision: evidenceReadingDecisionSchema,
  confidence: evidenceConfidenceSchema,
  testedAssumption: z.string().min(8),
  methodologicalRoute: methodologicalRouteSchema,
  methodologicalRationale: z.string().min(20),
  rationale: z.string().min(30),
  evidenceSupports: z.array(z.string().min(8)).min(1).max(8),
  weakOrMissingEvidence: z.array(z.string().min(8)).min(1).max(8),
  falsePositiveRisk: z.string().min(20),
  falseNegativeRisk: z.string().min(20),
  learning: z.string().min(20),
  nextStep: z.string().min(12),
});

export const resultRecordSchema = z.object({
  id: z.string().min(1),
  closedValues: z.record(z.string(), z.string()).default({}),
  values: z.record(z.string(), z.string()).default({}),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
});

export const methodologicalOverrideSchema = z.object({
  from: methodologicalRouteSchema,
  to: methodologicalRouteSchema,
  reason: z.string().min(20),
  changedAt: z.string().datetime(),
});

export const resultsPhaseStateSchema = z.object({
  cycleId: z.string().min(1),
  prototypeRouteId: z.string().min(1).nullable().optional(),
  records: z.array(resultRecordSchema).default([]),
  evidenceReading: evidenceReadingSchema.nullable().optional(),
  methodologicalRoute: methodologicalRouteSchema.nullable().optional(),
  methodologicalOverride: methodologicalOverrideSchema.nullable().optional(),
});

export const evidenceReadInputSchema = z.object({
  cycleId: z.string().min(1),
  route: prototypeRouteSchema,
  artifact: prototypeArtifactSchema.optional(),
  idea: z
    .object({
      idea: z.string().min(1),
      supuestoQueRompe: z.string().optional(),
      mecanicaConcreta: z.string().optional(),
      porQueFunciona: z.string().optional(),
      metricaQueMueve: z.string().optional(),
      primerPasoEjecutable: z.string().optional(),
    })
    .optional(),
  closedQuestions: z.array(closedQuestionSchema).default([]),
  records: z.array(resultRecordSchema).min(1),
});

export const resultsPhaseRecordSchema = resultsPhaseStateSchema.extend({
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ResultRecord = z.infer<typeof resultRecordSchema>;
export type ClosedQuestion = z.infer<typeof closedQuestionSchema>;
export type EvidenceReadInput = z.infer<typeof evidenceReadInputSchema>;
export type EvidenceReading = z.infer<typeof evidenceReadingSchema>;
export type MethodologicalRoute = z.infer<typeof methodologicalRouteSchema>;
export type MethodologicalOverride = z.infer<typeof methodologicalOverrideSchema>;
export type ResultsPhaseRecord = z.infer<typeof resultsPhaseRecordSchema>;
export type ResultsPhaseState = z.infer<typeof resultsPhaseStateSchema>;
