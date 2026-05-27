import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  Fullscreen,
  Maximize2,
  Minimize2,
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
  type PrototypeIdeaType,
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

type ManualIdeaInput = Pick<
  IdeationIdea,
  "idea" | "tipoDeIdea" | "supuestoQueRompe" | "mecanicaConcreta" | "porQueFunciona"
>;

const prototypeIdeaTypes: PrototypeIdeaType[] = [
  "Servicio / experiencia",
  "Producto digital / interfaz",
  "Proceso / operación",
  "Modelo comercial / acceso",
  "Producto físico / tangible",
];

export function IdeationPage() {
  const {
    cycleId,
    diagnosis,
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
    manual: ManualIdeaInput,
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
    <div className="workspace-container">
      <section className="phase-hero">
        <SectionLabel>Ideación disruptiva</SectionLabel>
        <div className="mt-4">
          <div className="max-w-4xl">
            <h1 className="phase-title">
              Rutas de ruptura desde gaps e insights.
            </h1>
            <p className="phase-summary">
              Elige ruptura, gap e insight. Cada combinación genera un set por
              ruta, una idea IA por vez, máximo 4 ideas IA por ruta. Las ideas
              manuales no tienen límite.
            </p>
          </div>
        </div>
      </section>

      {!signals && !ideationOptions && <Notice>Genera Señales antes de idear.</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      <IdeationCanvas
        addManualIdea={addManualIdea}
        completeSelection={completeSelection}
        generatedAiCount={generatedAiCount}
        recommendedChallenge={diagnosis?.recommendedChallenge ?? "Reto recomendado"}
        ideationOptions={ideationOptions}
        ideationSelection={ideationSelection}
        ideationSets={ideationSets}
        runGeneration={runGeneration}
        selectedSet={selectedSet ?? null}
        status={status}
        updateIdea={updateIdea}
        updateSelection={updateSelection}
      />

      <div className="flex justify-end">
        <Button
          disabled={selectedCount === 0}
          onClick={() => setActivePhaseId("evaluation")}
          variant="secondary"
        >
          Evaluar ideas seleccionadas ({selectedCount})
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function IdeationCanvas({
  addManualIdea,
  completeSelection,
  generatedAiCount,
  recommendedChallenge,
  ideationOptions,
  ideationSelection,
  ideationSets,
  runGeneration,
  selectedSet,
  status,
  updateIdea,
  updateSelection,
}: {
  addManualIdea: (
    set: IdeationSet | null,
    manual: ManualIdeaInput,
  ) => void;
  completeSelection: boolean;
  generatedAiCount: number;
  recommendedChallenge: string;
  ideationOptions: IdeationOptions | null;
  ideationSelection: IdeationSelection;
  ideationSets: IdeationSet[];
  runGeneration: () => Promise<void>;
  selectedSet: IdeationSet | null;
  status: "idle" | "loading" | "generating";
  updateIdea: (setId: string, ideaId: string, nextIdea: IdeationIdea) => void;
  updateSelection: (patch: Partial<IdeationSelection>) => void;
}) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);
  const canvasWidth = Math.max(1500, ideationSets.length * 500 + 240);
  const dragRef = useRef({
    dragging: false,
    moved: false,
    startPanX: 0,
    startPanY: 0,
    startX: 0,
    startY: 0,
  });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.9);
  const [autoMoving, setAutoMoving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const selectedRoute = ideationOptions?.ruptureTypes.find(
    (route) => route.id === ideationSelection.ruptureType,
  );
  useEffect(() => {
    if (initializedRef.current) return;
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    initializedRef.current = true;
    setPan({ x: (rect.width - canvasWidth * zoom) / 2, y: 0 });
  }, [zoom]);

  const focusNextLevel = () => {
    const rect = frameRef.current?.getBoundingClientRect();
    const nextZoom = 0.78;
    setAutoMoving(true);
    setZoom(nextZoom);
    setPan((current) => ({
      x: rect ? (rect.width - canvasWidth * nextZoom) / 2 : current.x,
      y: current.y - 120,
    }));
    window.setTimeout(() => setAutoMoving(false), 720);
  };

  const zoomAt = (clientX: number, clientY: number, nextZoom: number) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) {
      setZoom(nextZoom);
      return;
    }
    const cursorX = clientX - rect.left;
    const cursorY = clientY - rect.top;
    setPan((currentPan) => {
      const worldX = (cursorX - currentPan.x) / zoom;
      const worldY = (cursorY - currentPan.y) / zoom;
      return {
        x: cursorX - worldX * nextZoom,
        y: cursorY - worldY * nextZoom,
      };
    });
    setZoom(nextZoom);
  };

  const zoomBy = (delta: number) => {
    const rect = frameRef.current?.getBoundingClientRect();
    const nextZoom = clamp(Number((zoom + delta).toFixed(2)), 0.48, 1.16);
    zoomAt(
      (rect?.left ?? 0) + (rect?.width ?? 0) / 2,
      (rect?.top ?? 0) + (rect?.height ?? 0) / 2,
      nextZoom,
    );
  };

  const fitCanvas = () => {
    const nextZoom = 0.9;
    const rect = frameRef.current?.getBoundingClientRect();
    setAutoMoving(true);
    setZoom(nextZoom);
    setPan({ x: rect ? (rect.width - canvasWidth * nextZoom) / 2 : 0, y: 0 });
    window.setTimeout(() => setAutoMoving(false), 720);
  };

  const toggleFullscreen = async () => {
    const shell = shellRef.current;
    if (!shell) return;

    if (document.fullscreenElement === shell) {
      await document.exitFullscreen();
      return;
    }

    await shell.requestFullscreen();
  };

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      zoomAt(
        event.clientX,
        event.clientY,
        clamp(Number((zoom - event.deltaY * 0.0012).toFixed(2)), 0.48, 1.16),
      );
    };

    frame.addEventListener("wheel", handleWheel, { passive: false });
    return () => frame.removeEventListener("wheel", handleWheel);
  }, [zoom]);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(document.fullscreenElement === shellRef.current);
    };

    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  return (
    <div ref={shellRef}>
    <Card
      className={cn(
        "overflow-hidden p-0",
        isFullscreen && "flex h-screen flex-col rounded-none border-0",
      )}
    >
      <div className="flex flex-col gap-4 border-b border-border bg-white px-6 py-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <SectionLabel>Reto recomendado</SectionLabel>
          <h2 className="mt-2 text-2xl font-extrabold">
            {recommendedChallenge}
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
          <Button onClick={() => void toggleFullscreen()} size="icon" variant="secondary">
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Fullscreen className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <div
        className={cn(
          "relative h-[820px] cursor-grab select-none overflow-hidden overscroll-contain bg-[radial-gradient(circle_at_1px_1px,hsl(24_8%_78%/0.45)_1px,transparent_0)] [background-size:28px_28px] active:cursor-grabbing",
          isFullscreen && "h-auto flex-1",
        )}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("button,input,textarea,label,select")) {
            return;
          }
          event.preventDefault();
          setAutoMoving(false);
          dragRef.current = {
            dragging: true,
            moved: false,
            startPanX: pan.x,
            startPanY: pan.y,
            startX: event.clientX,
            startY: event.clientY,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragRef.current.dragging) return;
          const dx = event.clientX - dragRef.current.startX;
          const dy = event.clientY - dragRef.current.startY;
          if (Math.abs(dx) + Math.abs(dy) > 3) dragRef.current.moved = true;
          setPan({
            x: dragRef.current.startPanX + dx,
            y: dragRef.current.startPanY + dy,
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
        ref={frameRef}
      >
        <div
          className={cn(
            "absolute left-0 top-10 origin-top-left select-none",
            autoMoving && "transition-transform duration-700 ease-out",
          )}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: "max-content",
          }}
        >
          <div
            className="flex flex-col items-center gap-10"
            style={{ width: canvasWidth }}
          >
            <CanvasLevel
              eyebrow="Ruptura"
              title="Selecciona qué tan lejos debe moverse la solución."
            >
              <CanvasChoices
                variant="large"
                items={(ideationOptions?.ruptureTypes ?? []).map((route) => ({
                  active: ideationSelection.ruptureType === route.id,
                  description: route.description,
                  id: route.id,
                  title: route.title,
                  onClick: () => {
                    updateSelection({
                      gapTitle: null,
                      insightTitle: null,
                      ruptureType: route.id,
                    });
                    focusNextLevel();
                  },
                }))}
              />
            </CanvasLevel>

            {ideationSelection.ruptureType && (
              <>
                <CanvasArrow />
                <CanvasLevel
                  eyebrow="Insights"
                  title="Selecciona la tensión del comprador."
                >
                  <CanvasChoices
                    items={(ideationOptions?.insights ?? []).map((insight) => ({
                      active: ideationSelection.insightTitle === insight.title,
                      description: insight.promptParaIdeacion,
                      id: insight.title,
                      onClick: () => {
                        updateSelection({ insightTitle: insight.title });
                        focusNextLevel();
                      },
                      title: insight.title,
                    }))}
                  />
                </CanvasLevel>
              </>
            )}

            {ideationSelection.insightTitle && (
              <>
                <CanvasArrow />
                <CanvasLevel eyebrow="Gaps" title="Selecciona la brecha a atacar.">
                  <CanvasChoices
                    items={(ideationOptions?.gaps ?? []).map((gap) => ({
                      active: ideationSelection.gapTitle === gap.title,
                      description: gap.implicationForIdeation,
                      id: gap.title,
                      onClick: () => {
                        updateSelection({ gapTitle: gap.title });
                        focusNextLevel();
                      },
                      title: gap.title,
                    }))}
                  />
                </CanvasLevel>
              </>
            )}

            {completeSelection && (
              <>
                <CanvasArrow />
                <RouteBuilderCard
                  generatedAiCount={generatedAiCount}
                  ideationSelection={ideationSelection as CompleteIdeationSelection}
                  runGeneration={runGeneration}
                  ruptureTitle={selectedRoute?.title ?? ideationSelection.ruptureType ?? ""}
                  selectedSet={selectedSet}
                  status={status}
                />
              </>
            )}

            {ideationSets.length ? (
              <>
                <CanvasArrow />
                <CanvasOutput
                  addManualIdea={addManualIdea}
                  ideationSets={ideationSets}
                  updateIdea={updateIdea}
                />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
    </div>
  );
}

