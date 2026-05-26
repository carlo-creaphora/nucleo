import { useEffect, useMemo, useState } from "react";
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
  completeDiagnosis,
  getDiagnosisAudit,
  getDiagnosisVersions,
  getRegistration,
  reinterpretDiagnosis,
  requestDiagnosisQuestion,
  type AuditEvent,
  type CriticalMissingPiece,
  type DiagnosisQuestion,
  type DiagnosisVersion,
} from "./diagnosis-api.js";
import { demoDiagnosisResponse } from "./diagnosis-demo.js";

const promptChips = [
  "Tengo un problema de crecimiento",
  "Tengo una decisión bloqueada",
  "Quiero replantear una oferta",
];

const clarifiableSections: Array<{
  key: DiagnosisCorrection["section"];
  label: string;
  getItems: (diagnosis: DiagnosisOutput) => string[];
}> = [
  { key: "symptoms", label: "Síntomas", getItems: (diagnosis) => diagnosis.symptoms },
  { key: "causes", label: "Causas", getItems: (diagnosis) => diagnosis.causes },
  { key: "tensions", label: "Tensiones", getItems: (diagnosis) => diagnosis.tensions },
  { key: "metrics", label: "Métricas", getItems: (diagnosis) => diagnosis.metrics },
  {
    key: "restrictions",
    label: "Restricciones",
    getItems: (diagnosis) => diagnosis.restrictions,
  },
  {
    key: "notWorthAttackingYet",
    label: "No atacar todavía",
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
  const [composer, setComposer] = useState(demoDiagnosisResponse);
  const [status, setStatus] = useState<
    "idle" | "question" | "complete" | "reinterpret" | "recover"
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

  const canRun = Boolean(registration?.output?.contextForDiagnosis);
  const isBusy = status !== "idle";
  const userTurnCount = diagnosisMessages.filter(
    (message) => message.role === "user",
  ).length;

  useEffect(() => {
    const recoverRegistration = async () => {
      const id = registration?.id ?? registrationId;

      if (!id || registration?.output?.contextForDiagnosis) return;

      setStatus("recover");
      try {
        const result = await getRegistration(id);
        setRegistration(result.registration);
      } catch {
        setError("No se pudo recuperar el Registro guardado.");
      } finally {
        setStatus("idle");
      }
    };

    void recoverRegistration();
  }, [registration, registrationId, setRegistration]);

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

  const closeDiagnosis = async () => {
    if (!payload) {
      setError("Completa Registro antes de cerrar Diagnóstico.");
      return;
    }

    if (userTurnCount === 0) {
      setError("Escribe al menos una respuesta antes de cerrar Diagnóstico.");
      return;
    }

    setStatus("complete");
    setError(null);

    try {
      await applyDiagnosisResult(await completeDiagnosis(payload));
    } catch (submitError) {
      handleDiagnosisError(submitError);
      setDiagnosisMessages([
        ...diagnosisMessages,
        {
          role: "assistant",
          content:
            "No cierro el diagnóstico todavía. Responde las piezas críticas faltantes y vuelve a cerrar.",
        },
      ]);
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
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-8 px-8 py-8 xl:px-12">
      <section className="rounded-[28px] border border-border bg-surface px-10 py-9 shadow-workspace">
        <SectionLabel>Diagnóstico estratégico</SectionLabel>
        <div className="mt-4 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <h1 className="text-5xl font-extrabold leading-[1.02] tracking-normal">
              Conversación para cerrar el reto real.
            </h1>
            <p className="mt-5 max-w-3xl text-xl leading-8 text-muted-foreground">
              La IA pregunta, detecta piezas críticas, cierra diagnóstico y
              permite reinterpretar secciones con trazabilidad.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              disabled={!diagnosis || criticalMissing.length > 0 || isBusy}
              onClick={() => setActivePhaseId("signals")}
              variant="secondary"
            >
              Confirmar y consultar señales
            </Button>
            <Button disabled={!canRun || isBusy} onClick={closeDiagnosis}>
              {isBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Cerrar diagnóstico
            </Button>
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

      {criticalMissing.length > 0 && (
        <Card className="border-red-200 bg-red-50 p-7 shadow-sm">
          <SectionLabel className="text-red-700">Piezas faltantes</SectionLabel>
          <div className="mt-4 space-y-3">
            {criticalMissing.map((item) => (
              <p className="text-base leading-7 text-red-900" key={item.key}>
                <strong>{item.key}:</strong> {item.reason}
              </p>
            ))}
          </div>
        </Card>
      )}

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="flex min-h-[620px] flex-col p-7">
          <SectionLabel>Conversación</SectionLabel>
          <h2 className="mt-3 text-3xl font-extrabold">
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
                <p className="mt-3 max-w-sm text-base leading-7 text-muted-foreground">
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
                  <p className="mt-1 text-base leading-7">{message.content}</p>
                </div>
              ))
            )}
          </div>

          {lastQuestion && (
            <div className="mt-4 rounded-[20px] border border-border bg-white p-4">
              <SectionLabel>Por qué importa</SectionLabel>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {lastQuestion.whyItMatters}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lastQuestion.suggestedAngles.map((angle) => (
                  <span
                    className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-stone-600"
                    key={angle}
                  >
                    {angle}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <TextArea
              className="min-h-36"
              placeholder="Escribe tu respuesta o aclaración..."
              value={composer}
              onChange={(event) => setComposer(event.target.value)}
            />
            <div className="mt-3 flex justify-end gap-3">
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

        <div className="flex flex-col gap-5">
          <DiagnosisResult
            diagnosis={diagnosis}
            onClarify={startClarification}
            clarificationActive={Boolean(clarificationTarget)}
          />
          <TracePanel auditEvents={auditEvents} versions={versions} />
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
        <h2 className="mt-3 text-3xl font-extrabold">
          Diagnóstico pendiente
        </h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          Al cerrar, aquí aparecerán el reto recomendado, tensiones, métricas,
          restricciones y brief para Ideación.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-7">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-stone-900" />
        <div>
          <SectionLabel>Diagnóstico cerrado</SectionLabel>
          <h2 className="mt-3 text-3xl font-extrabold">
            {diagnosis.recommendedChallenge}
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            {diagnosis.whyThisChallenge}
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-4">
        {clarifiableSections.map((section) => (
          <DiagnosisList
            disabled={clarificationActive}
            items={section.getItems(diagnosis)}
            key={section.key}
            onClarify={() => onClarify(section.key, section.label)}
            title={section.label}
          />
        ))}
      </div>

      <div className="mt-6 rounded-[20px] border border-border bg-surface-raised p-5">
        <SectionLabel>Supuesto a cuestionar</SectionLabel>
        <p className="mt-3 text-lg font-bold leading-7">
          {diagnosis.assumptionToQuestion}
        </p>
      </div>

      <div className="mt-4 rounded-[20px] border border-border bg-white p-5">
        <SectionLabel>Brief para ideación</SectionLabel>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          {diagnosis.ideationBrief}
        </p>
      </div>
    </Card>
  );
}

function DiagnosisList({
  disabled,
  items,
  onClarify,
  title,
}: {
  disabled: boolean;
  items: string[];
  onClarify: () => void;
  title: string;
}) {
  return (
    <div className="rounded-[18px] border border-border bg-surface-raised p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-stone-900">{title}</p>
        <button
          className="rounded-full border border-border bg-white px-3 py-1 text-xs font-bold text-stone-600 transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
          disabled={disabled}
          onClick={onClarify}
          type="button"
        >
          Aclarar
        </button>
      </div>
      <ul className="mt-3 space-y-2">
        {(items.length ? items : ["Sin dato declarado"]).map((item) => (
          <li className="text-sm leading-6 text-muted-foreground" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
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
    <Card className="p-7">
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
