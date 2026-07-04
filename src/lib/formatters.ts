/**
 * Pure, presentation-free formatters. Every one treats null/undefined as a real
 * case (the data has genuinely null duration, cost, start, exitStatus, ...) and
 * returns an em-dash placeholder rather than throwing or printing "null".
 */

export const EMPTY = "—";

/** Format a millisecond duration as "1h 2m 3s" / "2m 3s" / "3s". Null → "—". */
export function formatDuration(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return EMPTY;
  if (ms < 1000) return `${Math.round(ms)}ms`;

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  // Show seconds if there are no larger units, or when there's a non-zero remainder.
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(" ");
}

/** Format a USD cost. Sub-cent costs keep more precision. Null → "—". */
export function formatCost(cost: number | null | undefined): string {
  if (cost == null || !Number.isFinite(cost)) return EMPTY;
  if (cost === 0) return "$0.00";
  // Costs in the data are fractions of a dollar; avoid rounding them to $0.00.
  const digits = cost < 0.01 ? 4 : cost < 1 ? 3 : 2;
  return `$${cost.toFixed(digits)}`;
}

/** Format a percentage (0–100 input). Null → "—". */
export function formatPercent(
  value: number | null | undefined,
  digits = 0,
): string {
  if (value == null || !Number.isFinite(value)) return EMPTY;
  return `${value.toFixed(digits)}%`;
}

/** Format a byte count as B/KB/MB/GB/TB (binary). Null → "—". */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return EMPTY;
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Format an ISO timestamp for display. Null → "—". */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return EMPTY;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export interface TaskRatio {
  succeeded: number;
  failed: number;
  total: number;
  /** null when there are no succeed/fail tasks recorded (e.g. cancelled run). */
  successRate: number | null;
  label: string;
}

/**
 * Task success ratio from run-level stats (succeedCount vs failedCount). The
 * tasks[] array can be truncated/absent, so stats is the authoritative source.
 */
export function taskRatio(
  succeedCount: number,
  failedCount: number,
): TaskRatio {
  const succeeded = Math.max(0, succeedCount || 0);
  const failed = Math.max(0, failedCount || 0);
  const total = succeeded + failed;
  const successRate = total === 0 ? null : (succeeded / total) * 100;
  return {
    succeeded,
    failed,
    total,
    successRate,
    label: total === 0 ? EMPTY : `${succeeded}/${total}`,
  };
}
