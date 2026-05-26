import { z } from "zod";
import { playbookPhaseRecordSchema } from "./playbook.js";
import { prototypePhaseStateSchema } from "./prototype.js";
import { methodologicalRouteSchema, resultsPhaseStateSchema } from "./results.js";

export const cyclePhaseSchema = z.enum([
  "registration",
  "diagnosis",
  "signals",
  "ideation",
  "evaluation",
  "prototype",
  "results",
  "reading",
  "playbook",
  "memory",
]);

export const cycleStatusSchema = z.enum(["draft", "in_progress", "closed"]);

export const traceabilitySchema = z.object({
  sourcePhase: cyclePhaseSchema,
  inputRefs: z.array(z.string().min(1)).default([]),
  evidenceUsed: z.array(z.string().min(1)).default([]),
  inferences: z.array(z.string().min(1)).default([]),
  decision: z.string().min(1).optional(),
  limitations: z.array(z.string().min(1)).default([]),
});

export const masterCycleStateSchema = z.object({
  cycleId: z.string().min(1),
  status: cycleStatusSchema,
  currentPhase: cyclePhaseSchema,
  registration: z.unknown().nullable().optional(),
  diagnosis: z.unknown().nullable().optional(),
  signals: z.unknown().nullable().optional(),
  ideation: z.unknown().nullable().optional(),
  evaluationConfirmed: z.boolean().default(false),
  evaluationWinnerId: z.string().nullable().optional(),
  prototype: prototypePhaseStateSchema.nullable().optional(),
  results: resultsPhaseStateSchema.nullable().optional(),
  playbook: playbookPhaseRecordSchema.nullable().optional(),
  finalMethodologicalRoute: methodologicalRouteSchema.nullable().optional(),
  traceability: z.array(traceabilitySchema).default([]),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  closedAt: z.string().datetime().nullable().optional(),
});

export type CyclePhase = z.infer<typeof cyclePhaseSchema>;
export type CycleStatus = z.infer<typeof cycleStatusSchema>;
export type MasterCycleState = z.infer<typeof masterCycleStateSchema>;
export type Traceability = z.infer<typeof traceabilitySchema>;
