import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import {
  type SignalEvidence,
  type SignalLens,
  type SignalsInput,
  type SignalsOutput,
  signalEvidenceForAiSchema,
  signalsSynthesisForAiSchema,
  signalsOutputSchema,
} from "../contracts/signals.js";

const evidenceResponseSchema = z.object({
  signals: z.array(signalEvidenceForAiSchema).max(5),
});

type EvidenceWithoutId = z.infer<typeof evidenceResponseSchema>["signals"][number];

export type SignalsEngine = {
  generate(input: SignalsInput): Promise<SignalsOutput>;
};

export class OpenAiSignalsEngine implements SignalsEngine {
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

  async generate(input: SignalsInput): Promise<SignalsOutput> {
    const searchResults = await Promise.all([
      this.searchLens(input, "SOCIAL_LISTENING"),
      this.searchLens(input, "TREND"),
      this.searchLens(input, "COMPETITOR"),
    ]);
    const senalesBase = rankEvidence(searchResults.flat()).map((signal, index) => ({
      ...signal,
      id: `sig_${index + 1}`,
    }));
    const synthesis = await this.synthesize(input, senalesBase);
    const fuentesConsultadas = Array.from(
      new Set(
        senalesBase
          .map((signal) => signal.sourceUrl ?? signal.sourceLabel)
          .filter(Boolean),
      ),
    );
    const missingLenses = [
      ["SOCIAL_LISTENING", "No se encontro social listening defendible con voz textual."],
      ["TREND", "No se encontraron tendencias trazables suficientes."],
      ["COMPETITOR", "No se encontraron senales competitivas trazables suficientes."],
    ] as const;

    return signalsOutputSchema.parse({
      ...synthesis,
      searchDepth: "standard",
      generatedAt: new Date().toISOString(),
      memoriaEmpresa: input.ideationInput.memory,
      internal: {
        fuentesConsultadas,
        senalesBase,
        vaciosDeEvidencia: missingLenses
          .filter(([lens]) => !senalesBase.some((signal) => signal.lens === lens))
          .map(([, message]) => message),
      },
    });
  }

  private async searchLens(input: SignalsInput, lens: SignalLens) {
    const response = await this.client.responses.parse({
      model: this.model,
      max_output_tokens: 2800,
      tools: [
        {
          type: "web_search_preview",
          search_context_size: "medium",
          user_location: this.buildSearchLocation(input),
        },
      ],
      tool_choice: "required",
      input: [
        {
          role: "system",
          content: buildSearchSystemPrompt(lens),
        },
        {
          role: "user",
          content: buildSearchUserPrompt(input, lens),
        },
      ],
      text: {
        format: zodTextFormat(evidenceResponseSchema, `signals_${lens}`),
      },
    });

    const parsed = response as typeof response & {
      output_parsed?: z.infer<typeof evidenceResponseSchema> | null;
    };

    return normalizeEvidence(parsed.output_parsed?.signals ?? [], lens);
  }

  private async synthesize(input: SignalsInput, evidence: SignalEvidence[]) {
    const completion = await this.client.beta.chat.completions.parse({
      model: this.model,
      temperature: 0.15,
      messages: [
        {
          role: "system",
          content: buildSynthesisSystemPrompt(),
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              instruction:
                "Analiza solo estas senales base. Rankea mentalmente por utilidad para Ideacion y produce obligatoriamente exactamente 2 gaps y exactamente 2 insights. Si la evidencia es floja, usa baseEvidencia indirecta; no dejes vacio.",
              diagnosis: input.ideationInput.diagnosis,
              registration: input.registration,
              memory: input.ideationInput.memory,
              evidence,
            },
            null,
            2,
          ),
        },
      ],
      response_format: zodResponseFormat(
        signalsSynthesisForAiSchema,
        "signals_synthesis",
      ),
    });

    const parsed = completion.choices[0]?.message.parsed;

    if (!parsed) {
      throw new Error("OpenAI no devolvio sintesis valida para Senales");
    }

    return parsed;
  }

  private buildSearchLocation(input: SignalsInput) {
    const countries = [
      input.registration.contextForDiagnosis.profileLicense.country,
      ...input.registration.contextForDiagnosis.company.operatingCountries,
    ]
      .join(" ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    if (countries.includes("mexico")) {
      return { type: "approximate" as const, country: "MX", timezone: "America/Mexico_City" };
    }

    if (countries.includes("panama")) {
      return { type: "approximate" as const, country: "PA", timezone: "America/Panama" };
    }

    if (countries.includes("chile")) {
      return { type: "approximate" as const, country: "CL", timezone: "America/Santiago" };
    }

    if (countries.includes("peru")) {
      return { type: "approximate" as const, country: "PE", timezone: "America/Lima" };
    }

    return { type: "approximate" as const, country: "CO", timezone: "America/Bogota" };
  }
}

