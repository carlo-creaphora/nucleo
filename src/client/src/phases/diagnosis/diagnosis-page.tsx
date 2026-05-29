import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageSquare,
  Send,
} from "lucide-react";
import {
  useAppState,
  type DiagnosisCorrection,
  type DiagnosisOutput,
  type DialogMessage,
} from "../../app-state.js";
import { Button } from "../../components/ui/button.js";
import { Card, SectionLabel } from "../../components/ui/card.js";
import { TextArea } from "../../components/ui/form-field.js";
import {
  getDiagnosisAudit,
  getDiagnosisCycle,
  getDiagnosisDraft,
  getDiagnosisVersions,
  getRegistration,
  getRegistrationByCycle,
  reinterpretDiagnosis,
  requestDiagnosisQuestion,
  saveDiagnosisDraft,
  type AuditEvent,
  type CriticalMissingPiece,
  type DiagnosisQuestion,
  type DiagnosisVersion,
} from "./diagnosis-api.js";

const promptChips = [
  "Tengo un problema de crecimiento",
  "Tengo una decisión bloqueada",
  "Quiero replantear una oferta",
];

const clarifiableSections: Array<{
  key: DiagnosisCorrection["section"];
  label: string;
  title: string;
  getItems: (diagnosis: DiagnosisOutput) => string[];
}> = [
  {
    key: "symptoms",
    label: "Síntomas",
    title: "Síntomas observados",
    getItems: (diagnosis) => diagnosis.symptoms,
  },
  {
    key: "causes",
    label: "Causas",
    title: "Causas probables",
    getItems: (diagnosis) => diagnosis.causes,
  },
  {
    key: "tensions",
    label: "Tensiones",
    title: "Tensión estratégica",
    getItems: (diagnosis) => diagnosis.tensions,
  },
  {
    key: "metrics",
    label: "Métricas",
    title: "Métrica prioritaria",
    getItems: (diagnosis) => diagnosis.metrics,
  },
  {
    key: "restrictions",
    label: "Restricciones",
    title: "Restricciones no negociables",
    getItems: (diagnosis) => diagnosis.restrictions,
  },
  {
    key: "notWorthAttackingYet",
    label: "No atacar todavía",
    title: "No conviene atacar todavía",
    getItems: (diagnosis) => diagnosis.notWorthAttackingYet,
  },
];

