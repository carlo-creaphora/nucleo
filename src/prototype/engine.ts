import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  type PrototypeArtifact,
  type PrototypeBuildInput,
  type PrototypeClassification,
  type PrototypeClassifyInput,
  prototypeArtifactSchema,
  prototypeClassificationSchema,
} from "../contracts/prototype.js";

export type PrototypeEngine = {
  build(input: PrototypeBuildInput): Promise<PrototypeArtifact>;
  classify(input: PrototypeClassifyInput): Promise<PrototypeClassification>;
};

export class OpenAiPrototypeEngine implements PrototypeEngine {
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

  async build(input: PrototypeBuildInput): Promise<PrototypeArtifact> {
    const completion = await this.client.beta.chat.completions.parse({
      model: this.model,
      temperature: 0.25,
      messages: [
        {
          role: "system",
          content: buildPrototypeSystemPrompt(),
        },
        {
          role: "user",
          content: JSON.stringify(input, null, 2),
        },
      ],
      response_format: zodResponseFormat(
        prototypeArtifactSchema,
        "prototype_artifact",
      ),
    });

    const parsed = completion.choices[0]?.message.parsed;

    if (!parsed) {
      throw new Error("Prototipado no devolvio un artefacto estructurado.");
    }

    return parsed;
  }

  async classify(input: PrototypeClassifyInput): Promise<PrototypeClassification> {
    const completion = await this.client.beta.chat.completions.parse({
      model: this.model,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: [
            "Eres un experto en prototipado e innovacion.",
            "Clasifica la idea ganadora en exactamente uno de los tipos disponibles de la matriz de prototipado.",
            "No uses scores, gates, M0/M1 ni mappings heredados.",
            "Decide por la naturaleza de lo que se debe prototipar: experiencia, interfaz digital, proceso operativo, modelo comercial/acceso o producto tangible.",
          ].join("\n"),
        },
        {
          role: "user",
          content: JSON.stringify(input, null, 2),
        },
      ],
      response_format: zodResponseFormat(
        prototypeClassificationSchema,
        "prototype_classification",
      ),
    });

    const parsed = completion.choices[0]?.message.parsed;

    if (!parsed) {
      throw new Error("Prototipado no pudo clasificar el tipo de idea.");
    }

    return parsed;
  }
}

class MissingOpenAiPrototypeEngine implements PrototypeEngine {
  async build(): Promise<PrototypeArtifact> {
    throw new Error(
      "OPENAI_API_KEY es requerido para Prototipado; no se generan artefactos con motor heuristico.",
    );
  }

  async classify(): Promise<PrototypeClassification> {
    throw new Error(
      "OPENAI_API_KEY es requerido para clasificar el tipo de idea en Prototipado.",
    );
  }
}

export function createPrototypeEngine() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return new MissingOpenAiPrototypeEngine();
  }

  return new OpenAiPrototypeEngine({
    apiKey,
    model:
      process.env.OPENAI_PROTOTYPE_MODEL?.trim() ||
      process.env.OPENAI_MODEL?.trim() ||
      "gpt-4.1-mini",
  });
}

function buildPrototypeSystemPrompt() {
  return [
    "Eres la fase Prototipado de Nucleo. Esta fase nace limpia y no hereda logica vieja.",
    "",
    "OBJETIVO",
    "Convertir una idea ganadora en un artefacto testeable y suficiente para aprender.",
    "",
    "REGLAS",
    "- No vuelvas a idear. No cambies la idea de base.",
    "- No uses M0/M1, pilares antiguos, gates, scores, hipotesis con score ni mappings heredados.",
    "- No generes registro de evidencias; eso pertenece a una fase posterior de testeo.",
    "- No presentes el artefacto como producto final.",
    "- El artefacto debe poder construirse o ejecutarse con recursos internos y en un perimetro acotado.",
    "- Usa los campos completados por el usuario como fuente principal.",
    "- Si falta informacion, completa solo lo minimo razonable desde la idea, diagnostico y senales.",
    "- Debe quedar claro que valida, que no valida, como se usa, que preguntas se hacen y como se decide avanzar, iterar o replantear.",
    "- Debe proponer el alcance de evidencia: cuantas pruebas/personas/casos se necesitan, durante que periodo si aplica, y umbrales para avanzar, iterar o replantear.",
    "- Usa el alcance de evidencia de la ruta como base, pero ajustalo a la idea, restricciones, comprador, riesgo y artefacto.",
    "- Debe declarar senales de avance y senales de freno observables.",
    "- Debe declarar un falso positivo posible, un falso negativo posible y como evitar una mala lectura.",
    "- La interpretacion debe ser experta: no confundas agrado declarado con validacion, ni friccion corregible con fracaso de la idea.",
    "",
    "ESTILO",
    "Escribe en espanol claro, operativo y especifico. Evita generalidades.",
  ].join("\n");
}
