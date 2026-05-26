import * as React from "react";
import { cn } from "../../lib/utils.js";

type FieldProps = {
  label: string;
  className?: string;
  children: React.ReactNode;
};

export function Field({ label, className, children }: FieldProps) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-2", className)}>
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-14 w-full rounded-[18px] border border-input bg-surface-raised px-5 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-stone-400 focus:bg-white focus:ring-4 focus:ring-stone-200/70",
        className,
      )}
      {...props}
    />
  );
}

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full resize-y rounded-[20px] border border-input bg-surface-raised px-5 py-4 text-base leading-7 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-stone-400 focus:bg-white focus:ring-4 focus:ring-stone-200/70",
        className,
      )}
      {...props}
    />
  );
}
