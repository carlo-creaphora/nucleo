import { Menu } from "lucide-react";
import { Button } from "./ui/button.js";
import { useAppState } from "../app-state.js";
import { companyContext, type Phase } from "../workspace-data.js";

type WorkspaceHeaderProps = {
  activePhase: Phase;
  onMenuClick: () => void;
};

export function WorkspaceHeader({ onMenuClick }: WorkspaceHeaderProps) {
  const { registration } = useAppState();
  const context = registration?.output?.contextForDiagnosis;
  const companyName = context?.company.name || companyContext.company;
  const category = context?.company.sectorCategory || companyContext.cycle;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/85 px-5 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Button
          aria-label="Abrir navegación"
          className="lg:hidden"
          onClick={onMenuClick}
          size="icon"
          variant="secondary"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {companyName}
          </p>
          <h2 className="text-lg font-semibold">{category}</h2>
        </div>
      </div>
      <div />
    </header>
  );
}
