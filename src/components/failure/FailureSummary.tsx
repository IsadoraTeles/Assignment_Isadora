/**
 * FailureSummary — the root view of the failure drill-stack. Leads with MEANING,
 * not status: a plain-language headline (deterministic), an illustrated Spine of
 * where it broke (deterministic), then the AI-attributed interpretation (likely
 * cause + what next). Deeper detail lives behind doors. For runs that never executed
 * it shows an honest "nothing ran" state instead of a fabricated spine.
 */
import { FileText, ListChecks, Terminal } from "lucide-react";
import type { Run } from "@/lib/types";
import { deriveFailureDiagnosis, deriveTaskBreakdown } from "@/lib/failure";
import { derivePhases } from "@/lib/phases";
import { RunProgress } from "@/components/RunProgress";
import { RunIdentity } from "./RunIdentity";
import { AiInterpretation } from "./AiInterpretation";
import { Door } from "./Door";

interface FailureSummaryProps {
  run: Run;
}

export function FailureSummary({ run }: FailureSummaryProps) {
  const diagnosis = deriveFailureDiagnosis(run);
  const phases = derivePhases(run.tasks);
  const breakdown = deriveTaskBreakdown(run);

  return (
    <div className="flex flex-col gap-5">
      <RunIdentity run={run} />

      {/* h2, not h1: the page already owns the single h1 ("Pipeline runs"); inside
          the dialog headings continue from the view title without skipping levels. */}
      <h2 className="max-w-[36ch] text-xl font-semibold leading-snug tracking-tight text-ink">
        {diagnosis.headline}
      </h2>

      {/* Where it got to — as progress. No tasks → an honest "nothing ran" line. */}
      <RunProgress
        phases={phases}
        emptyNote="the failure is in the launch, not the science."
      />

      {/* AI-attributed region: likely source + cause + suggestions together, one
          marker, so no interpretive content is left unlabelled. */}
      <AiInterpretation
        source={diagnosis.source}
        cause={diagnosis.cause}
        steps={diagnosis.nextSteps}
      />

      <div className="flex flex-col gap-2">
        {/* "What ran" only appears when tasks actually ran — honesty over symmetry. */}
        {breakdown.total > 0 && (
          <Door
            to="what-ran"
            title="What ran"
            descriptor="The full task breakdown, visualized"
            Icon={ListChecks}
          />
        )}
        <Door
          to="raw-error"
          title="Raw platform error"
          descriptor="The unedited message — often misleading"
          Icon={Terminal}
        />
        <Door
          to="complete-results"
          title="Complete results"
          descriptor="Everything about this run, on one page"
          Icon={FileText}
        />
      </div>
    </div>
  );
}
