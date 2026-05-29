import { useEffect, useState } from "react";
import { type ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  Loader2,
  Radar,
} from "lucide-react";
import {
  useAppState,
  type SignalGap,
  type SignalInsight,
  type SignalsAnalysisSection,
  type SignalsOutput,
} from "../../app-state.js";
import { Button } from "../../components/ui/button.js";
import { Card, SectionLabel } from "../../components/ui/card.js";
import { getDiagnosisCycle } from "../diagnosis/diagnosis-api.js";
import { getSignals, generateSignals } from "./signals-api.js";

export function SignalsPage() {
  const {
    cycleId,
    diagnosis,
    setActivePhaseId,
    setDiagnosis,
    setSignals,
    signals,
  } = useAppState();
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSavedProgress = async () => {
      const [existingSignals, existingDiagnosis] = await Promise.all([
        signals ? Promise.resolve(null) : getSignals(cycleId),
        diagnosis ? Promise.resolve(null) : getDiagnosisCycle(cycleId),
      ]);

      if (existingDiagnosis?.diagnosis) {
        setDiagnosis(existingDiagnosis.diagnosis);
      }

      if (existingSignals?.signals.output) {
        setSignals(existingSignals.signals.output);
      }
    };

    void loadSavedProgress();
  }, [cycleId, diagnosis, setDiagnosis, setSignals, signals]);

  const runSignals = async () => {
    setStatus("loading");
    setError(null);

    try {
      const record = await generateSignals(cycleId);
      setSignals(record.output);
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "No se pudo consultar Señales.",
      );
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className="workspace-container">
      <section className="phase-hero">
        <SectionLabel>Lectura de señales</SectionLabel>
        <div className="mt-4">
          <div className="max-w-4xl">
            <h1 className="phase-title">
              Señales públicas, gaps e insights para ideación.
            </h1>
            <p className="phase-summary">
              Consulta social listening, tendencias y competidores. La síntesis
              trabaja sobre evidencia encontrada y produce siempre 2 gaps y 2
              insights.
            </p>
          </div>
        </div>
      </section>

      {!diagnosis && (
        <Notice>Confirma Diagnóstico antes de consultar Señales.</Notice>
      )}

      {error && <Notice tone="error">{error}</Notice>}

      {!signals ? (
        <Card className="flex min-h-[420px] flex-col items-center justify-center p-10 text-center">
          <Radar className="h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">
            Señales pendientes
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            Cuando ejecutes la consulta, Núcleo mostrará análisis por lente, 2
            gaps, 2 insights, fuentes consultadas y memoria usada por la IA.
          </p>
        </Card>
      ) : (
        <SignalsResult signals={signals} />
      )}

      <div className="flex justify-end">
        {signals ? (
          <Button onClick={() => setActivePhaseId("ideation")} variant="secondary">
            Diseñar ruta de ideación
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button disabled={!diagnosis || status === "loading"} onClick={runSignals}>
            {status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Radar className="h-4 w-4" />
            )}
            Consultar señales
          </Button>
        )}
      </div>
    </div>
  );
}

function SignalsResult({ signals }: { signals: SignalsOutput }) {
  return (
    <>
      <section className="grid gap-5 xl:grid-cols-3">
        <AnalysisCard label="Social listening" value={signals.analisisSocialListening} />
        <AnalysisCard label="Tendencias" value={signals.analisisTendencias} />
        <AnalysisCard label="Competidores" value={signals.analisisCompetidores} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <SignalCollection
          items={signals.gaps}
          label="Gaps detectados"
          renderItem={(gap) => <GapCard gap={gap} />}
        />
        <SignalCollection
          items={signals.insights}
          label="Insights accionables"
          renderItem={(insight) => <InsightCard insight={insight} />}
        />
      </section>

      <section className="grid gap-5">
        <SourcesCard signals={signals} />
        <MemoryCard signals={signals} />
      </section>
    </>
  );
}

function AnalysisCard({
  label,
  value,
}: {
  label: string;
  value: SignalsAnalysisSection;
}) {
  return (
    <Card className="p-5">
      <SectionLabel>{label}</SectionLabel>
      <p className="mt-3 text-xl font-extrabold leading-tight">
        {value.summary}
      </p>
      <div className="mt-5 space-y-3">
        {[...value.findings, ...value.limitations].map((item) => (
          <p className="text-sm leading-6 text-muted-foreground" key={item}>
            {item}
          </p>
        ))}
      </div>
    </Card>
  );
}

