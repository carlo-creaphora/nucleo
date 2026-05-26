import { ArrowRight, FlaskConical } from "lucide-react";
import { Button } from "./ui/button.js";
import { Card, SectionLabel } from "./ui/card.js";
import { cn } from "../lib/utils.js";
import {
  companyContext,
  evidenceRows,
  phaseDetails,
  type Phase,
} from "../workspace-data.js";

type PhaseWorkspaceProps = {
  phase: Phase;
};

export function PhaseWorkspace({ phase }: PhaseWorkspaceProps) {
  const Icon = phase.icon;
  const details = phaseDetails[phase.id];

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-8 px-8 py-8 xl:px-12">
      <section className="rounded-[28px] border border-border bg-surface px-10 py-9 shadow-workspace">
        <SectionLabel>{phase.eyebrow}</SectionLabel>
        <div className="mt-4 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex items-start gap-4">
              <div className="mt-1 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-border bg-surface-raised">
                <Icon className="h-6 w-6 text-stone-700" />
              </div>
              <div>
                <h1 className="text-5xl font-extrabold leading-[1.02] tracking-normal">
                  {phase.title}
                </h1>
                <p className="mt-5 max-w-3xl text-xl leading-8 text-muted-foreground">
                  {phase.summary}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary">Revisar memoria</Button>
            <Button>
              Continuar ciclo
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {details.map((detail, index) => (
          <Card className="p-7" key={detail}>
            <SectionLabel>
              {index === 0
                ? "Entrada clave"
                : index === 1
                  ? "Decisión"
                  : "Control"}
            </SectionLabel>
            <h2 className="mt-3 text-2xl font-bold leading-tight">{detail}</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {supportCopy[index]}
            </p>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <SectionLabel>Lectura de evidencia</SectionLabel>
              <h2 className="mt-3 text-3xl font-extrabold">
                Matriz de señales tomada de la bitácora del test.
              </h2>
            </div>
            <FlaskConical className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="mt-7 overflow-hidden rounded-[18px] border border-border">
            {evidenceRows.map((row, index) => (
              <div
                key={row.join("-")}
                className={cn(
                  "grid grid-cols-[1.4fr_0.8fr_0.6fr] border-b border-border last:border-b-0",
                  index === 0 ? "bg-surface-raised" : "bg-white",
                )}
              >
                {row.map((cell) => (
                  <div
                    key={cell}
                    className={cn(
                      "px-6 py-5 text-base",
                      index === 0
                        ? "font-bold text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {cell}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-7">
          <SectionLabel>Sistema visual</SectionLabel>
          <h2 className="mt-3 text-3xl font-extrabold">
            Workspace React preparado para crecer por fases.
          </h2>
          <div className="mt-6 space-y-3">
            {[
              ["Contexto", companyContext.category],
              ["Estado", "Demo comercial navegable"],
              ["UI", "Tokens, componentes y layout modular"],
              ["API", "Hono y contratos existentes intactos"],
            ].map(([name, detail]) => (
              <div
                key={name}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface-raised px-4 py-3"
              >
                <span className="font-semibold">{name}</span>
                <span className="text-right text-sm text-muted-foreground">
                  {detail}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

const supportCopy = [
  "La información se presenta como material de trabajo, no como bloque decorativo ni marketing.",
  "Cada fase conserva una jerarquía visual estable para que el usuario pueda comparar estados sin reaprender la pantalla.",
  "La interfaz mantiene explícitas las fronteras de validación para evitar optimismo injustificado.",
];