export class HeuristicSignalsEngine implements SignalsEngine {
  async generate(input: SignalsInput): Promise<SignalsOutput> {
    const category = input.registration.contextForDiagnosis.company.sectorCategory;
    const challenge = input.ideationInput.selectedChallenge;
    const competitor = input.registration.contextForDiagnosis.category.competitors[0];
    const evidence: SignalEvidence[] = [
      {
        id: "sig_1",
        lens: "SOCIAL_LISTENING",
        title: "Voz publica insuficiente para afirmar adopcion",
        observedText:
          "No se ejecuto busqueda real en modo heuristico; la senal queda como vacio a validar.",
        sourceLabel: "Modo heuristico local",
        frictionType: "vacio de voz publica",
        relationToDiagnosis: "El diagnostico no esta contrastado contra usuarios externos.",
        usefulnessForIdeation: "Evita ideas que asuman demanda ya validada.",
        isNegative: true,
        confidence: "LOW",
      },
      {
        id: "sig_2",
        lens: "TREND",
        title: `La categoria ${category} exige evidencia antes de prometer cambio`,
        observedText:
          "La tendencia asumida debe tratarse como presion a validar, no como oportunidad automatica.",
        sourceLabel: "Modo heuristico local",
        frictionType: "presion de categoria no validada",
        relationToDiagnosis: "El reto puede depender de una presion externa todavia no demostrada.",
        usefulnessForIdeation: "Obliga a crear ideas que produzcan evidencia temprana.",
        isNegative: false,
        confidence: "LOW",
      },
      {
        id: "sig_3",
        lens: "COMPETITOR",
        title: `Competidor declarado: ${competitor?.name ?? "sin competidor"}`,
        observedText:
          "La promesa visible del competidor debe contrastarse contra friccion publica antes de usarla como insight.",
        sourceLabel: competitor?.website ?? "Modo heuristico local",
        sourceUrl: competitor?.website,
        frictionType: "promesa competitiva sin contraste",
        relationToDiagnosis: "La promesa visible del competidor puede estar ocultando la misma friccion.",
        usefulnessForIdeation: "Fuerza a idear contra promesas incumplidas, no contra claims.",
        isNegative: true,
        confidence: "LOW",
      },
    ];

    return signalsOutputSchema.parse({
      searchDepth: "standard",
      generatedAt: new Date().toISOString(),
      analisisSocialListening: {
        summary:
          "Modo heuristico: no hay social listening real. Esto debe bloquear conclusiones fuertes sobre voz publica.",
        findings: [evidence[0].observedText],
        evidenceIds: ["sig_1"],
        limitations: ["Configura OPENAI_API_KEY para busqueda web real."],
      },
      analisisTendencias: {
        summary:
          "La categoria puede estar presionada por necesidad de evidencia, pero en modo local no se valida con fuentes externas.",
        findings: [evidence[1].observedText],
        evidenceIds: ["sig_2"],
        limitations: ["Tendencia no verificada con fuentes publicas."],
      },
      analisisCompetidores: {
        summary:
          "Los competidores declarados sirven como punto de busqueda, no como evidencia suficiente.",
        findings: [evidence[2].observedText],
        evidenceIds: ["sig_3"],
        limitations: ["Falta contraste publico de promesa versus friccion."],
      },
      gaps: [
        {
          title: "Brecha entre reto diagnosticado y evidencia externa",
          summary:
            "El reto no debe pasar a Ideacion como verdad hasta contrastar senales publicas reales.",
          contradiction:
            "El diagnostico puede estar bien formulado internamente, pero aun no esta probado contra mercado.",
          evidenceIds: ["sig_1", "sig_2"],
          evidenceBase: "indirecta",
          implicationForIdeation:
            "Ideacion debe evitar ideas que dependan de una demanda externa no verificada.",
        },
        {
          title: "Brecha entre promesa competitiva y friccion observable",
          summary:
            "El competidor declarado no basta como referencia; hay que contrastar su promesa contra fricciones publicas.",
          contradiction:
            "Copiar claims competitivos puede repetir una promesa que el mercado no valida.",
          evidenceIds: ["sig_3"],
          evidenceBase: "indirecta",
          implicationForIdeation:
            "Ideacion debe buscar mecanismos que prueben confianza y ejecucion, no solo mensajes mejores.",
        },
      ],
      insights: [
        {
          title: "La ausencia de evidencia tambien es criterio",
          summary:
            "Si no aparece voz publica defendible, la primera idea no debe asumir que el mercado ya reconoce el dolor.",
          actionableTruth:
            "La ideacion debe crear mecanismos que produzcan evidencia temprana, no solo soluciones completas.",
          evidenceIds: ["sig_1"],
          evidenceBase: "indirecta",
          ideationPrompt:
            `Que idea permite probar ${challenge} sin asumir que el mercado ya lo entiende?`,
        },
        {
          title: "La promesa no es diferenciacion hasta que supera friccion",
          summary:
            "Una idea util debe atacar la friccion que impide creer, comprar o ejecutar, no solo formular una oferta mas clara.",
          actionableTruth:
            "La ideacion debe convertir la friccion en una prueba observable de confianza.",
          evidenceIds: ["sig_2", "sig_3"],
          evidenceBase: "indirecta",
          ideationPrompt:
            `Que idea demuestra ${challenge} antes de pedir adopcion completa?`,
        },
      ],
      memoriaEmpresa: input.ideationInput.memory,
      internal: {
        fuentesConsultadas: evidence.map((signal) => signal.sourceLabel),
        senalesBase: evidence,
        vaciosDeEvidencia: [
          "Busqueda web real no ejecutada en modo heuristico.",
        ],
      },
    });
  }
}

