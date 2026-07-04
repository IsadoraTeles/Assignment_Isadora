/**
 * WhatRanView — the "What ran" door. A Donut answers "how much completed?", a
 * legend gives the exact counts, and the stopped tasks are listed as evidence.
 * Run-vs-task truth made visible: a failed run that was 88% successful.
 */
import { Server } from "lucide-react";
import type { Run } from "@/lib/types";
import {
  affectedTasks,
  deriveFailureDiagnosis,
  deriveTaskBreakdown,
  recordedPriceModel,
} from "@/lib/failure";
import { Donut } from "@/components/viz/Donut";
import { TaskRow } from "./TaskRow";

interface WhatRanViewProps {
  run: Run;
}

export function WhatRanView({ run }: WhatRanViewProps) {
  const b = deriveTaskBreakdown(run);
  const affected = affectedTasks(run);
  const stoppedTotal = b.failed + b.aborted;
  const failingPhase = deriveFailureDiagnosis(run).failingPhaseLabel;
  // Grounded: only shown when every recorded task carries this price model.
  const priceModel = recordedPriceModel(run);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-6">
        <Donut
          ariaLabel={`${b.succeeded} of ${b.total} tasks succeeded (${b.completedPct}%)`}
          centerValue={`${b.completedPct}%`}
          centerLabel="completed"
          segments={[
            { value: b.succeeded, strokeClass: "stroke-success-solid" },
            { value: b.failed, strokeClass: "stroke-danger-solid" },
            { value: b.aborted, strokeClass: "stroke-muted-solid" },
          ]}
        />
        <dl className="flex flex-wrap gap-x-6 gap-y-2">
          <LegendStat
            n={b.succeeded}
            label="succeeded"
            className="text-success-text"
          />
          <LegendStat
            n={b.failed}
            label="failed"
            className="text-danger-text"
          />
          <LegendStat
            n={b.aborted}
            label="aborted"
            className="text-muted-text"
          />
        </dl>
      </div>

      <p className="text-sm text-ink-2">
        {b.succeeded} of {b.total} tasks completed
        {failingPhase ? (
          <>
            {" "}
            — the failure is isolated to the{" "}
            <span className="font-semibold">{failingPhase}</span> step.
          </>
        ) : (
          "."
        )}
      </p>

      {priceModel?.model === "spot" && (
        // Grounds the spot-reclamation reading: exit 143 on a spot machine most
        // likely means the instance was reclaimed. icon + text, not colour-alone.
        <p className="flex items-center gap-2 rounded-sm bg-surface-sunk px-3 py-2 text-sm text-ink-2">
          <Server
            className="h-4 w-4 shrink-0 text-muted-solid"
            aria-hidden="true"
          />
          All {priceModel.count} recorded tasks ran on{" "}
          <span className="font-semibold">spot instances</span> — which can be
          reclaimed mid-run.
        </p>
      )}

      {affected.length > 0 && (
        <div className="flex flex-col gap-2">
          {/* tasks[] is truncated in the data, so we show the stopped rows we have
              and say so, rather than implying these are all of them. */}
          <p className="text-xs text-muted-text">
            The tasks that stopped
            {affected.length < stoppedTotal
              ? ` (${affected.length} of ${stoppedTotal} recorded here)`
              : ""}
            :
          </p>
          {affected.map((task) => (
            <TaskRow key={task.taskId} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

function LegendStat({
  n,
  label,
  className,
}: {
  n: number;
  label: string;
  className: string;
}) {
  return (
    <div>
      <dd className={`text-xl font-bold tabular-nums ${className}`}>{n}</dd>
      <dt className="text-xs font-semibold text-muted-text">{label}</dt>
    </div>
  );
}
