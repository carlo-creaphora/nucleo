import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { z } from "zod";
import {
  type DiagnosisInput,
  type DiagnosisClosureAssessmentOutput,
  type DiagnosisOutput,
  type DiagnosisQuestionOutput,
  diagnosisClosureAssessmentOutputSchema,
  diagnosisOutputSchema,
  diagnosisQuestionOutputSchema,
} from "../contracts/diagnosis.js";
import {
  buildClosureAssessmentInstruction,
  buildCompletionInstruction,
  buildDiagnosisSystemPrompt,
  buildQuestionInstruction,
  buildReinterpretInstruction,
} from "./prompt.js";

export type DiagnosisEngine = {
  generateQuestion(input: DiagnosisInput): Promise<DiagnosisQuestionOutput>;
  assessClosure(input: DiagnosisInput): Promise<DiagnosisClosureAssessmentOutput>;
  completeDiagnosis(input: DiagnosisInput): Promise<DiagnosisOutput>;
  reinterpretDiagnosis(
    input: DiagnosisInput,
    previousDiagnosis: DiagnosisOutput,
  ): Promise<DiagnosisOutput>;
};

type StructuredRunOptions<TSchema extends z.ZodType> = {
  name: string;
  schema: TSchema;
  payload: unknown;
};

export class OpenAiDiagnosisEngine implements DiagnosisEngine {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor({
    apiKey,
    model = "gpt-4.1-mini",
  }: {
    apiKey: string;
    model?: string;
  }) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  generateQuestion(input: DiagnosisInput) {
    return this.runStructured({
      name: "diagnosis_question",
      schema: diagnosisQuestionOutputSchema,
      payload: buildQuestionInstruction(input),
    });
  }

  assessClosure(input: DiagnosisInput) {
    return this.runStructured({
      name: "diagnosis_closure_assessment",
      schema: diagnosisClosureAssessmentOutputSchema,
      payload: buildClosureAssessmentInstruction(input),
    });
  }

  completeDiagnosis(input: DiagnosisInput) {
    return this.runStructured({
      name: "diagnosis_result",
      schema: diagnosisOutputSchema,
      payload: buildCompletionInstruction(input),
    });
  }

  reinterpretDiagnosis(
    input: DiagnosisInput,
    previousDiagnosis: DiagnosisOutput,
  ) {
    return this.runStructured({
      name: "diagnosis_reinterpretation",
      schema: diagnosisOutputSchema,
      payload: buildReinterpretInstruction(input, previousDiagnosis),
    });
  }

  private async runStructured<TSchema extends z.ZodType>({
    name,
    schema,
    payload,
  }: StructuredRunOptions<TSchema>) {
    const completion = await this.client.beta.chat.completions.parse({
      model: this.model,
      temperature: 0.25,
      messages: [
        {
          role: "system",
          content: buildDiagnosisSystemPrompt(),
        },
        {
          role: "user",
          content: JSON.stringify(payload, null, 2),
        },
      ],
      response_format: zodResponseFormat(schema, name),
    });

    const parsed = completion.choices[0]?.message.parsed;

    if (!parsed) {
      throw new Error(`OpenAI no devolvio una respuesta valida para ${name}`);
    }

    return parsed as z.infer<TSchema>;
  }
}

