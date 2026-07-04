/**
 * RawErrorView — the "Raw platform error" door. The unedited message, demoted
 * behind a door because it's unreliable: often null, an empty string, truncated at
 * 255 chars, or naming a sibling tool rather than the step that actually failed.
 * The caveat is derived from the real data, not hard-coded.
 */
import { AlertTriangle } from "lucide-react";
import type { Run } from "@/lib/types";
import { deriveFailureDiagnosis } from "@/lib/failure";
import { processLeaf } from "@/lib/tasks";

const PLATFORM_TRUNCATION_LIMIT = 255;

interface RawErrorViewProps {
  run: Run;
}

export function RawErrorView({ run }: RawErrorViewProps) {
  // Handle BOTH null and empty-string: the two failed runs differ (one is null, the
  // other ""), and neither should render as a blank code block.
  const raw = run.errorMessage?.trim() ? run.errorMessage : null;

  if (!raw) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-ink">
          No raw error was recorded.
        </p>
        <p className="text-sm text-muted-text">
          {run.tasks && run.tasks.length > 0
            ? "The platform captured no error text for this run."
            : "The run failed before any tool produced output, so there's nothing to show here — the cause is in the launch configuration."}
        </p>
      </div>
    );
  }

  const failingTask = deriveFailureDiagnosis(run).failingTask;
  const failingLeaf = failingTask ? processLeaf(failingTask.process) : null;
  const truncated = raw.length >= PLATFORM_TRUNCATION_LIMIT;
  const namesWrongTool = Boolean(
    failingLeaf && !raw.toUpperCase().includes(failingLeaf.toUpperCase()),
  );

  return (
    <div className="flex flex-col gap-4">
      <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-words rounded-sm bg-ink p-4 font-mono text-xs text-white/90">
        {raw}
      </pre>
      <div className="flex items-start gap-2.5 rounded-sm bg-surface-sunk p-3">
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-solid"
          aria-hidden="true"
        />
        <p className="text-sm text-ink-2">
          {truncated && "Truncated at 255 characters by the platform. "}
          {namesWrongTool && failingLeaf && (
            <>
              It doesn't even name{" "}
              <b className="text-danger-text">{failingLeaf}</b>, the step that
              actually failed.{" "}
            </>
          )}
          The raw text can't tell you the reason — the task rows can. That's why
          the panel doesn't lead with it.
        </p>
      </div>
    </div>
  );
}
