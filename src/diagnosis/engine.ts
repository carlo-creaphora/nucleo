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
    const hasTension = /pero|aunque|sin embargo|tensi[oó]n|conflicto|fricci[oó]n|diferencia|desacuerdo/i.test(
      userText,
    );
    const hasBlockedDecision = /decisi[oó]n|decidir|priorizar|destrabar|aprobar|invertir|definir/i.test(
      userText,
    );
    const hasExpectedChange = /esperamos|deber[ií]a cambiar|queremos que|resultado esperado|cambio esperado|lograr/i.test(
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

    if (!hasTension) {
      return {
        question:
          "Donde esta la tension interna del caso: que areas, criterios o prioridades chocan cuando intentan resolverlo?",
        whyItMatters:
          "Las tensiones internas ayudan a distinguir el reto real de una solucion superficial.",
        suggestedAngles: ["comercial vs operacion", "rapidez vs calidad", "crecimiento vs margen"],
        coveredFacts: ["metrica prioritaria", "restricciones", "intentos previos"],
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
          "metrica prioritaria",
          "restricciones",
          "intentos previos",
          "tensiones internas",
        ],
        nextFocus: "decision trabada",
        shouldCloseDiagnosis: false,
      };
    }

    if (!hasExpectedChange) {
      return {
        question:
          "Si el diagnostico fuera correcto, que deberia cambiar en comportamiento, resultado o decision en las proximas semanas?",
        whyItMatters:
          "El cambio esperado evita cerrar un diagnostico que no se pueda reconocer en la practica.",
        suggestedAngles: ["conducta del cliente", "decision del equipo", "senal comercial", "resultado operativo"],
        coveredFacts: [
          "metrica prioritaria",
          "restricciones",
          "intentos previos",
          "tensiones internas",
          "decision trabada",
        ],
        nextFocus: "cambio esperado",
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

class MissingOpenAiDiagnosisEngine implements DiagnosisEngine {
  async generateQuestion(): Promise<DiagnosisQuestionOutput> {
    throw missingOpenAiError("Diagnostico");
  }

  async completeDiagnosis(): Promise<DiagnosisOutput> {
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
  const useFake = process.env.NUCLEO_FAKE_AI === "true";
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
    `OPENAI_API_KEY es requerido para ${stage}; el demo y produccion no usan respuestas heuristicas.`,
  );
}
