# Pipeline Run Status Dashboard

**Live demo → https://assignment-isadora.vercel.app/**

> Health at a glance → a scannable runs list → a diagnostic failure view…

![Overview — run health at a glance, with each run's phase roadmap](images/overview.png)

![Failure detail — run progress, likely source, and the grounded cause](images/details.png)

A redesign of the run-monitoring experience for a bioinformatics workflow platform, built
around one idea: **progressive disclosure**. It reads the situation first, then lets you drill
exactly as deep as you want — and treats a *failed* run as a first-class, diagnostic experience.

> **Health at a glance → a scannable runs list (each run shows its phase roadmap) → a
> diagnostic failure view** for the runs that broke. Everything shown is reconstructed from the
> real execution data — nothing is fabricated.

**Stack:** Vite · React · TypeScript · Tailwind · shadcn/ui (Radix) · framer-motion.
Visualizations are hand-rolled SVG. Styled with a token system **sampled from the product's own
UI and tuned for WCAG AA**.

## Run it

```bash
npm install
npm run dev        # then open the printed URL (default http://localhost:5173)

npm run build      # type-check (tsc -b) + production build
npm run typecheck  # tsc --noEmit
npm run preview    # preview the production build
```

Requires Node 18+ (developed on Node 22).

## The problem, and how this fits

Today, understanding a run means *reading*: the runs list is flat, and a single run opens into
eight dense tabs of equal-weight data — you become the interpreter, and the hardest moment,
understanding a **failure**, leaves you alone with raw logs. This dashboard does that
interpretation for you and keeps the raw depth one click away. It's an addition, not a rewrite:

- **Replaces** the runs list — same job, plus a health band, cost, task ratios, plain-language
  descriptions, filtering/sorting, and each run's **phase roadmap** (the road it travelled and
  where it stopped).
- **Inserts** an interpretation layer between clicking a run and the existing detail.
- **Preserves** the platform's depth — *See full run details* opens the existing view, unchanged.

## What the data taught me (the reasoning starts here)

The dataset is an **execution record, not the science** — timing, cost, task status; the real
outputs live in cloud storage, referenced only by path. Every interaction and component choice
below follows from reading the data closely:

- **The raw error is unreliable.** On the mid-run failure it's a 255-char *truncated banner
  naming the wrong tool* (ABACAS, not the failing UNICYCLER), and the run's exit status reads
  `0` while it failed. → the failure view **reconstructs** the cause from task-level signals and
  demotes the raw text.
- **Run status ≠ task status.** A succeeded run can contain a task that failed and *recovered on
  retry*. → surfaced in one plain line ("explain, don't alarm").
- **Two failure archetypes.** Mid-run (a step killed after 77 succeeded) vs died-on-arrival
  (~8s, zero tasks). → treated distinctly; a run that never executed shows an honest "nothing
  ran," not a fake chart.
- **`tasks[]` is truncated; `stats`/`load` are authoritative.** → counts come from `stats`
  (77 / 2 / 9 = 88 % completed); rows are labelled as a sample.
- **exit 143 = an external kill** (spot reclamation / timeout), *not* out-of-memory (that's
  137); the tasks ran on **spot instances**, confirmed in the data. → the diagnosis, the
  "Likely source" tag (Infrastructure), and the next-steps all reflect that.

## Interaction choices, and why

- **Progressive disclosure** — one idea per view; open doors to go deeper; always a way back.
  The overview *triages* ("which runs need me?"); the detail *diagnoses*.
- **Lead with meaning, not status** — a failed run opens with a plain-language headline; the
  status is a small pill. You already know it failed — the useful thing is *what* and *why*.
- **The phase roadmap** — on the overview it shows each run's road and where it stopped (labels
  reveal on hover/focus to keep the list scannable); in the detail it's reframed as **run
  progress** ("4 of 5 — stopped at Assembly"). It's the same component in two contexts, and it's
  the honest terminal state of what, with live telemetry, would animate as a run progresses.