class MissingOpenAiSignalsEngine implements SignalsEngine {
  async generate(): Promise<SignalsOutput> {
    throw new Error(
      "OPENAI_API_KEY es requerido para Senales porque la fase debe usar busqueda web real.",
    );
  }
}

function buildSearchSystemPrompt(lens: SignalLens) {
  const shared = [
    "Eres la etapa de busqueda real de Senales de Nucleo.",
    "Debes buscar fuentes publicas reales y devolver solo evidencia textual util para construir 2 gaps y 2 insights.",
    "No inventes datos, fuentes, URLs, competidores ni comportamientos.",
    "Busca primero senales negativas: quejas, fricciones, miedos, reclamos, abandono, ratings bajos, costos ocultos o promesas incumplidas.",
    "No hagas investigacion general ni resumen de mercado.",
    "No conviertas hallazgos en ideas. Solo devuelve evidencia publica resumida.",
    "Cada senal debe decir tipoDeFriccion, relacionConDiagnostico y porQueImportaParaIdeacion.",
  ];

  if (lens === "SOCIAL_LISTENING") {
    shared.push(
      "Este lente es social listening: solo cuenta voz textual de usuarios, clientes, compradores u operadores.",
      "Blogs, prensa corporativa, paginas SEO y comunicados no cuentan como social listening.",
      "Busca resenas, foros, Reddit/Quora, marketplaces, app stores, quejas, reclamos, FAQs y soporte publico.",
      "Prioriza busquedas con palabras como: queja, reclamo, resena baja, no funciona, caro, dificil, demorado, soporte, abandono, promesa incumplida.",
    );
  }

  if (lens === "TREND") {
    shared.push(
      "Este lente es tendencias: prioriza reportes fechados, reguladores, asociaciones, sitios oficiales y noticias sectoriales.",
      "Una tendencia positiva no debe presentarse como gap ni oportunidad por si sola.",
      "Busca presiones externas: regulacion, costos crecientes, cambios de comprador, exigencias nuevas, adopcion lenta, riesgo operativo.",
    );
  }

  if (lens === "COMPETITOR") {
    shared.push(
      "Este lente es competidores: analiza promesa visible versus friccion evidenciada.",
      "Usa webs declaradas, claims, precios, garantias, casos, FAQs, onboarding y fricciones publicas asociadas.",
      "Busca la contradiccion entre lo que prometen y lo que parece dificil, condicionado, costoso o no probado.",
    );
  }

  return shared.join(" ");
}