export class HeuristicDiagnosisEngine implements DiagnosisEngine {
  async generateQuestion(input: DiagnosisInput): Promise<DiagnosisQuestionOutput> {
    const userTurns = input.dialogMessages.filter(
      (message) => message.role === "user",
    ).length;
    const userText = input.dialogMessages
      .filter((message) => message.role === "user")
      .map((message) => message.content)
      .join(" ");
    const hasImpact = /impact|consecuencia|importa|venta|ingreso|margen|tiempo|costo|riesgo|calidad|retenci[oó]n|demora|perd/i.test(
      userText,
    );
    const hasRestriction = /restric|no podemos|presupuesto|legal|regulaci[oó]n|operaci[oó]n|marca/i.test(
      userText,
    );
    const hasAttempt = /intent|probamos|hicimos|ya se hizo|funcion[oó]|fall[oó]/i.test(
      userText,
    );
    const hasTension = /pero|aunque|sin embargo|tensi[oó]n|conflicto|fricci[oó]n|diferencia|desacuerdo/i.test(
      userText,
    );
    const hasBlockedDecision = /decisi[oó]n|decidir|priorizar|destrabar|aprobar|invertir|definir/i.test(
      userText,
    );
    const hasExpectedChange = /esperamos|deber[ií]a cambiar|queremos que|resultado esperado|cambio esperado|lograr/i.test(
      userText,
    );

    if (!hasImpact) {
      return {
        question:
          "Que consecuencia concreta esta teniendo este problema hoy y por que importa resolverlo ahora?",
        whyItMatters:
          "Sin impacto observable, el diagnostico puede quedarse en una percepcion general.",
        suggestedAngles: ["ingresos", "tiempo", "riesgo", "decision"],
        coveredFacts: [],
        nextFocus: "sintoma visible",
        shouldCloseDiagnosis: false,
      };
    }

    if (!hasAttempt) {
      return {
        question:
          "Que han intentado ya para resolverlo y que revela ese intento sobre por que el problema se sostiene?",
        whyItMatters:
          "Los intentos previos ayudan a separar sintoma visible de mecanismo causal.",
        suggestedAngles: ["intentos fallidos", "aprendizajes", "patrones", "bloqueos"],
        coveredFacts: ["sintoma visible"],
        nextFocus: "mecanismo causal probable",
        shouldCloseDiagnosis: false,
      };
    }

    if (!hasRestriction) {
      return {
        question:
          "Que restriccion real no pueden ignorar al enfrentar este reto: talento, presupuesto, tiempo, estructura, cultura u operacion?",
        whyItMatters:
          "La restriccion no negociable evita formular un reto correcto pero impracticable.",
        suggestedAngles: ["talento", "presupuesto", "tiempo", "estructura"],
        coveredFacts: ["sintoma visible", "mecanismo causal probable"],
        nextFocus: "restriccion no negociable",
        shouldCloseDiagnosis: false,
      };
    }

    if (!hasTension) {
      return {
        question:
          "Donde esta la tension interna del caso: que areas, criterios o prioridades chocan cuando intentan resolverlo?",
        whyItMatters:
          "Las tensiones internas ayudan a distinguir el reto real de una solucion superficial.",
        suggestedAngles: ["comercial vs operacion", "rapidez vs calidad", "crecimiento vs margen"],
        coveredFacts: [
          "sintoma visible",
          "mecanismo causal probable",
          "restriccion no negociable",
        ],
        nextFocus: "tensiones internas",
        shouldCloseDiagnosis: false,
      };
    }

    if (!hasBlockedDecision) {
      return {
        question:
          "Que decision concreta esta trabada hasta que entiendan mejor este reto?",
        whyItMatters:
          "El diagnostico debe habilitar una decision, no solo describir el problema.",
        suggestedAngles: ["priorizar inversion", "cambiar oferta", "ajustar canal", "redisenar operacion"],
        coveredFacts: [
          "sintoma visible",
          "mecanismo causal probable",
          "restriccion no negociable",
          "tensiones internas",
        ],
        nextFocus: "decision trabada",
        shouldCloseDiagnosis: false,
      };
    }

    if (!hasExpectedChange && userTurns < 10) {
      return {
        question:
          "Que cambio observable minimo indicaria que este problema empieza a destrabarse?",
        whyItMatters:
          "El cambio esperado calibra si el reto recomendado apunta al mecanismo o solo al sintoma.",
        suggestedAngles: ["conducta", "decision", "senal operativa", "resultado"],
        coveredFacts: [
          "sintoma visible",
          "mecanismo causal probable",
          "restriccion no negociable",
          "tensiones internas",
          "decision trabada",
        ],
        nextFocus: "cambio esperado minimo",
        shouldCloseDiagnosis: false,
      };
    }

    return {
      question:
        "El mapa diagnostico ya tiene suficiencia; no deberia requerirse otra pregunta para formular el reto recomendado.",
      whyItMatters:
        "Cuando una respuesta adicional solo agrega detalle, el diagnostico debe cerrar.",
      suggestedAngles: ["mecanismo", "tension", "decision", "restriccion"],
      coveredFacts: [
        "sintoma visible",
        "mecanismo causal probable",
        "tension interna",
        "decision trabada",
        "restriccion no negociable",
      ],
      nextFocus: "cierre",
      shouldCloseDiagnosis: true,
    };
  }

