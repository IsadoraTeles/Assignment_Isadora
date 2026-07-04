/**
 * Deterministic synthesis of the whole run set for the interpretive overview band.
 *
 * TRUST MODEL: this is COMPUTED from the data, so it is always correct and carries
 * NO "AI" label — unlike the interpretive failure diagnosis (hedged, labelled
 * "illustrative"). The software does the aggregation across runs so the user
 * doesn't have to; the phrasing lives in the component, the facts live here.
 *
 * Failures are reported at the RUN level (a failed run), kept separate from
 * pipeline-repeat counts — otherwise naming "viralrecon" as failed reads as if the
 * pipeline failed, when in fact one viralrecon run failed and another succeeded.
 */
import type { Run } from "./types";

export interface RepeatedPipeline {
  name: string;
  count: number;
}

export interface FailedRun {
  /** Short pipeline name of the failed run. */
  pipeline: string;
  /** True when this pipeline ran more than once (→ "one X run" vs "the X run"). */
  oneOfMany: boolean;
}

export interface OverviewFacts {
  totalRuns: number;
  pipelineCount: number;
  succeeded: number;
  failed: number;
  cancelled: number;
  /** The failed RUNS, described so they're not confused with the pipeline. */
  failedRuns: FailedRun[];
  /** Pipelines that ran more than once, most-run first (a separate note). */
  repeated: RepeatedPipeline[];
}

/** Short, human name for a pipeline: the last path segment of projectName. */
function shortName(projectName: string): string {
  return projectName.split("/").pop() ?? projectName;
}

export function deriveOverview(runs: Run[]): OverviewFacts {
  // Count runs per pipeline to find distinct pipelines and repeats.
  const perPipeline = new Map<string, number>();
  for (const run of runs) {
    perPipeline.set(
      run.projectName,
      (perPipeline.get(run.projectName) ?? 0) + 1,
    );
  }

  const countByStatus = (status: Run["status"]) =>
    runs.filter((r) => r.status === status).length;

  const failedRuns: FailedRun[] = runs
    .filter((r) => r.status === "FAILED")
    .map((r) => ({
      pipeline: shortName(r.projectName),
      oneOfMany: (perPipeline.get(r.projectName) ?? 1) > 1,
    }));

  const repeated = [...perPipeline.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name: shortName(name), count }));

  return {
    totalRuns: runs.length,
    pipelineCount: perPipeline.size,
    succeeded: countByStatus("SUCCEEDED"),
    failed: countByStatus("FAILED"),
    cancelled: countByStatus("CANCELLED"),
    failedRuns,
    repeated,
  };
}
