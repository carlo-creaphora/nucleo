import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { z } from "zod";
import {
  type DiagnosisInput,
  type DiagnosisOutput,
  type DiagnosisQuestionOutput,
  diagnosisOutputSchema,
  diagnosisQuestionOutputSchema,
} from "../contracts/diagnosis.js";
import {
  buildCompletionInstruction,
  buildDiagnosisSystemPrompt,
  buildQuestionInstruction,
  buildReinterpretInstruction,
} from "./prompt.js";

export type DiagnosisEngine = {
  generateQuestion(input: DiagnosisInput): Promise<DiagnosisQuestionOutput>;
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
    const userText = input.dialogMessages
      .filter((message) => message.role === "user")
      .map((message) => message.content)
      .join(" ");
    const hasMetric = /m[eé]trica|venta|ingreso|margen|tiempo|costo|riesgo|calidad|retenci[oó]n/i.test(
      userText,
    );
    const hasRestriction = /restric|no podemos|presupuesto|legal|regulaci[oó]n|operaci[oó]n|marca/i.test(
      userText,
    );
    const hasAttempt = /intent|probamos|hicimos|ya se hizo|funcion[oó]|fall[oó]/i.test(
      userText,
    );

    if (!hasMetric) {
      return {
        question:
          "Que metrica o senal concreta muestra que este reto realmente importa para la empresa?",
        whyItMatters:
          "Sin una senal prioritaria, el diagnostico puede quedarse en una percepcion general.",
        suggestedAngles: ["ingresos", "tiempo", "calidad", "riesgo"],
        coveredFacts: [],
        nextFocus: "metrica prioritaria",
        shouldCloseDiagnosis: false,
      };
    }

    if (!hasRestriction) {
      return {
        question:
          "Que limite no se puede romper al resolver este reto: presupuesto, operacion, marca, tecnologia, talento o regulacion?",
        whyItMatters:
          "Las restricciones separan un reto estrategico de una idea que suena bien pero no se puede ejecutar.",
        suggestedAngles: ["presupuesto", "operacion", "marca", "regulacion"],
        coveredFacts: ["metrica prioritaria"],
        nextFocus: "restricciones",
        shouldCloseDiagnosis: false,
      };
    }

    if (!hasAttempt) {
      return {
        question:
          "Que han intentado ya para resolverlo y que aprendieron de eso, incluso si no funciono?",
        whyItMatters:
          "Los intentos previos muestran respuestas obvias que conviene evitar o reinterpretar.",
        suggestedAngles: ["campanas", "procesos", "capacitacion", "cambios comerciales"],
        coveredFacts: ["metrica prioritaria", "restricciones"],
        nextFocus: "intentos previos",
        shouldCloseDiagnosis: false,
      };
    }

    return {
      question:
        "Cual es la tension mas incomoda del caso: que necesita cambiar pero hoy el sistema evita tocar?",
      whyItMatters:
        "La tension ayuda a formular el reto real y no quedarse en el sintoma declarado.",
      suggestedAngles: ["cliente vs operacion", "crecimiento vs margen", "velocidad vs calidad"],
      coveredFacts: ["metrica prioritaria", "restricciones", "intentos previos"],
      nextFocus: "tension estrategica",
      shouldCloseDiagnosis: true,
    };
  }

  async completeDiagnosis(input: DiagnosisInput): Promise<DiagnosisOutput> {
    return buildHeuristicDiagnosis(input);
  }

  async reinterpretDiagnosis(input: DiagnosisInput): Promise<DiagnosisOutput> {
    return buildHeuristicDiagnosis(input);
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
      : `Identificar el mecanismo que impide que ${company} convierta su contexto de ${category} en una decision accionable y medible.`,
    whyThisChallenge:
      "Es mas correcto que la lectura inicial porque no asume que el sintoma declarado sea la causa; obliga a separar hechos, restricciones y mecanismo de cambio antes de idear.",
    symptoms: [
      `El perfil declara: ${declaredProblem}`,
      "La situacion todavia necesita evidencia para distinguir sintoma de causa.",
    ],
    causes: [
      "Causa probable: el sistema actual puede estar respondiendo al sintoma visible y no al mecanismo que lo produce.",
    ],
    tensions: [
      "Tension: avanzar rapido sin repetir soluciones obvias ni romper restricciones de la empresa.",
    ],
    metrics: ["Definir la senal prioritaria que demostrara si el reto importa."],
    restrictions: input.userClarifications,
    notWorthAttackingYet: [
      "No conviene atacar con ideas genericas antes de confirmar el mecanismo causal probable.",
    ],
    assumptionToQuestion:
      "Que la lectura inicial del perfil describe el problema real y no solo su sintoma mas visible.",
    ideationBrief:
      "Ideacion debe partir del reto recomendado, evitar ideas genericas y proponer mecanismos que puedan probarse contra una senal observable.",
  };
}

export function createDiagnosisEngine() {
  const useFake = process.env.NUCLEO_FAKE_AI === "true";
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (useFake || !apiKey) {
    return new HeuristicDiagnosisEngine();
  }

  return new OpenAiDiagnosisEngine({
    apiKey,
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
  });
}
