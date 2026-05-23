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

const ideationConceptReviewSchema = z.object({
  passed: z.boolean(),
  conceptualFindings: z.array(
    z.object({
      ideaId: z.string().min(1),
      status: z.enum(["ok", "generic_or_antipattern"]),
      reason: z.string().min(12),
      antiPatternTitle: z.string().min(3).optional(),
      requiredReframe: z.string().min(12).optional(),
    }),
  ).min(1).max(4),
});

type IdeationConceptReview = z.infer<typeof ideationConceptReviewSchema>;

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
      const conceptReview = await this.runConceptReview(input, caseScreening, output);

      if (conceptReview.passed) {
        return output;
      }

      const semanticallyRepaired = await this.repairConceptViolations(
        input,
        caseScreening,
        output,
        conceptReview,
      );
      const semanticallyRepairedReview = await this.runConceptReview(
        input,
        caseScreening,
        semanticallyRepaired,
      );

      if (!semanticallyRepairedReview.passed) {
        throw new Error(
          `Ideacion incumplio contrato conceptual despues de reparacion: ${semanticallyRepairedReview.conceptualFindings
            .filter((finding) => finding.status !== "ok")
            .map((finding) => finding.reason)
            .join(" | ")}`,
        );
      }

      return semanticallyRepaired;
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

    const conceptReview = await this.runConceptReview(input, caseScreening, repaired);

    if (!conceptReview.passed) {
      const semanticallyRepaired = await this.repairConceptViolations(
        input,
        caseScreening,
        repaired,
        conceptReview,
      );
      const semanticallyRepairedReview = await this.runConceptReview(
        input,
        caseScreening,
        semanticallyRepaired,
      );

      if (!semanticallyRepairedReview.passed) {
        throw new Error(
          `Ideacion incumplio contrato conceptual despues de reparacion: ${semanticallyRepairedReview.conceptualFindings
            .filter((finding) => finding.status !== "ok")
            .map((finding) => finding.reason)
            .join(" | ")}`,
        );
      }

      return semanticallyRepaired;
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
        "Repara la ideacion por incumplimiento contractual. No cambies gap, insight, tipo de ruptura ni los casos ya seleccionados en caseScreening. Reformula solo la idea afectada y conserva exactamente 1 idea.",
      violations,
      mandatoryCaseScreening: caseScreening,
      originalOutput: output,
      originalPayload: buildIdeationUserPayload(input, caseScreening),
    });
  }

  private async repairConceptViolations(
    input: IdeationGenerationInput,
    caseScreening: IdeationCaseScreening,
    output: IdeationOutput,
    conceptReview: IdeationConceptReview,
  ) {
    return this.runStructured({
      instruction:
        "Repara la ideacion por incumplimiento conceptual de anti-patrones. No cambies gap, insight, tipo de ruptura ni los casos seleccionados. Reformula solo las ideas marcadas como generic_or_antipattern desde el mecanismo del caso seleccionado.",
      conceptReview,
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

  private async runConceptReview(
    input: IdeationGenerationInput,
    caseScreening: IdeationCaseScreening,
    output: IdeationOutput,
  ) {
    const completion = await this.client.beta.chat.completions.parse({
      model: this.model,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: buildConceptReviewSystemPrompt(),
        },
        {
          role: "user",
          content: JSON.stringify(
            buildConceptReviewPayload(input, caseScreening, output),
            null,
            2,
          ),
        },
      ],
      response_format: zodResponseFormat(
        ideationConceptReviewSchema,
        "ideation_concept_review",
      ),
    });
    const parsed = completion.choices[0]?.message.parsed;

    if (!parsed) {
      throw new Error("OpenAI no devolvio revision conceptual valida");
    }

    return parsed as IdeationConceptReview;
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

    return cleanIdeationOutputForDisplay(
      parsed as z.infer<typeof ideationOutputSchema>,
    );
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
    "2. Usar las referencias seleccionadas como base; la idea final debe nacer de una referencia principal y puede apoyarse en las otras.",
    "3. Traducir el mecanismo transferible, no copiar el caso ni presentarlo como biblioteca.",
    "4. Cruzar cada reinterpretacion con supuestos por industria: cada idea debe romper un supuesto explicitamente.",
    "5. Cruzar cada idea contra antipatrones antes de responder. Si coincide con D3 Solucion antes que problema o D4 Beneficio sin mecanica, esta prohibida.",
    "6. No basta decir el beneficio: la mecanica concreta debe incluir actor, objeto/ritual/interaccion, regla de uso, frecuencia o momento. El piloto va solo en primerPasoEjecutable.",
    "7. Usar modelos de negocio raros solo como apoyo cuando mejoren la mecanica; no los presentes como idea abstracta.",
    "8. Formular exactamente 1 idea prototipable en un piloto acotado para la ruta seleccionada.",
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
    "Generar exactamente 1 idea para la ruta seleccionada.",
    "La idea debe derivarse del gap seleccionado, insight seleccionado, reto recomendado, restricciones, tensiones y evidencias usadas.",
    "La idea debe tener exactamente esta estructura visible y en este orden:",
    "1. idea: debe empezar con 'Idea 1. [nombre distintivo]: [descripcion corta]'",
    "2. supuestoQueRompe: solo el supuesto que rompe, en una frase corta. No empieces con 'Rompe el supuesto de que', no expliques beneficio, no agregues frases como 'Cambia...' o 'Esto permite...'.",
    "3. mecanicaConcreta: mecanismo concreto en maximo 2 frases, sin piloto y sin explicar beneficios.",
    "4. porQueFunciona: explicacion breve en maximo 2 frases.",
    "5. casoAnalogo: contenido de 'Caso analogo:' incluyendo nombre, ano, industria/pais, similitud y diferencia",
    "6. metricaQueMueve: contenido de 'Metrica que mueve:'",
    "7. primerPasoEjecutable: contenido de 'Primer paso ejecutable:'",
    "8. antiPatronesAEvitar: contenido de 'Anti-patrones a evitar al ejecutar:'",
    "No repitas el nombre del campo dentro del contenido: supuestoQueRompe no debe empezar con 'Supuesto que rompe:' y mecanicaConcreta no debe empezar con 'La mecanica concreta consiste en'.",
    "supuestoQueRompe debe ser solo el supuesto, no una mini-explicacion de la idea.",
    "mecanicaConcreta y porQueFunciona deben ser concretos: evita parrafos largos.",
    "La mecanica concreta debe nombrar actores, objetos/rituales/interacciones y regla de uso, pero no debe describir el piloto; el piloto va exclusivamente en primerPasoEjecutable.",
    "antiPatronesAEvitar debe estar escrito para el usuario final, sin codigos internos como D3, D4 o textos entre parentesis tipo '(evitar D4)'.",
    "",
    "SALIDA INTERNA",
    "En internal.caseScreening.translatedCaseReferences copia las referencias de mandatoryCaseScreening ya reinterpretadas, sin inventar otras nuevas.",
  ].join("\n");
}

