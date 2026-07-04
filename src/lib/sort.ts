/**
 * Run sorting for the overview list.
 *
 * WHY these keys and nothing time-series-y: the runs are INDEPENDENT executions —
 * there is no cross-run sequence or dependency — so ordering is purely by a field
 * the user cares about (recency, runtime, spend, or state), never a computed
 * "pipeline order". Pure and non-mutating.
 */
import type { Run } from "./types";

export type SortKey = "recent" | "duration" | "cost" | "status";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Most recent" },
  { value: "duration", label: "Duration" },
  { value: "cost", label: "Cost" },
  { value: "status", label: "Status" },
];

// Failures first — a status sort should surface what needs attention, not bury it.
const STATUS_RANK: Record<Run["status"], number> = {
  FAILED: 0,
  RUNNING: 1,
  SUBMITTED: 2,
  CANCELLED: 3,
  SUCCEEDED: 4,
};

/** Descending compare that always pushes null/undefined to the end. */
function descNullsLast(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return b - a;
}

/** Newest submit first (ISO strings sort lexically). */
function byRecent(a: Run, b: Run): number {
  return a.submit < b.submit ? 1 : a.submit > b.submit ? -1 : 0;
}

export function sortRuns(runs: Run[], key: SortKey): Run[] {
  const sorted = [...runs];
  switch (key) {
    case "duration":
      return sorted.sort(
        (a, b) => descNullsLast(a.duration, b.duration) || byRecent(a, b),
      );
    case "cost":
      return sorted.sort(
        (a, b) => descNullsLast(a.load.cost, b.load.cost) || byRecent(a, b),
      );
    case "status":
      return sorted.sort(
        (a, b) =>
          STATUS_RANK[a.status] - STATUS_RANK[b.status] || byRecent(a, b),
      );
    case "recent":
    default:
      return sorted.sort(byRecent);
  }
}
