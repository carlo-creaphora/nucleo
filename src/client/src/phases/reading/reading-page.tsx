import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Brain } from "lucide-react";
import {
  useAppState,
  type EvidenceReading,
  type MethodologicalOverride,
  type PrototypeClosedQuestion,
  type PrototypeEvidenceMetric,
  type PrototypeRoute,
} from "../../app-state.js";
import { Button } from "../../components/ui/button.js";
import { Card, SectionLabel } from "../../components/ui/card.js";
import { TextArea } from "../../components/ui/form-field.js";
import { prototypeMatrix } from "../../../../prototype/matrix.js";
import { getPrototypeState } from "../prototype/prototype-api.js";
import {
  getResultsState,
  saveResultsState,
} from "../results/results-api.js";

const routeOptions: Array<{
  id: EvidenceReading["methodologicalRoute"];
  title: string;
  description: string;
  action: string;
}> = [
  {
    action: "Avanzar a playbook",
    description:
      "La idea pasa a Playbook solo si la evidencia cumple avance y el riesgo residual es manejable.",
    id: "advance",
    title: "Avanzar",
  },
  {
    action: "Volver a prototipo",
    description:
      "La idea sigue viva, pero requiere ajustar artefacto, muestra, registro o criterio.",
    id: "iterate",
    title: "Iterar o ajustar",
  },
  {
    action: "Volver a ideación",
    description:
      "Se descarta la idea sin matar necesariamente el reto o la señal de partida.",
    id: "discard",
    title: "Descartar idea",
  },
  {
    action: "Volver a diagnóstico",
    description: "La evidencia sugiere que el reto estaba mal definido.",
    id: "invalidate_challenge",
    title: "Invalidar reto",
  },
  {
    action: "Volver a señales",
    description: "La evidencia sugiere que el gap o insight de partida falló.",
    id: "invalidate_signal",
    title: "Invalidar señal",
  },
];

