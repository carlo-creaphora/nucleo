import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { StoredDiagnosisCycle, NucleoStore } from "./store.js";

type StoreFile = {
  diagnosisCycles: StoredDiagnosisCycle[];
};

const emptyStore: StoreFile = {
  diagnosisCycles: [],
};

export class FileStore implements NucleoStore {
  constructor(private readonly path: string) {}

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

  private async read(): Promise<StoreFile> {
    try {
      const raw = await readFile(this.path, "utf8");
      return JSON.parse(raw) as StoreFile;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return { ...emptyStore, diagnosisCycles: [] };
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
  return new FileStore(process.env.NUCLEO_DATA_PATH || ".data/nucleo.json");
}

