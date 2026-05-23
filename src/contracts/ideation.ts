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

export const ideationEvidenceBaseSchema = z.enum([
  "fuerte",
  "media",
  "indirecta",
]);

export const ideationSignalGapSchema = z.object({
  title: z.string().min(8),
  estadoActualEmpresa: z.string().min(20),
  potencialMercado: z.string().min(20),
  brecha: z.string().min(20),
  evidenciaMercado: z.string().min(20),
  evidenceIds: z.array(z.string().min(1)).min(1),
  evidenceBase: ideationEvidenceBaseSchema,
  implicationForIdeation: z.string().min(12),
});

export const ideationSignalInsightSchema = z.object({
  title: z.string().min(8),
  cliente: z.string().min(3),
  comportamientoObservado: z.string().min(20),
  motivacionODeseo: z.string().min(20),
  verdadAccionable: z.string().min(12),
  evidenceIds: z.array(z.string().min(1)).min(1),
  evidenceBase: ideationEvidenceBaseSchema,
  promptParaIdeacion: z.string().min(12),
});

export const ideationSignalsEvidenceSchema = z.object({
  id: z.string().min(1),
  lens: z.enum([
    "SOCIAL_LISTENING",
    "TREND",
    "COMPETITOR",
    "CUSTOMER_INSIGHT",
  ]),
  title: z.string().min(8),
  observedText: z.string().min(12),
  sourceLabel: z.string().min(3),
  sourceUrl: z.string().min(1).optional(),
  evidenceBase: z.enum(["HIGH", "MEDIUM", "LOW"]),
  usefulnessForIdeation: z.string().min(8),
});

export const ideationSignalsInputSchema = z.object({
  cycleId: z.string().min(1),
  companyId: z.string().min(1),
  licenseId: z.string().min(1),
  searchDepth: z.literal("standard"),
  generatedAt: z.string().datetime(),
  gaps: z.array(ideationSignalGapSchema).length(2),
  insights: z.array(ideationSignalInsightSchema).length(2),
  memory: z.object({
    companyPatterns: z.array(z.string()).default([]),
    previousLearnings: z.array(z.string()).default([]),
    avoidRepeating: z.array(z.string()).default([]),
  }),
  evidence: z.array(ideationSignalsEvidenceSchema).default([]),
});

export const ideationKnowledgePackSchema = z.object({
  sourceDocuments: z.object({
    assumptionsByIndustry: z.string().min(100),
    antiPatterns: z.string().min(100),
    disruptiveCases: z.string().min(100),
    weirdBusinessModels: z.string().min(100),
  }).optional(),
  assumptionsByIndustry: z.array(
    z.object({
      industry: z.string().min(3),
      assumption: z.string().min(12),
      whyItLimitsIdeation: z.string().min(12),
    }),
  ).min(1),
  antiPatterns: z.array(
    z.object({
      title: z.string().min(4),
      description: z.string().min(12),
      forbiddenIdeaPatterns: z.array(z.string().min(3)).min(1),
    }),
  ).min(1),
  disruptiveCases: z.array(
    z.object({
      name: z.string().min(2),
      year: z.string().min(4),
      industry: z.string().min(3),
      country: z.string().min(3),
      mechanism: z.string().min(12),
      transferablePrinciple: z.string().min(12),
    }),
  ).min(3),
  weirdBusinessModels: z.array(
    z.object({
      name: z.string().min(3),
      model: z.string().min(12),
      usefulWhen: z.string().min(12),
    }),
  ).default([]),
});

export const ideationRuptureTypeSchema = z.enum([
  "RUPTURA_MODERADA",
  "RUPTURA_FUERTE",
  "RUPTURA_RADICAL_CONTROLADA",
]);

export const ideationSelectionSchema = z.object({
  ruptureType: ideationRuptureTypeSchema,
  gapTitle: z.string().min(8),
  insightTitle: z.string().min(8),
});

export const ideationGenerationInputSchema = z.object({
  cycleId: z.string().min(1),
  diagnosisHandoff: ideationInputSchema,
  signalsHandoff: ideationSignalsInputSchema,
  knowledgePack: ideationKnowledgePackSchema,
  selection: ideationSelectionSchema,
});

export const ideationRouteSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(8),
  ruptureType: ideationRuptureTypeSchema,
  verb: z.enum(["mejorar", "transformar", "romper"]),
  guidingQuestion: z.string().min(20),
  riskLevel: z.enum(["bajo", "medio", "alto_controlado"]),
  purpose: z.string().min(20),
  usesGapTitles: z.array(z.string().min(1)).min(1),
  usesInsightTitles: z.array(z.string().min(1)).min(1),
});

export const ideationIdeaSchema = z.object({
  id: z.string().min(1),
  routeId: z.string().min(1),
  source: z.enum(["ai", "user"]).default("ai"),
  selectedForEvaluation: z.boolean().default(false),
  idea: z.string().min(8),
  supuestoQueRompe: z.string().min(20),
  mecanicaConcreta: z.string().min(40),
  porQueFunciona: z.string().min(30),
  casoAnalogo: z.string().min(40),
  metricaQueMueve: z.string().min(12),
  primerPasoEjecutable: z.string().min(30),
  antiPatronesAEvitar: z.array(z.string().min(8)).min(1),
  trace: z.object({
    gapTitles: z.array(z.string().min(1)).min(1),
    insightTitles: z.array(z.string().min(1)).min(1),
    evidenceIds: z.array(z.string().min(1)).default([]),
    disruptiveCaseName: z.string().min(2),
  }),
});

export const ideationOutputSchema = z.object({
  generatedAt: z.string().datetime(),
  route: ideationRouteSchema,
  ideas: z.array(ideationIdeaSchema).min(1).max(4),
  internal: z.object({
    caseScreening: z.object({
      translatedCaseReferences: z.array(
        z.object({
          caseName: z.string().min(2),
          transferableMechanism: z.string().min(20),
          reinterpretationForThisIdea: z.string().min(20),
          caveat: z.string().min(8),
        }),
      ).min(1).max(4),
      rejectedCaseFamilies: z.array(z.string().min(8)).default([]),
    }),
    consultedKnowledge: z.object({
      assumptionsByIndustry: z.number().int().min(1),
      antiPatterns: z.number().int().min(1),
      disruptiveCases: z.number().int().min(3),
      weirdBusinessModels: z.number().int().min(0),
    }),
    rejectedAntiPatternMatches: z.array(z.string()).default([]),
  }),
});

export const ideationRecordSchema = z.object({
  id: z.string().min(1),
  cycleId: z.string().min(1),
  companyId: z.string().min(1),
  licenseId: z.string().min(1),
  input: ideationGenerationInputSchema,
  output: ideationOutputSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type IdeationSignalsInput = z.infer<typeof ideationSignalsInputSchema>;
export type IdeationKnowledgePack = z.infer<typeof ideationKnowledgePackSchema>;
export type IdeationSelection = z.infer<typeof ideationSelectionSchema>;
export type IdeationGenerationInput = z.infer<
  typeof ideationGenerationInputSchema
>;
export type IdeationOutput = z.infer<typeof ideationOutputSchema>;
export type IdeationRecord = z.infer<typeof ideationRecordSchema>;
