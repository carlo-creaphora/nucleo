import type { DiagnosisInput, DiagnosisOutput } from "../contracts/diagnosis.js";
import type { RegistrationRecord } from "../contracts/registration.js";

export type AuditEvent = {
  id: string;
  cycleId?: string;
  companyId?: string;
  licenseId?: string;
  stage: "REGISTRATION" | "DIAGNOSIS" | "IDEATION" | "SYSTEM";
  action: string;
  summary: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type StoredDiagnosisCycle = {
  cycleId: string;
  companyId: string;
  licenseId: string;
  input: DiagnosisInput;
  diagnosis?: DiagnosisOutput;
  createdAt: string;
  updatedAt: string;
};

export type StoredDiagnosisVersion = {
  id: string;
  cycleId: string;
  version: number;
  reason: "complete" | "max_questions" | "reinterpret";
  correctedSections: DiagnosisInput["correctedSections"];
  input: DiagnosisInput;
  diagnosis: DiagnosisOutput;
  createdAt: string;
};

export type NucleoStore = {
  saveRegistration(registration: RegistrationRecord): Promise<void>;
  getRegistration(id: string): Promise<RegistrationRecord | null>;
  getRegistrationByCycle(cycleId: string): Promise<RegistrationRecord | null>;
  listCompanyRegistrations(companyId: string): Promise<RegistrationRecord[]>;
  saveDiagnosisCycle(cycle: StoredDiagnosisCycle): Promise<void>;
  getDiagnosisCycle(cycleId: string): Promise<StoredDiagnosisCycle | null>;
  listCompanyDiagnosisCycles(companyId: string): Promise<StoredDiagnosisCycle[]>;
  saveDiagnosisVersion(version: StoredDiagnosisVersion): Promise<void>;
  listDiagnosisVersions(cycleId: string): Promise<StoredDiagnosisVersion[]>;
  saveAuditEvent(event: AuditEvent): Promise<void>;
  listAuditEvents(cycleId: string): Promise<AuditEvent[]>;
};