export function DiagnosisPage() {
  const {
    cycleId,
    diagnosis,
    diagnosisCorrections,
    diagnosisMessages,
    registration,
    registrationId,
    setActivePhaseId,
    setDiagnosis,
    setDiagnosisCorrections,
    setDiagnosisMessages,
    setRegistration,
  } = useAppState();
  const [composer, setComposer] = useState("");
  const [status, setStatus] = useState<
    "idle" | "question" | "reinterpret" | "recover"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [criticalMissing, setCriticalMissing] = useState<
    CriticalMissingPiece[]
  >([]);
  const [lastQuestion, setLastQuestion] = useState<DiagnosisQuestion | null>(
    null,
  );
  const [clarificationTarget, setClarificationTarget] = useState<{
    key: DiagnosisCorrection["section"];
    label: string;
  } | null>(null);
  const [versions, setVersions] = useState<DiagnosisVersion[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const canRun = Boolean(registration?.output?.contextForDiagnosis);
  const isBusy = status !== "idle";

  useEffect(() => {
    const recoverRegistration = async () => {
      if (registration?.output?.contextForDiagnosis) return;

      setStatus("recover");
      try {
        const result = registrationId
          ? await getRegistration(registrationId)
          : await getRegistrationByCycle(cycleId);

        if (!result) return;

        setRegistration(result.registration);
      } catch {
        setError("No se pudo recuperar el Registro guardado.");
      } finally {
        setStatus("idle");
      }
    };

    void recoverRegistration();
  }, [cycleId, registration, registrationId, setRegistration]);

  useEffect(() => {
    const recoverDiagnosisProgress = async () => {
      try {
        const [draft, cycle] = await Promise.all([
          getDiagnosisDraft(cycleId),
          diagnosis ? Promise.resolve(null) : getDiagnosisCycle(cycleId),
        ]);

        if (cycle?.diagnosis) {
          setDiagnosis(cycle.diagnosis);
        }

        if (draft) {
          setDiagnosisMessages(draft.dialogMessages);
          setDiagnosisCorrections(draft.correctedSections);
          setLastQuestion(draft.lastQuestion);
          setComposer(draft.composer);
        } else if (isStoredDiagnosisInput(cycle?.input)) {
          setDiagnosisMessages(cycle.input.dialogMessages);
          setDiagnosisCorrections(cycle.input.correctedSections);
          setLastQuestion(null);
        }
      } catch {
        setError("No se pudo recuperar el avance de Diagnóstico.");
      } finally {
        setDraftLoaded(true);
      }
    };

    void recoverDiagnosisProgress();
  }, [
    cycleId,
    diagnosis,
    setDiagnosis,
    setDiagnosisCorrections,
    setDiagnosisMessages,
  ]);

  useEffect(() => {
    if (!draftLoaded) return;

    const timeout = window.setTimeout(() => {
      void saveDiagnosisDraft(cycleId, {
        composer,
        correctedSections: diagnosisCorrections,
        dialogMessages: diagnosisMessages,
        lastQuestion,
      }).catch(() => {
        setError("No se pudo guardar el chat en progreso.");
      });
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [
    composer,
    cycleId,
    diagnosisCorrections,
    diagnosisMessages,
    draftLoaded,
    lastQuestion,
  ]);

  const payload = useMemo(() => {
    if (!registration?.output?.contextForDiagnosis) return null;

    return {
      cycleId,
      ...registration.output.contextForDiagnosis,
      correctedSections: diagnosisCorrections,
      dialogMessages: diagnosisMessages,
      previousCycleLearnings: [],
      userClarifications: [],
    };
  }, [cycleId, diagnosisCorrections, diagnosisMessages, registration]);

  const refreshTrace = async () => {
    const [versionResult, auditResult] = await Promise.all([
      getDiagnosisVersions(cycleId),
      getDiagnosisAudit(cycleId),
    ]);
    setVersions(versionResult.versions);
    setAuditEvents(auditResult.events);
  };

  const applyDiagnosisResult = async (
    result: {
      diagnosis?: DiagnosisOutput;
      question?: DiagnosisQuestion | null;
      criticalMissing: CriticalMissingPiece[];
      changeSummary?: { summary?: string };
    },
    baseMessages = diagnosisMessages,
  ) => {
    setCriticalMissing(result.criticalMissing);

    if (result.diagnosis) {
      setDiagnosis(result.diagnosis);
      setLastQuestion(null);
      await refreshTrace();
      return;
    }

    if (result.question) {
      setLastQuestion(result.question);
      setDiagnosisMessages([
        ...baseMessages,
        {
          role: "assistant",
          content: result.question.question,
        },
      ]);
    }
  };

  const sendMessage = async () => {
    if (!payload || !composer.trim()) return;

    const userMessage: DialogMessage = {
      role: "user",
      content: composer.trim(),
    };
    const nextMessages = [...diagnosisMessages, userMessage];
    setDiagnosisMessages(nextMessages);
    setComposer("");
    setError(null);

    if (clarificationTarget && diagnosis) {
      const nextCorrections = [
        ...diagnosisCorrections,
        {
          section: clarificationTarget.key,
          clarification: userMessage.content,
        },
      ];
      setDiagnosisCorrections(nextCorrections);
      setClarificationTarget(null);
      setStatus("reinterpret");

      try {
        const result = await reinterpretDiagnosis({
          input: {
            ...payload,
            correctedSections: nextCorrections,
            dialogMessages: nextMessages,
          },
          previousDiagnosis: diagnosis,
        });
        await applyDiagnosisResult(result, nextMessages);
        setDiagnosisMessages([
          ...nextMessages,
          {
            role: "assistant",
            content:
              result.changeSummary?.summary ??
              `Reinterpreté el diagnóstico usando la aclaración de ${clarificationTarget.label}.`,
          },
        ]);
      } catch (submitError) {
        setDiagnosisCorrections(diagnosisCorrections);
        setClarificationTarget(clarificationTarget);
        handleDiagnosisError(submitError);
      } finally {
        setStatus("idle");
      }
      return;
    }

    setStatus("question");
    try {
      await applyDiagnosisResult(
        await requestDiagnosisQuestion({
          ...payload,
          dialogMessages: nextMessages,
        }),
        nextMessages,
      );
    } catch (submitError) {
      handleDiagnosisError(submitError);
    } finally {
      setStatus("idle");
    }
  };

  const startClarification = (
    key: DiagnosisCorrection["section"],
    label: string,
  ) => {
    setClarificationTarget({ key, label });
    setComposer("");
    setDiagnosisMessages([
      ...diagnosisMessages,
      {
        role: "assistant",
        content: `Aclara ${label} con evidencia concreta. Escribe lo que obliga a corregir el diagnóstico, no una defensa de la lectura anterior.`,
      },
    ]);
    window.setTimeout(() => {
      composerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      composerRef.current?.focus();
    }, 50);
  };

  const handleDiagnosisError = (submitError: unknown) => {
    setError(
      submitError instanceof Error
        ? submitError.message
        : "No se pudo consultar Diagnóstico.",
    );
    setCriticalMissing(
      Array.isArray((submitError as { criticalMissing?: unknown }).criticalMissing)
        ? ((submitError as { criticalMissing: CriticalMissingPiece[] })
            .criticalMissing)
        : [],
    );
  };

  return (
    <div className="workspace-container">
      <section className="phase-hero">
        <SectionLabel>Diagnóstico estratégico</SectionLabel>
        <div className="mt-4">
          <div className="max-w-4xl">
            <h1 className="phase-title">
              Conversación para cerrar el reto real.
            </h1>
            <p className="phase-summary">
              La IA pregunta, detecta piezas críticas, cierra diagnóstico y
              permite reinterpretar secciones con trazabilidad.
            </p>
          </div>
        </div>
      </section>

      {!canRun && status !== "recover" && (
        <Notice>
          Registro debe guardarse antes de generar Diagnóstico.
        </Notice>
      )}

      {error && (
        <Notice tone="error">
          {error}
        </Notice>
      )}

      <section className="grid gap-5">
        <Card className="flex min-h-[620px] flex-col p-7">
          <SectionLabel>Conversación</SectionLabel>
          <h2 className="mt-3 text-xl font-semibold">
            Preguntas y respuestas
          </h2>

          <div className="mt-5 flex flex-wrap gap-2">
            {promptChips.map((prompt) => (
              <button
                className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-stone-600 transition hover:bg-muted"
                key={prompt}
                onClick={() => setComposer(prompt)}
                type="button"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="mt-6 flex-1 space-y-3 overflow-y-auto rounded-[22px] border border-border bg-surface-raised p-4">
            {diagnosisMessages.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
                <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                  Escribe el reto como lo dirías en una reunión. La primera
                  respuesta puede ser larga; después la IA pedirá lo que falte.
                </p>
              </div>
            ) : (
              diagnosisMessages.map((message, index) => (
                <div
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[86%] rounded-[20px] bg-black px-4 py-3 text-white"
                      : "mr-auto max-w-[86%] rounded-[20px] border border-border bg-white px-4 py-3 text-stone-700"
                  }
                  key={`${message.role}-${index}`}
                >
                  <p className="text-sm font-semibold">
                    {message.role === "user" ? "Usuario" : "Núcleo"}
                  </p>
                  <p className="mt-1 text-sm leading-6">{message.content}</p>
                </div>
              ))
            )}
          </div>

          {lastQuestion?.suggestedAngles.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {lastQuestion.suggestedAngles.map((angle) => (
                <button
                  className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-stone-600 transition hover:bg-muted"
                  key={angle}
                  onClick={() => setComposer(angle)}
                  type="button"
                >
                  {angle}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-4">
            <TextArea
              className="min-h-36"
              placeholder="Escribe tu respuesta o aclaración..."
              ref={composerRef}
              value={composer}
              onChange={(event) => setComposer(event.target.value)}
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:justify-end">
              {clarificationTarget && (
                <Button
                  onClick={() => setClarificationTarget(null)}
                  type="button"
                  variant="secondary"
                >
                  Cancelar aclaración
                </Button>
              )}
              <Button disabled={!canRun || isBusy || !composer.trim()} onClick={sendMessage}>
                {isBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar
              </Button>
            </div>
          </div>
        </Card>

        <DiagnosisResult
          diagnosis={diagnosis}
          onClarify={startClarification}
          clarificationActive={Boolean(clarificationTarget)}
        />

        <div className="flex justify-end">
          <Button
            disabled={!diagnosis || criticalMissing.length > 0 || isBusy}
            onClick={() => setActivePhaseId("signals")}
            variant="secondary"
          >
            <CheckCircle2 className="h-4 w-4" />
            Confirmar y consultar señales
          </Button>
        </div>
      </section>
    </div>
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

function DiagnosisResult({
  clarificationActive,
  diagnosis,
  onClarify,
}: {
  clarificationActive: boolean;
  diagnosis: DiagnosisOutput | null;
  onClarify: (key: DiagnosisCorrection["section"], label: string) => void;
}) {
  if (!diagnosis) {
    return (
      <Card className="flex min-h-[420px] flex-col justify-center p-7">
        <SectionLabel>Salida contractual</SectionLabel>
        <h2 className="mt-3 text-xl font-semibold">
          Diagnóstico pendiente
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
          Al cerrar, aquí aparecerán el reto recomendado, tensiones, métricas,
          restricciones y brief para Ideación.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      <Card className="p-7">
        <SectionLabel>Reto recomendado</SectionLabel>
        <div className="mt-4 flex items-start gap-3">
          <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-stone-900" />
          <div>
            <h2 className="text-2xl font-semibold leading-tight">
              {diagnosis.recommendedChallenge}
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {diagnosis.whyThisChallenge}
            </p>
            <div className="mt-6 border-t border-border pt-5">
              <SectionLabel>Supuesto a cuestionar</SectionLabel>
              <p className="mt-3 text-lg font-semibold leading-7 text-stone-900">
                {diagnosis.assumptionToQuestion}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-7">
        <SectionLabel>Lectura diagnóstica</SectionLabel>
        <div className="mt-5">
          {clarifiableSections.map((section) => (
            <DiagnosisRow
              disabled={clarificationActive}
              items={section.getItems(diagnosis)}
              key={section.key}
              onClarify={() => onClarify(section.key, section.label)}
              title={section.title}
            />
          ))}
        </div>
      </Card>

      <Card className="p-7">
        <SectionLabel>Brief para ideación</SectionLabel>
        <p className="mt-4 text-sm leading-6 text-stone-700">
          {diagnosis.ideationBrief}
        </p>
      </Card>
    </div>
  );
}

function DiagnosisRow({
  disabled = false,
  items,
  onClarify,
  title,
}: {
  disabled?: boolean;
  items: string[];
  onClarify?: () => void;
  title: string;
}) {
  return (
    <div className="border-b border-border py-5 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-stone-950">{title}</h3>
          <p className="mt-4 text-sm leading-6 text-stone-600">
            {formatDiagnosisItems(items)}
          </p>
        </div>
        {onClarify ? (
          <button
            className="shrink-0 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-stone-500 transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
            disabled={disabled}
            onClick={onClarify}
            type="button"
          >
            Aclarar
          </button>
        ) : null}
      </div>
    </div>
  );
}

function formatDiagnosisItems(items: string[]) {
  const cleanItems = items.map((item) => item.trim()).filter(Boolean);
  if (!cleanItems.length) return "Sin dato declarado.";
  return cleanItems.join(" ");
}

function isStoredDiagnosisInput(input: unknown): input is {
  dialogMessages: DialogMessage[];
  correctedSections: DiagnosisCorrection[];
} {
  if (!input || typeof input !== "object") return false;

  const candidate = input as {
    dialogMessages?: unknown;
    correctedSections?: unknown;
  };

  return (
    Array.isArray(candidate.dialogMessages) &&
    Array.isArray(candidate.correctedSections)
  );
}

function TracePanel({
  auditEvents,
  versions,
}: {
  auditEvents: AuditEvent[];
  versions: DiagnosisVersion[];
}) {
  return (
    <Card className="p-5">
      <SectionLabel>Trazabilidad</SectionLabel>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div>
          <h3 className="text-lg font-extrabold">Versiones</h3>
          <div className="mt-3 space-y-2">
            {versions.length ? (
              versions.map((version) => (
                <TraceRow
                  key={version.id}
                  label={`Versión ${version.version}`}
                  value={version.reason}
                />
              ))
            ) : (
              <TraceEmpty />
            )}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-extrabold">Auditoría</h3>
          <div className="mt-3 space-y-2">
            {auditEvents.length ? (
              auditEvents.slice(-4).map((event) => (
                <TraceRow
                  key={event.id}
                  label={event.action}
                  value={event.summary}
                />
              ))
            ) : (
              <TraceEmpty />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function TraceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-3">
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-1 text-sm leading-5 text-muted-foreground">{value}</p>
    </div>
  );
}

function TraceEmpty() {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-3">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock3 className="h-4 w-4" />
        Sin eventos todavía
      </p>
    </div>
  );
}
