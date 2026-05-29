import { z } from "zod";
import { prototypeArtifactSchema, prototypeRouteSchema } from "./prototype.js";
import {
  evidenceReadingSchema,
  methodologicalRouteSchema,
  resultRecordSchema,
} from "./results.js";

export const playbookEvidenceChainSchema = z.object({
  prototype: z.string().min(3),
  result: z.string().min(8),
  reading: z.string().min(8),
  action: z.string().min(8),
});

export const playbookPlanItemSchema = z.object({
  horizon: z.string().min(3),
  objective: z.string().min(12),
  actions: z.array(z.string().min(8)).min(2).max(3),
  owner: z.string().min(3),
  decisionMetric: z.string().min(8),
});

export const playbookMetricSchema = z.object({
  label: z.string().min(3),
  target: z.string().min(2),
  evidenceSource: z.string().min(8),
});

export const playbookRiskSchema = z.object({
  risk: z.string().min(12),
  control: z.string().min(12),
});

export const playbookOutputSchema = z.object({
  executiveDecision: z.string().min(30),
  validatedMove: z.string().min(20),
  whyNow: z.string().min(30),
  evidenceChain: playbookEvidenceChainSchema,
  operatingPrinciple: z.string().min(20),
  implementationPlan: z.array(playbookPlanItemSchema).min(3).max(3),
  owners: z.array(z.string().min(3)).min(1).max(6),
  requiredResources: z.array(z.string().min(3)).min(1).max(6),
  metricsToMonitor: z.array(playbookMetricSchema).min(2).max(3),
  risksAndControls: z.array(playbookRiskSchema).min(2).max(6),
  reviewCadence: z.string().min(12),
  stopOrIterateConditions: z.array(z.string().min(8)).min(2).max(6),
  whatNotToRepeat: z.array(z.string().min(8)).min(1).max(6),
  exportSummary: z.string().min(60),
});

export const cycleMemorySchema = z.object({
  title: z.string().min(5),
  status: z.literal("closed"),
  visibility: z.literal("company_readonly"),
  methodologicalRoute: methodologicalRouteSchema,
  decision: z.string().min(5),
  problem: z.string().min(8),
  diagnosisSummary: z.string().min(8),
  signalSummary: z.string().min(8),
  selectedIdea: z.string().min(3),
  prototypeArtifact: z.string().min(3),
  evidenceReading: z.string().min(20),
  nextRecommendedMove: z.string().min(12),
  keyLearnings: z.array(z.string().min(8)).min(1).max(8),
  validatedAssumptions: z.array(z.string().min(8)).max(8),
  unresolvedAssumptions: z.array(z.string().min(8)).max(8),
  risks: z.array(z.string().min(8)).max(8),
  patternsToAvoid: z.array(z.string().min(8)).max(8),
});

export const playbookOverrideSchema = z.object({
  reason: z.string().min(20),
  changedBy: z.string().min(1).default("user"),
  changedAt: z.string().datetime().optional(),
});

export const playbookGenerateInputSchema = z.object({
  cycleId: z.string().min(1),
  companyId: z.string().min(1).optional(),
  licenseId: z.string().min(1).optional(),
  registration: z.unknown().optional(),
  diagnosis: z.unknown().optional(),
  signals: z.unknown().optional(),
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
  evaluationDecision: z.unknown().optional(),
  route: prototypeRouteSchema,
  artifact: prototypeArtifactSchema.optional(),
  records: z.array(resultRecordSchema).default([]),
  evidenceReading: evidenceReadingSchema,
  methodologicalRoute: methodologicalRouteSchema,
  override: playbookOverrideSchema.optional(),
}).superRefine((input, context) => {
  if (
    input.methodologicalRoute === "advance" &&
    input.evidenceReading.methodologicalRoute !== "advance" &&
    !input.override
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Avanzar contra la recomendacion IA requiere override ejecutivo trazable.",
      path: ["override"],
    });
  }
});

export const playbookPhaseRecordSchema = z.object({
  id: z.string().min(1),
  cycleId: z.string().min(1),
  companyId: z.string().min(1).nullable(),
  licenseId: z.string().min(1).nullable(),
  recommendedRoute: methodologicalRouteSchema,
  methodologicalRoute: methodologicalRouteSchema,
  override: playbookOverrideSchema.nullable(),
  playbook: playbookOutputSchema.nullable(),
  memory: cycleMemorySchema,
  closedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type PlaybookOutput = z.infer<typeof playbookOutputSchema>;
export type CycleMemory = z.infer<typeof cycleMemorySchema>;
export type PlaybookGenerateInput = z.infer<typeof playbookGenerateInputSchema>;
export type PlaybookPhaseRecord = z.infer<typeof playbookPhaseRecordSchema>;
