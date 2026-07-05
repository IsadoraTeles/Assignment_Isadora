/**
 * Spine — an ordered pipeline of phases answering ONE question: "where did it
 * break?" Green = completed, red = failed here, dashed = did not run. Each node is
 * icon + label + colour (never colour alone). Like the other viz primitives it is a
 * single role="img" with a descriptive aria-label summarising the whole spine, so a
 * screen reader gets the outcome in one line instead of parsing every node.
 *
 * Two densities, same data:
 *  - detail (default): phase labels always visible under each node.
 *  - compact: a slim line for the overview run rows — labels reveal on hover/focus
 *    of the enclosing row (a `.group`) so the list stays scannable. The compact
 *    aria-label enumerates the phases and their state ("Prepare, Read QC done;
 *    Assembly failed") so a screen-reader user gets the road at a glance.
 */
import { Check, X } from "lucide-react";
import type { Phase, PhaseStatus } from "@/lib/phases";
import { cn } from "@/lib/utils";

interface SpineProps {
  phases: Phase[];
  /** Compact overview variant: smaller nodes, labels on hover/focus. */
  compact?: boolean;
}

/** One-line description: how many phases completed, and where (if anywhere) it broke. */
function describeSpine(phases: Phase[]): string {
  const total = phases.length;
  const done = phases.filter((p) => p.status === "done").length;
  const failed = phases.find((p) => p.status === "failed");
  const notReached = phases.filter((p) => p.status === "not-reached").length;
  return (
    `Pipeline phases: ${done} of ${total} completed` +
    (failed ? `, failed at ${failed.label}` : "") +
    (notReached ? `, ${notReached} did not run` : "") +
    "."
  );
}

/** Enumerated description for the compact row spine: names each phase + its state. */
function describeSpineEnumerated(phases: Phase[]): string {
  const done = phases.filter((p) => p.status === "done").map((p) => p.label);
  const failed = phases.find((p) => p.status === "failed");
  const notReached = phases
    .filter((p) => p.status === "not-reached")
    .map((p) => p.label);
  const parts: string[] = [];
  if (done.length) parts.push(`${done.join(", ")} done`);
  if (failed) parts.push(`${failed.label} failed`);
  if (notReached.length) parts.push(`${notReached.join(", ")} did not run`);
  return parts.join("; ") + ".";
}

export function Spine({ phases, compact = false }: SpineProps) {
  // Self-safe: a no-task run has no phases. Callers show an honest "nothing ran"
  // state instead, but never fabricate a spine here.
  if (phases.length === 0) return null;

  return (
    <div
      role="img"
      aria-label={
        compact ? describeSpineEnumerated(phases) : describeSpine(phases)
      }
      className="flex items-stretch"
    >
      {phases.map((phase, i) => (
        <div
          key={phase.key}
          // min-w-0 lets nodes shrink and labels wrap instead of forcing the row
          // wider than the sheet (the old fine-grained spine clipped off the edge).
          className="relative flex min-w-0 flex-1 flex-col items-center gap-1.5"
        >
          <div
            className={cn(
              "relative flex w-full items-center justify-center",
              compact ? "h-4" : "h-6",
            )}
          >
            {/* Connector from the previous node. Green once execution reached this
                phase (done or failed), grey for phases that never ran. */}
            {i > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute right-1/2 top-1/2 h-0.5 w-full -translate-y-1/2",
                  phase.status === "not-reached"
                    ? "bg-border"
                    : "bg-success-solid",
                )}
              />
            )}
            <PhaseDot status={phase.status} compact={compact} />
          </div>
          <span
            className={cn(
              "text-center leading-tight",
              compact
                ? // Labels stay in flow (reserving their line, so hovering reflows
                  // nothing) but only appear on row hover/focus — keeps the list
                  // scannable. group-* keys off the enclosing run row (RunCard).
                  "text-[10px] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                : "text-xs",
              phase.status === "failed"
                ? "font-semibold text-danger-text"
                : "text-muted-text",
            )}
          >
            {phase.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function PhaseDot({
  status,
  compact,
}: {
  status: PhaseStatus;
  compact: boolean;
}) {
  if (status === "failed") {
    return (
      <span
        className={cn(
          "relative z-10 flex items-center justify-center rounded-full bg-danger-solid text-white",
          compact ? "h-4 w-4" : "h-6 w-6",
        )}
      >
        <X
          className={compact ? "h-2.5 w-2.5" : "h-3.5 w-3.5"}
          strokeWidth={3}
          aria-hidden="true"
        />
      </span>
    );
  }
  if (status === "done") {
    return (
      <span
        className={cn(
          "relative z-10 flex items-center justify-center rounded-full border-2 border-success-solid bg-bg text-success-solid",
          compact ? "h-3 w-3" : "h-[18px] w-[18px]",
        )}
      >
        <Check
          className={compact ? "h-1.5 w-1.5" : "h-2.5 w-2.5"}
          strokeWidth={3.5}
          aria-hidden="true"
        />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "relative z-10 rounded-full border-2 border-dashed border-muted-solid bg-bg",
        compact ? "h-3 w-3" : "h-[18px] w-[18px]",
      )}
    />
  );
}
