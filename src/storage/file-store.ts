import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { IdeationRecord } from "../contracts/ideation.js";
import type { RegistrationRecord } from "../contracts/registration.js";
import { BlobStore } from "./blob-store.js";
import { PostgresStore } from "./postgres-store.js";
import type {
  AuditEvent,
  StoredDiagnosisCycle,
  StoredDiagnosisVersion,
  NucleoStore,
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

export class FileStore implements NucleoStore {
  constructor(private readonly path: string) {}

  async saveRegistration(registration: RegistrationRecord) {
    const data = await this.read();
    const index = data.registrations.findIndex(
      (item) => item.id === registration.id,
    );

    if (index >= 0) {
      data.registrations[index] = registration;
    } else {
      data.registrations.push(registration);
    }

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

    if (index >= 0) {
      data.diagnosisCycles[index] = cycle;
    } else {
      data.diagnosisCycles.push(cycle);
    }

    await this.write(data);
  }

  async getDiagnosisCycle(cycleId: string) {
    const data = await this.read();
    return data.diagnosisCycles.find((cycle) => cycle.cycleId === cycleId) ?? null;
  }

  async listCompanyDiagnosisCycles(companyId: string) {
    const data = await this.read();
    return data.diagnosisCycles.filter((cycle) => cycle.companyId === companyId);
  }

  async saveDiagnosisVersion(version: StoredDiagnosisVersion) {
    const data = await this.read();
    const index = data.diagnosisVersions.findIndex(
      (item) => item.id === version.id,
    );

    if (index >= 0) {
      data.diagnosisVersions[index] = version;
    } else {
      data.diagnosisVersions.push(version);
    }

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

    if (index >= 0) {
      data.signalsRuns[index] = run;
    } else {
      data.signalsRuns.push(run);
    }

    await this.write(data);
  }

  async getSignalsRun(cycleId: string) {
    const data = await this.read();
    return data.signalsRuns.find((run) => run.cycleId === cycleId) ?? null;
  }

  async saveIdeationRun(run: IdeationRecord) {
    const data = await this.read();
    const index = data.ideationRuns.findIndex(
      (item) => item.cycleId === run.cycleId,
    );

    if (index >= 0) {
      data.ideationRuns[index] = run;
    } else {
      data.ideationRuns.push(run);
    }

    await this.write(data);
  }

  async getIdeationRun(cycleId: string) {
    const data = await this.read();
    return data.ideationRuns.find((run) => run.cycleId === cycleId) ?? null;
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
      const raw = await readFile(this.path, "utf8");
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
        "code" in error &&
        error.code === "ENOENT"
      ) {
          return {
            ...emptyStore,
            registrations: [],
            diagnosisCycles: [],
            diagnosisVersions: [],
            signalsRuns: [],
            ideationRuns: [],
            auditEvents: [],
          };
      }

      throw error;
    }
  }

  private async write(data: StoreFile) {
    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(this.path, JSON.stringify(data, null, 2));
  }
}

export function createStore() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (databaseUrl && /^postgres(ql)?:\/\//i.test(databaseUrl)) {
    return new PostgresStore(databaseUrl);
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return new BlobStore(process.env.NUCLEO_BLOB_PATH || "nucleo/demo-store.json");
  }

  const defaultPath = process.env.VERCEL ? "/tmp/nucleo.json" : ".data/nucleo.json";
  return new FileStore(process.env.NUCLEO_DATA_PATH || defaultPath);
}