export function ReadingPage() {
  const {
    cycleId,
    evidenceReading,
    ideationSets,
    methodologicalOverride,
    methodologicalRoute,
    prototypeArtifact,
    prototypeClassification,
    prototypeRouteId,
    resultsRecords,
    setActivePhaseId,
    setEvidenceReading,
    setMethodologicalOverride,
    setMethodologicalRoute,
    setPrototypeArtifact,
    setPrototypeBuilderValues,
    setPrototypeClassification,
    setPrototypeIdeaType,
    setPrototypeRouteId,
    setResultsRecords,
  } = useAppState();
  const [error, setError] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState("");

  useEffect(() => {
    const loadContext = async () => {
      try {
        if (!prototypeArtifact && !prototypeRouteId) {
          const prototype = await getPrototypeState(cycleId);
          if (prototype) {
            setPrototypeArtifact(prototype.prototypeArtifact ?? null);
            setPrototypeBuilderValues(prototype.prototypeBuilderValues ?? {});
            setPrototypeClassification(prototype.prototypeClassification ?? null);
            setPrototypeIdeaType(prototype.prototypeIdeaType ?? null);
            setPrototypeRouteId(
              prototype.prototypeRouteId ??
                prototype.prototypeArtifact?.routeId ??
                null,
            );
          }
        }
        if (!resultsRecords.length) {
          const results = await getResultsState(cycleId);
          if (results) {
            setResultsRecords(results.records ?? []);
            setEvidenceReading(results.evidenceReading ?? null);
            setMethodologicalRoute(results.methodologicalRoute ?? null);
            setMethodologicalOverride(results.methodologicalOverride ?? null);
          }
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar la lectura.",
        );
      }
    };

    void loadContext();
  }, [
    cycleId,
    prototypeArtifact,
    prototypeRouteId,
    resultsRecords.length,
    setEvidenceReading,
    setMethodologicalOverride,
    setMethodologicalRoute,
    setPrototypeArtifact,
    setPrototypeBuilderValues,
    setPrototypeClassification,
    setPrototypeIdeaType,
    setPrototypeRouteId,
    setResultsRecords,
  ]);

  const route = useMemo(() => {
    const routeId = prototypeRouteId ?? prototypeArtifact?.routeId;
    return (
      (prototypeMatrix as PrototypeRoute[]).find((item) => item.id === routeId) ??
      null
    );
  }, [prototypeArtifact?.routeId, prototypeRouteId]);

  const winnerIdea = useMemo(() => {
    const winnerId = prototypeClassification?.ideaId;
    return ideationSets
      .flatMap((set) => set.ideas)
      .find((idea) => idea.id === winnerId);
  }, [ideationSets, prototypeClassification?.ideaId]);

  const selectedRoute =
    methodologicalRoute ?? evidenceReading?.methodologicalRoute ?? null;
  const isOverride =
    evidenceReading &&
    selectedRoute &&
    selectedRoute !== evidenceReading.methodologicalRoute;

  const selectRoute = async (routeId: EvidenceReading["methodologicalRoute"]) => {
    if (!route || !evidenceReading) return;
    let nextOverride: MethodologicalOverride | null = null;
    if (routeId !== evidenceReading.methodologicalRoute) {
      nextOverride = {
        changedAt: new Date().toISOString(),
        from: evidenceReading.methodologicalRoute,
        reason:
          overrideReason.trim() ||
          "Cambio manual seleccionado por el usuario en lectura de evidencia.",
        to: routeId,
      };
    }
    setMethodologicalRoute(routeId);
    setMethodologicalOverride(nextOverride);
    setError(null);
    await saveResultsState({
      cycleId,
      evidenceReading,
      methodologicalOverride: nextOverride,
      methodologicalRoute: routeId,
      prototypeRouteId: route.id,
      records: resultsRecords,
    });
  };

  return (
    <div className="workspace-container">
      <section className="phase-hero">
        <SectionLabel>Lectura de evidencia</SectionLabel>
        <div className="mt-4">
          <div className="max-w-4xl">
            <h1 className="phase-title">
              Interpretar evidencia sin optimismo injustificado.
            </h1>
            <p className="phase-summary">
              La IA lee registros cerrados y abiertos contra la matriz, muestra,
              umbrales y riesgos de mala interpretación.
            </p>
          </div>
        </div>
      </section>

      {error && <Notice>{error}</Notice>}

      {!route || !resultsRecords.length ? (
        <Card className="p-10 text-center">
          <h2 className="text-xl font-semibold">Falta evidencia registrada</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Registra resultados observados antes de pedir una lectura.
          </p>
          <div className="mt-6">
            <Button onClick={() => setActivePhaseId("results")} variant="secondary">
              Ir a resultados
            </Button>
          </div>
        </Card>
      ) : evidenceReading ? (
        <>
          <Card className="p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <SectionLabel>{route.artifact}</SectionLabel>
                <div className="mt-4 rounded-[24px] border border-border bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Decisión recomendada
                  </p>
                  <h2 className="mt-3 text-3xl font-extrabold leading-tight">
                    {evidenceReading.decision}
                  </h2>
                  <p className="mt-4 max-w-4xl text-base leading-7 text-stone-700">
                    {evidenceReading.rationale}
                  </p>
                </div>
              </div>
              <div className="grid min-w-72 gap-3">
                <Kpi
                  label="Confianza"
                  value={evidenceReading.confidence}
                  description={evidenceReading.methodologicalRationale}
                />
                <Kpi
                  label="Muestra"
                  value={`${resultsRecords.length} registro(s)`}
                  description={route.evidenceScope.sample}
                />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <SectionLabel>Tablero de señales cerradas</SectionLabel>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
              {(route.closedQuestions ?? []).map((question) => (
                <ClosedSignalCard
                  key={question.id}
                  metric={metricForQuestion(route, question.id)}
                  question={question}
                  records={resultsRecords}
                  target={route.evidenceScope.sampleTargetMin}
                />
              ))}
            </div>
          </Card>

          <section className="grid gap-5 xl:grid-cols-2">
            <ListCard title="Evidencia fuerte" items={evidenceReading.evidenceSupports} />
            <ListCard
              title="Evidencia débil o faltante"
              items={evidenceReading.weakOrMissingEvidence}
            />
          </section>

          <Card className="p-5">
            <SectionLabel>Riesgos de sobreinterpretación</SectionLabel>
            <div className="mt-5 grid gap-5 xl:grid-cols-3">
              <TextBlock title="Falso positivo posible" value={evidenceReading.falsePositiveRisk} />
              <TextBlock title="Falso negativo posible" value={evidenceReading.falseNegativeRisk} />
              <TextBlock
                title="Cómo evitar mala lectura"
                value={route.avoidMisread.join(" · ")}
              />
            </div>
          </Card>

          <Card className="p-5">
            <SectionLabel>Siguiente movimiento</SectionLabel>
            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <TextBlock title="Siguiente acción gerencial" value={evidenceReading.nextStep} />
              <TextBlock
                title="Condición para próxima decisión"
                value={nextDecisionCondition(route, evidenceReading)}
              />
            </div>
          </Card>

          <Card className="p-5">
            <SectionLabel>Rutas metodológicas</SectionLabel>
            <h2 className="mt-3 text-xl font-semibold">
              {selectedRoute
                ? `Ruta final: ${routeTitle(selectedRoute)}`
                : "Selecciona una ruta final"}
            </h2>
            <div className="mt-5 grid gap-4 xl:grid-cols-5">
              {routeOptions.map((option) => (
                <button
                  className={
                    selectedRoute === option.id
                      ? "rounded-[20px] border border-black bg-black p-4 text-left text-white"
                      : "rounded-[20px] border border-border bg-surface-raised p-4 text-left transition hover:border-black hover:bg-white"
                  }
                  key={option.id}
                  onClick={() => void selectRoute(option.id)}
                  type="button"
                >
                  <strong className="block text-base">{option.title}</strong>
                  <span className="mt-2 block text-sm leading-6 opacity-80">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>

            <label className="mt-6 grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Razón si cambias contra recomendación IA
              </span>
              <TextArea
                className="min-h-24"
                onChange={(event) => setOverrideReason(event.target.value)}
                placeholder="Explica por qué eliges otra ruta metodológica."
                value={overrideReason}
              />
            </label>

            {isOverride && methodologicalOverride && (
              <TextBox
                label="Cambio trazable"
                value={`${routeTitle(methodologicalOverride.from)} -> ${routeTitle(
                  methodologicalOverride.to,
                )}. ${methodologicalOverride.reason}`}
              />
            )}

            <div className="mt-6 flex justify-end border-t border-border pt-5">
              <Button
                disabled={!selectedRoute}
                onClick={() =>
                  setActivePhaseId(selectedRoute === "advance" ? "playbook" : "memory")
                }
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-10 text-center">
          <Brain className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Lectura pendiente</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Hay {resultsRecords.length} registro(s). Vuelve a Resultados y usa
            Leer evidencia para obtener decisión, confianza, riesgos y ruta
            recomendada.
          </p>
        </Card>
      )}
    </div>
  );
}

function ClosedSignalCard({
  metric,
  question,
  records,
  target,
}: {
  metric: PrototypeEvidenceMetric | null;
  question: PrototypeClosedQuestion;
  records: Array<{ closedValues: Record<string, string> }>;
  target: number;
}) {
  const positiveValues = metric?.advanceValues?.length
    ? metric.advanceValues
    : question.options.slice(0, 1);
  const count = records.filter((record) =>
    positiveValues.includes(record.closedValues[question.id] ?? ""),
  ).length;
  const percent = target ? Math.min(100, Math.round((count / target) * 100)) : 0;
  return (
    <div className="rounded-[18px] border border-border bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {metric?.label ?? question.evidenceRole}
      </p>
      <strong className="mt-2 block text-lg font-semibold">
        {count}/{target}
      </strong>
      <p className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">
        {question.label}
      </p>
      <p className="mt-2 text-xs font-semibold text-muted-foreground">
        Cuenta: {positiveValues.join(" / ")}
      </p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-black" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs font-semibold text-muted-foreground">
        {metric?.interpretation ?? question.evidenceRole}
      </p>
    </div>
  );
}

function Kpi({
  description,
  label,
  value,
}: {
  description: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-border bg-surface-raised p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <strong className="mt-2 block text-2xl font-extrabold">{value}</strong>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function ListCard({ items, title }: { items: string[]; title: string }) {
  return (
    <Card className="p-6">
      <SectionLabel>Evidencia</SectionLabel>
      <h3 className="mt-3 text-2xl font-extrabold">{title}</h3>
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
      <h3 className="mt-3 text-xl font-extrabold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-stone-700">{value}</p>
    </Card>
  );
}

function TextBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-6 rounded-[20px] border border-border bg-surface-raised p-5">
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

function nextDecisionCondition(route: PrototypeRoute, reading: EvidenceReading) {
  if (reading.decision === "Avanzar") return route.evidenceScope.thresholds.advance;
  if (reading.decision === "Replantear") return route.evidenceScope.thresholds.rethink;
  return route.evidenceScope.thresholds.iterate;
}

function routeTitle(routeId: EvidenceReading["methodologicalRoute"]) {
  return routeOptions.find((option) => option.id === routeId)?.title ?? routeId;
}

function metricForQuestion(route: PrototypeRoute, questionId: string) {
  return (
    route.evidenceMetrics?.find(
      (metric: PrototypeEvidenceMetric) => metric.questionId === questionId,
    ) ?? null
  );
}
