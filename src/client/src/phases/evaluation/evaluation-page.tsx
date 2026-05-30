import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import {
  useAppState,
  type EvaluationScoreKey,
  type EvaluationScores,
  type IdeationIdea,
  type IdeationSet,
} from "../../app-state.js";
import { Button } from "../../components/ui/button.js";
import { Card, SectionLabel } from "../../components/ui/card.js";
import {
  classifyPrototypeIdea,
  savePrototypeClassification,
} from "./evaluation-api.js";

type EvaluationEntry = {
  id: string;
  idea: IdeationIdea;
  index: number;
  scores: EvaluationScores;
  set: IdeationSet;
  total: number;
};

const evaluationCriteria: Array<{
  description: string;
  key: EvaluationScoreKey;
  label: string;
}> = [
  {
    description: "Si funciona, cuánto mejora el negocio o la experiencia.",
    key: "potential",
    label: "Potencial",
  },
  {
    description: "Qué tan distinto es frente a la respuesta normal del sector.",
    key: "differentiation",
    label: "Diferenciación",
  },
  {
    description: "Qué tanto respeta restricciones operativas, comerciales y culturales.",
    key: "restrictionFit",
    label: "Fit restricciones",
  },
  {
    description: "Qué tan fácil es probarlo con tiempo y recursos razonables.",
    key: "costTime",
    label: "Costo/tiempo",
  },
  {
    description: "Si puede pilotearse sin poner en riesgo clientes críticos.",
    key: "riskControl",
    label: "Riesgo controlable",
  },
  {
    description: "Si puede entregar una señal clara en un ciclo corto.",
    key: "validability",
    label: "Validabilidad",
  },
  {
    description: "Cuánto aprendizaje deja incluso si la idea no avanza.",
    key: "learning",
    label: "Aprendizaje",
  },
];

