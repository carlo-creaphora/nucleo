import type { PrototypeEngine } from "./engine.js";
import {
  type PrototypeArtifact,
  type PrototypeBuildInput,
  type PrototypeClassification,
  type PrototypeClassifyInput,
  type PrototypePhaseRecord,
  type PrototypePhaseState,
  prototypePhaseStateSchema,
} from "../contracts/prototype.js";
import type { NucleoStore } from "../storage/store.js";

export class PrototypeService {
  constructor(
    private readonly engine: PrototypeEngine,
    private readonly store: NucleoStore,
  ) {}

  async build(input: PrototypeBuildInput): Promise<PrototypeArtifact> {
    const artifact = await this.engine.build(input);
    const existing = await this.store.getPrototypeRun(input.cycleId);

    await this.save({
      cycleId: input.cycleId,
      prototypeRouteId: input.route.id,
      prototypeIdeaType: input.route.ideaType as PrototypePhaseState["prototypeIdeaType"],
      prototypeClassification: existing?.prototypeClassification ?? null,
      prototypeBuilderValues: {
        ...(existing?.prototypeBuilderValues ?? {}),
        [input.route.id]: input.builderValues,
      },
      prototypeArtifact: {
        routeId: input.route.id,
        artifact,
      },
    });

    return artifact;
  }

  classify(input: PrototypeClassifyInput): Promise<PrototypeClassification> {
    return this.engine.classify(input);
  }

  async save(rawState: unknown): Promise<PrototypePhaseRecord> {
    const state = prototypePhaseStateSchema.parse(rawState);
    const existing = await this.store.getPrototypeRun(state.cycleId);
    const now = new Date().toISOString();
    const record: PrototypePhaseRecord = {
      ...state,
      id: existing?.id ?? `prototype-${state.cycleId}`,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await this.store.savePrototypeRun(record);
    await this.store.saveAuditEvent({
      id: `audit-${record.id}-${Date.now()}`,
      cycleId: record.cycleId,
      stage: "PROTOTYPE",
      action: "UPSERT_PROTOTYPE",
      summary: record.prototypeArtifact
        ? "Prototipo generado y persistido."
        : "Estado de prototipado persistido.",
      metadata: {
        routeId: record.prototypeRouteId,
        ideaType: record.prototypeIdeaType,
      },
      createdAt: now,
    });

    return record;
  }

  get(cycleId: string) {
    return this.store.getPrototypeRun(cycleId);
  }
}
