/**
 * RunProgress — the detail-level phase spine reframed as run PROGRESS, shared by
 * both outcomes (succeeded and failed). Heading "Run progress", a one-line summary
 * of how far it got ("N of N phases complete" on a clean run, "M of N — stopped at
 * <phase>" on a failure), then the always-labelled Spine. A run with no tasks
 * derives no phases → an honest "nothing ran" line, never a fabricated spine.
 */
import { CircleDashed } from "lucide-react";
import type { Phase } from "@/lib/phases";
import { Spine } from "@/components/viz/Spine";

interface RunProgressProps {
  phases: Phase[];
  /** Trailing context for the no-task state (failure vs cancelled differ). */
  emptyNote?: string;
}

/** "M of N — stopped at <phase>" on a failure, else "N of N phases complete". */
function summarize(phases: Phase[]): string {
  const total = phases.length;
  const done = phases.filter((p) => p.status === "done").length;
  const failed = phases.find((p) => p.status === "failed");
  return failed
    ? `${done} of ${total} — stopped at ${failed.label}`
    : `${done} of ${total} phases complete`;
}

export function RunProgress({ phases, emptyNote }: RunProgressProps) {
  if (phases.length === 0) {
    // No tasks ran — an honest "nothing ran" state, never a fabricated spine.
    return (
      <div className="flex items-center gap-3 rounded-md border border-border bg-surface p-4">
        <CircleDashed
          className="h-5 w-5 shrink-0 text-muted-solid"
          aria-hidden="true"
        />
        <p className="text-sm text-ink-2">
          Nothing ran{emptyNote ? ` — ${emptyNote}` : "."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-text">
          Run progress
        </p>
        <p className="text-xs tabular-nums text-muted-text">
          {summarize(phases)}
        </p>
      </div>
      <Spine phases={phases} />
    </div>
  );
}