export function cleanIdeationOutputForDisplay(
  output: IdeationOutput,
): IdeationOutput {
  return {
    ...output,
    ideas: output.ideas.map((idea) => ({
      ...idea,
      supuestoQueRompe: cleanAssumption(
        stripLeadingFieldLabel(idea.supuestoQueRompe, [
          "Supuesto que rompe",
        ]),
      ),
      mecanicaConcreta: limitSentences(stripPilotFromMechanic(
        stripLeadingFieldLabel(idea.mecanicaConcreta, [
          "Mecanica concreta",
          "Mecánica concreta",
          "La mecanica concreta consiste en",
          "La mecánica concreta consiste en",
        ]),
      ), 2),
      porQueFunciona: limitSentences(idea.porQueFunciona, 2),
      antiPatronesAEvitar: idea.antiPatronesAEvitar
        .map(stripInternalAntiPatternCode)
        .filter((item) => item.length > 0),
    })),
  };
}

function cleanAssumption(value: string) {
  const withoutPrefix = value
    .trim()
    .replace(/^[\s"'“”‘’]*(?:rompe|romper)\s+[\s\S]{0,90}?\s+de\s+que\s+/i, "")
    .replace(/^rompe\s+(?:el\s+)?supuesto\s+de\s+que\s+/i, "")
    .replace(/^rompe\s+(?:la\s+)?creencia\s+de\s+que\s+/i, "")
    .replace(/^el\s+supuesto\s+que\s+rompe\s+es\s+que\s+/i, "")
    .replace(/^la\s+creencia\s+que\s+rompe\s+es\s+que\s+/i, "");
  return limitSentences(uppercaseFirst(withoutPrefix), 1);
}

function uppercaseFirst(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed[0].toUpperCase() + trimmed.slice(1) : trimmed;
}

function limitSentences(value: string, maxSentences: number) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  const sentences = cleaned.match(/[^.!?]+[.!?]?/g);

  if (!sentences) {
    return cleaned;
  }

  return sentences.slice(0, maxSentences).join(" ").replace(/\s+/g, " ").trim();
}

function stripLeadingFieldLabel(value: string, labels: string[]) {
  let cleaned = value.trim();

  for (const label of labels) {
    const escaped = escapeRegExp(label);
    cleaned = cleaned.replace(new RegExp(`^${escaped}\\s*:?\\s*`, "i"), "");
  }

  return cleaned.trim();
}

function stripPilotFromMechanic(value: string) {
  return value
    .replace(
      /\s+(?:El piloto|El primer piloto|Como piloto|Para el piloto)\b[\s\S]*$/i,
      "",
    )
    .trim();
}

function stripInternalAntiPatternCode(value: string) {
  return value
    .replace(/\s*\(evitar\s+D\d+\)\.?/gi, "")
    .replace(/\s*\bD\d+\b\.?/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

export function buildConceptReviewSystemPrompt() {
  return [
    "Eres el revisor conceptual de anti-patrones de Ideacion de Nucleo.",
    "No bloquees por palabras sueltas. Evalua el modelo de la idea, su logica y su mecanica.",
    "",
    "CRITERIO",
    "- Una idea falla si su concepto es generico aunque use palabras sofisticadas.",
    "- Una idea pasa si tiene mecanismo concreto, actor, regla de uso, interaccion/ritual/objeto, primer piloto y trazabilidad a un caso disruptivo.",
    "- Palabras como app, plataforma, dashboard, IA, comunidad, alianza o capacitacion no son motivo suficiente para fallar. Solo fallan si el modelo de la idea es generico, decorativo o sustituye el problema por una solucion obvia.",
    "- Usa los anti-patrones del payload como criterios conceptuales, no como lista de palabras prohibidas.",
    "- D3 Solucion antes que problema falla cuando la idea parte de una solucion predefinida y no de la tension/gap/insight.",
    "- D4 Beneficio sin mecanica falla cuando promete un resultado sin explicar la mecanica concreta que lo produce.",
    "",
    "SALIDA",
    "Devuelve passed=true solo si todas las ideas pasan conceptualmente.",
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
      "Genera exactamente 1 idea para la seleccion usando mandatoryCaseScreening. No hagas scouting nuevo de casos en esta etapa: traduce el caso con mayor potencia en una idea concreta y evita los anti-patrones marcados.",
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

function buildConceptReviewPayload(
  input: IdeationGenerationInput,
  caseScreening: IdeationCaseScreening,
  output: IdeationOutput,
) {
  return {
    instruction:
      "Evalua conceptualmente si las ideas caen en anti-patrones. No uses palabras sueltas como criterio.",
    selection: input.selection,
    selectedContext: {
      challenge: input.diagnosisHandoff.selectedChallenge,
      diagnosis: input.diagnosisHandoff.diagnosis,
      gap: input.signalsHandoff.gaps.find(
        (gap) => gap.title === input.selection.gapTitle,
      ),
      insight: input.signalsHandoff.insights.find(
        (insight) => insight.title === input.selection.insightTitle,
      ),
    },
    mandatoryCaseScreening: caseScreening,
    antiPatterns: input.knowledgePack.antiPatterns,
    outputToReview: output,
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
