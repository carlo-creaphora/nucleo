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

const ideationCaseScreeningSchema = z.object({
  selectedCaseReferences: z.array(
    z.object({
      caseName: z.string().min(2),
      transferableMechanism: z.string().min(20),
      whyThisCaseFits: z.string().min(30),
      reinterpretationForThisIdea: z.string().min(30),
      antiPatternRisk: z.string().min(20),
      caveat: z.string().min(8),
    }),
  ).length(3),
  rejectedCaseFamilies: z.array(z.string().min(8)).default([]),
  generationGuardrails: z.array(z.string().min(12)).min(3),
});

type IdeationCaseScreening = z.infer<typeof ideationCaseScreeningSchema>;

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
    const caseScreening = await this.runCaseScreening(input);
    const output = await this.runStructured(
      buildIdeationUserPayload(input, caseScreening),
    );
    const violations = validateIdeationOutput(input, output);

    if (violations.length === 0) {
      return output;
    }

    const repaired = await this.repairContractViolations(
      input,
      caseScreening,
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
    caseScreening: IdeationCaseScreening,
    output: IdeationOutput,
    violations: IdeationContractViolation[],
  ) {
    return this.runStructured({
      instruction:
        "Repara la ideacion por incumplimiento contractual. No cambies gap, insight, tipo de ruptura ni los casos ya seleccionados en caseScreening. Reformula solo las ideas afectadas y conserva exactamente 3 ideas.",
      violations,
      mandatoryCaseScreening: caseScreening,
      originalOutput: output,
      originalPayload: buildIdeationUserPayload(input, caseScreening),
    });
  }

  private async runCaseScreening(input: IdeationGenerationInput) {
    const completion = await this.client.beta.chat.completions.parse({
      model: this.model,
      temperature: 0.18,
      messages: [
        {
          role: "system",
          content: buildCaseScreeningSystemPrompt(),
        },
        {
          role: "user",
          content: JSON.stringify(buildCaseScreeningPayload(input), null, 2),
        },
      ],
      response_format: zodResponseFormat(
        ideationCaseScreeningSchema,
        "ideation_case_screening",
      ),
    });
    const parsed = completion.choices[0]?.message.parsed;

    if (!parsed) {
      throw new Error("OpenAI no devolvio seleccion de casos valida");
    }

    return parsed as IdeationCaseScreening;
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
    "Recibiras mandatoryCaseScreening. Esa seleccion de casos ya fue hecha antes de idear y es obligatoria: cada idea debe nacer de una referencia distinta de esa lista.",
    "",
    "PROCESO INTERNO OBLIGATORIO",
    "1. Releer mandatoryCaseScreening antes de escribir cualquier idea.",
    "2. Usar exactamente las 3 referencias seleccionadas: una referencia distinta por idea.",
    "3. Traducir el mecanismo transferible, no copiar el caso ni presentarlo como biblioteca.",
    "4. Cruzar cada reinterpretacion con supuestos por industria: cada idea debe romper un supuesto explicitamente.",
    "5. Cruzar cada idea contra antipatrones antes de responder. Si coincide con D3 Solucion antes que problema o D4 Beneficio sin mecanica, esta prohibida.",
    "6. No basta decir el beneficio: la mecanica concreta debe incluir actor, objeto/ritual/interaccion, regla de uso, frecuencia o momento, y primer piloto.",
    "7. Usar modelos de negocio raros solo como apoyo cuando mejoren la mecanica; no los presentes como idea abstracta.",
    "8. Formular exactamente 3 ideas, cada una prototipable en un piloto acotado.",
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
    "RUPTURA_FUERTE = transformar. Verbo: transformar. Pregunta guia: que pieza del modelo podria funcionar de otra manera? No mejora lo existente: cambia su forma. El producto puede seguir siendo el mismo, pero cambia como se cobra, quien paga, como se entrega, como accede el cliente, que regla decide, que incentivo mueve conducta o quien tiene autoridad para cerrar una decision. Reconfigura el modelo de negocio o el sistema operativo sin necesariamente negar las creencias de la industria. Riesgo medio.",
    "RUPTURA_RADICAL_CONTROLADA = romper. Verbo: romper. Pregunta guia: que cree todo el mundo en este sector que en realidad no es cierto? No mejora ni reconfigura: ataca directamente una creencia que la industria da por obvia. Produce reinvencion y ventaja defendible, pero debe probarse en un perimetro acotado que no comprometa la operacion principal.",
    "No mezclar rutas: una idea moderada no debe cambiar quien paga; una fuerte debe tocar una pieza del modelo, regla, incentivo o forma de decidir; una radical debe negar un supuesto industrial explicito.",
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
    "En internal.caseScreening.translatedCaseReferences copia las 3 referencias de mandatoryCaseScreening ya reinterpretadas, sin inventar otras nuevas.",
  ].join("\n");
}

