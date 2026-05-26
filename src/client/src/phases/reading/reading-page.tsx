import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Brain, Loader2 } from "lucide-react";
import {
  useAppState,
  type EvidenceReading,
  type MethodologicalOverride,
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
  readEvidence,
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
  const [status, setStatus] = useState<"idle" | "reading">("idle");
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

  const generateReading = async () => {
    if (!route || !resultsRecords.length) return;
    setStatus("reading");
    setError(null);
    try {
      const reading = await readEvidence({
        artifact: prototypeArtifact?.artifact,
        closedQuestions: route.closedQuestions ?? [],
        cycleId,
        idea: winnerIdea,
        records: resultsRecords,
        route,
      });
      setEvidenceReading(reading);
      setMethodologicalRoute(reading.methodologicalRoute);
      setMethodologicalOverride(null);
      await saveResultsState({
        cycleId,
        evidenceReading: reading,
        methodologicalOverride: null,
        methodologicalRoute: reading.methodologicalRoute,
        prototypeRouteId: route.id,
        records: resultsRecords,
      });
    } catch (readError) {
      setError(
        readError instanceof Error
          ? readError.message
          : "No se pudo leer evidencia.",
      );
    } finally {
      setStatus("idle");
    }
  };

  const selectRoute = async (routeId: EvidenceReading["methodologicalRoute"]) => {
    if (!route || !evidenceReading) return;
    let nextOverride: MethodologicalOverride | null = null;
    if (routeId !== evidenceReading.methodologicalRoute) {
      if (overrideReason.trim().length < 20) {
        setError(
          "Para cambiar contra la recomendación IA, escribe una razón trazable de al menos 20 caracteres.",
        );
        return;
      }
      nextOverride = {
        changedAt: new Date().toISOString(),
        from: evidenceReading.methodologicalRoute,
        reason: overrideReason.trim(),
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
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-8 px-8 py-8 xl:px-12">
      <section className="rounded-[28px] border border-border bg-surface px-10 py-9 shadow-workspace">
        <SectionLabel>Lectura de evidencia</SectionLabel>
        <div className="mt-4 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <h1 className="text-5xl font-extrabold leading-[1.02] tracking-normal">
              Interpretar evidencia sin optimismo injustificado.
            </h1>
            <p className="mt-5 max-w-3xl text-xl leading-8 text-muted-foreground">
              La IA lee registros cerrados y abiertos contra la matriz, muestra,
              umbrales y riesgos de mala interpretación.
            </p>
          </div>
          <Button
            disabled={!route || !resultsRecords.length || status === "reading"}
            onClick={generateReading}
          >
            {status === "reading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            Leer evidencia
          </Button>
        </div>
      </section>

      {error && <Notice>{error}</Notice>}

      {!route || !resultsRecords.length ? (
        <Card className="p-10 text-center">
          <h2 className="text-3xl font-extrabold">Falta evidencia registrada</h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
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
          <Card className="p-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <SectionLabel>{route.artifact}</SectionLabel>
                <h2 className="mt-3 text-3xl font-extrabold">
                  Decisión recomendada: {evidenceReading.decision}
                </h2>
                <p className="mt-3 max-w-4xl text-base leading-7 text-stone-700">
                  {evidenceReading.rationale}
                </p>
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
            <TextBox
              label="Supuesto probado"
              value={evidenceReading.testedAssumption}
            />
          </Card>

          <Card className="p-7">
            <SectionLabel>Tablero de señales cerradas</SectionLabel>
            <div className="mt-5 grid gap-4 xl:grid-cols-3">
              {route.evidenceMetrics.map((metric) => (
                <MetricCard
                  key={metric.questionId}
                  metric={metric}
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

          <section className="grid gap-5 xl:grid-cols-3">
            <TextBlock title="Falso positivo posible" value={evidenceReading.falsePositiveRisk} />
            <TextBlock title="Falso negativo posible" value={evidenceReading.falseNegativeRisk} />
            <TextBlock
              title="Cómo evitar mala lectura"
              value={route.avoidMisread.join(" · ")}
            />
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <TextBlock title="Siguiente acción gerencial" value={evidenceReading.nextStep} />
            <TextBlock
              title="Condición para próxima decisión"
              value={nextDecisionCondition(route, evidenceReading)}
            />
          </section>

          <Card className="p-7">
            <SectionLabel>Rutas metodológicas</SectionLabel>
            <h2 className="mt-3 text-3xl font-extrabold">
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
          <h2 className="mt-4 text-3xl font-extrabold">Lectura pendiente</h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Hay {resultsRecords.length} registro(s). Ejecuta la lectura para
            obtener decisión, confianza, riesgos y ruta recomendada.
          </p>
        </Card>
      )}
    </div>
  );
}

function MetricCard({
  metric,
  records,
  target,
}: {
  metric: PrototypeEvidenceMetric;
  records: Array<{ closedValues: Record<string, string> }>;
  target: number;
}) {
  const count = records.filter((record) =>
    metric.advanceValues.includes(record.closedValues[metric.questionId] ?? ""),
  ).length;
  const percent = target ? Math.min(100, Math.round((count / target) * 100)) : 0;
  return (
    <div className="rounded-[20px] border border-border bg-surface-raised p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {metric.label}
      </p>
      <strong className="mt-2 block text-3xl font-extrabold">
        {count}/{target}
      </strong>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Cuenta: {metric.advanceValues.join(" / ")}
      </p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-black" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs font-semibold text-muted-foreground">
        {metric.interpretation}
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
      <SectionLabel>Riesgo</SectionLabel>
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
      <p className="mt-3 text-base leading-7 text-stone-800">{value}</p>
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
