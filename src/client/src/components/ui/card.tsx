import * as React from "react";
import { cn } from "../../lib/utils.js";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-soft",
        className,
      )}
      {...props}
    />
  );
}

export function SectionLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
