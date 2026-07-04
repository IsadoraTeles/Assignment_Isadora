/**
 * Reconstructs a grounded, plain-language reading of WHY a run failed, from real
 * structured fields only (failing process, exit code, retries, spot pricing, task
 * counts). This is the clearly-labelled "AI · illustrative" stub described in
 * ai-interaction-principles.md — hand-derived here, a live Claude call in prod.
 *
 * Every string is anchored to a field that exists; nothing asserts a cause the
 * data can't support, and uncertain claims are hedged ("most likely"), never stated
 * as fact. Two archetypes are handled distinctly: died mid-run vs died on arrival.
 */
import type { Run, Task } from "./types";
import { derivePhases } from "./phases";
import { formatExit, processLeaf } from "./tasks";

export type FailureArchetype = "mid-run" | "on-arrival";

export interface NextStep {
  title: string;
  detail: string;
  /** Optional call-to-action label; the button proposes, never auto-acts. */
  action?: string;
}

export interface FailureDiagnosis {
  archetype: FailureArchetype;
  /** Plain-language "what happened" — the hero of the summary view. */
  headline: string;
  /** One-line AI cause: grounded claim + hedge. Null when nothing can be said. */
  cause: { text: string; hedge: string } | null;
  nextSteps: NextStep[];
  /** The task that actually failed (mid-run only). */
  failingTask: Task | null;
  /** Label of the phase where it broke (e.g. "Assembly"), mid-run only. */
  failingPhaseLabel: string | null;
}

/** Run-level task breakdown for the "What ran" donut. */
export interface TaskBreakdown {
  succeeded: number;
  failed: number;
  aborted: number;
  total: number;
  completedPct: number;
}

/**
 * Breakdown for the donut. succeed/fail come from stats (the authoritative run-level
 * counts); aborted is only tracked in `load` (stats has no aborted field). We do NOT
 * count the tasks[] array — it's truncated (e.g. 50 rows while 88 tasks ran), so its
 * counts would understate reality.
 */
export function deriveTaskBreakdown(run: Run): TaskBreakdown {
  const succeeded = run.stats.succeedCount;
  const failed = run.stats.failedCount;
  const aborted = run.load.aborted;
  const total = succeeded + failed + aborted;
  const completedPct = total === 0 ? 0 : Math.round((succeeded / total) * 100);
  return { succeeded, failed, aborted, total, completedPct };
}

/**
 * The task rows worth showing — the ones that stopped (FAILED or ABORTED). Drawn
 * from tasks[]; these are the concrete rows the summary can cite as evidence.
 */
export function affectedTasks(run: Run): Task[] {
  return (run.tasks ?? []).filter(
    (t) => t.status === "FAILED" || t.status === "ABORTED",
  );
}

/**
 * If every recorded task shares one price model, report it (e.g. "spot", 50). This
 * grounds the spot-reclamation reading in what the data actually shows — we only
 * ever claim spot where the tasks say so, never assume it. Null when tasks are
 * absent, the model is missing, or the run mixes models.
 */
export function recordedPriceModel(
  run: Run,
): { model: string; count: number } | null {
  const tasks = run.tasks ?? [];
  if (tasks.length === 0) return null;
  const model = tasks[0].priceModel;
  if (!model || !tasks.every((t) => t.priceModel === model)) return null;
  return { model, count: tasks.length };
}

/**
 * Run status ≠ task status: a SUCCEEDED run can still contain a task that failed on
 * its first attempt and recovered on retry (stats.failedCount > 0 while the run is
 * green). Returns a plain line explaining that — so we surface the nuance honestly
 * without alarming. Null when there's nothing to explain (or the run didn't succeed,
 * since only a green run truly "completed cleanly").
 */
export function recoveredRetryNote(run: Run): string | null {
  if (run.status !== "SUCCEEDED") return null;
  const failedAttempts = run.stats.failedCount;
  if (failedAttempts <= 0 || run.load.retries <= 0) return null;
  const one = failedAttempts === 1;
  return `${failedAttempts} task${one ? "" : "s"} failed on ${
    one ? "its" : "their"
  } first attempt and succeeded on retry — the run completed cleanly.`;
}

