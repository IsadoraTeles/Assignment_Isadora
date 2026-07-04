/**
 * RunIdentity — who/what/when for a run, with the status demoted to a small
 * outlined pill (a confirmation, not the hero). Also hosts the prominent escape
 * hatch: "See full run details" — a link-out to the platform's full run page, up
 * by the title where it's always visible, not buried behind a door. (The dashboard
 * already lives inside Seqera, so the copy doesn't re-name the platform.)
 */
import { ArrowUpRight } from "lucide-react";
import type { Run } from "@/lib/types";
import { getStatusVisual } from "@/lib/status";
import { formatCost, formatDateTime, formatDuration } from "@/lib/formatters";

interface RunIdentityProps {
  run: Run;
}

export function RunIdentity({ run }: RunIdentityProps) {
  const { label, Icon, textClass } = getStatusVisual(run.status);

  // Sub-line: pipeline + revision · who · when · runtime · cost — all null-safe.
  const parts = [
    `${run.projectName} ${run.revision}`,
    run.userName,
    formatDateTime(run.submit),
    `ran ${formatDuration(run.duration)}`,
    formatCost(run.load.cost),
  ];

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="break-words text-lg font-semibold leading-tight text-ink">
          {run.runName}
        </h2>
        <p className="mt-1 text-xs text-muted-text">{parts.join(" · ")}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span
          aria-label={`Status: ${label}`}
          className={`inline-flex items-center gap-1.5 rounded-full border border-current px-2.5 py-0.5 text-xs font-semibold ${textClass}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {label}
        </span>
        {/* Honest link-out: this prototype has no run URL, so it's a real focusable
            button clearly labelled as opening the run's full details (↗). */}
        <button
          type="button"
          className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-primary-text hover:underline"
        >
          See full run details
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
