/**
 * AiInterpretation — the AI-attributed region of the failure view. It holds the two
 * pieces of INTERPRETIVE content: the "Likely cause" reading and the "What next"
 * suggestions that follow from it. Both live under ONE clearly-scoped AI region with
 * ONE subtle marker — a violet sparkle plus a small label — so no AI-authored content
 * is left unlabelled. The region uses a dedicated AI colour role (--ai-*, violet)
 * rather than the brand teal: on a FAILED run a green/teal tint reads as "success",
 * so AI gets its own hue that can't be confused with run health. Deterministic
 * content (headline, spine, task counts, overview summary) stays OUTSIDE this
 * region, unmarked.
 *
 * The marker is intentionally a quiet icon+colour cue, not a loud pill; it's a real
 * focusable control so its self-explaining tooltip is reachable by keyboard, and it
 * exposes the same text to assistive tech via aria-describedby. Content is derived
 * only from real fields (see lib/failure.ts). Used for BOTH failure archetypes.
 */
import { useId } from "react";
import { Sparkles, Lightbulb } from "lucide-react";
import type { FailureSource, NextStep } from "@/lib/failure";

const AI_TOOLTIP =
  "AI-generated interpretation. 'Illustrative' = a hand-built stub in this prototype; a live model in production.";

interface AiInterpretationProps {
  /** Hedged "likely source" category — a scannable chip above the cause sentence. */
  source: FailureSource | null;
  cause: { text: string; hedge: string } | null;
  steps: NextStep[];
}

export function AiInterpretation({
  source,
  cause,
  steps,
}: AiInterpretationProps) {
  const tooltipId = useId();

  return (
    <section
      aria-label="AI interpretation, illustrative"
      className="flex flex-col gap-3.5 rounded-r-sm border-l-[3px] border-ai-solid bg-ai-soft p-4"
    >
      <div className="flex justify-end">
        <span className="group relative inline-flex">
          <button
            type="button"
            aria-describedby={tooltipId}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-ai-text"
          >
            <Sparkles
              className="h-3.5 w-3.5 text-ai-solid"
              aria-hidden="true"
            />
            AI · illustrative
          </button>
          {/* Tooltip: shows on hover AND keyboard focus (focus-within); always in the
              DOM so aria-describedby carries it to screen readers. */}
          <span
            role="tooltip"
            id={tooltipId}
            className="pointer-events-none absolute right-0 top-full z-10 mt-1.5 w-64 rounded-md border border-border bg-bg p-2 text-xs font-normal normal-case leading-snug text-ink-2 opacity-0 shadow-2 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
          >
            {AI_TOOLTIP}
          </span>
        </span>
      </div>

      {cause && (
        <div>
          {/* The likely SOURCE is a scannable category chip sitting ON the cause
              heading — the "who" that the sentence below then explains. Kept as a
              bare label (not a second sentence) so it never restates the cause. */}
          <div className="mb-1 flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-ai-text">
              Likely cause
            </h3>
            {source && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-ai-text/40 bg-white/50 px-2 py-0.5 text-[11px] font-semibold text-ai-text">
                Source: {source}
              </span>
            )}
          </div>
          <p className="text-sm text-ink-2">
            <span className="font-semibold text-ink">{cause.text}</span>{" "}
            <span>{cause.hedge}</span>
          </p>
        </div>
      )}

      {steps.length > 0 && (
        <div className={cause ? "border-t border-ai-solid/20 pt-3" : ""}>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ai-text">
            <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
            What next
          </h3>
          <ol className="flex flex-col">
            {steps.map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-3 border-t border-ai-solid/15 py-2.5 first:border-t-0 first:pt-0"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/70 text-xs font-bold text-ai-text">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{step.title}</p>
                  <p className="text-xs text-ink-2">{step.detail}</p>
                </div>
                {step.action && (
                  <button
                    type="button"
                    className="shrink-0 whitespace-nowrap rounded-sm border border-ai-text bg-white/50 px-2.5 py-1 text-xs font-semibold text-ai-text hover:bg-white"
                  >
                    {step.action} →
                  </button>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