export function buildCaseScreeningSystemPrompt() {
  return [
    "Eres el filtro previo de Ideacion de Nucleo. Tu unica tarea es seleccionar casos disruptivos antes de generar ideas.",
    "No generes ideas finales. No escribas propuestas al usuario.",
    "",
    "METODO OBLIGATORIO",
    "1. Lee reto recomendado, gap, insight, restricciones, tensiones y memoria.",
    "2. Revisa la biblioteca completa de casos disruptivos disponible en el payload.",
    "3. Selecciona exactamente 3 casos cuyo mecanismo pueda traducirse al problema actual.",
    "4. Elige por mecanismo transferible, no por parecido superficial de industria.",
    "5. Cada caso debe habilitar una idea distinta; no aceptes tres variaciones de la misma logica.",
    "6. Antes de aceptar cada caso, identifica el riesgo de anti-patron que podria producir: D3 solucion antes que problema, D4 beneficio sin mecanica, app generica, plataforma generica, dashboard, capacitacion, contenido, alianza o IA decorativa.",
    "7. En generationGuardrails escribe reglas concretas para que la siguiente etapa no caiga en esos anti-patrones.",
    "",
    "CRITERIO DE SELECCION",
    "- Prioriza mecanismos que cambian decision, incentivo, unidad economica, interfaz fisica, canal, acceso, pagador, variable optimizada o ritual operativo.",
    "- Rechaza casos que solo inspiran marketing, comunicacion, contenido o tecnologia generica.",
    "- La reinterpretacion debe decir como se convierte el mecanismo en una idea posible para este gap e insight.",
  ].join("\n");
}

function buildCaseScreeningPayload(input: IdeationGenerationInput) {
  const selectedGap = input.signalsHandoff.gaps.find(
    (gap) => gap.title === input.selection.gapTitle,
  );
  const selectedInsight = input.signalsHandoff.insights.find(
    (insight) => insight.title === input.selection.insightTitle,
  );

  return {
    instruction:
      "Selecciona exactamente 3 casos disruptivos para reinterpretar despues. No generes ideas finales.",
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

function buildIdeationUserPayload(
  input: IdeationGenerationInput,
  caseScreening: IdeationCaseScreening,
) {
  const selectedGap = input.signalsHandoff.gaps.find(
    (gap) => gap.title === input.selection.gapTitle,
  );
  const selectedInsight = input.signalsHandoff.insights.find(
    (insight) => insight.title === input.selection.insightTitle,
  );

  return {
    instruction:
      "Genera exactamente 3 ideas para la seleccion usando mandatoryCaseScreening. No hagas scouting nuevo de casos en esta etapa: traduce cada caso seleccionado en una idea concreta y evita los anti-patrones marcados.",
    selection: input.selection,
    expectedRoute: buildRoute(
      input.selection.ruptureType,
      input.selection.gapTitle,
      input.selection.insightTitle,
    ),
    mandatoryCaseScreening: caseScreening,
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
