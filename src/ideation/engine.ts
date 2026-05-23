import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import {
  type IdeationGenerationInput,
  type IdeationOutput,
  ideationOutputSchema,
} from "../contracts/ideation.js";
import {
  type IdeationContractViolation,
  validateIdeationOutput,
} from "./validation.js";

export type IdeationEngine = {
  generate(input: IdeationGenerationInput): Promise<IdeationOutput>;
};

export class OpenAiIdeationEngine implements IdeationEngine {
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

  async generate(input: IdeationGenerationInput) {
    const output = await this.runStructured(
      buildIdeationUserPayload(input),
    );
    const violations = validateIdeationOutput(input, output);

    if (violations.length === 0) {
      return output;
    }

    const repaired = await this.repairContractViolations(
      input,
      output,
      violations,
    );
    const remainingViolations = validateIdeationOutput(input, repaired);

    if (remainingViolations.length > 0) {
      throw new Error(
        `Ideacion incumplio contrato despues de reparacion: ${remainingViolations
          .map((violation) => violation.message)
          .join(" | ")}`,
      );
    }

    return repaired;
  }

  private async repairContractViolations(
    input: IdeationGenerationInput,
    output: IdeationOutput,
    violations: IdeationContractViolation[],
  ) {
    return this.runStructured({
      instruction:
        "Repara la ideacion por incumplimiento contractual. No cambies gap, insight ni tipo de ruptura. Reformula solo las ideas afectadas y conserva exactamente 3 ideas.",
      violations,
      originalOutput: output,
      originalPayload: buildIdeationUserPayload(input),
    });
  }

  private async runStructured(payload: unknown) {
    const completion = await this.client.beta.chat.completions.parse({
      model: this.model,
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content: buildIdeationSystemPrompt(),
        },
        {
          role: "user",
          content: JSON.stringify(payload, null, 2),
        },
      ],
      response_format: zodResponseFormat(
        ideationOutputSchema,
        "ideation_output",
      ),
    });
    const parsed = completion.choices[0]?.message.parsed;

    if (!parsed) {
      throw new Error("OpenAI no devolvio una ideacion valida");
    }

    return parsed as z.infer<typeof ideationOutputSchema>;
  }
}

class MissingOpenAiIdeationEngine implements IdeationEngine {
  async generate(): Promise<IdeationOutput> {
    throw new Error(
      "OPENAI_API_KEY es requerido para Ideacion; el demo y produccion no usan respuestas heuristicas.",
    );
  }
}

export function createIdeationEngine() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return new MissingOpenAiIdeationEngine();
  }

  return new OpenAiIdeationEngine({
    apiKey,
    model:
      process.env.OPENAI_IDEATION_MODEL?.trim() ||
      process.env.OPENAI_MODEL?.trim() ||
      "gpt-4.1-mini",
  });
}

