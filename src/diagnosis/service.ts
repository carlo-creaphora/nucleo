import {
  type DiagnosisInput,
  type DiagnosisOutput,
  diagnosisInputSchema,
} from "../contracts/diagnosis.js";
import type { DiagnosisEngine } from "./engine.js";
import { MAX_DIAGNOSIS_QUESTIONS, countUserDiagnosisTurns } from "./prompt.js";
import type { NucleoStore, StoredDiagnosisCycle } from "../storage/store.js";

export class DiagnosisService {
  constructor(
    private readonly engine: DiagnosisEngine,
    private readonly store: NucleoStore,
  ) {}

  async nextQuestion(rawInput: unknown) {
    const input = diagnosisInputSchema.parse(rawInput);
    const userTurns = countUserDiagnosisTurns(input);

    if (userTurns >= MAX_DIAGNOSIS_QUESTIONS) {
      const diagnosis = await this.engine.completeDiagnosis(input);
      await this.persist(input, diagnosis);

      return {
        maxQuestionsReached: true,
        question: null,
        diagnosis,
      };
    }

    const question = await this.engine.generateQuestion(input);
    await this.persist(input);

    return {
      maxQuestionsReached: false,
      question,
      diagnosis: null,
    };
  }

  async complete(rawInput: unknown) {
    const input = diagnosisInputSchema.parse(rawInput);
    const diagnosis = await this.engine.completeDiagnosis(input);
    await this.persist(input, diagnosis);

    return {
      diagnosis,
    };
  }

  async reinterpret(rawInput: unknown, previousDiagnosis: DiagnosisOutput) {
    const input = diagnosisInputSchema.parse(rawInput);

    if (input.correctedSections.length === 0) {
      throw new Error("reinterpret requiere al menos una seccion corregida");
    }

    const diagnosis = await this.engine.reinterpretDiagnosis(
      input,
      previousDiagnosis,
    );
    await this.persist(input, diagnosis);

    return {
      diagnosis,
    };
  }

  getCycle(cycleId: string) {
    return this.store.getDiagnosisCycle(cycleId);
  }

  listCompanyCycles(companyId: string) {
    return this.store.listCompanyDiagnosisCycles(companyId);
  }

  private async persist(input: DiagnosisInput, diagnosis?: DiagnosisOutput) {
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
  }
}

