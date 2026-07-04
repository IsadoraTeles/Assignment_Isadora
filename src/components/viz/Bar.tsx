/**
 * Bar — a single horizontal magnitude answering ONE question (e.g. "how efficient
 * was memory use?"). Hand-rolled, token-styled. role="img" (not progressbar — the
 * run is finished, nothing is progressing) with the value stated in text, so it's
 * readable without seeing the fill.
 */
import { cn } from "@/lib/utils";

interface BarProps {
  value: number;
  max?: number;
  label: string;
  /** Text shown on the right, e.g. "61%". Defaults to the numeric value. */
  valueLabel?: string;
  /** Tailwind background utility for the fill. */
  fillClass?: string;
  className?: string;
}

export function Bar({
  value,
  max = 100,
  label,
  valueLabel,
  fillClass = "bg-primary-solid",
  className,
}: BarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const shown = valueLabel ?? String(value);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-text">{label}</span>
        <span className="text-xs font-semibold tabular-nums text-ink">
          {shown}
        </span>
      </div>
      <div
        role="img"
        aria-label={`${label}: ${shown}`}
        className="h-2 w-full overflow-hidden rounded-full bg-muted-soft"
      >
        <div
          className={cn("h-full rounded-full", fillClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