export function buildIdeationSystemPrompt() {
  return [
    "Eres la fase Ideacion de Nucleo. Esta fase nace limpia y no hereda logica de ningun proyecto anterior.",
    "",
    "PROHIBICIONES ABSOLUTAS",
    "- No traer M0/M1.",
    "- No usar pilares antiguos.",
    "- No usar gates.",
    "- No usar scores.",
    "- No usar hipotesis con score.",
    "- No usar retry interno por score bajo.",
    "- No usar mappings heredados.",
    "- No hacer optimismo automatico.",
    "- No darle la razon al usuario.",
    "- No generar creatividad generica.",
    "- No proponer app/plataforma/IA/comunidad/evento/contenido/capacitacion/dashboard/alianza si la mecanica no rompe un supuesto especifico.",
    "",
    "INPUT OBLIGATORIO",
    "El usuario ya selecciono tres niveles: tipo de ruptura, gap e insight. Solo puedes generar ideas para esa seleccion.",
    "Registro y Diagnostico son contexto invisible: usalos para entender empresa, restricciones, tension y reto recomendado; no los conviertas en secciones visibles.",
    "",
    "PROCESO INTERNO OBLIGATORIO",
    "1. Releer reto recomendado, gap seleccionado, insight seleccionado, restricciones y tensiones.",
    "2. Antes de idear, buscar en todos los casos disruptivos cuales podrian funcionar para este reto, gap e insight. No elijas el primer caso conocido; compara por mecanismo transferible.",
    "3. Clasificar mentalmente esos casos por mecanismo: cambio de cobro, quien paga, eliminacion de intermediario, experiencia diferida, activacion sensorial, interfaz fisica, variable contraintuitiva, capacidad ociosa, servitizacion, modelo psicologico, distribucion rara, operacion rara.",
    "4. Identificar referencias analogas utiles. No presentes los casos como resultado; usa cada referencia para traducir o reinterpretar su mecanismo en una idea nueva.",
    "5. Cada una de las 3 ideas debe apoyarse en una reinterpretacion distinta de la biblioteca de casos, no en tres variaciones de la misma logica.",
    "6. Cruzar cada reinterpretacion con supuestos por industria: cada idea debe romper un supuesto explicitamente.",
    "7. Cruzar cada idea contra antipatrones. Si coincide con un antipatron, no la presentes: reformulala hasta que tenga mecanica concreta o descartala.",
    "8. Usar modelos de negocio raros solo como apoyo cuando mejoren la mecanica; no los presentes como idea abstracta.",
    "9. Formular exactamente 3 ideas, cada una prototipable en un piloto acotado.",
    "",
    "CRITERIO PARA USAR CASOS DISRUPTIVOS",
    "- Preferir transferencia de mecanismo sobre similitud superficial de industria.",
    "- Preferir casos que cambian comportamiento, incentivo, decision, unidad economica, canal sensorial o modelo de cobro.",
    "- Evitar casos que solo inspiran marketing, branding o storytelling si el reto es operativo o de compra.",
    "- Si el caso tiene caveat, adaptar la idea para que el primer paso ejecutable limite ese riesgo.",
    "- No copiar el caso y no listar casos como si fueran la salida. Debes transformar el mecanismo al problema concreto.",
    "",
    "NIVELES DE RUPTURA",
    "La progresion es acumulativa: mejorar optimiza el juego, transformar cambia las reglas del juego, romper supuestos cambia el juego mismo.",
    "RUPTURA_MODERADA = mejorar. Verbo: mejorar. Pregunta guia: que hacemos hoy que podria funcionar mejor? Se toma lo que ya existe y se hace mejor: mas rapido, mas barato, mas comodo o con menos friccion. No cuestiona el modelo de negocio ni los supuestos de la industria. Acepta el tablero como esta y juega mejor. Riesgo bajo.",
    "RUPTURA_FUERTE = transformar. Verbo: transformar. Pregunta guia: que pieza del modelo podria funcionar de otra manera? No mejora lo existente: cambia su forma. El producto puede seguir siendo el mismo, pero cambia como se cobra, quien paga, como se entrega o como accede el cliente. Reconfigura el modelo de negocio sin necesariamente negar las creencias de la industria. Riesgo medio.",
    "RUPTURA_RADICAL_CONTROLADA = romper. Verbo: romper. Pregunta guia: que cree todo el mundo en este sector que en realidad no es cierto? No mejora ni reconfigura: ataca directamente una creencia que la industria da por obvia. Produce reinvencion y ventaja defendible, pero debe probarse en un perimetro acotado que no comprometa la operacion principal.",
    "No mezclar rutas: una idea moderada no debe cambiar quien paga; una fuerte debe tocar una pieza del modelo; una radical debe negar un supuesto industrial explicito.",
    "",
    "FORMATO DE IDEAS",
    "Generar exactamente 3 ideas para la ruta seleccionada.",
    "Cada idea debe derivarse del gap seleccionado, insight seleccionado, reto recomendado, restricciones, tensiones y evidencias usadas.",
    "Cada idea debe tener exactamente esta estructura visible y en este orden:",
    "1. idea: debe empezar con 'Idea N. [nombre distintivo]: [descripcion corta]'",
    "2. supuestoQueRompe: contenido de 'Supuesto que rompe:'",
    "3. mecanicaConcreta: contenido de 'Mecanica concreta:'",
    "4. porQueFunciona: contenido de 'Por que funciona:'",
    "5. casoAnalogo: contenido de 'Caso analogo:' incluyendo nombre, ano, industria/pais, similitud y diferencia",
    "6. metricaQueMueve: contenido de 'Metrica que mueve:'",
    "7. primerPasoEjecutable: contenido de 'Primer paso ejecutable:'",
    "8. antiPatronesAEvitar: contenido de 'Anti-patrones a evitar al ejecutar:'",
    "La mecanica concreta debe nombrar actores, objetos/rituales/interacciones, regla de uso y primer piloto.",
    "",
    "SALIDA INTERNA",
    "En internal.caseScreening.translatedCaseReferences deja rastro de las 3 referencias reinterpretadas, el mecanismo transferible, como se traduce a una idea y el caveat principal.",
  ].join("\n");
}