/** Whole diagnosis, dispatched by archetype. */
export function deriveFailureDiagnosis(run: Run): FailureDiagnosis {
  const tasks = run.tasks ?? [];

  // Archetype 1 — died on arrival: zero tasks recorded (the run never really began).
  if (tasks.length === 0) {
    const seconds =
      run.duration != null
        ? Math.max(1, Math.round(run.duration / 1000))
        : null;
    return {
      archetype: "on-arrival",
      headline:
        seconds != null
          ? `Failed ${seconds} seconds in — before any task started.`
          : "Failed before any task started.",
      cause: {
        text: "No tasks were recorded, so the run stopped during launch or setup, not inside the pipeline.",
        hedge: "Most likely a configuration, profile, or input-path error.",
      },
      nextSteps: [
        {
          title: "Check the launch configuration and inputs.",
          detail:
            "With zero tasks, the problem is almost always params, profile, or input paths — not the pipeline logic.",
        },
        {
          title: "Re-launch once the configuration is fixed.",
          detail: "Nothing ran, so there's no partial work to resume from.",
          action: "Re-launch",
        },
      ],
      failingTask: null,
      failingPhaseLabel: null,
    };
  }

  // Archetype 2 — died mid-run: reconstruct from the failing task + spine position.
  const phases = derivePhases(tasks);
  const failedPhase = phases.find((p) => p.status === "failed") ?? null;
  const failingTask = tasks.find((t) => t.status === "FAILED") ?? null;

  const phaseLabel = failedPhase?.label ?? "the failing";
  const phaseWord = failedPhase
    ? failedPhase.label.split(" ")[0].toLowerCase()
    : null;
  const leaf = failingTask ? processLeaf(failingTask.process) : null;
  const exit = failingTask ? formatExit(failingTask.exit) : null;
  const retries = run.load.retries;
  const onSpot = failingTask?.priceModel === "spot";
  const succeeded = run.stats.succeedCount;

  // CALIBRATED CONFIDENCE: exit 143 = 128 + SIGTERM(15) — the process was terminated
  // by an EXTERNAL signal, not a crash. An out-of-memory kill would be 137 (SIGKILL).
  // Verified against the data + domain, so we correct any "out of memory" reading
  // toward spot-reclamation / timeout and hedge instead of overclaiming a cause.
  const externalKill = exit === "143";

  const nearEnd = failedPhase
    ? phases.indexOf(failedPhase) >= phases.length - 2
    : false;
  const headline = nearEnd
    ? `The run got almost to the end, then the ${phaseLabel} step stopped.`
    : `The run stopped at the ${phaseLabel} step.`;

  const retryPhrase = retries === 1 ? "one retry" : `${retries} retries`;
  // Grounded claim: what was terminated, its exit signal, that it gave up after
  // retrying — each fragment is a real field, joined only when present.
  const causeText = leaf
    ? [
        `${leaf}${phaseWord ? ` (${phaseWord})` : ""} was terminated`,
        exit ? `exit ${exit}` : null,
        retries > 0 ? `and gave up after ${retryPhrase}` : null,
      ]
        .filter(Boolean)
        .join(" — ") + "."
    : "The pipeline stopped at this step.";

  // Hedge: interpret the signal without asserting a cause the data can't confirm.
  // When the failing task ran on spot (grounded in priceModel), name that as the
  // likely reason for the external kill; otherwise stay generic about the signal.
  const hedge = externalKill
    ? onSpot
      ? `These tasks ran on spot instances, so exit ${exit} — an external kill — most likely means the machine was reclaimed, not a crash or out-of-memory.`
      : `Exit ${exit} is an external kill, most often a reclaimed machine or a timeout, not a crash.`
    : exit === "137"
      ? `Exit ${exit} usually means the step ran out of memory.`
      : "The exit signal points to infrastructure rather than a pipeline bug.";

  // What-next, ordered by likelihood for this signal: transient-first (rerun), then
  // the durable fix (off spot), and memory LAST — 143 is rarely an OOM.
  const nextSteps: NextStep[] = [];
  if (externalKill) {
    nextSteps.push({
      title: "Rerun the pipeline.",
      detail:
        "Spot reclamation is often transient — a plain rerun may just succeed.",
      action: "Rerun",
    });
    if (onSpot) {
      nextSteps.push({
        title: "If it recurs, pin this step to on-demand (off spot).",
        detail: "A dedicated machine can't be reclaimed mid-run.",
      });
    }
    nextSteps.push({
      title: "Raising memory only helps if it's actually running out.",
      detail: `Less likely here — that usually shows as exit 137, not ${exit}.`,
    });
  } else {
    nextSteps.push({
      title: "Rerun from the failed step with more memory.",
      detail: `${succeeded} steps already succeeded — no need to start over.`,
      action: "Rerun",
    });
  }

  return {
    archetype: "mid-run",
    headline,
    cause: { text: causeText, hedge },
    nextSteps,
    failingTask,
    failingPhaseLabel: failedPhase?.label ?? null,
  };
}
