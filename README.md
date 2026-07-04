# Pipeline Run Status Dashboard

**Live demo → https://assignment-isadora.vercel.app/**

A redesign of the run-monitoring experience for a bioinformatics workflow platform, built
around one idea: **progressive disclosure**. Instead of dropping you into a wall of tabs, it
reads the situation first, then lets you drill exactly as deep as you want.

> **Health at a glance → a scannable runs list → a first-class, diagnostic failure view** for
> the runs that broke. Everything shown is reconstructed from the real execution data —
> nothing is fabricated.

**Stack:** Vite · React · TypeScript · Tailwind · shadcn/ui (Radix) · framer-motion.
Styled with a design-token system **sampled from the product's own UI and tuned for WCAG AA**.

## Run it

```bash
npm install
npm run dev        # then open the printed URL (default http://localhost:5173)

npm run build      # type-check (tsc -b) + production build
npm run typecheck  # tsc --noEmit
npm run preview    # preview the production build
```

Requires Node 18+ (developed on Node 22).

![Overview — run health at a glance](images/overview.png)

## The problem

Today, understanding a run means *reading*. The runs list is flat, and a single run opens
into eight dense tabs of equal-weight data — you become the interpreter. The hardest, highest-
stakes moment is understanding a **failure**, and that's exactly where the current experience
leaves you alone with raw logs and a cryptic error. This dashboard does the interpretation
*for* you, in plain language, and keeps the raw depth one click away.

## How it fits: replace · insert · preserve

It's an addition to the existing product, not a rewrite of it:

- **Replaces** the Runs list — same job, but with a health band, cost, task ratios, plain-
  language descriptions, filtering and sorting the flat list lacks.
- **Inserts** an interpretation layer between clicking a run and the platform's existing
  detail — a *"what happened, and what needs you"* surface, before the tabs.
- **Preserves** the platform's depth — *See full run details* opens the existing detailed
  view, unchanged. A new default, not a rebuild; the raw detail experts rely on is one click away.

## What the data taught me (why the design looks like this)

The dataset is an **execution record, not the science** — timing, cost, task status. The real
scientific outputs live in cloud storage, referenced only by path. Every design choice follows
from reading the data closely:

- **The raw error is unreliable.** On the mid-run failure it's a 255-char *truncated banner
  naming the wrong tool* (ABACAS), while the failing step is UNICYCLER — and the run's exit
  status reads `0` even though it failed. → I reconstruct the cause from task-level signals and
  demote the raw text behind a caveat.
- **Run status ≠ task status.** A succeeded run can contain a task that failed and *recovered
  on retry*. → surfaced in one plain line ("explain, don't alarm"), not hidden, not alarming.
- **Two failure archetypes, handled distinctly.** *Mid-run* (a step killed deep in, after 77
  succeeded) gets a specific diagnosis; *died-on-arrival* (~8s, zero tasks) gets an honest
  **"nothing ran"** state — no fake spine or chart.
- **Independent runs, not sub-pipelines.** The list mixes pipelines and repeats — the same
  pipeline appears twice with *different outcomes*. → the overview interprets *across* runs.
- **`tasks[]` is truncated; `stats`/`load` are authoritative.** → counts come from `stats`
  (77 / 2 / 9 = 88 % completed); task rows are labelled as a sample when fewer are shown.
- **exit 143 = an external kill** (spot reclamation or timeout), *not* out-of-memory — that
  shows as 137. The tasks ran on **spot instances**, confirmed in the data. → the cause and the
  next-steps reflect that, in the right order.

## Design decisions

- **Progressive disclosure** — one idea per view; open doors to go deeper; always a way back.
- **Lead with meaning, not status** — a failed run opens with a plain-language headline; the
  status is demoted to a small pill.
