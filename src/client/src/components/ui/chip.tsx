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
        "rounded-full border px-4 py-2 text-sm font-semibold transition",
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
