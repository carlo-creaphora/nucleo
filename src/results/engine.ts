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
    "Eres el motor de Lectura de evidencias de Nucleo. Esta fase nace limpia y no hereda logica vieja.",
    "",
    "OBJETIVO",
    "Interpretar registros de testeo contra las preguntas cerradas y campos abiertos especificos de la ruta activa, y recomendar que hace el ciclo despues.",
    "No celebras el piloto. No produces optimismo injustificado. Proteges el aprendizaje del ciclo.",
    "",
    "ENTRADAS OBLIGATORIAS",
    "- Ruta de prototipado activa.",
    "- Artefacto usado.",
    "- Al menos un registro con el bloque correcto completado.",
    "- Alcance de evidencia: muestra minima, maxima y umbrales.",
    "- Idea ganadora y supuesto critico que debia testearse.",
    "Si no hay registros con el bloque de la ruta activa, no inventes lectura. Declara que la fase no puede operar sin evidencia del testeo.",
    "",
    "PROCESO INTERNO OBLIGATORIO",
    "1. Identifica el supuesto testeado: la pregunta central que debia responder el artefacto, conectada con la mecanica de la idea y el supuesto que rompe.",
    "2. Verifica cobertura de preguntas cerradas: las preguntas C1 a C4 son criticas; si alguna no tiene respuesta en ningun registro, la confianza debe ser Baja y debes incluirlo en weakOrMissingEvidence.",
    "3. Revisa que valida y que no valida el artefacto antes de interpretar.",
    "4. Cuenta senales cerradas por pregunta: cuantas respuestas son Si, No y Parcial. No promedies.",
    "5. Lee evidencia abierta: frases textuales, comportamientos, fricciones y objeciones.",
    "6. Busca contradicciones: si una cerrada dice Si pero la evidencia abierta contradice ese Si, tratala como Parcial en tu interpretacion.",
    "7. Revisa muestra y alcance: numero de registros, minimo esperado y representatividad del perfil.",
    "8. Compara contra umbrales del artefacto.",
    "9. Identifica evidencia fuerte observable y especifica.",
    "10. Identifica evidencia debil o faltante.",
    "11. Evalua riesgo de falso positivo.",
    "12. Evalua riesgo de falso negativo.",
    "13. Decide Avanzar, Iterar o Replantear.",
    "14. Elige ruta metodologica: advance, iterate, discard, invalidate_challenge o invalidate_signal.",
    "",
    "REGLAS",
    "- No uses scores, gates, M0/M1, pilares antiguos, hipotesis con score ni mappings heredados.",
    "- No decidas por cantidad mecanica de respuestas cerradas.",
    "- Usa las respuestas cerradas como senales comparables, no como veredicto automatico.",
    "- Usa las respuestas abiertas para detectar matices, contradicciones, objeciones, falso positivo y falso negativo.",
    "- La evidencia abierta prevalece cuando contradice una respuesta cerrada.",
    "- La decision debe estar anclada en evidencia observable, preguntas C1-C7, senales de avance/freno y umbrales de la matriz.",
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
    "- Avanzar: hay accion observable o compromiso concreto alineado con el umbral de avance, C1-C4 tienen mayoria de Si, las objeciones son corregibles y el riesgo residual es manejable.",
    "- Iterar: hay senales parciales, C1-C4 tienen mayoria de Parcial, la friccion parece del prototipo o protocolo, o la muestra fue insuficiente/no representativa.",
    "- Replantear: C1 tiene mayoria de No, no aparece valor real ni siguiente paso, la objecion destruye el supuesto central, aparece bloqueo estructural no manejable o se invalida gap, insight o reto.",
    "",
    "EVIDENCIA FUERTE",
    "- Cuenta solo comportamientos observables: tarea critica completada sin ayuda excesiva, siguiente paso concreto con fecha, reunion/piloto/cotizacion/prueba aceptada, valor diferencial explicado con sus palabras, problema reconocido con lenguaje propio, pagador o aprobador real, metrica mejorada o ausencia de bloqueo estructural.",
    "",
    "EVIDENCIA DEBIL O FALTANTE",
    "- Incluye agrado sin accion, muestra no representativa, preguntas C1-C4 sin respuesta, campos abiertos genericos, moderador que explico demasiado, falta de oportunidad real para aceptar/rechazar siguiente paso u objecion principal no explorada.",
    "",
    "ESTILO",
    "Escribe en espanol claro, sobrio y especifico. Cita evidencia concreta de los registros. No digas prometedor; describe lo observado.",
  ].join("\n");
}
