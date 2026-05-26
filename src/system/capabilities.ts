export function buildSystemCapabilities() {
  const defaultModel = process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";

  return {
    ok: true,
    service: "nucleo",
    phases: {
      registration: "ready",
      diagnosis: "ready",
      signals: "ready",
      ideation: "ready",
      evaluation: "ready",
      prototype: "ready",
      results: "ready",
      evidenceReading: "ready",
      playbook: "ready",
      cycleMemory: "ready",
    },
    ai: {
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
      modelPolicy: "OPENAI_API_KEY required; no heuristic engine for AI phases.",
      models: {
        default: defaultModel,
        registration: process.env.OPENAI_REGISTRATION_MODEL?.trim() || defaultModel,
        diagnosis: defaultModel,
        signals: process.env.OPENAI_SIGNALS_MODEL?.trim() || defaultModel,
        ideation: process.env.OPENAI_IDEATION_MODEL?.trim() || defaultModel,
        prototype: process.env.OPENAI_PROTOTYPE_MODEL?.trim() || defaultModel,
        results: process.env.OPENAI_RESULTS_MODEL?.trim() || defaultModel,
        playbook: process.env.OPENAI_PLAYBOOK_MODEL?.trim() || defaultModel,
      },
    },
    storage: {
      databaseId: process.env.NUCLEO_DB_ID ?? "local-file",
    },
    contracts: [
      "masterCycleState",
      "traceability",
      "methodologicalRoute",
      "playbook",
      "cycleMemory",
      "antiOptimism",
    ],
    governance: {
      cycleClosure:
        "El ciclo se cierra al guardar memoria con una ruta metodologica final.",
      antiOptimism:
        "La plataforma no bloquea aprendizaje; bloquea optimismo injustificado.",
    },
  };
}
