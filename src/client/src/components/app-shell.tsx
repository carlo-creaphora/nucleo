import { useState, type ReactNode } from "react";
import { WorkspaceHeader } from "./workspace-header.js";
import { WorkspaceSidebar } from "./workspace-sidebar.js";
import { useAppState } from "../app-state.js";
import { sidebarPhases, type Phase } from "../workspace-data.js";

type AppShellProps = {
  activePhase: Phase;
  children: ReactNode;
};

export function AppShell({ activePhase, children }: AppShellProps) {
  const { activePhaseId, setActivePhaseId } = useAppState();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {mobileSidebarOpen && (
        <button
          aria-label="Cerrar navegación"
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          type="button"
        />
      )}
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[430px_1fr]">
        <WorkspaceSidebar
          activePhase={activePhaseId}
          isMobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          onSelectPhase={setActivePhaseId}
          phases={sidebarPhases}
        />
        <section className="min-w-0 border-l border-border bg-[hsl(35_18%_97%)]">
          <WorkspaceHeader
            activePhase={activePhase}
            onMenuClick={() => setMobileSidebarOpen(true)}
          />
          {children}
        </section>
      </div>
    </main>
  );
}
