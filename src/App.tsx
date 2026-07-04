import { useMemo, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useRuns } from "@/lib/useRuns";
import type { Run } from "@/lib/types";
import { sortRuns, type SortKey } from "@/lib/sort";
import { OverviewSummary } from "@/components/OverviewSummary";
import { HealthSummary } from "@/components/HealthSummary";
import { RunList } from "@/components/RunList";
import { RunDetail } from "@/components/RunDetail";
import {
  StatusFilter,
  type StatusFilterValue,
} from "@/components/StatusFilter";
import { SortControl } from "@/components/SortControl";
import { EmptyState } from "@/components/EmptyState";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";

/**
 * Dashboard shell: owns the load state (via useRuns), the shared status filter, the
 * sort order, and the selected-run detail. Presentation lives in /components and all
 * derivation in /lib; this file only composes and maps the three real states
 * (loading → skeleton, empty → filtered-to-zero, success → overview + list).
 */
export default function App() {
  const state = useRuns();
  const [filter, setFilter] = useState<StatusFilterValue>("ALL");
  const [sort, setSort] = useState<SortKey>("recent");
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  // The element that opened the sheet (the run row), so we can return focus to it
  // on close — we open programmatically, so Radix has no Trigger to restore to.
  const triggerRef = useRef<HTMLElement | null>(null);

  const runs = state.status === "success" ? state.runs : [];

  // Filter then sort. The overview band and tiles read the FULL set (synthesis is
  // about everything), while the list shows the filtered/sorted view.
  const visibleRuns = useMemo(() => {
    const filtered =
      filter === "ALL" ? runs : runs.filter((r) => r.status === filter);
    return sortRuns(filtered, sort);
  }, [runs, filter, sort]);

  function openRun(run: Run) {
    // Remember the focused row (works for both click and keyboard activation).
    triggerRef.current = document.activeElement as HTMLElement | null;
    setSelectedRun(run);
    setDetailOpen(true);
  }

  // Tiles and the status dropdown drive the SAME filter — clicking the active tile
  // (or its status again) clears back to "ALL". One source of truth, no conflict.
  function toggleStatus(status: StatusFilterValue) {
    setFilter((cur) => (cur === status ? "ALL" : status));
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-5">
          <div className="flex items-center gap-2">
            <span
              className="h-6 w-1.5 rounded-full bg-brand-solid"
              aria-hidden="true"
            />
            <h1 className="text-xl font-semibold text-ink">Pipeline runs</h1>
          </div>
          <p className="text-sm text-muted-text">
            Run health at a glance — with plain-language diagnosis for the runs
            that failed.
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
        {state.status === "loading" && <DashboardSkeleton />}

        {state.status === "error" && (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-lg border border-danger-soft bg-danger-soft/60 p-4 text-danger-text"
          >
            <AlertCircle
              className="h-5 w-5 text-danger-solid"
              aria-hidden="true"
            />
            <p className="text-sm font-medium">{state.error}</p>
          </div>
        )}

        {state.status === "success" && (
          <>
            <OverviewSummary runs={runs} />

            <HealthSummary
              runs={runs}
              activeStatus={filter}
              onToggleStatus={toggleStatus}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-text" aria-live="polite">
                Showing {visibleRuns.length} of {runs.length}{" "}
                {runs.length === 1 ? "run" : "runs"}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <SortControl value={sort} onChange={setSort} />
                <StatusFilter value={filter} onChange={setFilter} />
              </div>
            </div>

            {visibleRuns.length > 0 ? (
              <RunList runs={visibleRuns} onOpenRun={openRun} />
            ) : (
              // filter can only be a concrete status here (ALL always has matches
              // when runs exist), so this is the genuine zero-match empty state.
              <EmptyState
                status={filter === "ALL" ? "SUCCEEDED" : filter}
                onClearFilter={() => setFilter("ALL")}
              />
            )}
          </>
        )}
      </main>

      <RunDetail
        run={selectedRun}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        triggerRef={triggerRef}
      />
    </div>
  );
}
