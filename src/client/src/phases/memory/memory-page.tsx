import { useEffect, useMemo, useState } from "react";
import { Archive, ArrowRight, ChevronDown, Loader2 } from "lucide-react";
import {
  useAppState,
  type CycleMemory,
  type EvidenceReading,
  type PlaybookPhaseRecord,
} from "../../app-state.js";
import { Button } from "../../components/ui/button.js";
import { Card, SectionLabel } from "../../components/ui/card.js";
import { cn } from "../../lib/utils.js";
import { getDiagnosisCycle } from "../diagnosis/diagnosis-api.js";
import {
  getPlaybook,
  listCompanyMemories,
} from "../playbook/playbook-api.js";

const routeLabels: Record<EvidenceReading["methodologicalRoute"], string> = {
  advance: "Avanzar",
  discard: "Descartar idea",
  invalidate_challenge: "Invalidar reto",
  invalidate_signal: "Invalidar señal",
  iterate: "Iterar o ajustar",
};

const routeActions: Record<EvidenceReading["methodologicalRoute"], string> = {
  advance: "Ver Playbook",
  discard: "Volver a Ideación",
  invalidate_challenge: "Volver a Diagnóstico",
  invalidate_signal: "Volver a Señales",
  iterate: "Volver a Prototipo",
};

export function MemoryPage() {
  const {
    cycleId,
    playbookRecord,
    registration,
    setActivePhaseId,
    setPlaybookRecord,
  } = useAppState();
  const [records, setRecords] = useState<PlaybookPhaseRecord[]>([]);
  const [status, setStatus] = useState<"idle" | "loading">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMemory = async () => {
      setStatus("loading");
      setError(null);
      try {
        const current = playbookRecord ?? (await getPlaybook(cycleId));
        if (current) setPlaybookRecord(current);

        const companyId =
          current?.companyId ??
          registration?.companyId ??
          (await getDiagnosisCycle(cycleId))?.companyId ??
          null;
        const companyRecords = companyId ? await listCompanyMemories(companyId) : [];
        setRecords(mergeRecords(companyRecords, current));
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar memoria de ciclos.",
        );
      } finally {
        setStatus("idle");
      }
    };

    void loadMemory();
  }, [cycleId, playbookRecord, registration?.companyId, setPlaybookRecord]);

  const summary = useMemo(() => summarizeRecords(records), [records]);

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-8 px-8 py-8 xl:px-12">
      <section className="rounded-[28px] border border-border bg-surface px-10 py-9 shadow-workspace">
        <SectionLabel>Memoria de ciclos</SectionLabel>
        <div className="mt-4 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <h1 className="text-5xl font-extrabold leading-[1.02] tracking-normal">
              Aprendizaje acumulado, no archivo muerto.
            </h1>
            <p className="mt-5 max-w-3xl text-xl leading-8 text-muted-foreground">
              Cada ciclo cerrado queda en solo lectura con su ruta metodológica,
              evidencia, aprendizajes, riesgos y siguiente movimiento.
            </p>
          </div>
          <Button onClick={() => setActivePhaseId("registration")} variant="secondary">
            Nuevo ciclo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {error && <Notice>{error}</Notice>}

      <Card className="p-7">
        <SectionLabel>Regla de cierre</SectionLabel>
        <p className="mt-3 max-w-5xl text-base leading-7 text-stone-700">
          Un ciclo pasa a memoria cuando existe una ruta metodológica final
          confirmada desde Lectura de evidencias o Playbook. No se cierra por
          registrar resultados ni por leer evidencia sin decisión.
        </p>
      </Card>

      {status === "loading" ? (
        <Card className="p-10 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <h2 className="mt-4 text-3xl font-extrabold">Cargando memoria</h2>
        </Card>
      ) : records.length ? (
        <>
          <section className="grid gap-5 xl:grid-cols-5">
            <SummaryCard
              description="Ciclos cerrados en memoria solo lectura."
              label="Ciclos"
              value={String(records.length)}
            />
            <SummaryCard
              description="Retos que vuelven a aparecer."
              label="Problemas recurrentes"
              value={summary.recurrentProblems}
            />
            <SummaryCard
              description="Señales que reaparecen."
              label="Gaps e insights"
              value={summary.repeatedSignals}
            />
            <SummaryCard
              description="Ideas con evidencia registrada."
              label="Ideas probadas"
              value={summary.testedIdeas}
            />
            <SummaryCard
              description="Distribución metodológica."
              label="Estados"
              value={summary.routes}
            />
          </section>

          <Card className="p-7">
            <SectionLabel>Ciclos cerrados</SectionLabel>
            <div className="mt-5 grid gap-4">
              {records.map((record) => (
                <MemoryCycle
                  key={record.id}
                  onNavigate={() => navigateFromMemory(record, setActivePhaseId)}
                  record={record}
                />
              ))}
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-10 text-center">
          <Archive className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-4 text-3xl font-extrabold">Memoria vacía</h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Cierra un ciclo desde Lectura de evidencias para guardar aprendizaje
            personal y colectivo en modo solo lectura.
          </p>
        </Card>
      )}
    </div>
  );
}

