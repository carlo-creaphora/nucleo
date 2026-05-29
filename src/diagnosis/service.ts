import { randomUUID } from "node:crypto";
import {
  type DiagnosisInput,
  type DiagnosisOutput,
  type CriticalMissingPiece,
  diagnosisDraftSchema,
  diagnosisInputSchema,
} from "../contracts/diagnosis.js";
import { type IdeationInput, ideationInputSchema } from "../contracts/ideation.js";
import type { DiagnosisEngine } from "./engine.js";
import {
  HARD_MAX_DIAGNOSIS_QUESTIONS,
  MAX_DIAGNOSIS_QUESTIONS,
  countUserDiagnosisTurns,
} from "./prompt.js";
import type { NucleoStore, StoredDiagnosisCycle } from "../storage/store.js";

export class DiagnosisClosureError extends Error {
  readonly status = 409;

  constructor(
    message: string,
    readonly criticalMissing: CriticalMissingPiece[],
  ) {
    super(message);
    this.name = "DiagnosisClosureError";
  }
}

export class DiagnosisService {
  constructor(
    private readonly engine: DiagnosisEngine,
    private readonly store: NucleoStore,
  ) {}

  async nextQuestion(rawInput: unknown) {
    const input = await this.enrichInput(diagnosisInputSchema.parse(rawInput));
    await this.ensureRegistrationReady(input);
    const userTurns = countUserDiagnosisTurns(input);

    if (userTurns >= HARD_MAX_DIAGNOSIS_QUESTIONS) {
      const diagnosis = await this.engine.completeDiagnosis(input);
      await this.persist(input, diagnosis, "max_questions");

      return {
        maxQuestionsReached: true,
        question: null,
        diagnosis,
        criticalMissing: [],
      };
    }

    if (userTurns >= MAX_DIAGNOSIS_QUESTIONS) {
      const closure = await this.engine.assessClosure(input);
      if (!closure.canClose) {
        const question = await this.engine.generateQuestion(input);
        await this.persist(input);

        return {
          maxQuestionsReached: true,
          question,
          diagnosis: null,
          criticalMissing: [],
        };
      }

      const diagnosis = await this.engine.completeDiagnosis(input);
      await this.persist(input, diagnosis, "max_questions");

      return {
        maxQuestionsReached: true,
        question: null,
        diagnosis,
        criticalMissing: [],
      };
    }

    const question = await this.engine.generateQuestion(input);

    if (question.shouldCloseDiagnosis) {
      const closure = await this.engine.assessClosure(input);

      if (closure.canClose) {
        const diagnosis = await this.engine.completeDiagnosis(input);
        await this.persist(input, diagnosis, "complete");

        return {
          maxQuestionsReached: false,
          question: null,
          diagnosis,
          criticalMissing: [],
        };
      }

      await this.persist(input);

      return {
        maxQuestionsReached: false,
        question,
        diagnosis: null,
        criticalMissing: [],
      };
    }

    await this.persist(input);

    return {
      maxQuestionsReached: false,
      question,
      diagnosis: null,
      criticalMissing: [],
    };
  }

  async complete(rawInput: unknown) {
    const input = await this.enrichInput(diagnosisInputSchema.parse(rawInput));
    await this.ensureRegistrationReady(input);
    await this.ensureCanClose(input);
    const diagnosis = await this.engine.completeDiagnosis(input);
    await this.persist(input, diagnosis, "complete");

    return {
      diagnosis,
      criticalMissing: [],
    };
  }

  async reinterpret(rawInput: unknown, previousDiagnosis: DiagnosisOutput) {
    const input = await this.enrichInput(diagnosisInputSchema.parse(rawInput));
    await this.ensureRegistrationReady(input);

    if (input.correctedSections.length === 0) {
      throw new Error("reinterpret requiere al menos una seccion corregida");
    }

    const diagnosis = await this.engine.reinterpretDiagnosis(
      input,
      previousDiagnosis,
    );
    const closure = await this.engine.assessClosure(input);
    await this.persist(input, diagnosis, "reinterpret", closure.missing);

    return {
      diagnosis,
      changeSummary: summarizeDiagnosisChanges(previousDiagnosis, diagnosis),
      criticalMissing: closure.missing,
    };
  }

  getCycle(cycleId: string) {
    return this.store.getDiagnosisCycle(cycleId);
  }

  listCompanyCycles(companyId: string) {
    return this.store.listCompanyDiagnosisCycles(companyId);
  }

  listVersions(cycleId: string) {
    return this.store.listDiagnosisVersions(cycleId);
  }

