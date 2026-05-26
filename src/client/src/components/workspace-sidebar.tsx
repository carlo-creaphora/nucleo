import { Check, ChevronDown, PanelsTopLeft, X } from "lucide-react";
import { cn } from "../lib/utils.js";
import {
  companyContext,
  registrationPhase,
  type Phase,
  type PhaseId,
} from "../workspace-data.js";

type WorkspaceSidebarProps = {
  activePhase: PhaseId;
  isMobileOpen?: boolean;
  onClose?: () => void;
  phases: Phase[];
  onSelectPhase: (phase: PhaseId) => void;
};

export function WorkspaceSidebar({
  activePhase,
  isMobileOpen = false,
  onClose,
  phases,
  onSelectPhase,
}: WorkspaceSidebarProps) {
  const selectPhase = (phase: PhaseId) => {
    onSelectPhase(phase);
    onClose?.();
  };

  return (
    <aside
      aria-hidden={!isMobileOpen ? true : undefined}
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-[min(430px,calc(100vw-28px))] min-h-screen flex-col overflow-y-auto border-r border-border bg-background px-5 py-7 shadow-workspace transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-auto lg:w-auto lg:translate-x-0 lg:shadow-none",
        isMobileOpen
          ? "translate-x-0"
          : "pointer-events-none -translate-x-full lg:pointer-events-auto",
      )}
    >
      <div className="flex items-center justify-between px-2">
        <h1 className="text-[34px] font-extrabold leading-none tracking-normal">
          Innovación
        </h1>
        <button className="hidden h-7 w-7 place-items-center rounded-md border border-stone-500/80 bg-transparent transition hover:bg-muted lg:grid">
          <PanelsTopLeft className="h-4 w-4 text-stone-700" />
        </button>
        <button
          aria-label="Cerrar navegación"
          className="grid h-9 w-9 place-items-center rounded-full border border-border bg-white transition hover:bg-muted lg:hidden"
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4 text-stone-700" />
        </button>
      </div>

      <nav className="mt-14">
        <button
          className={cn(
            "mb-8 w-full rounded-[18px] border px-5 py-5 text-left transition duration-200 ease-out",
            activePhase === "registration"
              ? "border-border bg-white shadow-soft"
              : "border-transparent bg-white/35 hover:bg-white/70 hover:shadow-sm",
          )}
          onClick={() => selectPhase("registration")}
        >
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">
            Contexto base
          </span>
          <span className="mt-2 block text-[23px] font-bold leading-tight text-stone-900">
            {registrationPhase.name}
          </span>
          <span className="mt-1 block text-[20px] font-medium leading-tight text-stone-500">
            {activePhase === "registration" ? "Vista actual" : "Lista"}
          </span>
        </button>

        <p className="px-3 text-[22px] font-semibold text-stone-400">Fases</p>
        <div className="mt-4 flex flex-col gap-4">
          {phases.map((phase) => {
            const isActive = activePhase === phase.id;

            return (
              <button
                key={phase.id}
                className={cn(
                  "group flex min-h-[86px] w-full items-center gap-4 rounded-[14px] px-5 text-left transition duration-200 ease-out",
                  isActive
                    ? "border border-border bg-white shadow-soft"
                    : "bg-transparent hover:bg-white/70 hover:shadow-sm",
                )}
                onClick={() => selectPhase(phase.id)}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-white">
                  <Check className="h-5 w-5 stroke-[3]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[23px] font-bold leading-tight text-stone-900">
                    {phase.name}
                  </span>
                  <span className="mt-1 block text-[22px] font-medium leading-tight text-stone-500">
                    {isActive ? "Vista actual" : phase.status}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="mt-auto space-y-5 pb-3">
        <div className="rounded-[18px] border border-border bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between text-[20px] font-semibold">
            <span className="text-stone-500">Fases completadas</span>
            <span>8/8</span>
          </div>
          <div className="mt-5 h-3 rounded-full bg-muted">
            <div className="h-full rounded-full bg-black" />
          </div>
        </div>
        <button
          className={cn(
            "w-full rounded-[18px] border border-border bg-white p-5 text-left shadow-soft transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-workspace",
            activePhase === "memory" && "ring-2 ring-stone-900/10",
          )}
          onClick={() => selectPhase("memory")}
          type="button"
        >
          <div className="flex items-center justify-between text-[20px] font-semibold">
            <span className="text-stone-500">Memoria de ciclos</span>
            <span>1</span>
          </div>
          <p className="mt-4 text-[19px] leading-8 text-stone-500">
            Solo lectura para licencias de {companyContext.company}.
          </p>
        </button>
        <div className="border-t border-border pt-6">
          <button className="flex w-full items-center justify-between px-3 text-left">
            <span className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-stone-950 text-[22px] font-semibold text-white">
                C
              </span>
              <span className="text-[22px] font-bold">
                {companyContext.user}
              </span>
            </span>
            <ChevronDown className="h-5 w-5 text-stone-500" />
          </button>
        </div>
      </div>
    </aside>
  );
}