function buildSearchUserPrompt(input: SignalsInput, lens: SignalLens) {
  const context = input.registration.contextForDiagnosis;
  const competitors = context.category.competitors
    .map((competitor) => `${competitor.name} ${competitor.website}`)
    .join(" | ");

  return [
    `Lente a buscar: ${lens}`,
    `Categoria: ${context.company.sectorCategory}`,
    `Cliente: ${context.company.sellsTo}`,
    `Modelo de cobro: ${context.company.revenueModel}`,
    `Paises/regiones: ${context.company.operatingCountries.join(", ") || context.profileLicense.country}`,
    `Competidores declarados: ${competitors || "No informados"}`,
    `Notas categoria: ${context.category.notes ?? "No informadas"}`,
    `Reto diagnosticado: ${input.ideationInput.selectedChallenge}`,
    `Causas: ${input.ideationInput.diagnosis.causes.join(" | ")}`,
    `Tensiones: ${input.ideationInput.diagnosis.tensions.join(" | ")}`,
    `Restricciones: ${input.ideationInput.diagnosis.restrictions.join(" | ")}`,
    `No conviene atacar todavia: ${input.ideationInput.diagnosis.notWorthAttackingYet.join(" | ")}`,
    "",
    "Objetivo: encontrar evidencia que rompa, corrija o afine el diagnostico para ideacion.",
    "Devuelve maximo 5 senales. Prefiere menos senales, pero mas utiles.",
  ].join("\n");
}

function buildSynthesisSystemPrompt() {
  return [
    "Eres la etapa de analisis de Senales de Nucleo.",
    "Tu trabajo es convertir evidencia publica en exactamente 2 gaps y exactamente 2 insights para Ideacion.",
    "No diagnostiques de nuevo y no propongas ideas.",
    "No seas optimista por defecto ni conviertas todo en oportunidad.",
    "Si el mercado contradice al usuario o debilita el diagnostico, dilo.",
    "Un gap exige contradiccion o friccion no resuelta.",
    "Un insight debe ser una verdad accionable, no un resumen.",
    "Competidores deben analizar promesa visible versus friccion evidenciada.",
    "Debes entregar exactamente 2 gaps y 2 insights. Si la evidencia es debil, marca evidenceBase como indirecta.",
    "Prioriza: contradiccion con diagnostico, friccion negativa, impacto en compra/adopcion/ejecucion, competidor/categoria, tension interna.",
    "Todo gap e insight debe referenciar evidenceIds existentes.",
  ].join(" ");
}

function normalizeEvidence(
  signals: EvidenceWithoutId[],
  lens: SignalLens,
): Omit<SignalEvidence, "id">[] {
  return signals
    .filter((signal) => signal.lens === lens)
    .filter((signal) =>
      lens === "SOCIAL_LISTENING" ? Boolean(signal.sourceUrl) : true,
    )
    .map((signal) => ({
      ...signal,
      sourceUrl: signal.sourceUrl || undefined,
      sourceDate: signal.sourceDate || undefined,
      query: signal.query || undefined,
      confidence:
        signal.confidence === "HIGH" && !signal.sourceUrl
          ? "MEDIUM"
          : signal.confidence,
    }));
}

function rankEvidence(signals: Omit<SignalEvidence, "id">[]) {
  const lensWeight: Record<SignalLens, number> = {
    SOCIAL_LISTENING: 3,
    COMPETITOR: 2,
    TREND: 1,
  };

  return signals
    .map((signal) => ({
      signal,
      rank:
        lensWeight[signal.lens] +
        (signal.isNegative ? 3 : 0) +
        (signal.confidence === "HIGH" ? 3 : signal.confidence === "MEDIUM" ? 2 : 1) +
        (signal.relationToDiagnosis.length > 40 ? 1 : 0) +
        (signal.usefulnessForIdeation.length > 40 ? 1 : 0),
    }))
    .sort((a, b) => b.rank - a.rank)
    .map(({ signal }) => signal);
}

export function createSignalsEngine() {
  const useFake = process.env.NUCLEO_FAKE_AI === "true";
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (useFake) {
    return new HeuristicSignalsEngine();
  }

  if (!apiKey) {
    return new MissingOpenAiSignalsEngine();
  }

  return new OpenAiSignalsEngine({
    apiKey,
    model:
      process.env.OPENAI_SIGNALS_MODEL?.trim() ||
      process.env.OPENAI_MODEL?.trim() ||
      "gpt-4.1-mini",
  });
}