- **Failure as a first-class diagnosis** — *where* it broke (an illustrated **Spine** of
  pipeline phases), *why* (a grounded, hedged likely cause), and *what next* (concrete
  suggestions, framed as the user's choice — the human stays in control).
- **AI, honestly — two trust models.** The interpretive content (likely cause + suggestions)
  lives in one AI-attributed region with a dedicated **violet colour role** — deliberately
  *not* the brand teal, so an AI panel on a failed run can never read as "success"-green — and
  a single `AI · illustrative` marker (a hand-built stub here; a live model in production).
  Deterministic content — the headline, the spine, the counts, the overview summary — is
  *computed*, always correct, and carries **no** AI label.
- **Illustrated understanding** — hand-rolled SVG primitives (**Donut, Gauge, Spine, Bar**),
  each answering one question; no chart library, so they read as native to the platform.
- **Accessibility as a design constraint, not a final pass** — keyboard-drillable, focus
  follows navigation, WCAG AA contrast, status as icon + text + colour, reduced-motion aware.

## What's built

**Overview** — an **interpretive summary band** (a computed, always-correct synthesis of the
whole set: *"7 runs across 4 pipelines… 2 failed — these need attention"*), **health tiles that
double as filter toggles**, a **sort** control (recent / duration / cost / status), and a
**runs list** where every row carries status, a plain-language description, duration, cost, and
a task-success ratio. Filtering to a status with no matches (e.g. RUNNING) shows a genuine
**empty state**, and the app has real **loading / empty / failed** code paths.

**Failure view (the centerpiece)** — clicking a run opens a full-size sheet with *See full run
details ↗* by the title. A failed run leads with the plain-language headline, the illustrated
**Spine** (where it broke), the violet **AI region** (likely cause + what next), then **doors**
to go deeper: *What ran* (a Donut + the stopped-task rows), *Raw platform error* (demoted, with
its unreliability caveat), and *Complete results* (a one-page report). The visual spec it
reimplements is [`design/failure-panel-v3.html`](./design/failure-panel-v3.html).

## What I deliberately left out (next steps, not gaps)

A focused slice stays sharp by leaving deep-but-secondary detail for later — each with a clear
home in the existing architecture:

- **Per-process resource charts** (`metrics[]`: CPU/memory/IO per process) — a "resources" view
  using the same viz primitives; omitted to keep the failure story about *where* and *why*.
- **Provenance / reproducibility** (`commandLine`, `commitId`, `sessionId`) — a panel to copy
  the exact command, link the commit, resume the session.
- **Group-by-pipeline** at scale — the data layer already computes per-pipeline counts.
- **Real-time runs**, a **density toggle**, and **overview charts** — deferred on purpose (a
  real-time view would fabricate data the dataset doesn't contain).

## Project layout

```
src/
  data/                 # the real, provided dataset (moved here)
  styles/               # design tokens (imported globally)
  lib/                  # data layer — no JSX: types (from the real shape), the data hook,
                        #   null-safe formatters, and the domain logic — phases.ts (spine),
                        #   failure.ts (grounded diagnosis), overview.ts (deterministic synthesis)
  components/
    ui/                 # shadcn/ui primitives, token-wired
    viz/                # hand-rolled SVG: Donut, Gauge, Spine, Bar
    failure/            # the drill-stack (DrillStack, Door, FailureView, AiInterpretation, …)
    …                   # overview components (OverviewSummary, HealthSummary, RunList, …)
```

Everything on screen is derived at runtime from the real dataset; `src/lib/` is where each
derivation lives (no `any`, types from the actual data shape).

## Docs

- **[DESIGN-DIRECTIONS.md](./DESIGN-DIRECTIONS.md)** — the design principles.
- **[ai-interaction-principles.md](./ai-interaction-principles.md)** — how the AI behaves.
- **[NOTES.md](./NOTES.md)** — the full decision log, and how each derivation maps to the data.

## Accessibility

Treated as a design constraint and **audited against the running app** (axe-core across every
state, a keyboard-only pass, a computed WCAG contrast sweep) — not just reviewed in code.
Keyboard-complete with logical tab order; focus moves into a run on open and **returns to the
row that opened it** on close; a single visible `:focus-visible` ring (no `outline:none`);
semantic landmarks and a proper dialog; status as **icon + text + colour** with aria-labels;
every text/status pair meets AA; viz primitives are `role="img"` with descriptive labels;
`prefers-reduced-motion` honoured; and the result count is an `aria-live` region.