function CanvasLevel({
  children,
  eyebrow,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="w-full">
      <div className="mx-auto mb-8 max-w-5xl select-none text-left">
        <SectionLabel>{eyebrow}</SectionLabel>
        <h3 className="mt-3 text-4xl font-semibold leading-tight">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function CanvasArrow() {
  return (
    <div className="flex h-12 flex-col items-center justify-center text-stone-300">
      <div className="h-9 w-px bg-stone-300" />
      <div className="-mt-2 h-3 w-3 rotate-45 border-b border-r border-stone-300" />
    </div>
  );
}

function CanvasChoices({
  items,
  variant = "normal",
}: {
  items: Array<{
    active: boolean;
    description: string;
    id: string;
    onClick: () => void;
    title: string;
  }>;
  variant?: "large" | "normal";
}) {
  return (
    <div className="flex flex-wrap justify-center gap-5">
      {items.map((item) => (
        <button
          className={cn(
            "min-h-[220px] w-[360px] select-none rounded-[26px] border bg-white p-7 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-workspace",
            variant === "large" && "min-h-[300px] w-[390px]",
            item.active
              ? "border-2 border-black"
              : "border-border",
          )}
          key={item.id}
          onClick={item.onClick}
          type="button"
        >
          <span className="block text-2xl font-semibold leading-tight">
            {item.title}
          </span>
          <span className="mt-6 block h-px bg-border" />
          <span
            className="mt-6 block text-lg leading-8 text-stone-600"
          >
            {item.description}
          </span>
        </button>
      ))}
    </div>
  );
}

function RouteBuilderCard({
  generatedAiCount,
  ideationSelection,
  runGeneration,
  ruptureTitle,
  selectedSet,
  status,
}: {
  generatedAiCount: number;
  ideationSelection: CompleteIdeationSelection;
  runGeneration: () => Promise<void>;
  ruptureTitle: string;
  selectedSet: IdeationSet | null;
  status: "idle" | "loading" | "generating";
}) {
  return (
    <article className="w-full max-w-5xl select-none rounded-[26px] border border-border bg-white p-7 shadow-sm">
      <SectionLabel>Construcción de ruta</SectionLabel>
      <h3 className="mt-3 text-2xl font-semibold leading-tight">
        {ruptureTitle} / {ideationSelection.insightTitle} /{" "}
        {ideationSelection.gapTitle}
      </h3>
      <div className="mt-6 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-muted-foreground">
          {selectedSet
            ? `${generatedAiCount}/4 ideas IA generadas para esta ruta.`
            : "Genera la primera idea IA para esta combinación."}
        </p>
        <Button
          disabled={status === "generating" || Boolean(selectedSet && generatedAiCount >= 4)}
          onClick={() => void runGeneration()}
        >
          {status === "generating" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {selectedSet ? "Generar otra idea" : "Generar idea"}
        </Button>
      </div>
    </article>
  );
}

function CanvasOutput({
  addManualIdea,
  ideationSets,
  updateIdea,
}: {
  addManualIdea: (
    set: IdeationSet,
    manual: ManualIdeaInput,
  ) => void;
  ideationSets: IdeationSet[];
  updateIdea: (setId: string, ideaId: string, nextIdea: IdeationIdea) => void;
}) {
  return (
    <section className="w-full">
      <div className="mx-auto mb-8 max-w-5xl select-none">
        <SectionLabel>Ideas por rutas</SectionLabel>
        <h3 className="mt-3 text-4xl font-semibold leading-tight">
          Ideas generadas por combinación.
        </h3>
        <p className="mt-3 text-sm font-semibold text-muted-foreground">
        {ideationSets.reduce((count, set) => count + set.ideas.length, 0)} ideas en canvas
        </p>
      </div>
      <div
        className="grid items-start justify-center gap-5"
        style={{
          gridTemplateColumns: `repeat(${Math.max(ideationSets.length, 1)}, 460px)`,
        }}
      >
        {ideationSets.map((set, setIndex) => (
          <article
            className="w-[460px] select-none rounded-[26px] border border-border bg-white p-6 shadow-sm"
            key={set.id}
          >
            <SectionLabel>Ruta {setIndex + 1}</SectionLabel>
            <h4 className="mt-3 text-xl font-semibold leading-tight">
              {ruptureTitleFor(set.selection.ruptureType)} / {set.selection.insightTitle} /{" "}
              {set.selection.gapTitle}
            </h4>
            <div className="mt-5 grid gap-4">
              {set.ideas.map((idea, index) => (
                <article
                  className="rounded-[22px] border border-border bg-surface-raised p-5"
                  key={idea.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        Idea {index + 1}: {idea.tipoDeIdea ?? "Tipo por definir"}
                      </p>
                      <h4 className="mt-2 text-2xl font-semibold leading-tight">
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
                  <IdeaField label="Supuesto que rompe" value={idea.supuestoQueRompe} />
                  <IdeaField label="Mecánica" value={idea.mecanicaConcreta} />
                  {idea.porQueFunciona && (
                    <IdeaField label="Por qué funciona" value={idea.porQueFunciona} />
                  )}
                </article>
              ))}
            </div>
            <ManualIdeaForm addManualIdea={(manual) => addManualIdea(set, manual)} />
          </article>
        ))}
      </div>
    </section>
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
    manual: ManualIdeaInput,
  ) => void;
  set: IdeationSet;
  updateIdea: (setId: string, ideaId: string, nextIdea: IdeationIdea) => void;
}) {
  return (
    <Card className="p-5">
      <SectionLabel>{set.route.title}</SectionLabel>
      <div className="mt-3 flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {set.ideas.length} idea(s) en esta ruta
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
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
            {idea.tipoDeIdea ?? "Tipo por definir"}
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
      <IdeaField label="Mecánica" value={idea.mecanicaConcreta} />
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
    manual: ManualIdeaInput,
  ) => void;
}) {
  const [idea, setIdea] = useState("");
  const [ideaType, setIdeaType] = useState<PrototypeIdeaType>(
    "Modelo comercial / acceso",
  );
  const [assumption, setAssumption] = useState("");
  const [mechanism, setMechanism] = useState("");
  const [whyItWorks, setWhyItWorks] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      className="mt-6 rounded-[22px] border border-border bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!idea.trim() || !assumption.trim() || !mechanism.trim() || !whyItWorks.trim()) {
          setError("Completa idea, supuesto, mecánica y por qué funciona.");
          return;
        }
        addManualIdea({
          idea: idea.trim(),
          tipoDeIdea: ideaType,
          mecanicaConcreta: mechanism.trim(),
          porQueFunciona: whyItWorks.trim(),
          supuestoQueRompe: assumption.trim(),
        });
        setIdea("");
        setAssumption("");
        setMechanism("");
        setWhyItWorks("");
        setError("");
      }}
    >
      <SectionLabel>Idea manual</SectionLabel>
      <div className="mt-4 grid gap-4">
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Idea
          </span>
          <TextInput
            placeholder="Describe la idea en una frase"
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Tipo de idea
          </span>
          <select
            className="min-h-11 rounded-[14px] border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm outline-none transition focus:border-stone-400 focus:ring-4 focus:ring-stone-200"
            value={ideaType}
            onChange={(event) => setIdeaType(event.target.value as PrototypeIdeaType)}
          >
            {prototypeIdeaTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Supuesto que rompe
          </span>
          <TextInput
            placeholder="Qué creencia cambia esta idea"
            value={assumption}
            onChange={(event) => setAssumption(event.target.value)}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Mecánica
          </span>
          <TextArea
            className="min-h-24"
            placeholder="Cómo funcionaría en la práctica"
            value={mechanism}
            onChange={(event) => setMechanism(event.target.value)}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Por qué funciona
          </span>
          <TextArea
            className="min-h-24"
            placeholder="Por qué esta mecánica puede cambiar la decisión"
            value={whyItWorks}
            onChange={(event) => setWhyItWorks(event.target.value)}
          />
        </label>
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

function ruptureTitleFor(ruptureType: IdeationRuptureType) {
  if (ruptureType === "RUPTURA_MODERADA") return "Ruptura moderada";
  if (ruptureType === "RUPTURA_FUERTE") return "Ruptura fuerte";
  return "Ruptura radical controlada";
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
