import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BarChart3, ChevronRight, FileText, Plus, Trash2 } from "lucide-react";
import {
  useAppState,
  type EvaluationScores,
  type IdeationIdea,
  type PrototypeArtifact,
  type PrototypeClosedQuestion,
  type PrototypeEvidenceMetric,
  type PrototypeRoute,
  type ResultRecord,
} from "../../app-state.js";
import { Button } from "../../components/ui/button.js";
import { Card, SectionLabel } from "../../components/ui/card.js";
import { TextArea } from "../../components/ui/form-field.js";
import { prototypeMatrix } from "../../../../prototype/matrix.js";
import { getPrototypeState } from "../prototype/prototype-api.js";
import { getResultsState, saveResultsState } from "./results-api.js";

type FormState = {
  closedValues: Record<string, string>;
  values: Record<string, string>;
  notes: string;
};

type WinnerEntry = {
  id: string;
  idea: IdeationIdea;
  scores: EvaluationScores | null;
  total: number;
};

export function ResultsPage() {
  const {
    cycleId,
    evidenceReading,
    evaluationScores,
    evaluationWinnerId,
    ideationSets,
    methodologicalRoute,
    methodologicalOverride,
    prototypeArtifact,
    prototypeBuilderValues,
    prototypeClassification,
    prototypeIdeaType,
    prototypeRouteId,
    resultsRecords,
    setActivePhaseId,
    setEvidenceReading,
    setMethodologicalRoute,
    setPrototypeArtifact,
    setPrototypeBuilderValues,
    setPrototypeClassification,
    setPrototypeIdeaType,
    setPrototypeRouteId,
    setResultsRecords,
  } = useAppState();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    closedValues: {},
    notes: "",
    values: {},
  });
  const [openRecordId, setOpenRecordId] = useState<string | null>(null);

  useEffect(() => {
    const loadPrototype = async () => {
      if (prototypeArtifact || prototypeRouteId) return;
      try {
        const saved = await getPrototypeState(cycleId);
        if (!saved) return;
        setPrototypeArtifact(saved.prototypeArtifact ?? null);
        setPrototypeBuilderValues(saved.prototypeBuilderValues ?? {});
        setPrototypeClassification(saved.prototypeClassification ?? null);
        setPrototypeIdeaType(saved.prototypeIdeaType ?? null);
        setPrototypeRouteId(
          saved.prototypeRouteId ?? saved.prototypeArtifact?.routeId ?? null,
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar Prototipado.",
        );
      }
    };

    void loadPrototype();
  }, [
    cycleId,
    prototypeArtifact,
    prototypeRouteId,
    setPrototypeArtifact,
    setPrototypeBuilderValues,
    setPrototypeClassification,
    setPrototypeIdeaType,
    setPrototypeRouteId,
  ]);

  useEffect(() => {
    const loadResults = async () => {
      if (resultsRecords.length) return;
      try {
        const saved = await getResultsState(cycleId);
        if (!saved) return;
        setResultsRecords(saved.records ?? []);
        setEvidenceReading(saved.evidenceReading ?? null);
        setMethodologicalRoute(saved.methodologicalRoute ?? null);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudieron cargar resultados.",
        );
      }
    };

    void loadResults();
  }, [
    cycleId,
    resultsRecords.length,
    setEvidenceReading,
    setMethodologicalRoute,
    setResultsRecords,
  ]);

  const route = useMemo(() => {
    const routeId = prototypeRouteId ?? prototypeArtifact?.routeId;
    return (
      (prototypeMatrix as PrototypeRoute[]).find((item) => item.id === routeId) ??
      null
    );
  }, [prototypeArtifact?.routeId, prototypeRouteId]);

  const artifact = prototypeArtifact?.artifact ?? null;
  const winner = useMemo(
    () =>
      getWinner({
        evaluationScores,
        evaluationWinnerId: prototypeClassification?.ideaId ?? evaluationWinnerId,
        ideationSets,
      }),
    [evaluationScores, evaluationWinnerId, ideationSets, prototypeClassification],
  );

  const persistRecords = async (records: ResultRecord[]) => {
    if (!route) return;
    await saveResultsState({
      cycleId,
      evidenceReading,
      methodologicalOverride,
      methodologicalRoute,
      prototypeRouteId: route.id,
      records,
    });
  };

  const addRecord = async () => {
    if (!route) return;
    const hasClosed = Object.values(form.closedValues).some(Boolean);
    const hasOpen = Object.values(form.values).some((value) => value.trim());
    const hasNotes = form.notes.trim().length > 0;
    if (!hasClosed && !hasOpen && !hasNotes) {
      setError("Registra al menos una evidencia observada.");
      return;
    }
    const nextRecord: ResultRecord = {
      closedValues: form.closedValues,
      createdAt: new Date().toISOString(),
      id: `result-${Date.now()}`,
      notes: form.notes.trim(),
      values: Object.fromEntries(
        Object.entries(form.values).map(([key, value]) => [key, value.trim()]),
      ),
    };
    const nextRecords = [nextRecord, ...resultsRecords];
    setResultsRecords(nextRecords);
    setEvidenceReading(null);
    setMethodologicalRoute(null);
    setForm({ closedValues: {}, notes: "", values: {} });
    setError(null);
    await persistRecords(nextRecords);
  };

  const removeRecord = async (recordId: string) => {
    const nextRecords = resultsRecords.filter((record) => record.id !== recordId);
    setResultsRecords(nextRecords);
    setEvidenceReading(null);
    setMethodologicalRoute(null);
    await persistRecords(nextRecords);
  };

  const goToEvidenceReading = () => {
    if (!artifact) return;

    if (artifact.artifact.length < 4) {
      setError(
        "El artefacto de prototipado está incompleto para leer evidencia. La matriz espera al menos 4 piezas del artefacto antes de interpretar resultados. Vuelve a Prototipado y genera nuevamente el artefacto.",
      );
      return;
    }

    setError(null);
    setActivePhaseId("reading");
  };

  return (
    <div className="workspace-container">
      <section className="phase-hero">
        <SectionLabel>Registro de resultados</SectionLabel>
        <div className="mt-4">
          <div className="max-w-4xl">
            <h1 className="phase-title">
              Evidencia observada, sin inventar señales.
            </h1>
            <p className="phase-summary">
              Registra respuestas cerradas y evidencia abierta según la matriz
              del artefacto. La interpretación ocurre en Lectura de evidencias.
            </p>
          </div>
        </div>
      </section>

      {error && <Notice>{error}</Notice>}

      {!route || !artifact ? (
        <Card className="p-10 text-center">
          <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">
            Genera un artefacto antes de registrar resultados
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Esta fase necesita la ruta y el artefacto de Prototipado para saber
            qué observar.
          </p>
          <div className="mt-6">
            <Button onClick={() => setActivePhaseId("prototype")} variant="secondary">
              Ir a Prototipado
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <ResultsHero
            artifact={artifact}
            ideaType={prototypeIdeaType ?? route.ideaType}
            rationale={prototypeClassification?.rationale}
            route={route}
            resultsRecords={resultsRecords}
            winner={winner}
          />

          <Card className="p-5">
            <SectionLabel>Mini dashboard</SectionLabel>
            <h2 className="mt-3 text-xl font-semibold">
              Progreso de evidencia
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
              <MetricCard
                current={resultsRecords.length}
                description={route.evidenceScope.sample}
                label="Registros"
                target={sampleTarget(route)}
              />
              {(route.closedQuestions ?? []).map((question) => {
                const metric = metricForQuestion(route, question.id);
                const positives =
                  metric?.advanceValues?.length
                    ? metric.advanceValues
                    : question.options.slice(0, 1);
                const count = resultsRecords.filter((record) =>
                  positives.includes(record.closedValues[question.id] ?? ""),
                ).length;
                return (
                  <MetricCard
                    current={count}
                    description={`Cuenta: ${positives.join(" / ")}`}
                    key={question.id}
                    label={metric?.label ?? question.evidenceRole}
                    target={sampleTarget(route)}
                  />
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <SectionLabel>Agregar registro</SectionLabel>
            <h2 className="mt-3 text-xl font-semibold">
              Señales cerradas y evidencia abierta
            </h2>
            <div className="mt-6 grid gap-5">
              {route.closedQuestions?.length ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  {route.closedQuestions.map((question) => (
                    <ClosedQuestionField
                      key={question.id}
                      onChange={(value) =>
                        setForm({
                          ...form,
                          closedValues: {
                            ...form.closedValues,
                            [question.id]: value,
                          },
                        })
                      }
                      question={question}
                      value={form.closedValues[question.id] ?? ""}
                    />
                  ))}
                </div>
              ) : null}

              {registerFields(route).map((label) => {
                const key = fieldKey(label);
                return (
                  <label className="grid gap-2" key={key}>
                    <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {label}
                    </span>
                    <TextArea
                      className="min-h-24"
                      onChange={(event) =>
                        setForm({
                          ...form,
                          values: {
                            ...form.values,
                            [key]: event.target.value,
                          },
                        })
                      }
                      placeholder={`Registra la evidencia observada para "${label}".`}
                      value={form.values[key] ?? ""}
                    />
                  </label>
                );
              })}

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Notas de contexto
                </span>
                <TextArea
                  className="min-h-24"
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                  placeholder="Persona, caso, sesión, condición de prueba o matiz relevante."
                  value={form.notes}
                />
              </label>
            </div>
            <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 xl:flex-row xl:items-center xl:justify-between">
              <p className="text-sm font-semibold text-muted-foreground">
                Cada registro debe venir de una observación del test.
              </p>
              <Button onClick={addRecord}>
                <Plus className="h-4 w-4" />
                Guardar registro
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <SectionLabel>Evidencia capturada</SectionLabel>
            <h2 className="mt-3 text-xl font-semibold">
              {resultsRecords.length} registro(s)
            </h2>
            <div className="mt-6 grid gap-4">
              {resultsRecords.length ? (
                resultsRecords.map((record, index) => (
                  <RecordCard
                    key={record.id}
                    index={resultsRecords.length - index}
                    isOpen={openRecordId === record.id}
                    onToggle={() =>
                      setOpenRecordId(openRecordId === record.id ? null : record.id)
                    }
                    record={record}
                    removeRecord={removeRecord}
                    route={route}
                  />
                ))
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  Todavía no hay registros. Agrega evidencia del artefacto usado
                  para activar la lectura.
                </p>
              )}
            </div>
          </Card>

          <div className="flex justify-end">
            <Button
              disabled={!route || resultsRecords.length === 0}
              onClick={goToEvidenceReading}
              variant="secondary"
            >
              Leer evidencia
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function ResultsHero({
  artifact,
  ideaType,
  rationale,
  resultsRecords,
  route,
  winner,
}: {
  artifact: PrototypeArtifact;
  ideaType: string;
  rationale?: string;
  resultsRecords: ResultRecord[];
  route: PrototypeRoute;
  winner: WinnerEntry | null;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col items-center px-8 py-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-black text-white shadow-soft">
          <FileText className="h-9 w-9" />
        </div>
        <SectionLabel className="mt-7">{ideaType}</SectionLabel>
        <h2 className="mt-3 max-w-4xl text-3xl font-extrabold leading-tight">
          {winner ? displayIdeaName(winner.idea) : artifact.title}
        </h2>
        <p className="mt-4 max-w-5xl text-base font-semibold leading-7 text-stone-600">
          Supuesto que rompe:{" "}
          {winner?.idea.supuestoQueRompe || "Supuesto no declarado."}
        </p>
        {rationale && (
          <p className="mt-4 max-w-5xl text-sm leading-7 text-muted-foreground">
            {rationale}
          </p>
        )}
      </div>

      <div className="grid border-t border-border xl:grid-cols-3">
        <HeroMetric
          label="Artefacto usado"
          title={artifact.artifactType || route.artifact}
          value={artifact.howToUse || route.summary}
        />
        <HeroMetric
          label="Muestra esperada"
          title={route.evidenceScope.sample}
          value={route.evidenceScope.validates}
        />
        <HeroMetric
          label="Señal de avance"
          title={primaryMetric(route)?.label ?? route.advanceSignals[0] ?? "Señal"}
          value={advanceSignalText(route, resultsRecords)}
        />
      </div>
    </Card>
  );
}

function HeroMetric({
  label,
  title,
  value,
}: {
  label: string;
  title: string;
  value: string;
}) {
  return (
    <div className="flex min-h-44 gap-5 border-b border-border bg-white px-8 py-7 text-left xl:border-b-0 xl:border-r xl:last:border-r-0">
      <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-white text-stone-700">
        <ArrowRight className="h-5 w-5" />
      </span>
      <div>
        <SectionLabel>{label}</SectionLabel>
        <h3 className="mt-2 text-xl font-extrabold leading-tight">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}

function ClosedQuestionField({
  onChange,
  question,
  value,
}: {
  onChange: (value: string) => void;
  question: PrototypeClosedQuestion;
  value: string;
}) {
  return (
    <label className="grid gap-2 rounded-[20px] border border-border bg-surface-raised p-4">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {question.evidenceRole}
      </span>
      <strong className="text-sm leading-6 text-stone-900">{question.label}</strong>
      <select
        className="h-12 rounded-full border border-border bg-white px-4 text-sm font-semibold text-stone-800 outline-none transition focus:border-black"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">Seleccionar</option>
        {question.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function MetricCard({
  current,
  description,
  label,
  target,
}: {
  current: number;
  description: string;
  label: string;
  target: number;
}) {
  const percent = target ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div className="rounded-[18px] border border-border bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <strong className="mt-2 block text-lg font-semibold">
        {current}/{target}
      </strong>
      <p className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">{description}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-black" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs font-semibold text-muted-foreground">
        {percent}% observado · faltan {Math.max(0, target - current)}
      </p>
    </div>
  );
}

function RecordCard({
  index,
  isOpen,
  onToggle,
  record,
  removeRecord,
  route,
}: {
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  record: ResultRecord;
  removeRecord: (recordId: string) => void;
  route: PrototypeRoute;
}) {
  const closedRows = (route.closedQuestions ?? []).map((question) => ({
    label: question.label,
    value: record.closedValues[question.id] || "Sin dato",
  }));
  const openRows = registerFields(route).map((label) => ({
    label,
    value: record.values[fieldKey(label)] || "Sin dato",
  }));

  return (
    <article className="group rounded-[20px] border border-border bg-surface-raised">
      <button
        className="flex w-full cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left"
        onClick={onToggle}
        type="button"
      >
        <div>
          <h3 className="text-base font-semibold text-stone-900">Registro {index}</h3>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {new Date(record.createdAt).toLocaleString("es-CO")}
          </p>
        </div>
        <ChevronRight
          className={
            isOpen
              ? "h-5 w-5 rotate-90 text-muted-foreground transition"
              : "h-5 w-5 text-muted-foreground transition"
          }
        />
      </button>
      {isOpen && <div className="border-t border-border px-5 pb-5 pt-4">
        <ul className="grid gap-2 text-sm leading-6 text-stone-700">
          {[...closedRows, ...openRows].map((row) => (
            <li key={row.label}>
              • {row.label}: {row.value}
            </li>
          ))}
        </ul>
        {record.notes && (
          <p className="mt-2 text-sm leading-6 text-stone-700">
            • Notas: {record.notes}
          </p>
        )}
        <div className="mt-4 flex justify-end">
          <Button onClick={() => removeRecord(record.id)} variant="secondary">
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>}
    </article>
  );
}

function Notice({ children }: { children: string }) {
  return (
    <div className="rounded-[18px] border border-red-200 bg-red-50 px-5 py-4 shadow-sm">
      <p className="text-sm font-semibold text-red-800">{children}</p>
    </div>
  );
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

function registerFields(route: PrototypeRoute) {
  return route.register?.length
    ? route.register
    : [
        "Resultado observado",
        "Señal de avance o freno",
        "Objeción o fricción",
        "Siguiente paso observable",
      ];
}

function sampleTarget(route: PrototypeRoute) {
  return route.evidenceScope.sampleTargetMin || 1;
}

function primaryMetric(route: PrototypeRoute) {
  return route.evidenceMetrics?.[0] ?? null;
}

function metricForQuestion(route: PrototypeRoute, questionId: string) {
  return (
    route.evidenceMetrics?.find(
      (metric: PrototypeEvidenceMetric) => metric.questionId === questionId,
    ) ?? null
  );
}

function displayIdeaName(idea: IdeationIdea) {
  return idea.idea.length > 96 ? `${idea.idea.slice(0, 93)}...` : idea.idea;
}

function advanceSignalText(route: PrototypeRoute, records: ResultRecord[]) {
  const metric = primaryMetric(route);
  if (!metric) return route.advanceSignals[0] ?? "Señal definida por la matriz.";
  const count = records.filter((record) =>
    metric.advanceValues.includes(record.closedValues[metric.questionId] ?? ""),
  ).length;
  const total = records.length;
  const current = total
    ? `Actual: ${count}/${total}. `
    : "Actual: sin registros todavía. ";
  return `${current}Avanzar: ${metric.advance}. Iterar: ${metric.iterate}. Replantear: ${metric.rethink}. ${metric.interpretation}`;
}
