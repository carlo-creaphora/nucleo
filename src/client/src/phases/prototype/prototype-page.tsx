import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Boxes, FileText, Loader2, Sparkles } from "lucide-react";
import {
  useAppState,
  type EvaluationScores,
  type IdeationIdea,
  type PrototypeArtifact,
  type PrototypeRoute,
} from "../../app-state.js";
import { Button } from "../../components/ui/button.js";
import { Card, SectionLabel } from "../../components/ui/card.js";
import { TextArea } from "../../components/ui/form-field.js";
import { prototypeMatrix } from "../../../../prototype/matrix.js";
import {
  buildPrototypeArtifact,
  getPrototypeState,
  savePrototypeState,
} from "./prototype-api.js";

type WinnerEntry = {
  id: string;
  idea: IdeationIdea;
  scores: EvaluationScores | null;
  total: number;
};

export function PrototypePage() {
  const {
    cycleId,
    diagnosis,
    evaluationScores,
    evaluationWinnerId,
    ideationSets,
    prototypeArtifact,
    prototypeBuilderValues,
    prototypeClassification,
    prototypeIdeaType,
    prototypeRouteId,
    setActivePhaseId,
    setEvaluationWinnerId,
    setPrototypeArtifact,
    setPrototypeBuilderValues,
    setPrototypeClassification,
    setPrototypeIdeaType,
    setPrototypeRouteId,
    signals,
  } = useAppState();
  const [status, setStatus] = useState<"idle" | "loading" | "building">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSavedPrototype = async () => {
      if (prototypeClassification || prototypeArtifact || status === "loading") return;
      setStatus("loading");
      try {
        const saved = await getPrototypeState(cycleId);
        if (!saved) return;
        setPrototypeClassification(saved.prototypeClassification ?? null);
        setPrototypeIdeaType(saved.prototypeIdeaType ?? null);
        setPrototypeRouteId(saved.prototypeRouteId ?? null);
        setPrototypeBuilderValues(saved.prototypeBuilderValues ?? {});
        setPrototypeArtifact(saved.prototypeArtifact ?? null);
        if (saved.prototypeClassification?.ideaId) {
          setEvaluationWinnerId(saved.prototypeClassification.ideaId);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar Prototipado.",
        );
      } finally {
        setStatus("idle");
      }
    };

    void loadSavedPrototype();
  }, [
    cycleId,
    prototypeArtifact,
    prototypeClassification,
    setEvaluationWinnerId,
    setPrototypeArtifact,
    setPrototypeBuilderValues,
    setPrototypeClassification,
    setPrototypeIdeaType,
    setPrototypeRouteId,
    status,
  ]);

  const availableRoutes = useMemo(
    () =>
      (prototypeMatrix as PrototypeRoute[]).filter(
        (route) => !prototypeIdeaType || route.ideaType === prototypeIdeaType,
      ),
    [prototypeIdeaType],
  );

  const activeRoute = useMemo(() => {
    return (
      availableRoutes.find((route) => route.id === prototypeRouteId) ??
      availableRoutes[0] ??
      null
    );
  }, [availableRoutes, prototypeRouteId]);

  const winner = useMemo(
    () =>
      getWinner({
        evaluationScores,
        evaluationWinnerId: prototypeClassification?.ideaId ?? evaluationWinnerId,
        ideationSets,
      }),
    [evaluationScores, evaluationWinnerId, ideationSets, prototypeClassification],
  );

  useEffect(() => {
    if (!activeRoute || prototypeRouteId === activeRoute.id) return;
    setPrototypeRouteId(activeRoute.id);
  }, [activeRoute, prototypeRouteId, setPrototypeRouteId]);

  const routeValues = activeRoute
    ? (prototypeBuilderValues[activeRoute.id] ?? {})
    : {};

  const updateBuilderValue = (key: string, value: string) => {
    if (!activeRoute) return;
    setPrototypeBuilderValues({
      ...prototypeBuilderValues,
      [activeRoute.id]: {
        ...routeValues,
        [key]: value,
      },
    });
    setPrototypeArtifact(null);
  };

  const persistCurrentState = async (nextArtifact = prototypeArtifact) => {
    await savePrototypeState(cycleId, {
      prototypeArtifact: nextArtifact,
      prototypeBuilderValues,
      prototypeClassification,
      prototypeIdeaType,
      prototypeRouteId: activeRoute?.id ?? prototypeRouteId,
    });
  };

  const generateArtifact = async () => {
    if (!activeRoute || !winner) return;
    setStatus("building");
    setError(null);
    try {
      const artifact = await buildPrototypeArtifact({
        builderValues: collectRouteValues(activeRoute, winner.idea, prototypeBuilderValues),
        cycleId,
        diagnosis,
        evaluationDecision: {
          criticalAssumptions: winner.idea.supuestoQueRompe ?? "",
          firstThingToTest:
            winner.idea.primerPasoEjecutable ??
            winner.idea.mecanicaConcreta ??
            "",
          risksToWatch: buildRiskWatchText(winner),
        },
        idea: winner.idea,
        route: activeRoute,
        signals,
      });
      const nextArtifact = { artifact, routeId: activeRoute.id };
      setPrototypeArtifact(nextArtifact);
      await persistCurrentState(nextArtifact);
    } catch (buildError) {
      setError(
        buildError instanceof Error
          ? buildError.message
          : "No se pudo generar el artefacto.",
      );
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className="workspace-container">
      <section className="phase-hero">
        <SectionLabel>Prototipado rápido</SectionLabel>
        <div className="mt-4">
          <div className="max-w-4xl">
            <h1 className="phase-title">
              Convierte la ganadora en artefacto testeable.
            </h1>
            <p className="phase-summary">
              Núcleo usa el tipo clasificado por IA y solo muestra las dos rutas
              correspondientes. La evidencia se registra después.
            </p>
          </div>
        </div>
      </section>

      {error && <Notice>{error}</Notice>}

      {!winner || !prototypeIdeaType ? (
        <Card className="p-10 text-center">
          <Boxes className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">
            Confirma Evaluación antes de prototipar
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Prototipado requiere una idea ganadora única y una clasificación de
            tipo de idea.
          </p>
          <div className="mt-6">
            <Button onClick={() => setActivePhaseId("evaluation")} variant="secondary">
              Ir a Evaluación
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <PrototypeHero
            activeRoute={activeRoute}
            availableRoutes={availableRoutes}
            ideaType={prototypeIdeaType}
            rationale={prototypeClassification?.rationale}
            setPrototypeArtifact={setPrototypeArtifact}
            setPrototypeRouteId={setPrototypeRouteId}
            winner={winner}
          />

          {activeRoute && (
            <section className="grid gap-5">
              <RouteSummary route={activeRoute} />
              <BuilderCard
                route={activeRoute}
                routeValues={routeValues}
                updateBuilderValue={updateBuilderValue}
                winner={winner}
              />
              <EvidenceCard route={activeRoute} />
              <RiskCard route={activeRoute} />
              <div className="flex justify-end">
                <Button
                  disabled={status === "building"}
                  onClick={generateArtifact}
                >
                  {status === "building" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Generar artefacto
                </Button>
              </div>
              {prototypeArtifact?.routeId === activeRoute.id && (
                <ArtifactCard
                  artifact={prototypeArtifact.artifact}
                  route={activeRoute}
                  setActivePhaseId={setActivePhaseId}
                />
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function PrototypeHero({
  activeRoute,
  availableRoutes,
  ideaType,
  rationale,
  setPrototypeArtifact,
  setPrototypeRouteId,
  winner,
}: {
  activeRoute: PrototypeRoute | null;
  availableRoutes: PrototypeRoute[];
  ideaType: string;
  rationale?: string;
  setPrototypeArtifact: (artifact: ReturnType<typeof useAppState>["prototypeArtifact"]) => void;
  setPrototypeRouteId: (routeId: string | null) => void;
  winner: WinnerEntry;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col items-center px-8 py-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-black text-white shadow-soft">
          <FileText className="h-9 w-9" />
        </div>
        <SectionLabel className="mt-7">{ideaType}</SectionLabel>
        <h2 className="mt-3 max-w-4xl text-3xl font-extrabold leading-tight">
          {displayIdeaName(winner.idea)}
        </h2>
        <p className="mt-4 max-w-4xl text-base font-semibold leading-7 text-stone-600">
          Supuesto que rompe:{" "}
          {winner.idea.supuestoQueRompe || "Supuesto no declarado."}
        </p>
        {rationale && (
          <p className="mt-4 max-w-5xl text-sm leading-7 text-muted-foreground">
            {rationale}
          </p>
        )}
      </div>

      <div className="grid border-t border-border xl:grid-cols-2">
        {availableRoutes.map((route, index) => {
          const active = route.id === activeRoute?.id;
          return (
            <button
              className="group flex min-h-40 gap-5 border-b border-border bg-white px-8 py-7 text-left transition hover:bg-surface-raised xl:border-b-0 xl:border-r xl:last:border-r-0"
              key={route.id}
              onClick={() => {
                setPrototypeRouteId(route.id);
                setPrototypeArtifact(null);
              }}
              type="button"
            >
              <span
                className={
                  active
                    ? "mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white"
                    : "mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-white text-stone-700 group-hover:border-black"
                }
              >
                <ArrowRight className="h-5 w-5" />
              </span>
              <span>
                <strong className="block text-xl font-extrabold leading-tight">
                  Ruta {index + 1} · {route.method}
                  <br />
                  {route.artifact}
                </strong>
                <span className="mt-3 block text-sm leading-6 text-muted-foreground">
                  {route.summary}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function RouteSummary({ route }: { route: PrototypeRoute }) {
  return (
    <section className="grid gap-5 xl:grid-cols-3">
      <ListBlock title="Entregable generado" items={route.output} />
      <ListBlock title="Señales de avance" items={route.advanceSignals} />
      <ListBlock title="Señales de freno" items={route.stopSignals} />
    </section>
  );
}

function BuilderCard({
  route,
  routeValues,
  updateBuilderValue,
  winner,
}: {
  route: PrototypeRoute;
  routeValues: Record<string, string>;
  updateBuilderValue: (key: string, value: string) => void;
  winner: WinnerEntry;
}) {
  return (
    <Card className="p-5">
      <SectionLabel>Constructor en plataforma</SectionLabel>
      <h2 className="mt-3 text-xl font-semibold">Completa lo esencial</h2>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {route.buildFields.map(([label, description]) => {
          const key = fieldKey(label);
          const suggestion = getFieldSuggestion(label, description, winner.idea);
          const value = routeValues[key] ?? suggestion;
          return (
            <label className="grid gap-2" key={key}>
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {label}
              </span>
              <TextArea
                className="min-h-28"
                onChange={(event) => updateBuilderValue(key, event.target.value)}
                placeholder={description}
                value={value}
              />
            </label>
          );
        })}
      </div>
      <p className="mt-5 text-sm font-semibold text-muted-foreground">
        Estos campos alimentan el artefacto. Prototipado no registra evidencia.
      </p>
    </Card>
  );
}

function EvidenceCard({ route }: { route: PrototypeRoute }) {
  return (
    <Card className="p-5">
      <SectionLabel>Alcance de evidencia</SectionLabel>
      <h2 className="mt-3 text-xl font-semibold">{route.evidenceScope.sample}</h2>
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <TextBox label="Qué valida" value={route.evidenceScope.validates} />
        <TextBox label="Qué no valida" value={route.evidenceScope.doesNotValidate} />
      </div>
    </Card>
  );
}

function RiskCard({ route }: { route: PrototypeRoute }) {
  return (
    <section className="grid gap-5 xl:grid-cols-3">
      <TextBlock title="Falso positivo posible" value={route.falsePositive} />
      <TextBlock title="Falso negativo posible" value={route.falseNegative} />
      <ListBlock title="Cómo evitar mala lectura" items={route.avoidMisread} />
    </section>
  );
}

function ArtifactCard({
  artifact,
  route,
  setActivePhaseId,
}: {
  artifact: PrototypeArtifact;
  route: PrototypeRoute;
  setActivePhaseId: (phaseId: "results") => void;
}) {
  const thresholds = artifact.evidenceScope?.thresholds ?? route.evidenceScope.thresholds;
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <SectionLabel>Artefacto listo</SectionLabel>
          <h2 className="mt-3 text-xl font-semibold">{artifact.title}</h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
            {artifact.objective}
          </p>
        </div>
        <span className="rounded-full bg-black px-4 py-2 text-sm font-bold text-white">
          {artifact.artifactType}
        </span>
      </div>

      <div className="mt-6 grid gap-4">
        <ListTextBox label="Cómo usarlo" value={artifact.howToUse} />
        {artifact.artifact.map((item) => (
          <TextBox key={item.label} label={item.label} value={item.content} />
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <TrafficLightBox tone="green" label="Avanzar" value={thresholds.advance} />
        <TrafficLightBox tone="yellow" label="Iterar" value={thresholds.iterate} />
        <TrafficLightBox tone="red" label="Replantear" value={thresholds.rethink} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <ListBlock title="Preguntas de testeo" items={artifact.testQuestions} />
        <TextBlock title="Siguiente paso" value={artifact.nextStep} />
      </div>

      <div className="mt-6 flex justify-end border-t border-border pt-5">
        <Button onClick={() => setActivePhaseId("results")}>
          Registrar resultados
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

function ListBlock({ items, title }: { items: string[]; title: string }) {
  return (
    <Card className="p-6">
      <SectionLabel>Artefacto</SectionLabel>
      <h3 className="mt-3 text-xl font-extrabold">{title}</h3>
      <ul className="mt-4 grid gap-2 text-sm leading-6 text-stone-700">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </Card>
  );
}

function TextBlock({ title, value }: { title: string; value: string }) {
  return (
    <Card className="p-6">
      <SectionLabel>Lectura</SectionLabel>
      <h3 className="mt-3 text-xl font-extrabold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-stone-700">{value}</p>
    </Card>
  );
}

function TextBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-border bg-surface-raised p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-sm leading-6 text-stone-800">{value}</p>
    </div>
  );
}

function ListTextBox({ label, value }: { label: string; value: string }) {
  const items = splitInstructionList(value);
  return (
    <div className="rounded-[20px] border border-border bg-surface-raised p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <ol className="mt-3 grid list-decimal gap-2 pl-5 text-sm leading-6 text-stone-800">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </div>
  );
}

function TrafficLightBox({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "green" | "yellow" | "red";
  value: string;
}) {
  const styles = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700",
    yellow: "border-amber-200 bg-amber-50 text-amber-700",
  }[tone];

  return (
    <div className="rounded-[20px] border border-border bg-white p-5">
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full border ${styles}`} />
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </p>
      </div>
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

function splitInstructionList(value: string) {
  const byLine = value
    .split(/\n+/)
    .map((item) => item.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);

  if (byLine.length > 1) return byLine;

  const bySentence = value
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return bySentence.length ? bySentence : [value];
}

function getWinner({
  evaluationScores,
  evaluationWinnerId,
  ideationSets,
}: {
  evaluationScores: Record<string, EvaluationScores>;
  evaluationWinnerId: string | null;
  ideationSets: ReturnType<typeof useAppState>["ideationSets"];
}): WinnerEntry | null {
  const entries = ideationSets.flatMap((set) =>
    set.ideas
      .filter((idea) => idea.selectedForEvaluation || idea.id === evaluationWinnerId)
      .map((idea) => {
        const scores = evaluationScores[idea.id] ?? null;
        return {
          id: idea.id,
          idea,
          scores,
          total: scores
            ? Object.values(scores).reduce((total, value) => total + value, 0)
            : 0,
        };
      }),
  );

  if (evaluationWinnerId) {
    return entries.find((entry) => entry.id === evaluationWinnerId) ?? null;
  }

  return entries.sort((left, right) => right.total - left.total)[0] ?? null;
}

function fieldKey(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function getFieldSuggestion(
  label: string,
  description: string,
  idea: IdeationIdea,
) {
  const normalized = label.toLowerCase();
  const fallbackByDescription = `${description} ${idea.idea}`.trim();
  if (
    normalized.includes("usuario") ||
    normalized.includes("audiencia") ||
    normalized.includes("cliente") ||
    normalized.includes("comprador")
  ) {
    return "Comprador o aprobador representativo del segmento objetivo.";
  }
  if (normalized.includes("problema") || normalized.includes("dolor")) {
    return idea.supuestoQueRompe || "";
  }
  if (normalized.includes("precio") || normalized.includes("condición")) {
    return idea.metricaQueMueve
      ? `Condicionar avance o pago a ${idea.metricaQueMueve}.`
      : "Condición comercial acotada para probar interés real sin rediseñar todo el modelo.";
  }
  if (normalized.includes("garantía")) {
    return "Garantía limitada al perímetro del piloto y respaldada por evidencia observable del test.";
  }
  if (
    normalized.includes("promesa") ||
    normalized.includes("solución") ||
    normalized.includes("propuesta") ||
    normalized.includes("paquete")
  ) {
    return idea.mecanicaConcreta || idea.idea || "";
  }
  if (normalized.includes("métrica")) return idea.metricaQueMueve || "";
  if (normalized.includes("objeción") || normalized.includes("riesgo")) {
    return idea.antiPatronesAEvitar?.join("\n") ?? "";
  }
  if (normalized.includes("cta") || normalized.includes("cierre") || normalized.includes("siguiente")) {
    return idea.primerPasoEjecutable || "";
  }
  return fallbackByDescription;
}

function collectRouteValues(
  route: PrototypeRoute,
  idea: IdeationIdea,
  valuesByRoute: Record<string, Record<string, string>>,
) {
  const currentValues = valuesByRoute[route.id] ?? {};
  return route.buildFields.reduce<Record<string, string>>((values, [label, description]) => {
    const key = fieldKey(label);
    values[key] = currentValues[key] ?? getFieldSuggestion(label, description, idea);
    return values;
  }, {});
}

function displayIdeaName(idea: IdeationIdea) {
  return idea.idea.length > 96 ? `${idea.idea.slice(0, 93)}...` : idea.idea;
}

function buildRiskWatchText(winner: WinnerEntry) {
  return winner.idea.antiPatronesAEvitar?.length
    ? winner.idea.antiPatronesAEvitar.join(" · ")
    : "Evitar leer agrado declarado como evidencia de validación. Observar conducta, compromiso y fricciones reales.";
}