function SignalCollection<T>({
  items,
  label,
  renderItem,
}: {
  items: T[];
  label: string;
  renderItem: (item: T) => ReactNode;
}) {
  return (
    <Card className="p-5">
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-5 space-y-4">{items.map(renderItem)}</div>
    </Card>
  );
}

function GapCard({ gap }: { gap: SignalGap }) {
  return (
    <article className="rounded-[20px] border border-border bg-surface-raised p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-xl font-extrabold leading-tight">{gap.title}</h3>
        <Badge>{gap.evidenceBase}</Badge>
      </div>
      <SignalField label="Estado actual" value={gap.estadoActualEmpresa} />
      <SignalField label="Potencial mercado" value={gap.potencialMercado} />
      <SignalField label="Brecha" value={gap.brecha} />
      <SignalField label="Implicación" value={gap.implicationForIdeation} />
    </article>
  );
}

function InsightCard({ insight }: { insight: SignalInsight }) {
  return (
    <article className="rounded-[20px] border border-border bg-surface-raised p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-xl font-extrabold leading-tight">{insight.title}</h3>
        <Badge>{insight.evidenceBase}</Badge>
      </div>
      <SignalField label="Cliente" value={insight.cliente} />
      <SignalField
        label="Comportamiento"
        value={insight.comportamientoObservado}
      />
      <SignalField label="Motivación" value={insight.motivacionODeseo} />
      <SignalField label="Prompt ideación" value={insight.promptParaIdeacion} />
    </article>
  );
}

function SignalField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-stone-700">{value}</p>
    </div>
  );
}

function SourcesCard({ signals }: { signals: SignalsOutput }) {
  const sources = signals.internal.fuentesConsultadas;

  return (
    <Card className="p-5">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
          <div>
            <SectionLabel>Fuentes consultadas</SectionLabel>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              {sources.length || 1} fuente(s) · {signals.generatedAt}
            </p>
          </div>
          <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition group-open:rotate-180" />
        </summary>
        <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-6 text-stone-700">
          {(sources.length ? sources : ["Sin fuentes registradas"]).map((source) => (
            <li key={source}>
              {source.startsWith("http") ? (
                <a
                  className="font-semibold underline underline-offset-4"
                  href={source}
                  rel="noreferrer"
                  target="_blank"
                >
                  {source}
                </a>
              ) : (
                source
              )}
            </li>
          ))}
        </ul>
      </details>
    </Card>
  );
}

function MemoryCard({ signals }: { signals: SignalsOutput }) {
  const memory = signals.memoriaEmpresa;

  return (
    <Card className="p-5">
      <SectionLabel>Memoria usada por IA</SectionLabel>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Antes de idear, el motor consulta ciclos cerrados de la empresa para
        evitar repetir errores y detectar patrones útiles.
      </p>
      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <MiniList label="Patrones a evitar" items={memory.avoidRepeating} />
        <MiniList label="Aprendizajes previos" items={memory.previousLearnings} />
        <MiniList label="Patrones de empresa" items={memory.companyPatterns} />
      </div>
    </Card>
  );
}

function MiniList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded-[18px] border border-border bg-surface-raised p-4">
      <h3 className="text-sm font-bold">{label}</h3>
      <ul className="mt-3 space-y-2">
        {(items.length ? items : ["Sin dato declarado."]).map((item) => (
          <li className="text-sm leading-6 text-muted-foreground" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Badge({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-black px-3 py-1 text-xs font-bold uppercase text-white">
      {children}
    </span>
  );
}

function Notice({
  children,
  tone = "default",
}: {
  children: string;
  tone?: "default" | "error";
}) {
  return (
    <div
      className={
        tone === "error"
          ? "rounded-[18px] border border-red-200 bg-red-50 px-5 py-4 shadow-sm"
          : "rounded-[18px] border border-border bg-white px-5 py-4 shadow-sm"
      }
    >
      <p
        className={
          tone === "error"
            ? "flex items-center gap-2 text-sm font-semibold text-red-800"
            : "flex items-center gap-2 text-sm font-semibold text-stone-700"
        }
      >
        <AlertCircle className="h-4 w-4" />
        {children}
      </p>
    </div>
  );
}