- **Failure as a first-class diagnosis** — *where* it broke (the roadmap), *whose fault* (a
  hedged "Likely source" tag — Infrastructure / Configuration / Pipeline / User), *why* (the
  grounded cause), and *what next* (concrete, framed as the user's choice). The source tag and
  live-progress emphasis came from validating with a biotechnologist.
- **AI, honestly — two trust models.** Interpretive content (source + cause + suggestions) sits
  in one region with a dedicated **violet colour role** — deliberately not the brand teal, so an
  AI panel on a failed run can't read as "success"-green — and a single `AI · illustrative`
  marker (a hand-built stub here; a live model in production). Deterministic content (headline,
  roadmap, counts, the overview summary) is computed and carries **no** AI label.

## Component & code choices, and why

- **Data layer / presentation split.** `lib/` holds no JSX — types derived from the *actual*
  data shape, null-safe formatters, and the domain logic (`phases.ts` → roadmap, `failure.ts` →
  grounded diagnosis + `deriveFailureSource()`, `overview.ts` → the deterministic summary). Why:
  the interpretation logic is the interesting part and the most likely to change or move to a
  server, so it's isolated and testable, away from rendering.
- **One `Spine` component, two contexts.** The overview roadmap and the detail progress are the
  same component with a `compact` prop — one source of truth for "where did it get to," so the
  two views can't drift.
- **Hand-rolled SVG primitives** (`Donut`, `Gauge`, `Spine`, `Bar`) instead of a chart library.
  Why: they match the product's visual language, keep the bundle lean, and each answers exactly
  one question.
- **A drill-stack for the failure view** (`DrillStack`, `Door`, `FailureView`, …) with
  push/pop navigation and focus management. Why: the "one idea per view, always a way back"
  interaction *is* the architecture.
- **Typed throughout, no `any`; the three states are real code paths** (a simulated load exposes
  the loading skeleton; filtering to an empty status exposes the empty state; failed/cancelled
  runs render null-safely).

## Tradeoffs

- **Interpretation depth over exhaustive provenance.** I surface what answers "is it healthy /
  why did it fail," and link out for the platform's full provenance (config, containers, per-
  process metrics, raw logs). Gain: speed-to-understanding. Cost: the deepest audit detail lives
  one click away, not in-view.
- **A focused slice over broad coverage.** One vertical, built deep, rather than every screen
  shallow — the scope the brief rewards, at the cost of surface area.
- **Hand-rolled visualizations over a charting library.** Native feel and a lean bundle, at the
  cost of building the primitives myself.
- **Honesty over demo flash.** No faked real-time view, no recreated results report — because
  the dataset is post-execution and holds no scientific outputs. A live-looking demo would have
  been more dazzling; it would also have been dishonest.

## What I'd build next (with more time / real data)

- **Real-time runs** — the roadmap is built for it; with live telemetry it fills in as phases
  complete. Not faked here because the dataset is entirely post-execution.
- **Per-process resource charts** (`metrics[]`) and a **provenance panel** (copy the exact
  command, link the commit, resume the session).
- **Group-by-pipeline** at scale (the data layer already computes per-pipeline counts).
- **Rerun-from-the-failed-step** as a real action, plus a concise ↔ full density toggle.

## Project layout

```
src/
  data/        # the real, provided dataset
  styles/      # design tokens (imported globally)
  lib/         # data layer — no JSX: types, hook, null-safe formatters, and the domain
               #   logic — phases.ts (roadmap), failure.ts (diagnosis + source), overview.ts
  components/
    ui/        # shadcn/ui primitives, token-wired
    viz/       # hand-rolled SVG: Donut, Gauge, Spine, Bar
    failure/   # the drill-stack (DrillStack, Door, RunProgress, AiInterpretation, …)
    …          # overview components (OverviewSummary, HealthSummary, RunList, RunCard, …)
```

## Accessibility

Treated as a design constraint and **audited against the running app** (axe-core across every
state, a keyboard-only pass, a computed WCAG contrast sweep) — not just reviewed in code.
Keyboard-complete with logical order; focus moves into a run on open and **returns to the row
that opened it** on close; a single visible `:focus-visible` ring; semantic landmarks and a
proper dialog; status as **icon + text + colour** with aria-labels; the roadmap carries an
enumerated aria-label; every text/status pair meets AA; viz primitives are `role="img"` with
descriptive labels; `prefers-reduced-motion` honoured; and the result count is an `aria-live`
region.

## Docs

- **[DESIGN-DIRECTIONS.md](./DESIGN-DIRECTIONS.md)** — the design principles.
- **[ai-interaction-principles.md](./ai-interaction-principles.md)** — how the AI behaves.
- **[NOTES.md](./NOTES.md)** — the decision log, the data-faithfulness audit, and how each
  derivation maps to the real data.