  listAudit(cycleId: string) {
    return this.store.listAuditEvents(cycleId);
  }

  getDraft(cycleId: string) {
    return this.store.getDiagnosisDraft(cycleId);
  }

  async saveDraft(rawDraft: unknown) {
    const draft = diagnosisDraftSchema.parse(rawDraft);
    await this.store.saveDiagnosisDraft(draft);
    return draft;
  }

  async buildIdeationInput(cycleId: string): Promise<IdeationInput | null> {
    const cycle = await this.store.getDiagnosisCycle(cycleId);

    if (!cycle?.diagnosis) {
      return null;
    }

    const [versions, registration, companyCycles] = await Promise.all([
      this.store.listDiagnosisVersions(cycleId),
      this.store.getRegistrationByCycle(cycleId),
      this.store.listCompanyDiagnosisCycles(cycle.companyId),
    ]);
    const latestVersion = versions.at(-1)?.version ?? 1;
    const previousCycles = companyCycles.filter(
      (item) => item.cycleId !== cycleId && item.diagnosis,
    );

    const handoff = {
      cycleId,
      companyId: cycle.companyId,
      licenseId: cycle.licenseId,
      diagnosisVersion: latestVersion,
      selectedChallenge: cycle.diagnosis.recommendedChallenge,
      diagnosticInput: {
        detonators: [
          ...cycle.diagnosis.causes.map((cause, index) => ({
            source: "diagnostic_gap",
            title: `Causa ${index + 1}`,
            summary: cause,
          })),
          ...cycle.diagnosis.tensions.map((tension, index) => ({
            source: "tension",
            title: `Tension ${index + 1}`,
            summary: tension,
          })),
        ],
        negativeSignals: cycle.diagnosis.notWorthAttackingYet.map(
          (signal, index) => ({
            sourceCaseTitle: `No atacar ${index + 1}`,
            negativeSignal: signal,
            inversionPrompt: `Si esto no conviene atacar todavia, que supuesto debe invertirse antes de idear?`,
            disruptiveScenario:
              "Idear desde la restriccion y no desde la solucion obvia.",
          }),
        ),
      },
      registration: registration?.output,
      diagnosisInput: cycle.input,
      diagnosis: cycle.diagnosis,
      memory: {
        companyPatterns: previousCycles.flatMap(
          (item) => item.diagnosis?.causes ?? [],
        ),
        previousLearnings: previousCycles.map(
          (item) =>
            item.diagnosis?.assumptionToQuestion ??
            item.diagnosis?.recommendedChallenge ??
            "",
        ).filter(Boolean),
        avoidRepeating: previousCycles.flatMap(
          (item) => item.diagnosis?.notWorthAttackingYet ?? [],
        ),
      },
    };

    return ideationInputSchema.parse(handoff);
  }