export function EvaluationPage() {
  const {
    cycleId,
    diagnosis,
    evaluationConfirmed,
    evaluationScores,
    evaluationWinnerId,
    ideationSets,
    prototypeClassification,
    setActivePhaseId,
    setEvaluationConfirmed,
    setEvaluationScores,
    setEvaluationWinnerId,
    setPrototypeClassification,
    setPrototypeIdeaType,
    signals,
  } = useAppState();
  const [status, setStatus] = useState<"idle" | "classifying">("idle");
  const [error, setError] = useState<string | null>(null);

  const selectedIdeas = useMemo(() => getSelectedIdeas(ideationSets), [ideationSets]);

  useEffect(() => {
    const selectedIds = new Set(selectedIdeas.map((entry) => entry.id));
    const nextScores: Record<string, EvaluationScores> = {};

    selectedIdeas.forEach((entry) => {
      nextScores[entry.id] = evaluationScores[entry.id] ?? emptyScores();
    });

    const sameIds =
      Object.keys(evaluationScores).length === selectedIds.size &&
      Object.keys(evaluationScores).every((id) => selectedIds.has(id));

    if (!sameIds) {
      setEvaluationScores(nextScores);
      setEvaluationConfirmed(false);
      setEvaluationWinnerId(null);
      setPrototypeClassification(null);
      setPrototypeIdeaType(null);
    }
  }, [
    evaluationScores,
    selectedIdeas,
    setEvaluationConfirmed,
    setEvaluationScores,
    setEvaluationWinnerId,
    setPrototypeClassification,
    setPrototypeIdeaType,
  ]);

  const rankedIdeas = useMemo(
    () =>
      selectedIdeas
        .map((entry, index) => {
          const scores = evaluationScores[entry.id] ?? emptyScores();
          return {
            ...entry,
            index,
            scores,
            total: scoreTotal(scores),
          };
        })
        .sort(rankIdeas),
    [evaluationScores, selectedIdeas],
  );

  const winner = evaluationWinnerId
    ? (rankedIdeas.find((entry) => entry.id === evaluationWinnerId) ?? rankedIdeas[0])
    : rankedIdeas[0];
  const runnerUp = rankedIdeas.find((entry) => entry.id !== winner?.id) ?? null;
  const isComplete =
    selectedIdeas.length > 0 &&
    selectedIdeas.every((entry) =>
      evaluationCriteria.every(
        ({ key }) => Number(evaluationScores[entry.id]?.[key] ?? 0) > 0,
      ),
    );
  const topScoreTie =
    isComplete &&
    rankedIdeas.length > 1 &&
    rankedIdeas.filter((entry) => entry.total === rankedIdeas[0]?.total).length >
      1;

  const updateScore = (
    ideaId: string,
    key: EvaluationScoreKey,
    value: number,
  ) => {
    setEvaluationScores({
      ...evaluationScores,
      [ideaId]: {
        ...(evaluationScores[ideaId] ?? emptyScores()),
        [key]: value,
      },
    });
    setEvaluationConfirmed(false);
    setEvaluationWinnerId(null);
    setPrototypeClassification(null);
    setPrototypeIdeaType(null);
  };

  const confirmScores = async () => {
    if (!isComplete || !winner || topScoreTie) return;
    setStatus("classifying");
    setError(null);
    try {
      const classification = await classifyPrototypeIdea({
        diagnosis,
        idea: winner.idea,
        signals,
      });
      await savePrototypeClassification({
        classification,
        cycleId,
        ideaId: winner.id,
      });
      setEvaluationConfirmed(true);
      setEvaluationWinnerId(winner.id);
      setPrototypeIdeaType(classification.ideaType);
      setPrototypeClassification({ ...classification, ideaId: winner.id });
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : "No se pudo confirmar la evaluación.",
      );
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className="workspace-container">
      <section className="phase-hero">
        <SectionLabel>Evaluación de ideas</SectionLabel>
        <div className="mt-4">
          <div className="max-w-4xl">
            <h1 className="phase-title">
              Puntajes humanos antes de decidir.
            </h1>
            <p className="phase-summary">
              Todas las ideas arrancan en cero. La plataforma solo decide la
              ganadora cuando confirmas todos los criterios.
            </p>
          </div>
        </div>
      </section>

      {error && <Notice>{error}</Notice>}

      {!selectedIdeas.length ? (
        <Card className="p-10 text-center">
          <h2 className="text-xl font-semibold">
            Selecciona ideas en Ideación
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            La evaluación aparece cuando hay al menos una idea marcada para
            evaluar.
          </p>
          <div className="mt-6">
            <Button onClick={() => setActivePhaseId("ideation")} variant="secondary">
              Volver a Ideación
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <section className="grid gap-5">
            <Card className="p-5">
              <SectionLabel>Criterios</SectionLabel>
              <div className="mt-5 grid gap-4">
                {evaluationCriteria.map((criterion) => (
                  <div
                    className="border-b border-border pb-4 last:border-b-0 last:pb-0"
                    key={criterion.key}
                  >
                    <h3 className="text-base font-extrabold">
                      {criterion.label}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {criterion.description}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <SectionLabel>Matriz de puntajes</SectionLabel>
                  <h2 className="mt-3 text-xl font-semibold">
                    {evaluationConfirmed
                      ? "Puntajes confirmados"
                      : "Califica de 1 a 5"}
                  </h2>
                </div>
                <span className="rounded-full bg-muted px-4 py-2 text-sm font-bold text-stone-700">
                  {evaluationConfirmed && winner
                    ? `Ganadora: ${displayIdeaName(winner.idea)}`
                    : topScoreTie
                      ? "Empate pendiente"
                    : "Pendiente de confirmación"}
                </span>
              </div>
              {topScoreTie && (
                <div className="mt-5 rounded-[18px] border border-amber-200 bg-amber-50 px-5 py-4">
                  <p className="text-sm font-semibold text-amber-900">
                    Hay empate en el puntaje mayor. Ajusta al menos un criterio
                    para desempatar antes de confirmar la idea ganadora.
                  </p>
                </div>
              )}
              <div className="mt-6 grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
                {rankedIdeas.map((entry) => (
                  <EvaluationIdeaCard
                    entry={entry}
                    key={entry.id}
                    updateScore={updateScore}
                  />
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 xl:flex-row xl:items-center xl:justify-between">
                <p className="text-sm font-semibold text-muted-foreground">
                  {evaluationConfirmed
                    ? "La decisión está lista para pasar a prototipado."
                    : topScoreTie
                      ? "Hay empate: desempata para que exista una única idea ganadora."
                    : "Completa todos los puntajes para confirmar."}
                </p>
                <Button
                  disabled={
                    evaluationConfirmed ||
                    !isComplete ||
                    topScoreTie ||
                    status === "classifying"
                  }
                  onClick={confirmScores}
                >
                  {status === "classifying" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {evaluationConfirmed ? "Puntajes confirmados" : "Confirmar puntajes"}
                </Button>
              </div>
            </Card>
          </section>

          {evaluationConfirmed && winner && (
            <DecisionCard
              evaluationDecision={prototypeClassification?.evaluationDecision}
              prototypeIdeaType={prototypeClassification?.ideaType}
              prototypeRationale={prototypeClassification?.rationale}
              runnerUp={runnerUp}
              winner={winner}
            />
          )}
          <div className="flex justify-end">
            <Button
              disabled={!evaluationConfirmed || !winner}
              onClick={() => setActivePhaseId("prototype")}
              variant="secondary"
            >
              Pasar a prototipado
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function EvaluationIdeaCard({
  entry,
  updateScore,
}: {
  entry: EvaluationEntry;
  updateScore: (ideaId: string, key: EvaluationScoreKey, value: number) => void;
}) {
  return (
    <article className="rounded-[22px] border border-border bg-surface-raised p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold leading-tight">
            {displayIdeaName(entry.idea)}
          </h3>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {entry.set.route.title} · {entry.idea.source === "user" ? "Manual" : "IA"}
          </p>
        </div>
        <span className="rounded-full bg-black px-3 py-2 text-sm font-bold text-white">
          {entry.total} pts
        </span>
      </div>
      <div className="mt-5 grid gap-3">
        {evaluationCriteria.map((criterion) => (
          <div
            className="flex flex-col gap-2 border-t border-border pt-3"
            key={criterion.key}
          >
            <label className="text-sm font-bold text-stone-800">
              {criterion.label}
            </label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  className={
                    entry.scores[criterion.key] === value
                      ? "h-9 w-9 rounded-full bg-black text-sm font-extrabold text-white"
                      : "h-9 w-9 rounded-full border border-border bg-white text-sm font-extrabold text-stone-700 transition hover:border-black"
                  }
                  key={value}
                  onClick={() => updateScore(entry.id, criterion.key, value)}
                  type="button"
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function DecisionCard({
  evaluationDecision,
  prototypeIdeaType,
  prototypeRationale,
  runnerUp,
  winner,
}: {
  evaluationDecision?: {
    criticalAssumptions: string;
    firstThingToTest: string;
    risksToWatch: string;
  };
  prototypeIdeaType?: string;
  prototypeRationale?: string;
  runnerUp: EvaluationEntry | null;
  winner: EvaluationEntry;
}) {
  const decision =
    evaluationDecision ?? buildFallbackEvaluationDecision(winner, runnerUp);
  const warningNotes = buildEvaluationWarningNotes(winner);

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <SectionLabel>Evaluación cerrada</SectionLabel>
          <h2 className="mt-3 text-xl font-semibold">
            {displayIdeaName(winner.idea)}
          </h2>
        </div>
        <span className="rounded-full bg-black px-4 py-2 text-sm font-bold text-white">
          {winner.total} puntos
        </span>
      </div>
      {warningNotes.length ? (
        <div className="mt-5 grid gap-3">
          {warningNotes.map((note) => (
            <div
              className="rounded-[18px] border border-amber-200 bg-amber-50 px-5 py-4"
              key={note}
            >
              <p className="text-sm font-semibold leading-6 text-amber-900">
                {note}
              </p>
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <DecisionBox
          label="Tipo de prototipo"
          value={
            prototypeIdeaType
              ? `${prototypeIdeaType}. ${prototypeRationale ?? "Clasificación definida por la incertidumbre principal de la idea."}`
              : "Clasificación pendiente."
          }
        />
        <DecisionBox
          label="Idea ganadora"
          value={`Confirmada por puntajes humanos: ${winner.total}/35.`}
        />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <DecisionBox
          label="Supuestos críticos de la idea"
          value={decision.criticalAssumptions}
        />
        <DecisionBox
          label="Qué probar primero"
          value={decision.firstThingToTest}
        />
        <DecisionBox
          label="Riesgos a vigilar"
          value={decision.risksToWatch}
        />
      </div>
    </Card>
  );
}

function DecisionBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-border bg-surface-raised p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-sm leading-6 text-stone-800">{value}</p>
    </div>
  );
}

function Notice({ children }: { children: string }) {
  return (
    <div className="rounded-[18px] border border-red-200 bg-red-50 px-5 py-4 shadow-sm">
      <p className="text-sm font-semibold text-red-800">{children}</p>
    </div>
  );
}

function getSelectedIdeas(sets: IdeationSet[]) {
  return sets.flatMap((set) =>
    set.ideas
      .filter((idea) => idea.selectedForEvaluation)
      .map((idea, index) => ({
        id: idea.id || `${set.id}-idea-${index}`,
        idea,
        index,
        set,
      })),
  );
}

function emptyScores(): EvaluationScores {
  return {
    costTime: 0,
    differentiation: 0,
    learning: 0,
    potential: 0,
    restrictionFit: 0,
    riskControl: 0,
    validability: 0,
  };
}

function scoreTotal(scores: EvaluationScores) {
  return evaluationCriteria.reduce(
    (total, criterion) => total + Number(scores[criterion.key] || 0),
    0,
  );
}

function rankIdeas(left: EvaluationEntry, right: EvaluationEntry) {
  return (
    right.total - left.total ||
    right.scores.validability - left.scores.validability ||
    right.scores.learning - left.scores.learning ||
    right.scores.potential - left.scores.potential ||
    left.index - right.index
  );
}

function displayIdeaName(idea: IdeationIdea) {
  return idea.idea.length > 88 ? `${idea.idea.slice(0, 85)}...` : idea.idea;
}

function buildFallbackEvaluationDecision(
  winner: EvaluationEntry,
  runnerUp: EvaluationEntry | null,
) {
  return {
    criticalAssumptions:
      winner.idea.supuestoQueRompe ||
      "La idea depende de que el cliente valore una señal visible antes de una implementación completa.",
    firstThingToTest:
      winner.idea.primerPasoEjecutable ||
      winner.idea.mecanicaConcreta ||
      "Diseñar una prueba acotada con un segmento y una métrica observable.",
    risksToWatch: buildRiskWatchText(winner, runnerUp),
  };
}

function buildEvaluationWarningNotes(winner: EvaluationEntry) {
  const notes: string[] = [];

  if (winner.scores.differentiation <= 3 && winner.scores.learning <= 3) {
    notes.push(
      `${displayIdeaName(winner.idea)} lidera por puntaje, pero tiene diferenciación y aprendizaje bajos. Es la más ejecutable, pero puede no ser la que más aprende sobre el reto.`,
    );
  }

  const conceptualRisk = conceptualRiskForIdea(winner.idea);
  if (conceptualRisk) {
    notes.push(
      `${displayIdeaName(winner.idea)} tiene una condición de riesgo: ${conceptualRisk}. El ciclo avanza, pero es importante tenerlo en cuenta al construir el artefacto.`,
    );
  }

  return notes;
}

function conceptualRiskForIdea(idea: IdeationIdea) {
  const mechanismText = idea.mecanicaConcreta?.trim() ?? "";

  if (!mechanismText) {
    return "no declara una mecánica observable";
  }

  return null;
}

function buildRiskWatchText(winner: EvaluationEntry, runnerUp: EvaluationEntry | null) {
  const weakCriteria = evaluationCriteria
    .filter((criterion) => winner.scores[criterion.key] <= 2)
    .map((criterion) => criterion.label.toLowerCase());

  const closeRunnerUp =
    runnerUp && winner.total - runnerUp.total <= 2
      ? ` La segunda idea quedó cerca (${runnerUp.total} puntos), así que conviene no sobrerreaccionar a una diferencia mínima.`
      : "";

  if (!weakCriteria.length) {
    return `Vigilar que el piloto no convierta una señal inicial en conclusión fuerte antes de observar comportamiento real.${closeRunnerUp}`;
  }

  return `Vigilar especialmente ${weakCriteria.join(", ")}. La idea gana, pero esos criterios pueden distorsionar la lectura si el piloto se ejecuta sin controles.${closeRunnerUp}`;
}
