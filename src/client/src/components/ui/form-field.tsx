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
        "h-10 w-full rounded-lg border border-input bg-surface-raised px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-stone-400 focus:bg-white focus:ring-4 focus:ring-stone-200/70",
        className,
      )}
      {...props}
    />
  );
}

export const TextArea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextArea({ className, ...props }, ref) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-y rounded-lg border border-input bg-surface-raised px-3 py-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-stone-400 focus:bg-white focus:ring-4 focus:ring-stone-200/70",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