function buildIdeationUserPayload(input: IdeationGenerationInput) {
  const selectedGap = input.signalsHandoff.gaps.find(
    (gap) => gap.title === input.selection.gapTitle,
  );
  const selectedInsight = input.signalsHandoff.insights.find(
    (insight) => insight.title === input.selection.insightTitle,
  );

  return {
    instruction:
      "Genera exactamente 3 ideas para la seleccion. Usa todos los casos disruptivos como biblioteca de analogias; no presentes casos, reinterpreta mecanismos y documenta las referencias usadas en internal.caseScreening.translatedCaseReferences.",
    selection: input.selection,
    expectedRoute: buildRoute(
      input.selection.ruptureType,
      input.selection.gapTitle,
      input.selection.insightTitle,
    ),
    selectedContext: {
      challenge: input.diagnosisHandoff.selectedChallenge,
      diagnosis: input.diagnosisHandoff.diagnosis,
      registration: input.diagnosisHandoff.registration,
      gap: selectedGap,
      insight: selectedInsight,
      evidence: input.signalsHandoff.evidence.filter((evidence) =>
        [...(selectedGap?.evidenceIds ?? []), ...(selectedInsight?.evidenceIds ?? [])].includes(
          evidence.id,
        ),
      ),
      memory: {
        diagnosisMemory: input.diagnosisHandoff.memory,
        signalsMemory: input.signalsHandoff.memory,
      },
    },
    knowledge: {
      assumptionsByIndustry: input.knowledgePack.assumptionsByIndustry,
      antiPatterns: input.knowledgePack.antiPatterns,
      disruptiveCases: input.knowledgePack.disruptiveCases,
      weirdBusinessModels: input.knowledgePack.weirdBusinessModels,
    },
  };
}

function buildRoute(
  ruptureType: IdeationGenerationInput["selection"]["ruptureType"],
  gapTitle: string,
  insightTitle: string,
) {
  const titleByType = {
    RUPTURA_MODERADA: "Ruptura moderada",
    RUPTURA_FUERTE: "Ruptura fuerte",
    RUPTURA_RADICAL_CONTROLADA: "Ruptura radical controlada",
  };
  const purposeByType = {
    RUPTURA_MODERADA:
      "Mejorar lo que ya existe para hacerlo mas rapido, barato, comodo o con menos friccion, sin cuestionar el modelo de negocio.",
    RUPTURA_FUERTE:
      "Transformar una pieza del modelo: cobro, pagador, entrega, acceso o forma de operar.",
    RUPTURA_RADICAL_CONTROLADA:
      "Romper una creencia obvia de la industria mediante una prueba acotada que no comprometa la operacion principal.",
  };
  const verbByType = {
    RUPTURA_MODERADA: "mejorar",
    RUPTURA_FUERTE: "transformar",
    RUPTURA_RADICAL_CONTROLADA: "romper",
  } as const;
  const guidingQuestionByType = {
    RUPTURA_MODERADA: "Que hacemos hoy que podria funcionar mejor?",
    RUPTURA_FUERTE: "Que pieza del modelo podria funcionar de otra manera?",
    RUPTURA_RADICAL_CONTROLADA:
      "Que cree todo el mundo en este sector que en realidad no es cierto?",
  };
  const riskLevelByType = {
    RUPTURA_MODERADA: "bajo",
    RUPTURA_FUERTE: "medio",
    RUPTURA_RADICAL_CONTROLADA: "alto_controlado",
  } as const;

  return {
    id: ruptureType.toLowerCase(),
    title: titleByType[ruptureType],
    ruptureType,
    verb: verbByType[ruptureType],
    guidingQuestion: guidingQuestionByType[ruptureType],
    riskLevel: riskLevelByType[ruptureType],
    purpose: purposeByType[ruptureType],
    usesGapTitles: [gapTitle],
    usesInsightTitles: [insightTitle],
  };
}
