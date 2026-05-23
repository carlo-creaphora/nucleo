import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import {
  type SignalEvidence,
  type SignalLens,
  type SignalsInput,
  type SignalsOutput,
  signalGapSynthesisForAiSchema,
  signalEvidenceForAiSchema,
  signalInsightSynthesisForAiSchema,
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
      this.searchLens(input, "CUSTOMER_INSIGHT"),
    ]);
    const senalesBase = rankEvidence(searchResults.flat()).map((signal, index) => ({
      ...signal,
      id: `sig_${index + 1}`,
    }));
    const gapSynthesis = await this.synthesizeGaps(input, senalesBase);
    const insightSynthesis = await this.synthesizeInsights(
      input,
      senalesBase,
      gapSynthesis.gaps,
    );
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
      ["CUSTOMER_INSIGHT", "No se encontraron senales defendibles de motivaciones del comprador."],
    ] as const;

    return signalsOutputSchema.parse({
      ...gapSynthesis,
      ...insightSynthesis,
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

  private async synthesizeGaps(input: SignalsInput, evidence: SignalEvidence[]) {
    const completion = await this.client.beta.chat.completions.parse({
      model: this.model,
      temperature: 0.15,
      messages: [
        {
          role: "system",
          content: buildGapSynthesisSystemPrompt(),
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              instruction:
                "Analiza solo estas senales base de mercado. Produce exactamente 2 gaps. GAP = diferencia entre estado actual de la empresa y potencial/expectativa/movimiento del mercado.",
              diagnosis: input.ideationInput.diagnosis,
              registration: input.registration,
              buyer: inferBuyer(input),
              bannedParaphraseSource:
                "No repitas coordinacion operativa, estandarizacion, falta de personal, diferencias normativas o tensiones internas salvo como estadoActualEmpresa; el valor debe venir del mercado o del cliente.",
              memory: input.ideationInput.memory,
              evidence: evidence.filter((signal) => signal.lens !== "CUSTOMER_INSIGHT"),
            },
            null,
            2,
          ),
        },
      ],
      response_format: zodResponseFormat(
        signalGapSynthesisForAiSchema,
        "signals_gap_synthesis",
      ),
    });

    const parsed = completion.choices[0]?.message.parsed;

    if (!parsed) {
      throw new Error("OpenAI no devolvio gaps validos para Senales");
    }

    return parsed;
  }

  private async synthesizeInsights(
    input: SignalsInput,
    evidence: SignalEvidence[],
    gaps: unknown,
  ) {
    const customerEvidence = evidence.filter(
      (signal) => signal.lens === "CUSTOMER_INSIGHT",
    );
    const fallbackEvidence = customerEvidence.length ? customerEvidence : evidence;
    const completion = await this.client.beta.chat.completions.parse({
      model: this.model,
      temperature: 0.18,
      messages: [
        {
          role: "system",
          content: buildInsightSynthesisSystemPrompt(),
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              instruction:
                "Produce exactamente 2 insights desde evidencia del comprador. No resumas gaps. No repitas mercado, costos ocultos, incumplimiento o desconfianza como insight si ya aparecen en gaps. El insight debe revelar que intenta proteger, conseguir, justificar o evitar el cliente.",
              buyer: inferBuyer(input),
              declaredCustomer: input.registration.contextForDiagnosis.company.sellsTo,
              category: input.registration.contextForDiagnosis.company.sectorCategory,
              gaps,
              evidence: fallbackEvidence,
            },
            null,
            2,
          ),
        },
      ],
      response_format: zodResponseFormat(
        signalInsightSynthesisForAiSchema,
        "signals_insight_synthesis",
      ),
    });

    const parsed = completion.choices[0]?.message.parsed;

    if (!parsed) {
      throw new Error("OpenAI no devolvio insights validos para Senales");
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
      {
        id: "sig_4",
        lens: "CUSTOMER_INSIGHT",
        title: "El comprador protege su exposicion ante terceros",
        observedText:
          "En modo heuristico, el insight se modela como una hipotesis de comprador, no como evidencia real.",
        sourceLabel: "Modo heuristico local",
        frictionType: "riesgo reputacional del comprador",
        relationToDiagnosis: "La compra depende de reducir exposicion del decisor ante terceros.",
        usefulnessForIdeation: "Obliga a disenar pruebas defendibles para el comprador, no solo mejoras operativas.",
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
          estadoActualEmpresa:
            "El reto no debe pasar a Ideacion como verdad hasta contrastar senales publicas reales.",
          potencialMercado:
            "El mercado puede estar exigiendo pruebas visibles de confiabilidad antes de comprar o adoptar.",
          brecha:
            "El diagnostico puede estar bien formulado internamente, pero aun no esta probado contra mercado.",
          evidenciaMercado:
            "En modo heuristico no hay evidencia publica real; se marca como base indirecta.",
          evidenceIds: ["sig_1", "sig_2"],
          evidenceBase: "indirecta",
          implicationForIdeation:
            "Ideacion debe evitar ideas que dependan de una demanda externa no verificada.",
        },
        {
          title: "Brecha entre promesa competitiva y friccion observable",
          estadoActualEmpresa:
            "El competidor declarado no basta como referencia; hay que contrastar su promesa contra fricciones publicas.",
          potencialMercado:
            "El mercado premia ofertas que reducen incertidumbre visible para el comprador, no solo claims.",
          brecha:
            "Copiar claims competitivos puede repetir una promesa que el mercado no valida.",
          evidenciaMercado:
            "En modo heuristico no hay contraste publico de promesa versus friccion.",
          evidenceIds: ["sig_3"],
          evidenceBase: "indirecta",
          implicationForIdeation:
            "Ideacion debe buscar mecanismos que prueben confianza y ejecucion, no solo mensajes mejores.",
        },
      ],
      insights: [
        {
          title: "La ausencia de evidencia tambien es criterio",
          cliente: input.registration.contextForDiagnosis.company.sellsTo,
          comportamientoObservado:
            "El comprador tiende a pedir evidencia que pueda defender ante terceros antes de aceptar una promesa de mejora.",
          motivacionODeseo:
            "Quiere reducir exposicion personal, politica o reputacional si la solucion falla.",
          verdadAccionable:
            "La idea debe darle al comprador una prueba defendible, no solo una mejora funcional.",
          evidenceIds: ["sig_4"],
          evidenceBase: "indirecta",
          promptParaIdeacion:
            `Que idea permite probar ${challenge} sin asumir que el mercado ya lo entiende?`,
        },
        {
          title: "La promesa no es diferenciacion hasta que supera friccion",
          cliente: input.registration.contextForDiagnosis.company.sellsTo,
          comportamientoObservado:
            "Cuando el cambio aumenta riesgo de reclamos o perdida de control, el comprador prefiere tolerar una solucion mediocre.",
          motivacionODeseo:
            "Busca continuidad, control y trazabilidad para justificar la decision si aparece un reclamo.",
          verdadAccionable:
            "La idea debe bajar el riesgo percibido de cambiar, no solo prometer un resultado mejor.",
          evidenceIds: ["sig_4"],
          evidenceBase: "indirecta",
          promptParaIdeacion:
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
    "No busques soporte para el diagnostico interno; busca comportamiento del comprador y potencial del mercado que la empresa no esta capturando.",
    "No inventes datos, fuentes, URLs, competidores ni comportamientos.",
    "Busca primero senales negativas: quejas, fricciones, miedos, reclamos, abandono, ratings bajos, costos ocultos o promesas incumplidas.",
    "No hagas investigacion general ni resumen de mercado.",
    "No conviertas hallazgos en ideas. Solo devuelve evidencia publica resumida.",
    "Cada senal debe decir tipoDeFriccion, relacionConDiagnostico y porQueImportaParaIdeacion.",
    "La evidencia debe venir del mercado, clientes, compradores, usuarios, reguladores, competidores o categoria; no de repetir el problema interno.",
  ];

  if (lens === "SOCIAL_LISTENING") {
    shared.push(
      "Este lente es social listening: solo cuenta voz textual de usuarios, clientes, compradores u operadores.",
      "Blogs, prensa corporativa, paginas SEO y comunicados no cuentan como social listening.",
      "Busca resenas, foros, Reddit/Quora, marketplaces, app stores, quejas, reclamos, FAQs y soporte publico.",
      "Prioriza busquedas con palabras como: queja, reclamo, resena baja, no funciona, caro, dificil, demorado, soporte, abandono, promesa incumplida.",
      "Encuentra que temen, evitan o desean los compradores/usuarios declarados.",
    );
  }

  if (lens === "TREND") {
    shared.push(
      "Este lente es tendencias: prioriza reportes fechados, reguladores, asociaciones, sitios oficiales y noticias sectoriales.",
      "Una tendencia positiva no debe presentarse como gap ni oportunidad por si sola.",
      "Busca presiones externas: regulacion, costos crecientes, cambios de comprador, exigencias nuevas, adopcion lenta, riesgo operativo.",
      "Encuentra hacia donde se esta moviendo el mercado y que expectativa nueva crea para el comprador.",
    );
  }

  if (lens === "COMPETITOR") {
    shared.push(
      "Este lente es competidores: analiza promesa visible versus friccion evidenciada.",
      "Usa webs declaradas, claims, precios, garantias, casos, FAQs, onboarding y fricciones publicas asociadas.",
      "Busca la contradiccion entre lo que prometen y lo que parece dificil, condicionado, costoso o no probado.",
      "Encuentra potencial de mercado en claims, funcionalidades, casos, garantias, SLA, digitalizacion, trazabilidad o reduccion de riesgo.",
    );
  }

  if (lens === "CUSTOMER_INSIGHT") {
    shared.push(
      "Este lente es exclusivo para insights del comprador. No busques gaps de mercado ni promesas de competidores.",
      "Busca motivaciones, deseos, verdades incomodas, riesgos politicos, miedo reputacional, criterios de compra, aversion al cambio, necesidad de control y rituales de decision.",
      "La evidencia debe explicar que intenta proteger, conseguir, justificar o evitar el comprador declarado.",
      "Busca frases y patrones como: vendor selection criteria, switching provider risk, approval process, tenant complaints, liability, board approval, maintenance reporting, control, accountability.",
      "Para administradores de edificios o centros comerciales, prioriza residentes, arrendatarios, comites, juntas, gerencia, reclamos, continuidad operativa y exposicion del administrador.",
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
    `Comprador/cliente declarado: ${context.company.sellsTo}`,
    `Comprador inferido para busqueda: ${inferBuyer(input)}`,
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
    "Objetivo: encontrar la diferencia entre el estado actual de la empresa y el potencial del mercado, y descubrir comportamiento/motivacion/deseo del comprador.",
    "No devuelvas causas internas que ya declaro el perfil como si fueran senales.",
    lens === "CUSTOMER_INSIGHT"
      ? "Para este lente, busca solo motivaciones, deseos, verdades ocultas, temores, criterios de decision y riesgos percibidos del comprador."
      : "Para este lente, busca potencial de mercado, fricciones externas, promesas competitivas o expectativas nuevas.",
    "Devuelve maximo 5 senales. Prefiere menos senales, pero mas utiles.",
  ].join("\n");
}

function buildGapSynthesisSystemPrompt() {
  return [
    "Eres la etapa de analisis de Senales de Nucleo.",
    "Tu trabajo es convertir evidencia publica en exactamente 2 gaps para Ideacion.",
    "No diagnostiques de nuevo y no propongas ideas.",
    "No seas optimista por defecto ni conviertas todo en oportunidad.",
    "Si el mercado contradice al usuario o debilita el diagnostico, dilo.",
    "Un gap debe comparar estadoActualEmpresa contra potencialMercado; no puede ser solo una causa interna.",
    "Si una frase podria salir solo del diagnostico, rechazala y formula desde mercado/cliente.",
    "Competidores deben analizar promesa visible versus friccion evidenciada.",
    "Debes entregar exactamente 2 gaps. Si la evidencia es debil, marca evidenceBase como indirecta.",
    "Prioriza: potencial de mercado, expectativa nueva del comprador, friccion negativa, comportamiento de compra/adopcion, promesa competitiva incumplida.",
    "Todo gap e insight debe referenciar evidenceIds existentes.",
  ].join(" ");
}

function buildInsightSynthesisSystemPrompt() {
  return [
    "Eres la etapa de insight de comprador de Nucleo.",
    "Tu trabajo es producir exactamente 2 insights para Ideacion desde evidencia del comprador o cliente declarado.",
    "No produzcas gaps. No describas el mercado. No repitas promesas competitivas ni fricciones externas como insight.",
    "Un insight debe revelar comportamiento, motivacion, miedo, deseo, criterio de compra, costo politico, ritual de decision o tension oculta del comprador.",
    "El insight debe responder que intenta proteger, conseguir, justificar o evitar el comprador.",
    "Si un gap habla de costos ocultos, incumplimiento o desconfianza, el insight debe ir a una capa distinta: temor reputacional, aprobacion ante terceros, continuidad operativa, aversion al cambio, deseo de control, necesidad de prueba o trazabilidad defendible.",
    "No uses la misma frase, causa o fenomeno central de los gaps. Si se parece al gap, rehazlo desde motivacion del comprador.",
    "Cada insight debe referenciar evidenceIds existentes.",
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
    CUSTOMER_INSIGHT: 4,
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

function inferBuyer(input: SignalsInput) {
  const context = input.registration.contextForDiagnosis;
  const text = [
    context.company.sectorCategory,
    context.company.sellsTo,
    context.category.notes ?? "",
    input.ideationInput.selectedChallenge,
  ]
    .join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (text.includes("ascensor") || text.includes("elevator")) {
    return "administradores de edificios, property managers, facility managers, comites de copropiedad y responsables de mantenimiento";
  }

  if (text.includes("b2b")) {
    return "compradores empresariales, usuarios operadores, decisores de area y responsables de implementar el servicio";
  }

  return context.company.sellsTo;
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
