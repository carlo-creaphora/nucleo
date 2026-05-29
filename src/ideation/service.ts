import { randomUUID } from "node:crypto";
import {
  type IdeationGenerationInput,
  type IdeationIdea,
  type IdeationOutput,
  type IdeationSelection,
  type IdeationRecord,
  ideationGenerationInputSchema,
  ideationIdeaSchema,
  ideationRouteSchema,
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

  async saveCanvas(cycleId: string, rawCanvas: unknown) {
    const canvas = parseCanvasState(rawCanvas);
    const existing = await this.store.getIdeationRun(cycleId);
    const input =
      existing?.input ?? (await this.buildInput(cycleId, canvas.selection));
    const now = new Date().toISOString();
    const output: IdeationOutput = {
      generatedAt: existing?.output.generatedAt ?? now,
      internal: existing?.output.internal ?? buildManualInternalState(),
      ideas: canvas.ideas.map((idea) => hydrateIdeaForPersistence(idea, canvas)),
      route: canvas.route,
    };
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
      action: "IDEATION_CANVAS_SAVED",
      summary: "Ideacion guardo el estado del canvas del ciclo.",
      metadata: {
        ideas: output.ideas.length,
        manualIdeas: output.ideas.filter((idea) => idea.source === "user").length,
        selectedIdeas: output.ideas.filter((idea) => idea.selectedForEvaluation)
          .length,
      },
      createdAt: now,
    });

    return { ideation: record };
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

function parseCanvasState(rawCanvas: unknown) {
  const value = rawCanvas as {
    ideas?: unknown;
    route?: unknown;
    selection?: unknown;
  };

  return {
    ideas: Array.isArray(value?.ideas) ? value.ideas : [],
    route: ideationRouteSchema.parse(value?.route),
    selection: ideationSelectionSchema.parse(value?.selection),
  };
}

function hydrateIdeaForPersistence(
  rawIdea: unknown,
  canvas: {
    selection: IdeationSelection;
    route: IdeationOutput["route"];
  },
): IdeationIdea {
  const idea = rawIdea as Partial<IdeationIdea>;

  return ideationIdeaSchema.parse({
    antiPatronesAEvitar:
      idea.antiPatronesAEvitar?.length
        ? idea.antiPatronesAEvitar
        : ["No convertir el canvas manual en una idea generica sin mecanismo."],
    casoAnalogo:
      idea.casoAnalogo ??
      "Idea agregada manualmente por el usuario sin caso analogo registrado.",
    id: idea.id,
    idea: idea.idea,
    mecanicaConcreta: ensureMinLength(
      idea.mecanicaConcreta,
      "Mecanica manual pendiente de ampliar durante prototipado.",
      40,
    ),
    metricaQueMueve:
      idea.metricaQueMueve ??
      "Senal observable definida durante evaluacion o prototipado.",
    porQueFunciona: ensureMinLength(
      idea.porQueFunciona,
      "Razonamiento manual pendiente de ampliar durante evaluacion.",
      30,
    ),
    primerPasoEjecutable:
      idea.primerPasoEjecutable ??
      "Convertir la idea en una accion minima verificable.",
    routeId: idea.routeId ?? canvas.route.id,
    selectedForEvaluation: Boolean(idea.selectedForEvaluation),
    source: idea.source ?? "user",
    supuestoQueRompe: ensureMinLength(
      idea.supuestoQueRompe,
      "Supuesto manual pendiente de ampliar durante evaluacion.",
      20,
    ),
    tipoDeIdea: idea.tipoDeIdea,
    trace: idea.trace ?? {
      disruptiveCaseName: "Idea manual",
      evidenceIds: [],
      gapTitles: [canvas.selection.gapTitle],
      insightTitles: [canvas.selection.insightTitle],
    },
  });
}

function ensureMinLength(
  value: string | undefined,
  fallback: string,
  minLength: number,
) {
  const trimmed = value?.trim();

  if (!trimmed) return fallback;
  if (trimmed.length >= minLength) return trimmed;

  return `${trimmed}. ${fallback}`.slice(0, Math.max(minLength, fallback.length));
}

function buildManualInternalState(): IdeationOutput["internal"] {
  return {
    caseScreening: {
      rejectedCaseFamilies: [],
      translatedCaseReferences: [
        {
          caseName: "Idea manual",
          transferableMechanism:
            "El usuario agrego la idea directamente al canvas de ideacion.",
          reinterpretationForThisIdea:
            "La idea debe evaluarse contra el reto recomendado, gap e insight seleccionados.",
          caveat: "No fue generada por el motor de casos disruptivos.",
        },
      ],
    },
    consultedKnowledge: {
      antiPatterns: 0,
      assumptionsByIndustry: 0,
      disruptiveCases: 0,
      weirdBusinessModels: 0,
    },
    rejectedAntiPatternMatches: [],
  };
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
