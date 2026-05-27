import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  LockKeyhole,
} from "lucide-react";
import {
  useAppState,
  type CycleMemory,
  type EvidenceReading,
  type IdeationIdea,
  type PlaybookOutput,
  type PlaybookPhaseRecord,
  type PrototypeRoute,
} from "../../app-state.js";
import { Button } from "../../components/ui/button.js";
import { Card, SectionLabel } from "../../components/ui/card.js";
import { TextArea } from "../../components/ui/form-field.js";
import { prototypeMatrix } from "../../../../prototype/matrix.js";
import { getDiagnosisCycle } from "../diagnosis/diagnosis-api.js";
import { getIdeationRun } from "../ideation/ideation-api.js";
import { getPrototypeState } from "../prototype/prototype-api.js";
import { getResultsState } from "../results/results-api.js";
import { getSignals } from "../signals/signals-api.js";
import {
  generatePlaybook,
  getPlaybook,
  toPlaybookOverride,
} from "./playbook-api.js";

const routeLabels: Record<EvidenceReading["methodologicalRoute"], string> = {
  advance: "Avanzar",
  discard: "Descartar idea",
  invalidate_challenge: "Invalidar reto",
  invalidate_signal: "Invalidar señal",
  iterate: "Iterar o ajustar",
};

type PlaybookPageProps = {
  mode?: "playbook" | "memory";
};

