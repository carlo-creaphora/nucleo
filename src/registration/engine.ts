import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { z } from "zod";
import {
  type RegistrationInput,
  type RegistrationOutput,
  registrationOutputSchema,
} from "../contracts/registration.js";

export type RegistrationEngine = {
  prepare(input: RegistrationInput): Promise<RegistrationOutput>;
};

export class OpenAiRegistrationEngine implements RegistrationEngine {
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

  async prepare(input: RegistrationInput) {
    const completion = await this.client.beta.chat.completions.parse({
      model: this.model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: [
            "Eres la skill de Registro de Nucleo.",
            "No diagnosticas, no propones ideas y no evaluas competidores todavia.",
            "Tu trabajo es preparar contexto limpio para Diagnostico.",
            "Deriva informacion de categoria solo desde notas, documentos y datos declarados.",
            "Construye un marco para evaluar competidores sin concluir quien gana.",
            "Deja el marco competitivo listo para Senales/Benchmark: ejes, preguntas de senal y brechas de evidencia.",
            "Marca readiness.isReadyForDiagnosis=false si faltan datos minimos para diagnosticar sin inventar.",
            "Mantente breve, operativo y sin tono motivacional.",
          ].join("\n"),
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              task: "Prepara el output contractual de Registro.",
              input,
            },
            null,
            2,
          ),
        },
      ],
      response_format: zodResponseFormat(
        registrationOutputSchema,
        "registration_output",
      ),
    });

    const parsed = completion.choices[0]?.message.parsed;

    if (!parsed) {
      throw new Error("OpenAI no devolvio una respuesta valida para Registro");
    }

    return parsed as z.infer<typeof registrationOutputSchema>;
  }
}

export class HeuristicRegistrationEngine implements RegistrationEngine {
  async prepare(input: RegistrationInput): Promise<RegistrationOutput> {
    const documentEvidence = input.uploadedDocuments.flatMap((document) =>
      [document.summary, document.extractedText].filter(
        (item): item is string => Boolean(item?.trim()),
      ),
    );
    const categoryEvidence = [
      input.category.notes,
      input.category.averageTicket
        ? `Ticket promedio: ${input.category.averageTicket}`
        : undefined,
      typeof input.category.averageSalesCycleDays === "number"
        ? `Ciclo de venta: ${input.category.averageSalesCycleDays} dias`
        : undefined,
      ...documentEvidence,
    ].filter((item): item is string => Boolean(item?.trim()));
    const competitorNames = input.category.competitors.map((item) => item.name);

    return {
      contextForDiagnosis: {
        profileLicense: input.profileLicense,
        company: input.company,
        category: input.category,
        uploadedDocuments: input.uploadedDocuments,
      },
      categoryInformation: {
        summary: categoryEvidence.length
          ? categoryEvidence.join(" | ")
          : "No hay evidencia adicional de categoria; Diagnostico debe preguntar antes de asumir.",
        evidence: categoryEvidence,
        unknowns: [
          input.category.averageTicket ? "" : "ticket promedio",
          typeof input.category.averageSalesCycleDays === "number"
            ? ""
            : "ciclo de venta",
          competitorNames.length === 3 ? "" : "tres competidores completos",
        ].filter(Boolean),
      },
      competitorEvaluationFrame: {
        criteria: [
          "claridad del valor antes del contacto comercial",
          "evidencia de resultados o casos",
          "fricciones visibles en compra, adopcion o confianza",
          "diferenciacion mas alla de precio",
        ],
        notes: competitorNames.length
          ? competitorNames.map((name) => `Comparar ${name} contra el reto diagnosticado, no contra una lista generica.`)
          : ["Faltan competidores para construir contraste especifico."],
        comparisonAxes: [
          "promesa de valor observable",
          "prueba de confianza o evidencia",
          "friccion que resuelve antes de compra",
          "mecanismo de diferenciacion",
        ],
        signalQuestions: [
          "Que afirma cada competidor que el cliente pueda verificar?",
          "Que evidencia usan para reducir incertidumbre?",
          "Que parte del proceso de decision parece acelerar o trabar?",
          "Donde compiten por precio porque no lograron probar valor?",
        ],
        evidenceGaps: [
          competitorNames.length === 3 ? "" : "faltan tres competidores completos",
          categoryEvidence.length ? "" : "faltan notas o documentos de categoria",
        ].filter(Boolean),
      },
      readiness: {
        isReadyForDiagnosis:
          Boolean(input.profileLicense.role) &&
          Boolean(input.company.name) &&
          Boolean(input.company.sectorCategory) &&
          Boolean(input.company.sellsTo) &&
          Boolean(input.company.revenueModel) &&
          competitorNames.length > 0,
        blockingIssues: [
          input.company.name ? "" : "empresa sin nombre",
          input.company.sectorCategory ? "" : "sector/categoria faltante",
          input.company.sellsTo ? "" : "actor comprador no declarado",
          input.company.revenueModel ? "" : "modelo de cobro no declarado",
          competitorNames.length > 0 ? "" : "sin competidores para contraste minimo",
        ].filter(Boolean),
        warnings: [
          input.category.averageTicket ? "" : "ticket promedio no declarado",
          typeof input.category.averageSalesCycleDays === "number"
            ? ""
            : "ciclo de venta no declarado",
          categoryEvidence.length ? "" : "sin evidencia documental o notas de categoria",
        ].filter(Boolean),
      },
    };
  }
}

export function createRegistrationEngine() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (process.env.NUCLEO_FAKE_AI === "true" || !apiKey) {
    return new HeuristicRegistrationEngine();
  }

  return new OpenAiRegistrationEngine({
    apiKey,
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini",
  });
}
