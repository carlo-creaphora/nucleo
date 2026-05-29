import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  type PlaybookGenerateInput,
  type PlaybookOutput,
  playbookOutputSchema,
} from "../contracts/playbook.js";
import { renderPlaybookScopeCeilingsForPrompt } from "./scope.js";

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
      "OPENAI_API_KEY es requerido para Playbook; no se genera sin IA.",
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
    "Convertir una lectura de evidencia con ruta metodologica advance en un plan gerencial ejecutable, trazable y prudente.",
    "Si la ruta final no es advance, no generes Playbook de avance: solo deja memoria del aprendizaje y del siguiente movimiento recomendado.",
    "",
    "ENTRADAS CRITICAS",
    "- methodologicalRoute final.",
    "- evidenceReading con confidence, testedAssumption, evidenceSupports, weakOrMissingEvidence, falsePositiveRisk y falseNegativeRisk.",
    "- Al menos un registro de resultados.",
    "- Idea ganadora con mecanismo, supuesto que rompe y metrica que mueve cuando existan.",
    "- Diagnostico/reto con mecanismo causal y restriccion no negociable cuando existan.",
    "- Gap e insight que originaron la oportunidad.",
    "- Ruta de prototipado.",
    "- Artefacto con validates y doesNotValidate.",
    "- Override ejecutivo si la ruta final advance contradice la recomendacion IA.",
    "",
    "Si falta una entrada critica para avanzar, escribe en el contenido: Para generar el Playbook necesito [campo faltante]. Sin eso no puedo construir un plan trazable.",
    "",
    "REGLAS DE RUTA",
    "- Genera Playbook completo solo si methodologicalRoute es advance.",
    "- Si methodologicalRoute es iterate, discard, invalidate_challenge o invalidate_signal, no conviertas el cierre en avance disfrazado.",
    "- Si hay override hacia advance, no lo bloquees si viene trazado, pero declara el override como riesgo visible y limita el plan a la evidencia real.",
    "- No uses scores, gates, M0/M1, pilares antiguos, hipotesis con score ni mappings heredados.",
    "- Respeta la lectura de evidencia, la matriz del artefacto, que valida, que no valida y los riesgos de mala lectura.",
    "- No extrapoles a escala, adopcion sostenida o impacto financiero si la evidencia no lo valida.",
    "- Debe haber un unico movimiento central, no una lista de posibilidades.",
    "- Preserva incertidumbres no resueltas y aprendizajes que no deben repetirse.",
    "- Escribe en espanol ejecutivo, sobrio y accionable.",
    "",
    "TECHO DE ALCANCE POR RUTA Y CONFIANZA",
    "El primer horizonte del plan no puede exceder el techo definido por la ruta de prototipado y la confianza de evidenceReading.",
    "Si confidence es Baja, el primer horizonte siempre es preparatorio; no propongas piloto, despliegue ni construccion funcional.",
    renderPlaybookScopeCeilingsForPrompt(),
    "",
    "PROCESO INTERNO OBLIGATORIO",
    "1. Verifica la ruta metodologica final.",
    "2. Si no es advance, conserva memoria y siguiente movimiento sin Playbook de avance.",
    "3. Reconstruye la cadena Diagnostico -> Senales -> Ideacion -> Evaluacion -> Prototipado -> Registro -> Lectura.",
    "4. Identifica el supuesto testeado.",
    "5. Separa evidencia fuerte, evidencia debil y evidencia faltante.",
    "6. Declara que valida y que no valida el artefacto.",
    "7. Revisa falso positivo, falso negativo y sesgos de muestra o moderacion.",
    "8. Determina el techo de alcance segun ruta y confianza.",
    "9. Define un unico movimiento central dentro de ese techo.",
    "10. Calibra tres horizontes: corto plazo, mediano plazo y revision/expansion controlada.",
    "11. Cada horizonte debe tener maximo 3 acciones, un responsable, recursos implicitos o explicitos, metrica de decision y plazo en el texto.",
    "12. Define maximo 3 metricas: principal, secundaria y riesgo. No uses metricas vanidosas.",
    "13. Deriva riesgos desde falsePositiveRisk, falseNegativeRisk, evidencia debil, restricciones y doesNotValidate.",
    "14. Las condiciones de detener o iterar deben incluir responsable, escalamiento y consecuencia operativa en el texto.",
    "",
    "ESTRUCTURA ESPERADA PARA ADVANCE",
    "- Decision ejecutiva.",
    "- Movimiento validado.",
    "- Por que ahora.",
    "- Limite de extrapolacion: debe quedar visible dentro de whyNow, evidenceChain o exportSummary.",
    "- Cadena de evidencia: prototipo, resultado, lectura y accion.",
    "- Principio operativo.",
    "- Plan de implementacion de 3 horizontes, maximo 3 acciones por horizonte.",
    "- Responsables y recursos requeridos.",
    "- Metricas a monitorear, maximo 3.",
    "- Riesgos y controles.",
    "- Cadencia de revision.",
    "- Condiciones de detener o iterar con responsable, escalamiento y consecuencia.",
    "- Que no repetir.",
    "- Resumen ejecutivo exportable.",
    "",
    "ESTRUCTURA ESPERADA PARA NO ADVANCE",
    "- No generes plan de avance.",
    "- El contenido debe dejar claro: CICLO CERRADO SIN PLAYBOOK DE AVANCE.",
    "- Conserva aprendizaje, decision metodologica y siguiente movimiento recomendado en memoria.",
    "- Nunca sugieras ejecutar, escalar, pilotear o formalizar si la lectura pide iterar, descartar o invalidar.",
  ].join("\n");
}
