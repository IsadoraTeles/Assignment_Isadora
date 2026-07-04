/**
 * RunReport — the "Complete results" full report: everything about a run on one
 * page (the density escape-hatch for experts). Also serves as the standalone detail
 * for non-failed runs. Charts each answer one question — the Gauge: was CPU
 * efficient; the Bar: how full was memory. Honest about what the data supports:
 * a run that never executed shows "No compute recorded", and outputs link out to
 * cloud storage by path (the dataset is the execution record, not the science).
 */
import { FolderOpen, RotateCcw } from "lucide-react";
import type { Run } from "@/lib/types";
import { deriveTaskBreakdown, recoveredRetryNote } from "@/lib/failure";
import {
  EMPTY,
  formatBytes,
  formatCost,
  formatDateTime,
  formatDuration,
  formatPercent,
} from "@/lib/formatters";
import { Gauge } from "@/components/viz/Gauge";
import { Bar } from "@/components/viz/Bar";

const EXECUTOR_LABELS: Record<string, string> = { awsbatch: "AWS Batch" };

interface RunReportProps {
  run: Run;
}

export function RunReport({ run }: RunReportProps) {
  const breakdown = deriveTaskBreakdown(run);
  const retryNote = recoveredRetryNote(run);
  const ran = run.load.executors != null && run.load.executors.length > 0;
  const zone = run.tasks?.[0]?.cloudZone ?? null;
  const compute = ran
    ? [run.load.executors!.map((e) => EXECUTOR_LABELS[e] ?? e).join(", "), zone]
        .filter(Boolean)
        .join(" · ")
    : "No compute recorded";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        <StatCard label="Duration" value={formatDuration(run.duration)} />
        <StatCard label="Cost" value={formatCost(run.load.cost)} />
        <StatCard
          label="Peak memory"
          value={ran ? formatBytes(run.load.peakMemory) : EMPTY}
        />
      </div>

      <section>
        <SectionHeading>Compute efficiency</SectionHeading>
        {ran ? (
          <div className="flex items-center gap-6">
            <Gauge
              value={run.load.cpuEfficiency}
              label="CPU"
              ariaLabel={`CPU efficiency ${formatPercent(run.load.cpuEfficiency, 0)}`}
            />
            <Bar
              className="max-w-xs flex-1"
              value={run.load.memoryEfficiency}
              label="Memory used vs requested"
              valueLabel={formatPercent(run.load.memoryEfficiency, 1)}
              fillClass="bg-primary-solid"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-text">
            This run never executed, so there's no compute to report.
          </p>
        )}
      </section>

      <section>
        <SectionHeading>Run</SectionHeading>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          <KeyValue k="Pipeline" v={`${run.projectName} ${run.revision}`} />
          <KeyValue k="Compute" v={compute} />
          <KeyValue
            k="Submitted → Completed"
            v={`${formatDateTime(run.submit)} → ${formatDateTime(run.complete)}`}
          />
          <KeyValue k="User" v={run.userName} />
        </dl>
      </section>

      <section>
        <SectionHeading>Tasks</SectionHeading>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          <KeyValue
            k="Succeeded"
            v={String(breakdown.succeeded)}
            valueClass="text-success-text"
          />
          <KeyValue
            k="Failed / aborted"
            v={`${breakdown.failed} / ${breakdown.aborted}`}
            valueClass={breakdown.failed > 0 ? "text-danger-text" : undefined}
          />
        </dl>
        {/* Run-vs-task truth: a green run can still show failed task-attempts that
            recovered on retry. Explain it plainly so the count doesn't alarm. */}
        {retryNote && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-ink-2">
            <RotateCcw
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-solid"
              aria-hidden="true"
            />
            {retryNote}
          </p>
        )}
      </section>

      <section>
        <SectionHeading>Outputs</SectionHeading>
        {/* The dataset records execution, not result files — outputs live in cloud
            storage, referenced by workDir. We link out by path; we never fabricate results. */}
        <div className="rounded-md border border-border p-3">
          <p className="mb-2 text-sm text-muted-text">
            Result files and logs live in cloud storage, referenced by path:
          </p>
          <p className="mb-3 break-all font-mono text-xs text-ink-2">
            {run.workDir}
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-border px-2.5 py-1 text-xs font-semibold text-primary-text">
            <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
            Open work directory
            <span className="font-normal text-muted-text">(links out)</span>
          </span>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[120px] flex-1 rounded-md border border-border p-3">
      <div className="text-lg font-bold tabular-nums text-ink">{value}</div>
      <div className="text-xs text-muted-text">{label}</div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted-text">
      {children}
    </h3>
  );
}

function KeyValue({
  k,
  v,
  valueClass,
}: {
  k: string;
  v: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-1">
      <dt className="shrink-0 text-xs text-muted-text">{k}</dt>
      <dd
        className={`min-w-0 break-words text-right text-sm font-medium ${valueClass ?? "text-ink"}`}
      >
        {v}
      </dd>
    </div>
  );
}
