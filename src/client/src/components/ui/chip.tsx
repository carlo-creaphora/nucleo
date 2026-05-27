import { cn } from "../../lib/utils.js";

type ChipProps = {
  active?: boolean;
  children: string;
  onClick: () => void;
};

export function Chip({ active, children, onClick }: ChipProps) {
  return (
    <button
      className={cn(
        "rounded-lg border px-3 py-1.5 text-sm font-medium transition",
        active
          ? "border-black bg-black text-white shadow-sm"
          : "border-border bg-white text-stone-600 hover:border-stone-300 hover:bg-muted",
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
