/**
 * RunDetail — the full-size run detail, a right-side sheet (Radix-backed: focus-trap
 * + Escape, not a cramped modal). Routes by status: a FAILED run opens the
 * first-class FailureView drill-stack; any other run shows the one-page RunReport.
 */
import type { MutableRefObject } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Run } from "@/lib/types";
import { derivePhases } from "@/lib/phases";
import { FailureView } from "@/components/failure/FailureView";
import { RunReport } from "@/components/failure/RunReport";
import { RunIdentity } from "@/components/failure/RunIdentity";
import { RunProgress } from "@/components/RunProgress";

interface RunDetailProps {
  run: Run | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The row that opened the sheet; focus returns here on close. */
  triggerRef: MutableRefObject<HTMLElement | null>;
}

export function RunDetail({
  run,
  open,
  onOpenChange,
  triggerRef,
}: RunDetailProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-3xl p-0"
        // Programmatic open has no Radix Trigger to restore to, so we return focus
        // to the originating row ourselves (keyboard users don't lose their place).
        onCloseAutoFocus={(e) => {
          const trigger = triggerRef.current;
          if (trigger && document.contains(trigger)) {
            e.preventDefault();
            trigger.focus();
          }
        }}
      >
        {run && (
          <>
            {/* Title/description are for the accessibility tree; the visible headings
                live inside the views. */}
            <SheetTitle className="sr-only">
              {run.runName} — run detail
            </SheetTitle>
            <SheetDescription className="sr-only">
              Full detail for pipeline run {run.runName}.
            </SheetDescription>
            {run.status === "FAILED" ? (
              <FailureView run={run} />
            ) : (
              <NonFailedDetail run={run} />
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Non-failed runs don't need the diagnostic drill — just the identity + full report. */
function NonFailedDetail({ run }: { run: Run }) {
  // Same phase progress as the failure view. A run with tasks shows how far it got
  // (all green when it succeeded); a run with zero tasks (a cancelled run) derives
  // [] → the honest "nothing ran" state, never a fabricated spine.
  const phases = derivePhases(run.tasks);
  const emptyNote =
    run.status === "CANCELLED"
      ? "the run was cancelled before any task started."
      : undefined;

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold text-ink">Run detail</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col gap-6">
          <RunIdentity run={run} />
          <RunProgress phases={phases} emptyNote={emptyNote} />
          <RunReport run={run} />
        </div>
      </div>
    </div>
  );
}
