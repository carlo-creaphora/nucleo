import { useMemo, useState } from "react";
import { AppShell } from "./components/app-shell.js";
import { LandingScreen } from "./components/landing-screen.js";
import { PhaseWorkspace } from "./components/phase-workspace.js";
import { AppStateProvider, useAppState } from "./app-state.js";
import { DiagnosisPage } from "./phases/diagnosis/diagnosis-page.js";
import { EvaluationPage } from "./phases/evaluation/evaluation-page.js";
import { IdeationPage } from "./phases/ideation/ideation-page.js";
import { MemoryPage } from "./phases/memory/memory-page.js";
import { PlaybookPage } from "./phases/playbook/playbook-page.js";
import { PrototypePage } from "./phases/prototype/prototype-page.js";
import { ReadingPage } from "./phases/reading/reading-page.js";
import { RegistrationPage } from "./phases/registration/registration-page.js";
import { ResultsPage } from "./phases/results/results-page.js";
import { SignalsPage } from "./phases/signals/signals-page.js";
import { memoryPhase, registrationPhase, sidebarPhases } from "./workspace-data.js";

export function App() {
  return (
    <AppStateProvider>
      <WorkspaceApp />
    </AppStateProvider>
  );
}

function WorkspaceApp() {
  const { activePhaseId } = useAppState();
  const [showLanding, setShowLanding] = useState(true);
  const activePhase = useMemo(
    () =>
      activePhaseId === "registration"
        ? registrationPhase
        : activePhaseId === "memory"
          ? memoryPhase
        : (sidebarPhases.find((phase) => phase.id === activePhaseId) ??
          sidebarPhases[0]!),
    [activePhaseId],
  );

  if (showLanding) {
    return <LandingScreen onStart={() => setShowLanding(false)} />;
  }

  return (
    <AppShell activePhase={activePhase}>
      {activePhase.id === "registration" && <RegistrationPage />}
      {activePhase.id === "diagnosis" && <DiagnosisPage />}
      {activePhase.id === "signals" && <SignalsPage />}
      {activePhase.id === "ideation" && <IdeationPage />}
      {activePhase.id === "evaluation" && <EvaluationPage />}
      {activePhase.id === "prototype" && <PrototypePage />}
      {activePhase.id === "results" && <ResultsPage />}
      {activePhase.id === "reading" && <ReadingPage />}
      {activePhase.id === "playbook" && <PlaybookPage />}
      {activePhase.id === "memory" && <MemoryPage />}
      {activePhase.id !== "registration" &&
        activePhase.id !== "diagnosis" &&
        activePhase.id !== "signals" &&
        activePhase.id !== "ideation" &&
        activePhase.id !== "evaluation" &&
        activePhase.id !== "prototype" &&
        activePhase.id !== "results" &&
        activePhase.id !== "reading" &&
        activePhase.id !== "playbook" &&
        activePhase.id !== "memory" && (
        <PhaseWorkspace phase={activePhase} />
      )}
    </AppShell>
  );
}
