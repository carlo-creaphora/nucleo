import { z } from "zod";

export const prototypeIdeaTypeSchema = z.enum([
  "Servicio / experiencia",
  "Producto digital / interfaz",
  "Proceso / operación",
  "Modelo comercial / acceso",
  "Producto físico / tangible",
]);

export const prototypeEvidenceScopeSchema = z.object({
  sample: z.string().min(8),
  sampleTargetMin: z.number().int().positive(),
  sampleTargetMax: z.number().int().positive(),
  validates: z.string().min(20),
  doesNotValidate: z.string().min(20),
  thresholds: z.object({
    advance: z.string().min(12),
    iterate: z.string().min(12),
    rethink: z.string().min(12),
  }),
}).refine((scope) => scope.sampleTargetMin <= scope.sampleTargetMax, {
  message: "sampleTargetMin debe ser menor o igual a sampleTargetMax.",
  path: ["sampleTargetMax"],
});

export const prototypeEvidenceMetricSchema = z.object({
  questionId: z.string().min(1),
  label: z.string().min(4),
  advanceValues: z.array(z.string().min(1)).min(1),
  advance: z.string().min(2),
  iterate: z.string().min(2),
  rethink: z.string().min(2),
  interpretation: z.string().min(12),
});

export const prototypeRouteSchema = z.object({
  id: z.string().min(2),
  ideaType: prototypeIdeaTypeSchema,
  method: z.string().min(2),
  artifact: z.string().min(2),
  summary: z.string().min(10),
  validates: z.array(z.string().min(4)).min(1),
  doesNotValidate: z.array(z.string().min(4)).min(1),
  output: z.array(z.string()).min(1),
  questions: z.array(z.string()).min(1),
  advanceSignals: z.array(z.string().min(4)).min(1),
  stopSignals: z.array(z.string().min(4)).min(1),
  falsePositive: z.string().min(10),
  falseNegative: z.string().min(10),
  avoidMisread: z.array(z.string().min(8)).min(1),
  decision: z.array(z.string()).min(1),
  evidenceScope: prototypeEvidenceScopeSchema,
  evidenceMetrics: z.array(prototypeEvidenceMetricSchema).min(1),
});

export const prototypeClassifyInputSchema = z.object({
  idea: z.object({
    idea: z.string().min(1),
    supuestoQueRompe: z.string().optional(),
    mecanicaConcreta: z.string().optional(),
    porQueFunciona: z.string().optional(),
    metricaQueMueve: z.string().optional(),
    primerPasoEjecutable: z.string().optional(),
  }),
  diagnosis: z.unknown().optional(),
  signals: z.unknown().optional(),
  availableIdeaTypes: z.array(prototypeIdeaTypeSchema).min(1),
});

export const prototypeClassificationSchema = z.object({
  ideaType: prototypeIdeaTypeSchema,
  rationale: z.string().min(20),
});

export const prototypeBuildInputSchema = z.object({
  cycleId: z.string().min(1),
  route: prototypeRouteSchema,
  idea: z.object({
    idea: z.string().min(1),
    supuestoQueRompe: z.string().optional(),
    mecanicaConcreta: z.string().optional(),
    porQueFunciona: z.string().optional(),
    casoAnalogo: z.string().optional(),
    metricaQueMueve: z.string().optional(),
    primerPasoEjecutable: z.string().optional(),
    antiPatronesAEvitar: z.union([z.string(), z.array(z.string())]).optional(),
  }),
  diagnosis: z.unknown().optional(),
  signals: z.unknown().optional(),
  evaluationDecision: z
    .object({
      criticalAssumptions: z.string().optional(),
      firstThingToTest: z.string().optional(),
      risksToWatch: z.string().optional(),
    })
    .optional(),
  builderValues: z.record(z.string(), z.string().min(1)).default({}),
});

export const prototypeArtifactSchema = z.object({
  title: z.string().min(4),
  artifactType: z.string().min(2),
  method: z.string().min(2),
  objective: z.string().min(20),
  howToUse: z.string().min(20),
  validates: z.array(z.string().min(4)).min(1).max(6),
  doesNotValidate: z.array(z.string().min(4)).min(1).max(6),
  artifact: z.array(
    z.object({
      label: z.string().min(2),
      content: z.string().min(10),
    }),
  ).min(4).max(10),
  testQuestions: z.array(z.string().min(8)).min(3).max(8),
  advanceSignals: z.array(z.string().min(8)).min(2).max(6),
  stopSignals: z.array(z.string().min(8)).min(2).max(6),
  falsePositive: z.string().min(20),
  falseNegative: z.string().min(20),
  avoidMisread: z.array(z.string().min(10)).min(2).max(6),
  decisionReading: z.object({
    advance: z.string().min(12),
    iterate: z.string().min(12),
    rethink: z.string().min(12),
  }),
  evidenceScope: prototypeEvidenceScopeSchema,
  limits: z.array(z.string().min(8)).min(2).max(5),
  nextStep: z.string().min(12),
});

export const prototypePhaseStateSchema = z.object({
  cycleId: z.string().min(1),
  prototypeRouteId: z.string().min(1).nullable().optional(),
  prototypeIdeaType: prototypeIdeaTypeSchema.nullable().optional(),
  prototypeClassification: prototypeClassificationSchema
    .extend({
      ideaId: z.string().min(1).optional(),
    })
    .nullable()
    .optional(),
  prototypeBuilderValues: z.record(z.string(), z.record(z.string(), z.string())).default({}),
  prototypeArtifact: z
    .object({
      routeId: z.string().min(1),
      artifact: prototypeArtifactSchema,
    })
    .nullable()
    .optional(),
});

export const prototypePhaseRecordSchema = prototypePhaseStateSchema.extend({
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type PrototypeBuildInput = z.infer<typeof prototypeBuildInputSchema>;
export type PrototypeArtifact = z.infer<typeof prototypeArtifactSchema>;
export type PrototypeClassifyInput = z.infer<typeof prototypeClassifyInputSchema>;
export type PrototypeClassification = z.infer<typeof prototypeClassificationSchema>;
export type PrototypePhaseRecord = z.infer<typeof prototypePhaseRecordSchema>;
export type PrototypePhaseState = z.infer<typeof prototypePhaseStateSchema>;
