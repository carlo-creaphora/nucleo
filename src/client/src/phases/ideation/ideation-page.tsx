import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Maximize2,
  Loader2,
  Plus,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  useAppState,
  type IdeationIdea,
  type IdeationOptions,
  type IdeationRuptureType,
  type IdeationSelection,
  type IdeationSet,
} from "../../app-state.js";
import { Button } from "../../components/ui/button.js";
import { Card, SectionLabel } from "../../components/ui/card.js";
import { TextArea, TextInput } from "../../components/ui/form-field.js";
import { cn } from "../../lib/utils.js";
import {
  generateIdeation,
  getIdeationOptions,
  getIdeationRun,
} from "./ideation-api.js";

type CompleteIdeationSelection = {
  ruptureType: IdeationRuptureType;
  gapTitle: string;
  insightTitle: string;
};

export function IdeationPage() {
  const {
    cycleId,
    ideationOptions,
    ideationSelection,
    ideationSets,
    setActivePhaseId,
    setIdeationOptions,
    setIdeationSelection,
    setIdeationSets,
    signals,
  } = useAppState();
  const [status, setStatus] = useState<"idle" | "loading" | "generating">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOptions = async () => {
      if (ideationOptions) return;
      setStatus("loading");
      setError(null);
      try {
        setIdeationOptions(await getIdeationOptions(cycleId));
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudieron cargar opciones de Ideación.",
        );
      } finally {
        setStatus("idle");
      }
    };

    void loadOptions();
  }, [cycleId, ideationOptions, setIdeationOptions]);

  useEffect(() => {
    const loadSavedIdeation = async () => {
      if (ideationSets.length) return;
      try {
        const savedSet = await getIdeationRun(cycleId);
        if (!savedSet) return;
        setIdeationSelection(savedSet.selection);
        setIdeationSets([savedSet]);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar Ideación guardada.",
        );
      }
    };

    void loadSavedIdeation();
  }, [
    cycleId,
    ideationSets.length,
    setIdeationSelection,
    setIdeationSets,
  ]);

  const selectedSet = useMemo(
    () =>
      ideationSets.find((set) =>
        isSameSelection(set.selection, ideationSelection),
      ),
    [ideationSelection, ideationSets],
  );

  const selectedCount = ideationSets.flatMap((set) =>
    set.ideas.filter((idea) => idea.selectedForEvaluation),
  ).length;

  const completeSelection = isCompleteSelection(ideationSelection);
  const generatedAiCount =
    selectedSet?.ideas.filter((idea) => idea.source === "ai").length ?? 0;

  const updateSelection = (patch: Partial<IdeationSelection>) => {
    setIdeationSelection({ ...ideationSelection, ...patch });
  };

  const runGeneration = async () => {
    if (!completeSelection) return;

    if (selectedSet && generatedAiCount >= 4) {
      setError("Esta ruta ya alcanzó el máximo de 4 ideas IA.");
      return;
    }

    setStatus("generating");
    setError(null);
    try {
      const output = await generateIdeation(
        cycleId,
        ideationSelection as CompleteIdeationSelection,
      );
      const normalizedIdeas = output.ideas.map((idea) => ({
        ...idea,
        selectedForEvaluation: Boolean(idea.selectedForEvaluation),
        source: idea.source ?? "ai",
      }));
      const existingIdeas = selectedSet?.ideas ?? [];
      const remainingAiSlots =
        4 - existingIdeas.filter((idea) => idea.source === "ai").length;
      const generatedIdeas = normalizedIdeas.slice(0, Math.max(0, remainingAiSlots));
      const nextSet: IdeationSet = {
        id: routeKey(ideationSelection as CompleteIdeationSelection),
        ideas: [...existingIdeas, ...generatedIdeas],
        route: output.route,
        selection: ideationSelection as CompleteIdeationSelection,
      };
      setIdeationSets(
        selectedSet
          ? ideationSets.map((set) =>
              set.id === selectedSet.id ? nextSet : set,
            )
          : [...ideationSets, nextSet],
      );
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "No se pudo generar Ideación.",
      );
    } finally {
      setStatus("idle");
    }
  };

  const updateIdea = (setId: string, ideaId: string, nextIdea: IdeationIdea) => {
    setIdeationSets(
      ideationSets.map((set) =>
        set.id === setId
          ? {
              ...set,
              ideas: set.ideas.map((idea) =>
                idea.id === ideaId ? nextIdea : idea,
              ),
            }
          : set,
      ),
    );
  };

  const addManualIdea = (
    set: IdeationSet | null,
    manual: Pick<IdeationIdea, "idea" | "supuestoQueRompe" | "mecanicaConcreta">,
  ) => {
    const targetSet =
      set ??
      buildManualSet(
        ideationSelection as CompleteIdeationSelection,
        ideationOptions,
      );
    const nextIdea: IdeationIdea = {
      ...manual,
      id: `${targetSet.id}-user-${Date.now()}`,
      routeId: targetSet.route.id,
      selectedForEvaluation: false,
      source: "user",
    };
    setIdeationSets(
      ideationSets.some((item) => item.id === targetSet.id)
        ? ideationSets.map((item) =>
            item.id === targetSet.id
              ? { ...item, ideas: [...item.ideas, nextIdea] }
              : item,
          )
        : [...ideationSets, { ...targetSet, ideas: [nextIdea] }],
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-8 px-8 py-8 xl:px-12">
      <section className="rounded-[28px] border border-border bg-surface px-10 py-9 shadow-workspace">
        <SectionLabel>Ideación disruptiva</SectionLabel>
        <div className="mt-4 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <h1 className="text-5xl font-extrabold leading-[1.02] tracking-normal">
              Rutas de ruptura desde gaps e insights.
            </h1>
            <p className="mt-5 max-w-3xl text-xl leading-8 text-muted-foreground">
              Elige ruptura, gap e insight. Cada combinación genera un set por
              ruta, una idea IA por vez, máximo 4 ideas IA por ruta. Las ideas
              manuales no tienen límite.
            </p>
          </div>
          <Button
            disabled={selectedCount === 0}
            onClick={() => setActivePhaseId("evaluation")}
            variant="secondary"
          >
            Evaluar ideas seleccionadas ({selectedCount})
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {!signals && !ideationOptions && <Notice>Genera Señales antes de idear.</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      <IdeationCanvas
        addManualIdea={addManualIdea}
        completeSelection={completeSelection}
        generatedAiCount={generatedAiCount}
        ideationOptions={ideationOptions}
        ideationSelection={ideationSelection}
        ideationSets={ideationSets}
        runGeneration={runGeneration}
        selectedCount={selectedCount}
        selectedSet={selectedSet ?? null}
        setActivePhaseId={setActivePhaseId}
        status={status}
        updateIdea={updateIdea}
        updateSelection={updateSelection}
      />

      <section className="grid gap-5 xl:grid-cols-3">
        <ChoiceColumn
          disabled={!ideationOptions}
          label="Nivel 1"
          title="Ruptura"
          items={(ideationOptions?.ruptureTypes ?? []).map((route) => ({
            active: ideationSelection.ruptureType === route.id,
            description: route.description,
            id: route.id,
            title: route.title,
            onClick: () =>
              updateSelection({
                gapTitle: null,
                insightTitle: null,
                ruptureType: route.id,
              }),
          }))}
        />
        <ChoiceColumn
          disabled={!ideationSelection.ruptureType}
          label="Nivel 2"
          title="Gap"
          items={(ideationOptions?.gaps ?? []).map((gap) => ({
            active: ideationSelection.gapTitle === gap.title,
            description: gap.implicationForIdeation,
            id: gap.title,
            title: gap.title,
            onClick: () =>
              updateSelection({ gapTitle: gap.title, insightTitle: null }),
          }))}
        />
        <ChoiceColumn
          disabled={!ideationSelection.gapTitle}
          label="Nivel 3"
          title="Insight"
          items={(ideationOptions?.insights ?? []).map((insight) => ({
            active: ideationSelection.insightTitle === insight.title,
            description: insight.promptParaIdeacion,
            id: insight.title,
            title: insight.title,
            onClick: () => updateSelection({ insightTitle: insight.title }),
          }))}
        />
      </section>

      <Card className="p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <SectionLabel>Ruta seleccionada</SectionLabel>
            <h2 className="mt-3 text-3xl font-extrabold">
              {completeSelection
                ? "Lista para generar idea"
                : "Completa ruptura, gap e insight"}
            </h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              {selectedSet
                ? `${generatedAiCount}/4 ideas IA generadas para esta ruta.`
                : "Aún no hay set creado para esta combinación."}
            </p>
          </div>
          <Button
            disabled={
              !completeSelection ||
              status === "generating" ||
              Boolean(selectedSet && generatedAiCount >= 4)
            }
            onClick={runGeneration}
          >
            {status === "generating" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {selectedSet ? "Generar otra idea" : "Generar idea"}
          </Button>
        </div>
      </Card>

      {status === "loading" ? (
        <Card className="p-10 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-base font-semibold text-muted-foreground">
            Cargando rutas, gaps e insights...
          </p>
        </Card>
      ) : (
        <section className="grid gap-5">
          {completeSelection && !selectedSet && (
            <Card className="p-7">
              <SectionLabel>Idea manual</SectionLabel>
              <h2 className="mt-3 text-3xl font-extrabold">
                Agregar idea propia sin esperar a la IA
              </h2>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                Las ideas manuales no tienen límite y también pueden
                seleccionarse para evaluación.
              </p>
              <ManualIdeaForm addManualIdea={(manual) => addManualIdea(null, manual)} />
            </Card>
          )}
          {ideationSets.length ? (
            ideationSets.map((set) => (
              <IdeaSetCard
                addManualIdea={addManualIdea}
                key={set.id}
                set={set}
                updateIdea={updateIdea}
              />
            ))
          ) : (
            <Card className="p-10 text-center">
              <Plus className="mx-auto h-8 w-8 text-muted-foreground" />
              <h2 className="mt-4 text-3xl font-extrabold">
                Todavía no hay ideas generadas
              </h2>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                Selecciona una ruta completa y genera la primera idea.
              </p>
            </Card>
          )}
        </section>
      )}
    </div>
  );
}

function IdeationCanvas({
  addManualIdea,
  completeSelection,
  generatedAiCount,
  ideationOptions,
  ideationSelection,
  ideationSets,
  runGeneration,
  selectedCount,
  selectedSet,
  setActivePhaseId,
  status,
  updateIdea,
  updateSelection,
}: {
  addManualIdea: (
    set: IdeationSet | null,
    manual: Pick<IdeationIdea, "idea" | "supuestoQueRompe" | "mecanicaConcreta">,
  ) => void;
  completeSelection: boolean;
  generatedAiCount: number;
  ideationOptions: IdeationOptions | null;
  ideationSelection: IdeationSelection;
  ideationSets: IdeationSet[];
  runGeneration: () => Promise<void>;
  selectedCount: number;
  selectedSet: IdeationSet | null;
  setActivePhaseId: (phaseId: "evaluation") => void;
  status: "idle" | "loading" | "generating";
  updateIdea: (setId: string, ideaId: string, nextIdea: IdeationIdea) => void;
  updateSelection: (patch: Partial<IdeationSelection>) => void;
}) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({
    dragging: false,
    startPanX: 0,
    startPanY: 0,
    startX: 0,
    startY: 0,
  });
  const [pan, setPan] = useState({ x: 0, y: -90 });
  const [zoom, setZoom] = useState(0.82);

  const selectedRoute = ideationOptions?.ruptureTypes.find(
    (route) => route.id === ideationSelection.ruptureType,
  );
  const selectedGap = ideationOptions?.gaps.find(
    (gap) => gap.title === ideationSelection.gapTitle,
  );
  const selectedInsight = ideationOptions?.insights.find(
    (insight) => insight.title === ideationSelection.insightTitle,
  );

  const zoomBy = (delta: number) => {
    setZoom((current) => clamp(Number((current + delta).toFixed(2)), 0.52, 1.18));
  };

  const fitCanvas = () => {
    setZoom(0.82);
    setPan({ x: 0, y: -90 });
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-4 border-b border-border bg-white px-6 py-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <SectionLabel>Canvas de ideación</SectionLabel>
          <h2 className="mt-2 text-2xl font-extrabold">
            Flujo navegable de ruptura, gap, insight e ideas.
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => zoomBy(-0.1)} size="icon" variant="secondary">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="rounded-full border border-border bg-surface-raised px-4 py-2 text-sm font-extrabold">
            {Math.round(zoom * 100)}%
          </span>
          <Button onClick={() => zoomBy(0.1)} size="icon" variant="secondary">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button onClick={fitCanvas} size="icon" variant="secondary">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            disabled={selectedCount === 0}
            onClick={() => setActivePhaseId("evaluation")}
            variant="secondary"
          >
            Evaluar ({selectedCount})
          </Button>
        </div>
      </div>
      <div
        className="relative h-[720px] cursor-grab overflow-hidden bg-[radial-gradient(circle_at_1px_1px,hsl(24_8%_78%/0.45)_1px,transparent_0)] [background-size:28px_28px] active:cursor-grabbing"
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("button,input,textarea,label")) {
            return;
          }
          dragRef.current = {
            dragging: true,
            startPanX: pan.x,
            startPanY: pan.y,
            startX: event.clientX,
            startY: event.clientY,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragRef.current.dragging) return;
          setPan({
            x: dragRef.current.startPanX + event.clientX - dragRef.current.startX,
            y: dragRef.current.startPanY + event.clientY - dragRef.current.startY,
          });
        }}
        onPointerUp={(event) => {
          dragRef.current.dragging = false;
          try {
            event.currentTarget.releasePointerCapture(event.pointerId);
          } catch {
            // Pointer capture may already be released by the browser.
          }
        }}
        onWheel={(event) => {
          event.preventDefault();
          setZoom((current) =>
            clamp(Number((current - event.deltaY * 0.001).toFixed(2)), 0.52, 1.18),
          );
        }}
        ref={frameRef}
      >
        <div
          className="absolute left-1/2 top-24 flex origin-top-left items-start gap-8 transition-transform duration-100"
          style={{
            transform: `translate(${pan.x - 650}px, ${pan.y}px) scale(${zoom})`,
            width: 1300,
          }}
        >
          <CanvasNode
            complete={Boolean(ideationSelection.ruptureType)}
            contextLabel="Nivel 1"
            contextValue="Qué tan lejos debe moverse la solución."
            title="Ruptura"
          >
            <CanvasChoices
              items={(ideationOptions?.ruptureTypes ?? []).map((route) => ({
                active: ideationSelection.ruptureType === route.id,
                description: route.description,
                id: route.id,
                title:
                  route.title === "Ruptura radical controlada"
                    ? "Radical controlada"
                    : route.title,
                onClick: () => {
                  updateSelection({
                    gapTitle: null,
                    insightTitle: null,
                    ruptureType: route.id,
                  });
                  setPan({ x: 0, y: -90 });
                  setZoom(0.82);
                },
              }))}
            />
          </CanvasNode>

          {ideationSelection.ruptureType && (
            <>
              <CanvasConnector />
              <CanvasNode
                complete={Boolean(ideationSelection.gapTitle)}
                contextLabel="Nivel 2"
                contextValue={selectedRoute?.title ?? "Ruptura seleccionada"}
                title="Gap"
              >
                <CanvasChoices
                  items={(ideationOptions?.gaps ?? []).map((gap) => ({
                    active: ideationSelection.gapTitle === gap.title,
                    description: gap.implicationForIdeation,
                    id: gap.title,
                    onClick: () =>
                      updateSelection({ gapTitle: gap.title, insightTitle: null }),
                    title: gap.title,
                  }))}
                />
              </CanvasNode>
            </>
          )}

          {ideationSelection.gapTitle && (
            <>
              <CanvasConnector />
              <CanvasNode
                complete={Boolean(ideationSelection.insightTitle)}
                contextLabel="Nivel 3"
                contextValue={selectedGap?.title ?? "Gap seleccionado"}
                title="Insight"
              >
                <CanvasChoices
                  items={(ideationOptions?.insights ?? []).map((insight) => ({
                    active: ideationSelection.insightTitle === insight.title,
                    description: insight.promptParaIdeacion,
                    id: insight.title,
                    onClick: () => updateSelection({ insightTitle: insight.title }),
                    title: insight.title,
                  }))}
                />
              </CanvasNode>
            </>
          )}

          {ideationSelection.insightTitle && (
            <>
              <CanvasConnector />
              <CanvasNode
                complete={Boolean(selectedSet)}
                contextLabel="Ruta"
                contextValue={selectedInsight?.title ?? "Insight seleccionado"}
                title={selectedSet ? "Set en construcción" : "Generar set"}
              >
                <p className="text-sm leading-6 text-muted-foreground">
                  {selectedSet
                    ? `${generatedAiCount}/4 ideas IA generadas. Puedes agregar manuales sin límite.`
                    : "Genera una idea IA o agrega una idea manual para esta combinación."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    disabled={
                      !completeSelection ||
                      status === "generating" ||
                      Boolean(selectedSet && generatedAiCount >= 4)
                    }
                    onClick={() => void runGeneration()}
                  >
                    {status === "generating" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {selectedSet ? "Otra idea IA" : "Generar idea"}
                  </Button>
                </div>
                {completeSelection && (
                  <ManualIdeaForm
                    addManualIdea={(manual) => addManualIdea(selectedSet, manual)}
                  />
                )}
              </CanvasNode>
            </>
          )}

          {ideationSets.length ? (
            <>
              <CanvasConnector />
              <CanvasOutput
                ideationSets={ideationSets}
                updateIdea={updateIdea}
              />
            </>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function CanvasNode({
  children,
  complete,
  contextLabel,
  contextValue,
  title,
}: {
  children: ReactNode;
  complete: boolean;
  contextLabel: string;
  contextValue: string;
  title: string;
}) {
  return (
    <article className="w-[330px] shrink-0 rounded-[28px] border border-border bg-white p-5 shadow-workspace">
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionLabel>{contextLabel}</SectionLabel>
          <h3 className="mt-2 text-2xl font-extrabold">{title}</h3>
        </div>
        <span
          className={cn(
            "grid h-9 w-9 place-items-center rounded-full border text-sm font-extrabold",
            complete
              ? "border-black bg-black text-white"
              : "border-border bg-surface-raised text-muted-foreground",
          )}
        >
          {complete ? <CheckCircle2 className="h-4 w-4" /> : "•"}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{contextValue}</p>
      <div className="mt-5">{children}</div>
    </article>
  );
}

function CanvasChoices({
  items,
}: {
  items: Array<{
    active: boolean;
    description: string;
    id: string;
    onClick: () => void;
    title: string;
  }>;
}) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <button
          className={cn(
            "rounded-[18px] border p-4 text-left transition",
            item.active
              ? "border-black bg-black text-white"
              : "border-border bg-surface-raised hover:bg-white",
          )}
          key={item.id}
          onClick={item.onClick}
          type="button"
        >
          <span className="block text-sm font-extrabold">{item.title}</span>
          <span
            className={cn(
              "mt-2 block text-xs leading-5",
              item.active ? "text-stone-200" : "text-muted-foreground",
            )}
          >
            {item.description}
          </span>
        </button>
      ))}
    </div>
  );
}

