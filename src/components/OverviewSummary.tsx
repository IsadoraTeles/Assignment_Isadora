/**
 * OverviewSummary — the interpretive (but DETERMINISTIC) synthesis band at the top
 * of the dashboard. Reads the whole run set in a few plain sentences so the user
 * gets the takeaway before scanning tiles or rows (progressive disclosure:
 * synthesis first, raw list below). No AI label — every number here is computed and
 * always correct. Failures are reported at the RUN level and kept separate from
 * pipeline-repeat counts, so a failed run is never mistaken for a failed pipeline.
 */
import { Layers } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import type { Run } from "@/lib/types";
import { deriveOverview, type FailedRun } from "@/lib/overview";

interface OverviewSummaryProps {
  runs: Run[];
}

/** "twice" reads better than "2 times"; everything else is "N times". */
function countWord(n: number): string {
  return n === 2 ? "twice" : `${n} times`;
}

/**
 * Pipeline/run identifier: distinguished from surrounding prose by WEIGHT
 * (bold/700, ink token tier) — not colour alone — so names read as things, not text.
 * 600/semibold wasn't distinct enough against the body copy; 700 is.
 */
function Name({ children }: { children: ReactNode }) {
  return <span className="font-bold text-ink">{children}</span>;
}

/** "one viralrecon run" (pipeline ran >1×) vs "the rnaseq-nf run" (ran once). */
function failedRunPhrase(run: FailedRun): ReactNode {
  return (
    <>
      {run.oneOfMany ? "one " : "the "}
      <Name>{run.pipeline}</Name> run
    </>
  );
}

/** Join nodes with commas and a trailing "and": [a,b,c] → "a, b and c". */
function joinAnd(nodes: ReactNode[]): ReactNode {
  return nodes.map((node, i) => (
    <Fragment key={i}>
      {i > 0 && (i === nodes.length - 1 ? " and " : ", ")}
      {node}
    </Fragment>
  ));
}

export function OverviewSummary({ runs }: OverviewSummaryProps) {
  const o = deriveOverview(runs);

  // Status-count clause: only non-zero statuses, e.g. "4 succeeded, 2 failed, 1 was cancelled".
  const statusParts: string[] = [];
  if (o.succeeded > 0) statusParts.push(`${o.succeeded} succeeded`);
  if (o.failed > 0) statusParts.push(`${o.failed} failed`);
  if (o.cancelled > 0)
    statusParts.push(
      `${o.cancelled} ${o.cancelled === 1 ? "was" : "were"} cancelled`,
    );

  return (
    <section
      aria-label="Overview summary"
      className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 shadow-1"
    >
      <Layers
        className="mt-0.5 h-5 w-5 shrink-0 text-muted-solid"
        aria-hidden="true"
      />
      <div className="text-sm leading-relaxed">
        <p className="text-ink">
          <span className="font-semibold">{o.totalRuns} runs</span> across{" "}
          {o.pipelineCount} pipelines. {statusParts.join(", ")}.
        </p>
        <p className="mt-0.5 text-ink-2">
          {o.failed > 0 && (
            <>
              The {o.failed} failed {o.failed === 1 ? "run" : "runs"} —{" "}
              {joinAnd(o.failedRuns.map(failedRunPhrase))} —{" "}
              <span className="font-semibold text-danger-text">
                {o.failed === 1 ? "needs" : "need"} attention.
              </span>{" "}
            </>
          )}
          {o.repeated.length > 0 && (
            <span className="text-muted-text">
              (
              {o.repeated.map((p, i) => (
                <Fragment key={p.name}>
                  {i > 0 && ", "}
                  <Name>{p.name}</Name>{" "}
                  {i === 0
                    ? `was run ${countWord(p.count)}`
                    : countWord(p.count)}
                </Fragment>
              ))}
              .)
            </span>
          )}
        </p>
      </div>
    </section>
  );
}
