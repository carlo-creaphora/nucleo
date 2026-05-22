import type { DiagnosisInput, DiagnosisOutput } from "../contracts/diagnosis.js";

export type StoredDiagnosisCycle = {
  cycleId: string;
  companyId: string;
  licenseId: string;
  input: DiagnosisInput;
  diagnosis?: DiagnosisOutput;
  createdAt: string;
  updatedAt: string;
};

export type NucleoStore = {
  saveDiagnosisCycle(cycle: StoredDiagnosisCycle): Promise<void>;
  getDiagnosisCycle(cycleId: string): Promise<StoredDiagnosisCycle | null>;
  listCompanyDiagnosisCycles(companyId: string): Promise<StoredDiagnosisCycle[]>;
};