function MemoryCycle({
  onNavigate,
  record,
}: {
  onNavigate: () => void;
  record: PlaybookPhaseRecord;
}) {
  const memory = record.memory;

  return (
    <details className="group rounded-[22px] border border-border bg-surface-raised">
      <summary className="grid cursor-pointer list-none gap-4 p-5 xl:grid-cols-[1fr_auto_auto] xl:items-center">
        <div>
          <h3 className="text-xl font-extrabold leading-tight">
            {memory.title || memory.selectedIdea || "Ciclo cerrado"}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold text-muted-foreground">
            <span>Fecha: {formatDate(record.closedAt || record.createdAt)}</span>
            <span>Idea: {truncate(memory.selectedIdea, 72)}</span>
            <span>Ruta IA: {routeLabels[record.recommendedRoute]}</span>
          </div>
        </div>
        <span
          className={cn(
            "w-fit rounded-full border px-4 py-2 text-sm font-extrabold",
            routeClass(record.methodologicalRoute),
          )}
        >
          {routeLabels[record.methodologicalRoute]}
        </span>
        <div className="flex items-center gap-2">
          <Button
            onClick={(event) => {
              event.preventDefault();
              onNavigate();
            }}
            type="button"
            variant="secondary"
          >
            {routeActions[record.methodologicalRoute]}
          </Button>
          <ChevronDown className="h-5 w-5 text-muted-foreground transition group-open:rotate-180" />
        </div>
      </summary>
      <div className="grid gap-5 border-t border-border p-5 xl:grid-cols-2">
        <TextPanel
          eyebrow="Lectura ejecutiva"
          items={[memory.evidenceReading, memory.nextRecommendedMove]}
          title="Qué dejó el ciclo"
        />
        <TextPanel
          eyebrow="Aprendizajes"
          items={memory.keyLearnings}
          title="Qué reutilizar"
        />
        <TextPanel
          eyebrow="Supuestos"
          items={[
            ...memory.validatedAssumptions.map((item) => `Validado: ${item}`),
            ...memory.unresolvedAssumptions.map((item) => `No resuelto: ${item}`),
          ]}
          title="Qué queda abierto"
        />
        <TextPanel
          eyebrow="Anti-patrones"
          items={[...memory.risks, ...memory.patternsToAvoid]}
          title="Qué no repetir"
        />
      </div>
    </details>
  );
}

function SummaryCard({
  description,
  label,
  value,
}: {
  description: string;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-6">
      <SectionLabel>{label}</SectionLabel>
      <strong className="mt-3 block text-2xl font-extrabold leading-tight">
        {value || "Sin repetición todavía"}
      </strong>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    </Card>
  );
}

function TextPanel({
  eyebrow,
  items,
  title,
}: {
  eyebrow: string;
  items: string[];
  title: string;
}) {
  return (
    <div className="rounded-[20px] border border-border bg-white p-5">
      <SectionLabel>{eyebrow}</SectionLabel>
      <h4 className="mt-3 text-xl font-extrabold">{title}</h4>
      <ul className="mt-4 grid gap-2 text-sm leading-6 text-stone-700">
        {items.filter(Boolean).map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
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

function summarizeRecords(records: PlaybookPhaseRecord[]) {
  const memories = records.map((record) => record.memory).filter(Boolean);
  const recurrentProblems = topRepeated(
    memories.map((memory) => memory.problem || memory.diagnosisSummary),
  );
  const repeatedSignals = topRepeated(
    memories.flatMap((memory) => splitSignalSummary(memory.signalSummary)),
  );
  const testedIdeas = topRepeated(memories.map((memory) => memory.selectedIdea));
  const routes = Object.entries(
    countBy(records.map((record) => routeLabels[record.methodologicalRoute])),
  )
    .map(([label, count]) => `${label}: ${count}`)
    .join(" · ");

  return {
    recurrentProblems:
      recurrentProblems.join(" · ") ||
      unique(memories.map((memory) => memory.problem)).slice(0, 2).join(" · "),
    repeatedSignals:
      repeatedSignals.join(" · ") ||
      unique(memories.flatMap((memory) => splitSignalSummary(memory.signalSummary)))
        .slice(0, 2)
        .join(" · "),
    routes,
    testedIdeas:
      testedIdeas.join(" · ") ||
      memories.map((memory) => memory.selectedIdea).slice(0, 2).join(" · "),
  };
}

function mergeRecords(
  records: PlaybookPhaseRecord[],
  current: PlaybookPhaseRecord | null,
) {
  const byCycle = new Map<string, PlaybookPhaseRecord>();
  records.forEach((record) => byCycle.set(record.cycleId, record));
  if (current?.memory) byCycle.set(current.cycleId, current);
  return [...byCycle.values()].sort((left, right) =>
    (right.closedAt || right.createdAt).localeCompare(left.closedAt || left.createdAt),
  );
}

function splitSignalSummary(summary: string) {
  return String(summary || "")
    .split("·")
    .map((item) => item.trim())
    .filter(Boolean);
}

function topRepeated(items: string[]) {
  return Object.entries(countBy(items.filter(Boolean)))
    .filter(([, count]) => count > 1)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([label, count]) => `${label} (${count})`);
}

function countBy(items: string[]) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = String(item || "").trim();
    if (!key) return counts;
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function unique(items: string[]) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function routeClass(route: EvidenceReading["methodologicalRoute"]) {
  if (route === "advance") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (route === "iterate") return "border-amber-200 bg-amber-50 text-amber-900";
  if (route === "discard") return "border-stone-200 bg-stone-100 text-stone-800";
  return "border-red-200 bg-red-50 text-red-900";
}

function navigateFromMemory(
  record: PlaybookPhaseRecord,
  setActivePhaseId: (phase: "playbook" | "prototype" | "ideation" | "diagnosis" | "signals") => void,
) {
  if (record.methodologicalRoute === "advance") return setActivePhaseId("playbook");
  if (record.methodologicalRoute === "iterate") return setActivePhaseId("prototype");
  if (record.methodologicalRoute === "discard") return setActivePhaseId("ideation");
  if (record.methodologicalRoute === "invalidate_challenge") {
    return setActivePhaseId("diagnosis");
  }
  return setActivePhaseId("signals");
}

function formatDate(value: string) {
  if (!value) return "N/D";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function truncate(value: string, maxLength: number) {
  if (!value || value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}