  private async persist(
    input: DiagnosisInput,
    diagnosis?: DiagnosisOutput,
    reason?: "complete" | "max_questions" | "reinterpret",
    criticalMissing: CriticalMissingPiece[] = [],
  ) {
    const now = new Date().toISOString();
    const existing = await this.store.getDiagnosisCycle(input.cycleId);
    const cycle: StoredDiagnosisCycle = {
      cycleId: input.cycleId,
      companyId: input.company.companyId,
      licenseId: input.profileLicense.licenseId,
      input,
      diagnosis,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await this.store.saveDiagnosisCycle(cycle);

    if (diagnosis && reason) {
      const versions = await this.store.listDiagnosisVersions(input.cycleId);
      const versionNumber = versions.length + 1;

      await this.store.saveDiagnosisVersion({
        id: `diagv_${randomUUID()}`,
        cycleId: input.cycleId,
        version: versionNumber,
        reason,
        correctedSections: input.correctedSections,
        input,
        diagnosis,
        createdAt: now,
      });
      await this.store.saveAuditEvent({
        id: `aud_${randomUUID()}`,
        cycleId: input.cycleId,
        companyId: input.company.companyId,
        licenseId: input.profileLicense.licenseId,
        stage: "DIAGNOSIS",
        action:
          reason === "reinterpret"
            ? "DIAGNOSIS_REINTERPRETED"
            : "DIAGNOSIS_COMPLETED",
        summary:
          reason === "reinterpret"
            ? "Diagnostico reinterpretado con aclaracion de seccion."
            : "Diagnostico cerrado con salida contractual.",
        metadata: {
          version: versionNumber,
          correctedSections: input.correctedSections.map((item) => item.section),
          criticalMissing,
        },
        createdAt: now,
      });
    }
  }

  private async enrichInput(input: DiagnosisInput): Promise<DiagnosisInput> {
    if (input.companyMemory && input.previousCycleLearnings.length > 0) {
      return input;
    }

    const companyCycles = await this.store.listCompanyDiagnosisCycles(
      input.company.companyId,
    );
    const previousCycles = companyCycles
      .filter((cycle) => cycle.cycleId !== input.cycleId && cycle.diagnosis)
      .slice(0, 5);

    return {
      ...input,
      companyMemory: input.companyMemory ?? {
        summary: previousCycles.length
          ? `Memoria derivada de ${previousCycles.length} ciclos previos de la misma empresa.`
          : undefined,
        repeatedPatterns: previousCycles.flatMap(
          (cycle) => cycle.diagnosis?.causes ?? [],
        ),
        previousLearnings: previousCycles.map(
          (cycle) => cycle.diagnosis?.assumptionToQuestion ?? "",
        ).filter(Boolean),
      },
      previousCycleLearnings:
        input.previousCycleLearnings.length > 0
          ? input.previousCycleLearnings
          : previousCycles.map((cycle) => ({
              cycleId: cycle.cycleId,
              title: cycle.diagnosis?.recommendedChallenge ?? "Ciclo previo",
              learning:
                cycle.diagnosis?.assumptionToQuestion ??
                "Aprendizaje previo sin supuesto registrado.",
              avoidRepeating: cycle.diagnosis?.notWorthAttackingYet ?? [],
            })),
    };
  }

  private async ensureCanClose(input: DiagnosisInput) {
    const closure = await this.engine.assessClosure(input);

    if (!closure.canClose) {
      throw new DiagnosisClosureError(
        "Diagnostico no puede cerrar: faltan piezas criticas.",
        closure.missing,
      );
    }
  }

  private async ensureRegistrationReady(input: DiagnosisInput) {
    const registration = await this.store.getRegistrationByCycle(input.cycleId);

    if (!registration) {
      return;
    }

    if (!registration.output.readiness.isReadyForDiagnosis) {
      throw new Error(
        `Registro incompleto para Diagnostico: ${registration.output.readiness.blockingIssues.join(", ")}`,
      );
    }

    const currentFingerprint = registrationFingerprint({
      companyId: input.company.companyId,
      licenseId: input.profileLicense.licenseId,
      companyName: input.company.name,
      sectorCategory: input.company.sectorCategory,
    });
    const registrationFingerprintValue = registrationFingerprint({
      companyId: registration.output.contextForDiagnosis.company.companyId,
      licenseId:
        registration.output.contextForDiagnosis.profileLicense.licenseId,
      companyName: registration.output.contextForDiagnosis.company.name,
      sectorCategory:
        registration.output.contextForDiagnosis.company.sectorCategory,
    });

    if (currentFingerprint !== registrationFingerprintValue) {
      throw new Error(
        "Registro no coincide con el contexto actual de Diagnostico. Guarda Registro de nuevo.",
      );
    }
  }
}

function registrationFingerprint(input: {
  companyId: string;
  licenseId: string;
  companyName: string;
  sectorCategory: string;
}) {
  return [
    input.companyId,
    input.licenseId,
    input.companyName,
    input.sectorCategory,
  ]
    .map((value) => value.trim().toLowerCase())
    .join("|");
}

function summarizeDiagnosisChanges(
  previous: DiagnosisOutput,
  next: DiagnosisOutput,
) {
  const changed: string[] = [];
  const unchanged: string[] = [];
  const entries: Array<[keyof DiagnosisOutput, string]> = [
    ["recommendedChallenge", "reto recomendado"],
    ["whyThisChallenge", "por que es mas correcto"],
    ["symptoms", "sintomas"],
    ["causes", "causas"],
    ["tensions", "tensiones"],
    ["metrics", "metricas"],
    ["restrictions", "restricciones"],
    ["notWorthAttackingYet", "que no conviene atacar todavia"],
    ["assumptionToQuestion", "supuesto a cuestionar"],
    ["ideationBrief", "brief para ideacion"],
  ];

  for (const [key, label] of entries) {
    const before = JSON.stringify(previous[key]);
    const after = JSON.stringify(next[key]);

    if (before === after) unchanged.push(label);
    else changed.push(label);
  }

  return {
    changed,
    unchanged,
    summary: changed.length
      ? `Cambio: ${changed.slice(0, 4).join(", ")}. Sin cambio material: ${unchanged.slice(0, 4).join(", ")}.`
      : "La aclaracion no obligo a cambiar el diagnostico.",
  };
}
