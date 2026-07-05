import { Clock, DollarSign, CheckCircle2, XCircle } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { Spine } from "./viz/Spine";
import type { Run } from "@/lib/types";
import { getStatusVisual } from "@/lib/status";
import { describePipeline } from "@/lib/descriptions";
import { derivePhases } from "@/lib/phases";
import { formatCost, formatDuration, taskRatio } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface RunCardProps {
  run: Run;
  onOpen: (run: Run) => void;
}

/**
 * A single run row. Rendered as a native <button> so it's focusable and
 * Enter/Space activate it for free (keyboard navigation requirement). The global
 * :focus-visible token ring provides the visible focus indicator.
 */
export function RunCard({ run, onOpen }: RunCardProps) {
  // Ratio comes from stats, not tasks.length: the tasks[] array is truncated in
  // the data (e.g. 50 rows while stats reports 77 succeeded), so stats is the
  // authoritative per-run count.
  const ratio = taskRatio(run.stats.succeedCount, run.stats.failedCount);

  // The button's aria-label is its whole accessible name (it overrides inner text),
  // so fold in status — the primary at-a-glance signal a SR user would otherwise miss.
  const statusLabel = getStatusVisual(run.status).label;

  // The road this run travelled: a compact phase spine showing where it reached (or
  // stopped). Runs that never executed (cancelled, died-on-arrival) derive [] → no
  // spine, an honest "nothing ran". Its own slim line so metrics stay uncrowded.
  const phases = derivePhases(run.tasks);

  return (
    <button
      type="button"
      onClick={() => onOpen(run)}
      aria-label={`Open details for run ${run.runName}, status ${statusLabel}`}
      className={cn(
        "group flex w-full flex-col gap-3 rounded-lg border border-border bg-surface p-4 text-left shadow-1 transition-colors",
        "hover:border-muted-solid/40 hover:bg-surface-sunk",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* Identity */}
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <StatusBadge status={run.status} />
            <span className="truncate font-bold text-ink">{run.runName}</span>
          </div>
          {/* Pipeline name reads as an identifier: bold/700, ink tier — distinct from
              the description prose by weight, not colour. 600/semibold (and the muted
              tier) wasn't distinct enough. */}
          <span className="text-sm font-bold text-ink">{run.projectName}</span>
          <p className="text-sm text-ink-2/80">
            {describePipeline(run.projectName)}
          </p>
        </div>

        {/* Metrics */}
        <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 sm:justify-end">
          <MiniStat
            icon={
              <Clock className="h-4 w-4 text-muted-solid" aria-hidden="true" />
            }
            label="Duration"
            value={formatDuration(run.duration)}
          />
          <MiniStat
            icon={
              <DollarSign
                className="h-4 w-4 text-muted-solid"
                aria-hidden="true"
              />
            }
            label="Cost"
            value={formatCost(run.load.cost)}
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-text">Tasks</span>
            <span className="inline-flex items-center gap-2 text-sm font-medium tabular-nums">
              <span className="inline-flex items-center gap-1 text-success-text">
                <CheckCircle2
                  className="h-4 w-4 text-success-solid"
                  aria-hidden="true"
                />
                {ratio.succeeded}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  ratio.failed > 0 ? "text-danger-text" : "text-muted-text",
                )}
              >
                <XCircle
                  className={cn(
                    "h-4 w-4",
                    ratio.failed > 0 ? "text-danger-solid" : "text-muted-solid",
                  )}
                  aria-hidden="true"
                />
                {ratio.failed}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* The run's road, on its own line so it never crowds the metrics. Labels are
          hidden until the row is hovered/focused (see Spine compact). */}
      {phases.length > 0 && (
        <div className="border-t border-border/60 pt-2.5">
          <Spine phases={phases} compact />
        </div>
      )}
    </button>
  );
}

interface MiniStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function MiniStat({ icon, label, value }: MiniStatProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-text">{label}</span>
      <span className="inline-flex items-center gap-1.5 text-sm font-medium tabular-nums text-ink">
        {icon}
        {value}
      </span>
    </div>
  );
}
