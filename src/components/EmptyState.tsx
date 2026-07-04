import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStatusVisual } from "@/lib/status";
import type { RunStatus } from "@/lib/types";

interface EmptyStateProps {
  /** The status that was filtered to (the reason nothing matched). */
  status: Exclude<RunStatus, never>;
  onClearFilter: () => void;
}

/**
 * Genuine empty state for a filter with zero matches. Explains *why* it's empty
 * (grounded in the actual dataset — e.g. no RUNNING runs exist) and offers a way out.
 */
export function EmptyState({ status, onClearFilter }: EmptyStateProps) {
  const { label } = getStatusVisual(status);

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-sunk">
        <SearchX className="h-6 w-6 text-muted-solid" aria-hidden="true" />
      </span>
      <div className="flex max-w-md flex-col gap-1">
        <p className="font-semibold text-ink">No {label.toLowerCase()} runs</p>
        <p className="text-sm text-muted-text">
          None of the loaded runs have the status{" "}
          <span className="font-medium text-ink-2">{label}</span>. This sample
          dataset only contains succeeded, failed, and cancelled runs.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onClearFilter}>
        Clear filter
      </Button>
    </div>
  );
}
