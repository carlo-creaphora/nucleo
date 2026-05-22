import { z } from "zod";
import { diagnosisInputSchema, diagnosisOutputSchema } from "./diagnosis.js";
import { registrationOutputSchema } from "./registration.js";

export const ideationInputSchema = z.object({
  cycleId: z.string().min(1),
  companyId: z.string().min(1),
  licenseId: z.string().min(1),
  diagnosisVersion: z.number().int().min(1),
  selectedChallenge: z.string().min(12),
  diagnosticInput: z.object({
    detonators: z.array(
      z.object({
        source: z.string().min(1),
        title: z.string().min(1),
        summary: z.string().min(1),
      }),
    ),
    negativeSignals: z.array(
      z.object({
        sourceCaseTitle: z.string().min(1),
        negativeSignal: z.string().min(1),
        inversionPrompt: z.string().min(1),
        disruptiveScenario: z.string().min(1),
      }),
    ),
  }),
  registration: registrationOutputSchema.optional(),
  diagnosisInput: diagnosisInputSchema,
  diagnosis: diagnosisOutputSchema,
  memory: z.object({
    companyPatterns: z.array(z.string()).default([]),
    previousLearnings: z.array(z.string()).default([]),
    avoidRepeating: z.array(z.string()).default([]),
  }),
});

export type IdeationInput = z.infer<typeof ideationInputSchema>;