  async assessClosure(
    input: DiagnosisInput,
  ): Promise<DiagnosisClosureAssessmentOutput> {
    const missing = detectLocalTestMissingPieces(input);
    return {
      canClose: missing.length === 0,
      missing,
    };
  }

  async completeDiagnosis(input: DiagnosisInput): Promise<DiagnosisOutput> {
    return buildHeuristicDiagnosis(input);
  }

  async reinterpretDiagnosis(input: DiagnosisInput): Promise<DiagnosisOutput> {
    return buildHeuristicDiagnosis(input);
  }
}

class MissingOpenAiDiagnosisEngine implements DiagnosisEngine {
  async generateQuestion(): Promise<DiagnosisQuestionOutput> {
    throw missingOpenAiError("Diagnostico");
  }

  async completeDiagnosis(): Promise<DiagnosisOutput> {
    throw missingOpenAiError("Diagnostico");
  }

  async assessClosure(): Promise<DiagnosisClosureAssessmentOutput> {
    throw missingOpenAiError("Diagnostico");
  }

  async reinterpretDiagnosis(): Promise<DiagnosisOutput> {
    throw missingOpenAiError("Diagnostico");
  }
}

function buildHeuristicDiagnosis(input: DiagnosisInput): DiagnosisOutput {
  const declaredProblem =
    input.dialogMessages.find((message) => message.role === "user")?.content ??
    input.category.notes ??
    "el reto declarado por el perfil";
  const company = input.company.name;
  const category = input.company.sectorCategory;
  const correction = input.correctedSections.at(-1)?.clarification;

  return {
    recommendedChallenge: correction
      ? `Reformular el reto de ${company} incorporando la aclaracion: ${correction}`
      : `Dejar de tratar el sintoma declarado como causa y aislar el mecanismo operativo que bloquea una decision medible en ${category}.`,
    whyThisChallenge:
      "La lectura inicial todavia suena a etiqueta del problema. Este reto fuerza a separar hechos, restricciones y mecanismo antes de idear.",
    symptoms: [
      `El perfil declara: ${declaredProblem}`,
      "La situacion todavia necesita evidencia para distinguir sintoma de causa.",
    ],
    causes: [
      "Causa probable: la empresa esta respondiendo al sintoma visible porque todavia no ha hecho explicito el mecanismo que lo produce.",
    ],
    tensions: [
      "Tension: querer avanzar rapido mientras el sistema evita tocar la decision incomoda que sostiene el problema.",
    ],
    metrics: ["Definir la senal prioritaria que demostrara si el reto importa."],
    restrictions: input.userClarifications,
    notWorthAttackingYet: [
      "No conviene atacar con ideas genericas ni con mas esfuerzo sobre el mismo supuesto declarado.",
    ],
    assumptionToQuestion:
      "Que la lectura inicial del perfil describe el problema real y no solo su sintoma mas visible.",
    ideationBrief:
      "Ideacion debe partir del reto recomendado, evitar ideas genericas y proponer mecanismos que puedan probarse contra una senal observable.",
  };
}

export function createDiagnosisEngine() {
  const useFake =
    process.env.NODE_ENV === "test" && process.env.NUCLEO_FAKE_AI === "true";
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (useFake) {
    return new HeuristicDiagnosisEngine();
  }

  if (!apiKey) {
    return new MissingOpenAiDiagnosisEngine();
  }

  return new OpenAiDiagnosisEngine({
    apiKey,
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
  });
}

function missingOpenAiError(stage: string) {
  return new Error(
    `OPENAI_API_KEY es requerido para ${stage}; no se usan respuestas alternativas sin IA.`,
  );
}

function detectLocalTestMissingPieces(input: DiagnosisInput) {
  const userTurns = input.dialogMessages.filter((message) => message.role === "user");

  if (userTurns.length > 1 && userTurns.length < 15) {
    return [];
  }

  const latest = userTurns.at(-1)?.content.trim() ?? "";

  if (latest.length > 160) {
    return [];
  }

    return [
      {
        key: "mecanismo causal probable" as const,
        reason:
          "Sin mecanismo causal probable, el reto puede quedarse en sintoma declarado.",
      },
    ];
}
