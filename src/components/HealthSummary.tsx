/**
 * HealthSummary — counts by status as loud, at-a-glance tiles that double as filter
 * toggles. Each tile is a real <button> (aria-pressed, keyboard-operable, visible
 * focus); clicking filters the list to that status, clicking the active one clears.
 * The filter lives in App, shared with the Sort/Status controls — one source of truth.
 */
import { CheckCircle2, XCircle, Ban } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Run, RunStatus } from "@/lib/types";
import type { StatusFilterValue } from "./StatusFilter";
import { cn } from "@/lib/utils";

type TileStatus = Extract<RunStatus, "SUCCEEDED" | "FAILED" | "CANCELLED">;

interface StatDef {
  status: TileStatus;
  label: string;
  Icon: LucideIcon;
}

const STATS: StatDef[] = [
  { status: "SUCCEEDED", label: "Succeeded", Icon: CheckCircle2 },
  { status: "FAILED", label: "Failed", Icon: XCircle },
  { status: "CANCELLED", label: "Cancelled", Icon: Ban },
];

interface HealthSummaryProps {
  runs: Run[];
  activeStatus: StatusFilterValue;
  onToggleStatus: (status: TileStatus) => void;
}

export function HealthSummary({
  runs,
  activeStatus,
  onToggleStatus,
}: HealthSummaryProps) {
  const counts = runs.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-text">Filter by status</p>
      <div
        role="group"
        aria-label="Filter runs by status"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {STATS.map(({ status, label, Icon }) => {
          const count = counts[status] ?? 0;
          const loud = status === "FAILED" && count > 0;
          const active = activeStatus === status;
          return (
            <button
              key={status}
              type="button"
              aria-pressed={active}
              aria-label={`Filter by ${label}: ${count} ${count === 1 ? "run" : "runs"}`}
              onClick={() => onToggleStatus(status)}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-4 text-left shadow-1 transition-colors hover:bg-surface-sunk",
                loud
                  ? "border-danger-solid bg-danger-soft"
                  : "border-border bg-surface",
                // Active = persistent ring so the applied filter is visible, not just
                // implied by the list below.
                active &&
                  "ring-2 ring-primary-solid ring-offset-1 ring-offset-bg",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
                  status === "SUCCEEDED" &&
                    "bg-success-soft text-success-solid",
                  status === "FAILED" && "bg-white/70 text-danger-solid",
                  status === "CANCELLED" && "bg-muted-soft text-muted-solid",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col">
                <span
                  className={cn(
                    "text-2xl font-semibold leading-tight tabular-nums",
                    loud ? "text-danger-text" : "text-ink",
                  )}
                >
                  {count}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    active
                      ? "font-semibold text-primary-text"
                      : loud
                        ? "font-medium text-danger-text"
                        : "text-muted-text",
                  )}
                >
                  {label}
                  {active && " · filtering"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
