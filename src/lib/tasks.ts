/**
 * Task-level helpers: turning raw Task fields into presentable, honest values.
 * Kept in the data layer so views never re-implement the quirks below.
 */
import type { Task, TaskStatus } from "./types";
import type { StatusRole } from "./status";

/** Nextflow encodes "no exit code recorded" as INT_MAX rather than null. */
const NO_EXIT_SENTINEL = 2147483647;

/**
 * The leaf process name — the last colon-segment of the fully-qualified Nextflow
 * process path (e.g. "…:ASSEMBLY_UNICYCLER:UNICYCLER" → "UNICYCLER"). Kept
 * verbatim (uppercase tool names are the expert's vocabulary — do not prettify).
 */
export function processLeaf(process: string): string {
  const segments = process.split(":");
  return segments[segments.length - 1] || process;
}

/**
 * A task's exit code as a display string, or null when none was recorded. Aborted
 * tasks carry the INT_MAX sentinel, which must never be shown as "2147483647".
 */
export function formatExit(exit: number | null | undefined): string | null {
  if (exit == null || exit === NO_EXIT_SENTINEL) return null;
  return String(exit);
}

/** Was this task retried? errorAction "RETRY" is Nextflow's retry marker. */
export function wasRetried(task: Task): boolean {
  return task.errorAction === "RETRY" || task.attempt > 1;
}

/** Per-task status → semantic role. ABORTED reads as muted (collateral, not the cause). */
export function taskStatusRole(status: TaskStatus): StatusRole {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "FAILED":
      return "danger";
    case "ABORTED":
      return "muted";
    default:
      return "muted";
  }
}

/** Human label for a task status (Title-case of the known set). */
export function taskStatusLabel(status: TaskStatus): string {
  if (!status) return "Unknown";
  return status.charAt(0) + status.slice(1).toLowerCase();
}
