import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  type EvidenceReadInput,
  type EvidenceReading,
  evidenceReadingSchema,
} from "../contracts/results.js";

export type ResultsEngine = {
  read(input: EvidenceReadInput): Promise<EvidenceReading>;
};

export class OpenAiResultsEngine implements ResultsEngine {
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

  async read(input: EvidenceReadInput): Promise<EvidenceReading> {
    const completion = await this.client.beta.chat.completions.parse({
      model: this.model,
      temperature: 0.15,
      messages: [
        {
          role: "system",
          content: buildEvidenceReadingPrompt(),
        },
        {
          role: "user",
          content: JSON.stringify(input, null, 2),
        },
      ],
      response_format: zodResponseFormat(
        evidenceReadingSchema,
        "evidence_reading",
      ),
    });

    const parsed = completion.choices[0]?.message.parsed;

    if (!parsed) {
      throw new Error("Lectura de evidencias no devolvio una decision estructurada.");
    }

    return parsed;
  }
}

class MissingOpenAiResultsEngine implements ResultsEngine {
  async read(): Promise<EvidenceReading> {
    throw new Error(
      "OPENAI_API_KEY es requerido para Lectura de evidencias; no se decide sin IA.",
    );
  }
}

export function createResultsEngine() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return new MissingOpenAiResultsEngine();
  }

  return new OpenAiResultsEngine({
    apiKey,
    model:
      process.env.OPENAI_RESULTS_MODEL?.trim() ||
      process.env.OPENAI_MODEL?.trim() ||
      "gpt-4.1-mini",
  });
}

function buildEvidenceReadingPrompt() {
  return [
    "Eres la fase Lectura de evidencias de Nucleo. Esta fase nace limpia y no hereda logica vieja.",
    "",
    "OBJETIVO",
    "Leer registros de testeo contra la matriz del artefacto y recomendar Avanzar, Iterar o Replantear.",
    "",
    "REGLAS",
    "- No uses scores, gates, M0/M1, pilares antiguos, hipotesis con score ni mappings heredados.",
    "- No decidas por cantidad mecanica de respuestas cerradas.",
    "- Usa las respuestas cerradas como senales comparables, no como veredicto automatico.",
    "- Usa las respuestas abiertas para detectar matices, contradicciones, objeciones, falso positivo y falso negativo.",
    "- La decision debe estar anclada en evidencia observable, senales de avance/freno y umbrales de la matriz.",
    "- No confundas agrado declarado con compromiso real.",
    "- No confundas una friccion corregible con fracaso de la idea.",
    "- Si la evidencia es insuficiente, recomienda Iterar o Replantear segun el riesgo, y declara que falta.",
    "- Respeta que valida y que no valida el artefacto; no extrapoles a adopcion, escala o impacto financiero si la matriz no lo valida.",
    "- Devuelve confidence como Baja, Media o Alta segun muestra real, consistencia de senales y riesgos de mala lectura.",
    "- Devuelve testedAssumption copiando o sintetizando el supuesto de la idea probada; no inventes un supuesto nuevo.",
    "- Devuelve methodologicalRoute como una de: advance, iterate, discard, invalidate_challenge, invalidate_signal.",
    "- La ruta metodologica debe ser tu recomendacion accionable: advance si pasa a playbook, iterate si vuelve a prototipo, discard si se mata solo la idea, invalidate_challenge si el reto estaba mal definido, invalidate_signal si fallo el gap o insight de partida.",
    "- methodologicalRationale debe explicar por que esa ruta, anclada en evidencia concreta.",
    "",
    "LECTURA DE DECISION",
    "- Avanzar: hay accion observable o compromiso concreto alineado con el umbral de avance, y los riesgos son controlables.",
    "- Iterar: hay valor o interes, pero aparecen confusiones, objeciones corregibles, mala ejecucion del artefacto o evidencia incompleta.",
    "- Replantear: no se reconoce el problema, no aparece valor, pagador, confianza, uso real o siguiente paso; o aparece bloqueo estructural.",
    "",
    "ESTILO",
    "Escribe en espanol claro, sobrio y especifico. Cita evidencia concreta de los registros.",
  ].join("\n");
}
