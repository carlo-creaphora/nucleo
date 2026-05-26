import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  type PlaybookGenerateInput,
  type PlaybookOutput,
  playbookOutputSchema,
} from "../contracts/playbook.js";

export type PlaybookEngine = {
  generate(input: PlaybookGenerateInput): Promise<PlaybookOutput>;
};

export class OpenAiPlaybookEngine implements PlaybookEngine {
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

  async generate(input: PlaybookGenerateInput): Promise<PlaybookOutput> {
    const completion = await this.client.beta.chat.completions.parse({
      model: this.model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: buildPlaybookPrompt(),
        },
        {
          role: "user",
          content: JSON.stringify(input, null, 2),
        },
      ],
      response_format: zodResponseFormat(playbookOutputSchema, "playbook"),
    });

    const parsed = completion.choices[0]?.message.parsed;

    if (!parsed) {
      throw new Error("Playbook no devolvio un contrato estructurado.");
    }

    return parsed;
  }
}

class MissingOpenAiPlaybookEngine implements PlaybookEngine {
  async generate(): Promise<PlaybookOutput> {
    throw new Error(
      "OPENAI_API_KEY es requerido para Playbook; no se genera con motor heuristico.",
    );
  }
}

export function createPlaybookEngine() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return new MissingOpenAiPlaybookEngine();
  }

  return new OpenAiPlaybookEngine({
    apiKey,
    model:
      process.env.OPENAI_PLAYBOOK_MODEL?.trim() ||
      process.env.OPENAI_MODEL?.trim() ||
      "gpt-4.1-mini",
  });
}

function buildPlaybookPrompt() {
  return [
    "Eres la fase Playbook de Nucleo. Esta fase nace limpia y no hereda logica vieja.",
    "",
    "OBJETIVO",
    "Convertir una evidencia con ruta metodologica Avanzar en un plan gerencial ejecutable, trazable y prudente.",
    "",
    "REGLAS",
    "- Genera Playbook solo si methodologicalRoute es advance. Si no es advance, rechaza conceptualmente el avance en el contenido.",
    "- No uses scores, gates, M0/M1, pilares antiguos, hipotesis con score ni mappings heredados.",
    "- No conviertas iterar, descartar, invalidar reto, invalidar senal o evidencia insuficiente en avance disfrazado.",
    "- Respeta la lectura de evidencia, la matriz del artefacto, que valida, que no valida y los riesgos de mala lectura.",
    "- No extrapoles a escala, adopcion sostenida o impacto financiero si la evidencia no lo valida.",
    "- Debe haber un proximo movimiento unico, no una lista de posibilidades.",
    "- Incluye responsables, recursos, metricas, riesgos, controles y criterios de revision.",
    "- Preserva incertidumbres no resueltas y aprendizajes que no deben repetirse.",
    "- Usa la cadena Registro -> Diagnostico -> Senales -> Idea -> Prototipo -> Evidencia -> Decision.",
    "- Escribe en espanol ejecutivo, sobrio y accionable.",
  ].join("\n");
}
