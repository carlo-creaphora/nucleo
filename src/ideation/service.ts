import { randomUUID } from "node:crypto";
import {
  type IdeationGenerationInput,
  type IdeationSelection,
  type IdeationRecord,
  ideationGenerationInputSchema,
  ideationSelectionSchema,
} from "../contracts/ideation.js";
import type { DiagnosisService } from "../diagnosis/service.js";
import type { SignalsService } from "../signals/service.js";
import type { NucleoStore } from "../storage/store.js";
import type { IdeationEngine } from "./engine.js";
import { loadIdeationKnowledgePack } from "./knowledge.js";

export class IdeationService {
  constructor(
    private readonly engine: IdeationEngine,
    private readonly store: NucleoStore,
    private readonly diagnosisService: DiagnosisService,
    private readonly signalsService: SignalsService,
  ) {}

  async generate(cycleId: string, rawSelection: unknown) {
    const input = await this.buildInput(cycleId, rawSelection);
    const output = await this.engine.generate(input);
    const existing = await this.store.getIdeationRun(cycleId);
    const now = new Date().toISOString();
    const record: IdeationRecord = {
      id: existing?.id ?? `idea_${randomUUID()}`,
      cycleId,
      companyId: input.diagnosisHandoff.companyId,
      licenseId: input.diagnosisHandoff.licenseId,
      input,
      output,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await this.store.saveIdeationRun(record);
    await this.store.saveAuditEvent({
      id: `aud_${randomUUID()}`,
      cycleId,
      companyId: record.companyId,
      licenseId: record.licenseId,
      stage: "IDEATION",
      action: existing ? "IDEATION_REGENERATED" : "IDEATION_GENERATED",
      summary:
        "Ideacion genero 1 idea desde ruptura, gap, insight y knowledge pack limpio.",
      metadata: {
        ideas: output.ideas.length,
        gaps: input.signalsHandoff.gaps.length,
        insights: input.signalsHandoff.insights.length,
        ruptureType: input.selection.ruptureType,
        gapTitle: input.selection.gapTitle,
        insightTitle: input.selection.insightTitle,
        disruptiveCases: input.knowledgePack.disruptiveCases.length,
      },
      createdAt: now,
    });

    return { ideation: record };
  }

  get(cycleId: string) {
    return this.store.getIdeationRun(cycleId);
  }

  async buildOptions(cycleId: string) {
    const signalsHandoff = await this.signalsService.buildIdeationInput(cycleId);

    if (!signalsHandoff) {
      throw new Error("Ideacion requiere Senales generadas.");
    }

    return {
      ruptureTypes: [
        {
          id: "RUPTURA_MODERADA",
          title: "Ruptura moderada",
          verb: "mejorar",
          guidingQuestion: "Que hacemos hoy que podria funcionar mejor?",
          riskLevel: "bajo",
          description:
            "Se toma lo que ya existe y se hace mejor: mas rapido, mas barato, mas comodo o con menos friccion.",
        },
        {
          id: "RUPTURA_FUERTE",
          title: "Ruptura fuerte",
          verb: "transformar",
          guidingQuestion:
            "Que pieza del modelo podria funcionar de otra manera?",
          riskLevel: "medio",
          description:
            "Se cambia la forma del sistema: como se cobra, quien paga, como se entrega, como accede el cliente, que regla decide o que incentivo mueve conducta.",
        },
        {
          id: "RUPTURA_RADICAL_CONTROLADA",
          title: "Ruptura radical controlada",
          verb: "romper",
          guidingQuestion:
            "Que cree todo el mundo en este sector que en realidad no es cierto?",
          riskLevel: "alto_controlado",
          description:
            "Se ataca una creencia obvia de la industria y se prueba en un perimetro acotado.",
        },
      ],
      gaps: signalsHandoff.gaps,
      insights: signalsHandoff.insights,
    };
  }

  async buildInput(
    cycleId: string,
    rawSelection: unknown,
  ): Promise<IdeationGenerationInput> {
    const selection = ideationSelectionSchema.parse(rawSelection);
    const [diagnosisHandoff, signalsHandoff] = await Promise.all([
      this.diagnosisService.buildIdeationInput(cycleId),
      this.signalsService.buildIdeationInput(cycleId),
    ]);

    if (!diagnosisHandoff) {
      throw new Error("Ideacion requiere Diagnostico cerrado.");
    }

    if (!signalsHandoff) {
      throw new Error("Ideacion requiere Senales generadas.");
    }

    assertSelectionExists(selection, signalsHandoff);
    const knowledgePack = await loadIdeationKnowledgePack();

    return ideationGenerationInputSchema.parse({
      cycleId,
      diagnosisHandoff,
      signalsHandoff,
      knowledgePack,
      selection,
    });
  }
}

function assertSelectionExists(
  selection: IdeationSelection,
  signalsHandoff: IdeationGenerationInput["signalsHandoff"],
) {
  if (!signalsHandoff.gaps.some((gap) => gap.title === selection.gapTitle)) {
    throw new Error("Ideacion recibio un gap que no existe en Senales.");
  }

  if (
    !signalsHandoff.insights.some(
      (insight) => insight.title === selection.insightTitle,
    )
  ) {
    throw new Error("Ideacion recibio un insight que no existe en Senales.");
  }
}