export function PlaybookPage({ mode = "playbook" }: PlaybookPageProps) {
  const {
    cycleId,
    diagnosis,
    evidenceReading,
    ideationSets,
    methodologicalOverride,
    methodologicalRoute,
    playbookRecord,
    prototypeArtifact,
    prototypeClassification,
    prototypeRouteId,
    registration,
    resultsRecords,
    setActivePhaseId,
    setDiagnosis,
    setEvidenceReading,
    setIdeationSets,
    setMethodologicalOverride,
    setMethodologicalRoute,
    setPlaybookRecord,
    setPrototypeArtifact,
    setPrototypeBuilderValues,
    setPrototypeClassification,
    setPrototypeIdeaType,
    setPrototypeRouteId,
    setResultsRecords,
    setSignals,
    signals,
  } = useAppState();
  const [companyId, setCompanyId] = useState<string | null>(
    registration?.companyId ?? null,
  );
  const [licenseId, setLicenseId] = useState<string | null>(
    registration?.licenseId ?? null,
  );
  const [overrideReason, setOverrideReason] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "closing">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContext = async () => {
      setStatus("loading");
      setError(null);
      try {
        const [savedPlaybook, savedDiagnosis, savedSignals, savedIdeation, savedPrototype, savedResults] =
          await Promise.all([
            playbookRecord ? Promise.resolve(null) : getPlaybook(cycleId),
            diagnosis ? Promise.resolve(null) : getDiagnosisCycle(cycleId),
            signals ? Promise.resolve(null) : getSignals(cycleId).catch(() => null),
            ideationSets.length ? Promise.resolve(null) : getIdeationRun(cycleId),
            prototypeArtifact || prototypeRouteId
              ? Promise.resolve(null)
              : getPrototypeState(cycleId),
            resultsRecords.length || evidenceReading
              ? Promise.resolve(null)
              : getResultsState(cycleId),
          ]);

        if (savedPlaybook && !playbookRecord) setPlaybookRecord(savedPlaybook);
        if (savedDiagnosis?.diagnosis) setDiagnosis(savedDiagnosis.diagnosis);
        if (savedDiagnosis?.companyId) setCompanyId(savedDiagnosis.companyId);
        if (savedDiagnosis?.licenseId) setLicenseId(savedDiagnosis.licenseId);
        if (savedSignals?.signals.output) setSignals(savedSignals.signals.output);
        if (savedIdeation) setIdeationSets([savedIdeation]);
        if (savedPrototype) {
          setPrototypeArtifact(savedPrototype.prototypeArtifact ?? null);
          setPrototypeBuilderValues(savedPrototype.prototypeBuilderValues ?? {});
          setPrototypeClassification(savedPrototype.prototypeClassification ?? null);
          setPrototypeIdeaType(savedPrototype.prototypeIdeaType ?? null);
          setPrototypeRouteId(
            savedPrototype.prototypeRouteId ??
              savedPrototype.prototypeArtifact?.routeId ??
              null,
          );
        }
        if (savedResults) {
          setEvidenceReading(savedResults.evidenceReading ?? null);
          setMethodologicalOverride(savedResults.methodologicalOverride ?? null);
          setMethodologicalRoute(savedResults.methodologicalRoute ?? null);
          setResultsRecords(savedResults.records ?? []);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar el cierre del ciclo.",
        );
      } finally {
        setStatus("idle");
      }
    };

    void loadContext();
  }, [
    cycleId,
    diagnosis,
    evidenceReading,
    ideationSets.length,
    playbookRecord,
    prototypeArtifact,
    prototypeRouteId,
    resultsRecords.length,
    setDiagnosis,
    setEvidenceReading,
    setIdeationSets,
    setMethodologicalOverride,
    setMethodologicalRoute,
    setPlaybookRecord,
    setPrototypeArtifact,
    setPrototypeBuilderValues,
    setPrototypeClassification,
    setPrototypeIdeaType,
    setPrototypeRouteId,
    setResultsRecords,
    setSignals,
    signals,
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
    const ideas = ideationSets.flatMap((set) => set.ideas);
    return (
      ideas.find((idea) => idea.id === winnerId) ??
      ideas.find((idea) => idea.selectedForEvaluation) ??
      null
    );
  }, [ideationSets, prototypeClassification?.ideaId]);

  const finalRoute =
    methodologicalRoute ?? evidenceReading?.methodologicalRoute ?? null;
  const currentRecord = playbookRecord;
  const isPlaybookRoute = finalRoute === "advance";
  const needsAdvanceOverride = Boolean(
    evidenceReading?.methodologicalRoute &&
    finalRoute === "advance" &&
    evidenceReading.methodologicalRoute !== "advance" &&
    !methodologicalOverride,
  );
  const canClose =
    Boolean(route && evidenceReading && finalRoute && resultsRecords.length) &&
    !needsAdvanceOverride;

  const closeCycle = async () => {
    if (!route || !evidenceReading || !finalRoute) return;
    const manualOverride =
      needsAdvanceOverride || overrideReason.trim()
        ? {
            changedAt: new Date().toISOString(),
            changedBy: licenseId ?? "user",
            reason: overrideReason.trim(),
          }
        : undefined;

    if (
      finalRoute === "advance" &&
      evidenceReading.methodologicalRoute !== "advance" &&
      !methodologicalOverride &&
      (manualOverride?.reason.length ?? 0) < 20
    ) {
      setError(
        "Para generar Playbook contra la recomendación IA se requiere una razón ejecutiva trazable de al menos 20 caracteres.",
      );
      return;
    }

    setStatus("closing");
    setError(null);
    try {
      const record = await generatePlaybook({
        artifact: prototypeArtifact?.artifact,
        companyId: companyId ?? registration?.companyId,
        cycleId,
        diagnosis,
        evaluationDecision: buildEvaluationDecision(winnerIdea),
        evidenceReading,
        idea: winnerIdea ?? undefined,
        licenseId: licenseId ?? registration?.licenseId,
        methodologicalRoute: finalRoute,
        override:
          toPlaybookOverride(methodologicalOverride) ??
          (manualOverride?.reason ? manualOverride : undefined),
        records: resultsRecords,
        registration,
        route,
        signals,
      });
      setPlaybookRecord(record);
    } catch (closeError) {
      setError(
        closeError instanceof Error
          ? closeError.message
          : "No se pudo cerrar el ciclo.",
      );
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className="workspace-container">
      <section className="phase-hero">
        <SectionLabel>{mode === "memory" ? "Memoria de ciclos" : "Playbook"}</SectionLabel>
        <div className="mt-4 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <h1 className="phase-title">
              {mode === "memory"
                ? "Cerrar el ciclo como aprendizaje reutilizable."
                : "Convertir avance validado en ejecución gerencial."}
            </h1>
            <p className="phase-summary">
              Playbook solo existe cuando la ruta final es Avanzar. Las demás
              rutas cierran memoria sin disfrazar evidencia débil como escala.
            </p>
          </div>
        </div>
      </section>

      {error && <Notice>{error}</Notice>}

      {status === "loading" ? (
        <Card className="p-10 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Cargando cierre</h2>
        </Card>
      ) : !route || !evidenceReading || !finalRoute ? (
        <Card className="p-10 text-center">
          <h2 className="text-xl font-semibold">Falta decisión final</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Completa lectura de evidencias y selecciona una ruta metodológica
            antes de cerrar el ciclo.
          </p>
          <div className="mt-6">
            <Button onClick={() => setActivePhaseId("reading")} variant="secondary">
              Volver a lectura
            </Button>
          </div>
        </Card>
      ) : currentRecord ? (
        <ClosedCycle record={currentRecord} />
      ) : (
        <PendingClose
          evidenceReading={evidenceReading}
          finalRoute={finalRoute}
          isPlaybookRoute={isPlaybookRoute}
          needsAdvanceOverride={needsAdvanceOverride}
          onOverrideChange={setOverrideReason}
          overrideReason={overrideReason}
          route={route}
          recordsCount={resultsRecords.length}
        />
      )}

      {status !== "loading" && route && evidenceReading && finalRoute ? (
        <div className="flex justify-end">
          <Button
            disabled={!canClose || status === "closing" || Boolean(currentRecord)}
            onClick={closeCycle}
          >
            {status === "closing" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LockKeyhole className="h-4 w-4" />
            )}
            Cerrar ciclo y guardar en memoria
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function PendingClose({
  evidenceReading,
  finalRoute,
  isPlaybookRoute,
  needsAdvanceOverride,
  onOverrideChange,
  overrideReason,
  recordsCount,
  route,
}: {
  evidenceReading: EvidenceReading;
  finalRoute: EvidenceReading["methodologicalRoute"];
  isPlaybookRoute: boolean;
  needsAdvanceOverride: boolean;
  onOverrideChange: (value: string) => void;
  overrideReason: string;
  recordsCount: number;
  route: PrototypeRoute;
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <SectionLabel>Ruta final</SectionLabel>
          <h2 className="mt-3 text-xl font-semibold">{routeLabels[finalRoute]}</h2>
          <p className="mt-3 text-sm leading-6 text-stone-700">
            Recomendación IA: {routeLabels[evidenceReading.methodologicalRoute]}.
            Decisión de lectura: {evidenceReading.decision} con confianza{" "}
            {evidenceReading.confidence.toLowerCase()}.
          </p>
          <div className="mt-5 grid gap-3">
            <Kpi label="Artefacto" value={route.artifact} />
            <Kpi
              label="Muestra"
              value={`${recordsCount}/${route.evidenceScope.sampleTargetMin}`}
            />
            <Kpi
              label="Cierre"
              value={isPlaybookRoute ? "Playbook + memoria" : "Solo memoria"}
            />
          </div>
        </Card>

        <Card className="p-5">
          <SectionLabel>Control anti-optimismo</SectionLabel>
          <h2 className="mt-3 text-xl font-semibold">
            {isPlaybookRoute
              ? "El avance debe respetar lo que el artefacto no valida."
              : "El ciclo se guarda sin plan de escala."}
          </h2>
          <p className="mt-3 text-sm leading-6 text-stone-700">
            {evidenceReading.rationale}
          </p>
          <TextBox label="Qué valida" value={route.evidenceScope.validates} />
          <TextBox label="Qué no valida" value={route.evidenceScope.doesNotValidate} />
          {needsAdvanceOverride && (
            <label className="mt-6 grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Razón ejecutiva para avanzar contra recomendación IA
              </span>
              <TextArea
                className="min-h-28"
                onChange={(event) => onOverrideChange(event.target.value)}
                placeholder="Explica la razón trazable para generar Playbook aunque la IA no recomendó avanzar."
                value={overrideReason}
              />
            </label>
          )}
        </Card>
    </section>
  );
}

function ClosedCycle({ record }: { record: PlaybookPhaseRecord }) {
  const playbook = record.playbook;
  const primaryTitle =
    playbook?.validatedMove ?? record.memory.nextRecommendedMove;
  const primaryText = playbook?.executiveDecision ?? record.memory.evidenceReading;
  const keyLearning =
    record.memory.keyLearnings[0] ??
    playbook?.whyNow ??
    record.memory.nextRecommendedMove;

  return (
    <>
      <section className="grid overflow-hidden rounded-[28px] border border-border bg-surface shadow-workspace xl:grid-cols-[1.15fr_0.85fr]">
        <div className="bg-stone-950 p-8 text-white xl:p-10">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/75">
              Decisión: {routeLabels[record.methodologicalRoute]}
            </span>
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/75">
              Ruta IA: {routeLabels[record.recommendedRoute]}
            </span>
          </div>
          <SectionLabel className="mt-10 text-white/55">
            {playbook ? "Playbook generado" : "Memoria cerrada"}
          </SectionLabel>
          <h2 className="mt-4 max-w-4xl text-3xl font-extrabold leading-[1.06] tracking-normal md:text-4xl xl:text-5xl">
            {primaryTitle}
          </h2>
          <p className="mt-7 max-w-3xl text-base leading-8 text-white/70">
            {primaryText}
          </p>
        </div>

        <div className="grid content-start gap-5 p-6 xl:p-8">
          <Card className="p-6">
            <SectionLabel>Aprendizaje clave</SectionLabel>
            <p className="mt-4 text-lg font-semibold leading-8 text-stone-800">
              {keyLearning}
            </p>
          </Card>
        </div>
      </section>

      {playbook ? (
        <Card className="p-6">
          <SectionLabel>Cadena de evidencia</SectionLabel>
          <div className="mt-5 grid gap-5 xl:grid-cols-4">
            <EvidenceItem label="Acción" value={playbook.evidenceChain.action} />
            <EvidenceItem label="Prototipo" value={playbook.evidenceChain.prototype} />
            <EvidenceItem label="Lectura" value={playbook.evidenceChain.reading} />
            <EvidenceItem label="Resultado" value={playbook.evidenceChain.result} />
          </div>
        </Card>
      ) : null}

      {playbook ? <PlaybookDetail playbook={playbook} /> : null}
      <MemoryDetail memory={record.memory} />
    </>
  );
}

function PlaybookDetail({ playbook }: { playbook: PlaybookOutput }) {
  return (
    <>
      <Card className="p-5">
        <SectionLabel>Plan 0-90</SectionLabel>
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {playbook.implementationPlan.map((item) => (
            <div
              className="rounded-[20px] border border-border bg-surface-raised p-5"
              key={item.horizon}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {item.horizon}
              </p>
              <h3 className="mt-2 text-xl font-extrabold">{item.objective}</h3>
              <List items={item.actions} />
              <p className="mt-4 text-sm font-semibold text-stone-800">
                Responsable: {item.owner}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Métrica: {item.decisionMetric}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <section className="grid gap-5 xl:grid-cols-2">
        <ListCard title="Responsables" eyebrow="Gobierno" items={playbook.owners} />
        <ListCard
          title="Recursos requeridos"
          eyebrow="Ejecución"
          items={playbook.requiredResources}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <SectionLabel>Métricas</SectionLabel>
          <div className="mt-5 grid gap-3">
            {playbook.metricsToMonitor.map((metric) => (
              <div
                className="rounded-[18px] border border-border bg-surface-raised p-4"
                key={`${metric.label}-${metric.target}`}
              >
                <h3 className="font-extrabold">{metric.label}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Meta: {metric.target}. Fuente: {metric.evidenceSource}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <SectionLabel>Riesgos y controles</SectionLabel>
          <div className="mt-5 grid gap-3">
            {playbook.risksAndControls.map((item) => (
              <div
                className="rounded-[18px] border border-border bg-surface-raised p-4"
                key={item.risk}
              >
                <h3 className="font-extrabold">{item.risk}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Control: {item.control}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card className="p-5">
        <SectionLabel>Resumen exportable</SectionLabel>
        <h2 className="mt-3 text-2xl font-extrabold">{playbook.whyNow}</h2>
        <p className="mt-4 text-sm leading-6 text-stone-700">
          {playbook.exportSummary}
        </p>
        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          <TextBox label="Principio operativo" value={playbook.operatingPrinciple} />
          <TextBox label="Cadencia de revisión" value={playbook.reviewCadence} />
          <TextBox
            label="Condiciones para detener o iterar"
            value={playbook.stopOrIterateConditions.join(" · ")}
          />
        </div>
      </Card>
    </>
  );
}

function MemoryDetail({ memory }: { memory: CycleMemory }) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-border bg-surface-raised">
          <CheckCircle2 className="h-6 w-6 text-stone-800" />
        </div>
        <div>
          <SectionLabel>Memoria solo lectura</SectionLabel>
          <h2 className="mt-3 text-xl font-semibold">{memory.title}</h2>
          <p className="mt-3 text-sm leading-6 text-stone-700">
            {memory.nextRecommendedMove}
          </p>
        </div>
      </div>
      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <ListCard title="Aprendizajes" eyebrow="Memoria" items={memory.keyLearnings} />
        <ListCard
          title="Supuestos no resueltos"
          eyebrow="Control"
          items={memory.unresolvedAssumptions}
        />
        <ListCard title="Riesgos" eyebrow="Lectura" items={memory.risks} />
        <ListCard
          title="Qué no repetir"
          eyebrow="Anti-patrón"
          items={memory.patternsToAvoid}
        />
      </section>
    </Card>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-border bg-surface-raised p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <strong className="mt-2 block text-xl font-extrabold">{value}</strong>
    </div>
  );
}

function EvidenceItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-border px-5 py-1">
      <SectionLabel>{label}</SectionLabel>
      <p className="mt-3 text-base font-semibold leading-7 text-stone-800">
        {value}
      </p>
    </div>
  );
}

function ListCard({
  eyebrow,
  items,
  title,
}: {
  eyebrow: string;
  items: string[];
  title: string;
}) {
  return (
    <Card className="p-6">
      <SectionLabel>{eyebrow}</SectionLabel>
      <h3 className="mt-3 text-2xl font-extrabold">{title}</h3>
      <List items={items} />
    </Card>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 grid gap-2 text-sm leading-6 text-stone-700">
      {items.map((item) => (
        <li key={item}>• {item}</li>
      ))}
    </ul>
  );
}

function TextBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-5 rounded-[20px] border border-border bg-surface-raised p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-sm leading-6 text-stone-700">{value}</p>
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

function buildEvaluationDecision(idea: IdeationIdea | null) {
  if (!idea) return undefined;

  return {
    criticalAssumptions: idea.supuestoQueRompe,
    firstThingToTest: idea.primerPasoEjecutable ?? idea.mecanicaConcreta,
    risksToWatch: idea.antiPatronesAEvitar?.join(" · ") ?? "",
  };
}
