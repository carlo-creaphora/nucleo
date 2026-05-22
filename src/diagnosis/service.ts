import { randomUUID } from "node:crypto";
import {
  type DiagnosisInput,
  type DiagnosisOutput,
  diagnosisInputSchema,
} from "../contracts/diagnosis.js";
import type { IdeationInput } from "../contracts/ideation.js";
import type { DiagnosisEngine } from "./engine.js";
import {
  MAX_DIAGNOSIS_QUESTIONS,
  countUserDiagnosisTurns,
  detectCriticalMissingPieces,
} from "./prompt.js";
import type { NucleoStore, StoredDiagnosisCycle } from "../storage/store.js";

export class DiagnosisService {
  constructor(
    private readonly engine: DiagnosisEngine,
    private readonly store: NucleoStore,
  ) {}

  async nextQuestion(rawInput: unknown) {
    const input = await this.enrichInput(diagnosisInputSchema.parse(rawInput));
    const userTurns = countUserDiagnosisTurns(input);

    if (userTurns >= MAX_DIAGNOSIS_QUESTIONS) {
      const diagnosis = await this.engine.completeDiagnosis(input);
      await this.persist(input, diagnosis, "max_questions");

      return {
        maxQuestionsReached: true,
        question: null,
        diagnosis,
        criticalMissing: detectCriticalMissingPieces(input),
      };
    }

    const question = await this.engine.generateQuestion(input);
    await this.persist(input);

    return {
      maxQuestionsReached: false,
      question,
      diagnosis: null,
      criticalMissing: detectCriticalMissingPieces(input),
    };
  }

  async complete(rawInput: unknown) {
    const input = await this.enrichInput(diagnosisInputSchema.parse(rawInput));
    const diagnosis = await this.engine.completeDiagnosis(input);
    await this.persist(input, diagnosis, "complete");

    return {
      diagnosis,
      criticalMissing: detectCriticalMissingPieces(input),
    };
  }

  async reinterpret(rawInput: unknown, previousDiagnosis: DiagnosisOutput) {
    const input = await this.enrichInput(diagnosisInputSchema.parse(rawInput));

    if (input.correctedSections.length === 0) {
      throw new Error("reinterpret requiere al menos una seccion corregida");
    }

    const diagnosis = await this.engine.reinterpretDiagnosis(
      input,
      previousDiagnosis,
    );
    await this.persist(input, diagnosis, "reinterpret");

    return {
      diagnosis,
      criticalMissing: detectCriticalMissingPieces(input),
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

    return {
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
  }

  private async persist(
    input: DiagnosisInput,
    diagnosis?: DiagnosisOutput,
    reason?: "complete" | "max_questions" | "reinterpret",
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
          criticalMissing: detectCriticalMissingPieces(input),
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
}
