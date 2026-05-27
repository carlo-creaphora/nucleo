import { ChevronDown, PanelsTopLeft, X } from "lucide-react";
import { useAppState } from "../app-state.js";
import { cn } from "../lib/utils.js";
import {
  companyContext,
  memoryPhase,
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
  const { registration } = useAppState();
  const context = registration?.output?.contextForDiagnosis;
  const profileName = context?.profileLicense.name || companyContext.user;
  const companyName = context?.company.name || companyContext.company;
  const category = context?.company.sectorCategory || companyContext.cycle;
  const avatarInitial = (profileName || "N").trim().charAt(0).toUpperCase();
  const selectPhase = (phase: PhaseId) => {
    onSelectPhase(phase);
    onClose?.();
  };
  const navigationItems = [registrationPhase, ...phases, memoryPhase];
  const navigationLabels: Record<PhaseId, string> = {
    diagnosis: "Diagnóstico",
    evaluation: "Evaluación",
    ideation: "Ideación",
    memory: "Memoria",
    playbook: "Playbook",
    prototype: "Prototipado",
    reading: "Evidencias",
    registration: "Registro",
    results: "Resultados",
    signals: "Señales",
  };

  return (
    <aside
      aria-hidden={!isMobileOpen ? true : undefined}
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-[min(340px,calc(100vw-24px))] min-h-screen flex-col overflow-y-auto border-r border-border bg-surface px-7 py-7 shadow-workspace transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-auto lg:w-auto lg:translate-x-0 lg:shadow-none",
        isMobileOpen
          ? "translate-x-0"
          : "pointer-events-none -translate-x-full lg:pointer-events-auto",
      )}
    >
      <div className="flex items-center justify-between">
        <button
          className="flex min-w-0 items-center gap-4 rounded-2xl text-left"
          onClick={() => selectPhase("registration")}
          type="button"
        >
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-stone-100 text-2xl font-semibold text-stone-950">
            {avatarInitial}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-2xl font-bold leading-tight text-stone-950">
              Núcleo
            </span>
            <span className="mt-1 block truncate text-base font-medium leading-tight text-stone-500">
              {profileName}
            </span>
          </span>
        </button>
        <button className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-white text-stone-600 transition hover:bg-muted lg:grid">
          <PanelsTopLeft className="h-4 w-4" />
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

      <nav className="mt-10">
        <div className="flex flex-col gap-2">
          {navigationItems.map((phase) => {
            const isActive = activePhase === phase.id;
            const Icon = phase.icon;

            return (
              <button
                key={phase.id}
                className={cn(
                  "group flex min-h-10 w-full items-center justify-between gap-4 rounded-xl px-3 py-1.5 text-left transition duration-200 ease-out",
                  isActive
                    ? "bg-stone-100 text-stone-950"
                    : "text-stone-950 hover:bg-stone-50",
                )}
                onClick={() => selectPhase(phase.id)}
                type="button"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon className="h-3.5 w-3.5 shrink-0 stroke-[2.25]" />
                  <span className="block truncate text-sm font-semibold leading-tight">
                    {navigationLabels[phase.id]}
                  </span>
                </span>
                {isActive && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-stone-950" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="mt-auto border-t border-border pt-6">
        <button className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition hover:bg-stone-50">
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-stone-950">
              {companyName}
            </span>
            <span className="mt-1 block truncate text-sm text-stone-500">
              {category}
            </span>
          </span>
          <ChevronDown className="h-5 w-5 shrink-0 text-stone-500" />
        </button>
      </div>
    </aside>
  );
}
