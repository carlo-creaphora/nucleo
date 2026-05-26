import { Menu, Sparkles } from "lucide-react";
import { Button } from "./ui/button.js";
import { companyContext, type Phase } from "../workspace-data.js";

type WorkspaceHeaderProps = {
  activePhase: Phase;
  onMenuClick: () => void;
};

export function WorkspaceHeader({ activePhase, onMenuClick }: WorkspaceHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-[88px] items-center justify-between border-b border-border bg-[hsla(35,18%,97%,0.82)] px-8 backdrop-blur-xl xl:px-12">
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
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {companyContext.company}
          </p>
          <h2 className="text-xl font-bold">{companyContext.cycle}</h2>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="secondary">Exportar</Button>
        <Button size="icon" title={activePhase.name}>
          <Sparkles className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
