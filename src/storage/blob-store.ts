import { get, put } from "@vercel/blob";
import type { IdeationRecord } from "../contracts/ideation.js";
import type { RegistrationRecord } from "../contracts/registration.js";
import type {
  AuditEvent,
  NucleoStore,
  StoredDiagnosisCycle,
  StoredDiagnosisVersion,
  StoredSignalsRun,
} from "./store.js";

type StoreFile = {
  registrations: RegistrationRecord[];
  diagnosisCycles: StoredDiagnosisCycle[];
  diagnosisVersions: StoredDiagnosisVersion[];
  signalsRuns: StoredSignalsRun[];
  ideationRuns: IdeationRecord[];
  auditEvents: AuditEvent[];
};

const emptyStore: StoreFile = {
  registrations: [],
  diagnosisCycles: [],
  diagnosisVersions: [],
  signalsRuns: [],
  ideationRuns: [],
  auditEvents: [],
};

export class BlobStore implements NucleoStore {
  constructor(private readonly pathname = "nucleo/demo-store.json") {}

  async saveRegistration(registration: RegistrationRecord) {
    const data = await this.read();
    const index = data.registrations.findIndex(
      (item) => item.id === registration.id,
    );

    if (index >= 0) data.registrations[index] = registration;
    else data.registrations.push(registration);

    await this.write(data);
  }

  async getRegistration(id: string) {
    const data = await this.read();
    return data.registrations.find((item) => item.id === id) ?? null;
  }

  async getRegistrationByCycle(cycleId: string) {
    const data = await this.read();
    return data.registrations.find((item) => item.cycleId === cycleId) ?? null;
  }

  async listCompanyRegistrations(companyId: string) {
    const data = await this.read();
    return data.registrations.filter((item) => item.companyId === companyId);
  }

  async saveDiagnosisCycle(cycle: StoredDiagnosisCycle) {
    const data = await this.read();
    const index = data.diagnosisCycles.findIndex(
      (item) => item.cycleId === cycle.cycleId,
    );

    if (index >= 0) data.diagnosisCycles[index] = cycle;
    else data.diagnosisCycles.push(cycle);

    await this.write(data);
  }

  async getDiagnosisCycle(cycleId: string) {
    const data = await this.read();
    return data.diagnosisCycles.find((item) => item.cycleId === cycleId) ?? null;
  }

  async listCompanyDiagnosisCycles(companyId: string) {
    const data = await this.read();
    return data.diagnosisCycles.filter((item) => item.companyId === companyId);
  }

  async saveDiagnosisVersion(version: StoredDiagnosisVersion) {
    const data = await this.read();
    const index = data.diagnosisVersions.findIndex(
      (item) => item.id === version.id,
    );

    if (index >= 0) data.diagnosisVersions[index] = version;
    else data.diagnosisVersions.push(version);

    await this.write(data);
  }

  async listDiagnosisVersions(cycleId: string) {
    const data = await this.read();
    return data.diagnosisVersions
      .filter((item) => item.cycleId === cycleId)
      .sort((left, right) => left.version - right.version);
  }

  async saveSignalsRun(run: StoredSignalsRun) {
    const data = await this.read();
    const index = data.signalsRuns.findIndex(
      (item) => item.cycleId === run.cycleId,
    );

    if (index >= 0) data.signalsRuns[index] = run;
    else data.signalsRuns.push(run);

    await this.write(data);
  }

  async getSignalsRun(cycleId: string) {
    const data = await this.read();
    return data.signalsRuns.find((item) => item.cycleId === cycleId) ?? null;
  }

  async saveIdeationRun(run: IdeationRecord) {
    const data = await this.read();
    const index = data.ideationRuns.findIndex(
      (item) => item.cycleId === run.cycleId,
    );

    if (index >= 0) data.ideationRuns[index] = run;
    else data.ideationRuns.push(run);

    await this.write(data);
  }

  async getIdeationRun(cycleId: string) {
    const data = await this.read();
    return data.ideationRuns.find((item) => item.cycleId === cycleId) ?? null;
  }

  async saveAuditEvent(event: AuditEvent) {
    const data = await this.read();
    data.auditEvents.push(event);
    await this.write(data);
  }

  async listAuditEvents(cycleId: string) {
    const data = await this.read();
    return data.auditEvents
      .filter((item) => item.cycleId === cycleId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  private async read(): Promise<StoreFile> {
    try {
      const result = await get(this.pathname, {
        access: "private",
        useCache: false,
      });

      if (!result || result.statusCode !== 200 || !result.stream) {
        return { ...emptyStore };
      }

      const raw = await new Response(result.stream).text();
      const data = JSON.parse(raw) as Partial<StoreFile>;

      return {
        registrations: data.registrations ?? [],
        diagnosisCycles: data.diagnosisCycles ?? [],
        diagnosisVersions: data.diagnosisVersions ?? [],
        signalsRuns: data.signalsRuns ?? [],
        ideationRuns: data.ideationRuns ?? [],
        auditEvents: data.auditEvents ?? [],
      };
    } catch (error) {
      if (
        error instanceof Error &&
        /not found|BlobNotFound|404/i.test(error.message)
      ) {
        return { ...emptyStore };
      }

      throw error;
    }
  }

  private async write(data: StoreFile) {
    await put(this.pathname, JSON.stringify(data, null, 2), {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
  }
}