function CanvasConnector() {
  return (
    <div className="mt-36 h-px w-16 shrink-0 bg-stone-300">
      <div className="ml-auto mt-[-5px] h-3 w-3 rotate-45 border-r border-t border-stone-300" />
    </div>
  );
}

function CanvasOutput({
  ideationSets,
  updateIdea,
}: {
  ideationSets: IdeationSet[];
  updateIdea: (setId: string, ideaId: string, nextIdea: IdeationIdea) => void;
}) {
  return (
    <article className="w-[460px] shrink-0 rounded-[28px] border border-border bg-white p-5 shadow-workspace">
      <SectionLabel>Ideas generadas</SectionLabel>
      <h3 className="mt-2 text-2xl font-extrabold">
        {ideationSets.reduce((count, set) => count + set.ideas.length, 0)} ideas en canvas
      </h3>
      <div className="mt-5 grid max-h-[560px] gap-4 overflow-auto pr-2">
        {ideationSets.map((set) => (
          <div key={set.id}>
            <p className="mb-3 text-sm font-extrabold text-stone-700">
              {set.route.title}
            </p>
            <div className="grid gap-3">
              {set.ideas.map((idea) => (
                <article
                  className="rounded-[18px] border border-border bg-surface-raised p-4"
                  key={idea.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {idea.source === "user" ? "Manual" : "IA"}
                      </p>
                      <h4 className="mt-1 text-base font-extrabold leading-tight">
                        {idea.idea}
                      </h4>
                    </div>
                    <label className="shrink-0 rounded-full border border-border bg-white px-3 py-2 text-xs font-extrabold">
                      <input
                        checked={idea.selectedForEvaluation}
                        className="mr-2"
                        onChange={() =>
                          updateIdea(set.id, idea.id, {
                            ...idea,
                            selectedForEvaluation: !idea.selectedForEvaluation,
                          })
                        }
                        type="checkbox"
                      />
                      Evaluar
                    </label>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {idea.mecanicaConcreta}
                  </p>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function ChoiceColumn({
  disabled,
  items,
  label,
  title,
}: {
  disabled?: boolean;
  items: Array<{
    active: boolean;
    description: string;
    id: string;
    onClick: () => void;
    title: string;
  }>;
  label: string;
  title: string;
}) {
  return (
    <Card className="p-6">
      <SectionLabel>{label}</SectionLabel>
      <h2 className="mt-2 text-2xl font-extrabold">{title}</h2>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <button
            className={
              item.active
                ? "w-full rounded-[18px] border border-black bg-black p-4 text-left text-white"
                : "w-full rounded-[18px] border border-border bg-surface-raised p-4 text-left transition hover:bg-white"
            }
            disabled={disabled}
            key={item.id}
            onClick={item.onClick}
            type="button"
          >
            <span className="block text-base font-extrabold">{item.title}</span>
            <span
              className={
                item.active
                  ? "mt-2 block text-sm leading-6 text-stone-200"
                  : "mt-2 block text-sm leading-6 text-muted-foreground"
              }
            >
              {item.description}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}

function IdeaSetCard({
  addManualIdea,
  set,
  updateIdea,
}: {
  addManualIdea: (
    set: IdeationSet,
    manual: Pick<IdeationIdea, "idea" | "supuestoQueRompe" | "mecanicaConcreta">,
  ) => void;
  set: IdeationSet;
  updateIdea: (setId: string, ideaId: string, nextIdea: IdeationIdea) => void;
}) {
  return (
    <Card className="p-7">
      <SectionLabel>{set.route.title}</SectionLabel>
      <div className="mt-3 flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold">
            {set.ideas.length} idea(s) en esta ruta
          </h2>
          <p className="mt-2 text-base leading-7 text-muted-foreground">
            {set.selection.gapTitle} · {set.selection.insightTitle}
          </p>
        </div>
        <span className="rounded-full bg-muted px-4 py-2 text-sm font-bold text-stone-600">
          IA {set.ideas.filter((idea) => idea.source === "ai").length}/4
        </span>
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        {set.ideas.map((idea) => (
          <IdeaCard
            idea={idea}
            key={idea.id}
            onToggle={() =>
              updateIdea(set.id, idea.id, {
                ...idea,
                selectedForEvaluation: !idea.selectedForEvaluation,
              })
            }
          />
        ))}
      </div>
      <ManualIdeaForm addManualIdea={(manual) => addManualIdea(set, manual)} />
    </Card>
  );
}

function IdeaCard({
  idea,
  onToggle,
}: {
  idea: IdeationIdea;
  onToggle: () => void;
}) {
  return (
    <article className="rounded-[22px] border border-border bg-surface-raised p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {idea.source === "user" ? "Manual" : "IA"}
          </p>
          <h3 className="mt-2 text-2xl font-extrabold leading-tight">
            {idea.idea}
          </h3>
        </div>
        <label className="flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-sm font-bold">
          <input
            checked={idea.selectedForEvaluation}
            onChange={onToggle}
            type="checkbox"
          />
          Evaluar
        </label>
      </div>
      <IdeaField label="Supuesto que rompe" value={idea.supuestoQueRompe} />
      <IdeaField label="Mecánica concreta" value={idea.mecanicaConcreta} />
      {idea.porQueFunciona && (
        <IdeaField label="Por qué funciona" value={idea.porQueFunciona} />
      )}
      {idea.casoAnalogo && (
        <IdeaField label="Caso análogo" value={idea.casoAnalogo} />
      )}
      {idea.metricaQueMueve && (
        <IdeaField label="Métrica que mueve" value={idea.metricaQueMueve} />
      )}
      {idea.primerPasoEjecutable && (
        <IdeaField label="Primer paso ejecutable" value={idea.primerPasoEjecutable} />
      )}
      {idea.antiPatronesAEvitar?.length ? (
        <IdeaField
          label="Anti-patrones a evitar"
          value={idea.antiPatronesAEvitar.join(" · ")}
        />
      ) : null}
    </article>
  );
}

function IdeaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-stone-700">{value}</p>
    </div>
  );
}

function ManualIdeaForm({
  addManualIdea,
}: {
  addManualIdea: (
    manual: Pick<IdeationIdea, "idea" | "supuestoQueRompe" | "mecanicaConcreta">,
  ) => void;
}) {
  const [idea, setIdea] = useState("");
  const [assumption, setAssumption] = useState("");
  const [mechanism, setMechanism] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      className="mt-6 rounded-[22px] border border-border bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!idea.trim() || !assumption.trim() || !mechanism.trim()) {
          setError("Completa idea, supuesto y mecánica.");
          return;
        }
        addManualIdea({
          idea: idea.trim(),
          mecanicaConcreta: mechanism.trim(),
          supuestoQueRompe: assumption.trim(),
        });
        setIdea("");
        setAssumption("");
        setMechanism("");
        setError("");
      }}
    >
      <SectionLabel>Idea manual</SectionLabel>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <TextInput
          placeholder="Redacta la idea"
          value={idea}
          onChange={(event) => setIdea(event.target.value)}
        />
        <TextInput
          placeholder="Supuesto que rompe"
          value={assumption}
          onChange={(event) => setAssumption(event.target.value)}
        />
        <TextArea
          className="min-h-14 xl:col-span-1"
          placeholder="Mecánica concreta"
          value={mechanism}
          onChange={(event) => setMechanism(event.target.value)}
        />
      </div>
      {error && <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
      <div className="mt-4 flex justify-end">
        <Button type="submit" variant="secondary">
          <Plus className="h-4 w-4" />
          Agregar idea propia
        </Button>
      </div>
    </form>
  );
}

function isCompleteSelection(
  selection: IdeationSelection,
): selection is CompleteIdeationSelection {
  return Boolean(
    selection.ruptureType && selection.gapTitle && selection.insightTitle,
  );
}

function isSameSelection(
  left: CompleteIdeationSelection,
  right: IdeationSelection,
) {
  return (
    left.ruptureType === right.ruptureType &&
    left.gapTitle === right.gapTitle &&
    left.insightTitle === right.insightTitle
  );
}

function routeKey(selection: CompleteIdeationSelection) {
  return `${selection.ruptureType}::${selection.gapTitle}::${selection.insightTitle}`;
}

function buildManualSet(
  selection: CompleteIdeationSelection,
  options: IdeationOptions | null,
): IdeationSet {
  const routeOption = options?.ruptureTypes.find(
    (route) => route.id === selection.ruptureType,
  );

  return {
    id: routeKey(selection),
    ideas: [],
    route: {
      guidingQuestion: routeOption?.guidingQuestion ?? "",
      id: selection.ruptureType,
      purpose: routeOption?.description ?? "",
      riskLevel:
        selection.ruptureType === "RUPTURA_MODERADA"
          ? "bajo"
          : selection.ruptureType === "RUPTURA_FUERTE"
            ? "medio"
            : "alto_controlado",
      ruptureType: selection.ruptureType,
      title: routeOption?.title ?? selection.ruptureType,
      usesGapTitles: [selection.gapTitle],
      usesInsightTitles: [selection.insightTitle],
      verb:
        selection.ruptureType === "RUPTURA_MODERADA"
          ? "mejorar"
          : selection.ruptureType === "RUPTURA_FUERTE"
            ? "transformar"
            : "romper",
    },
    selection,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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
