/**
 * Spine — an ordered pipeline of phases answering ONE question: "where did it
 * break?" Green = completed, red = failed here, dashed = did not run. Each node is
 * icon + label + colour (never colour alone). Like the other viz primitives it is a
 * single role="img" with a descriptive aria-label summarising the whole spine, so a
 * screen reader gets the outcome in one line instead of parsing every node.
 */
import { Check, X } from "lucide-react";
import type { Phase, PhaseStatus } from "@/lib/phases";
import { cn } from "@/lib/utils";

interface SpineProps {
  phases: Phase[];
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

export function Spine({ phases }: SpineProps) {
  // Self-safe: a no-task run has no phases. Callers show an honest "nothing ran"
  // state instead, but never fabricate a spine here.
  if (phases.length === 0) return null;

  return (
    <div
      role="img"
      aria-label={describeSpine(phases)}
      className="flex items-stretch"
    >
      {phases.map((phase, i) => (
        <div
          key={phase.key}
          // min-w-0 lets nodes shrink and labels wrap instead of forcing the row
          // wider than the sheet (the old fine-grained spine clipped off the edge).
          className="relative flex min-w-0 flex-1 flex-col items-center gap-1.5"
        >
          <div className="relative flex h-6 w-full items-center justify-center">
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
            <PhaseDot status={phase.status} />
          </div>
          <span
            className={cn(
              "text-center text-xs leading-tight",
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

function PhaseDot({ status }: { status: PhaseStatus }) {
  if (status === "failed") {
    return (
      <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-danger-solid text-white">
        <X className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
      </span>
    );
  }
  if (status === "done") {
    return (
      <span className="relative z-10 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-success-solid bg-bg text-success-solid">
        <Check className="h-2.5 w-2.5" strokeWidth={3.5} aria-hidden="true" />
      </span>
    );
  }
  return (
    <span className="relative z-10 h-[18px] w-[18px] rounded-full border-2 border-dashed border-muted-solid bg-bg" />
  );
}
