# Pipeline Run Status Dashboard

A pipeline run status dashboard with progressive disclosure: a health band that answers
_"is anything wrong?"_ at a glance → a scannable runs list → a **first-class, diagnostic
failure view** for the runs that broke. Every number that matters is visualised, and
everything shown is grounded in the real execution data — nothing is fabricated.

Built with **Vite + React + TypeScript**, **Tailwind**, **shadcn/ui** (Radix), and
**framer-motion**, styled with a **Seqera-derived token system** (colours sampled from the
product UI and tuned for WCAG AA).

## Run it

```bash
npm install
npm run dev
```

Then open the printed URL (default **http://localhost:5173**).

Other scripts:

```bash
npm run build      # type-check (tsc -b) + production build (vite build)
npm run typecheck  # tsc --noEmit
npm run preview    # preview the production build
```

Requires Node 18+ (developed on Node 22).

## Overview

- **Interpretive summary band** — a computed, one-to-two-line synthesis of the whole set
  ("7 runs across 4 pipelines… 2 failed — these need attention"). It's **deterministic**
  (always correct, no AI label) — synthesis first, so you get the takeaway before scanning
  rows.
- **Health tiles = filter toggles** — counts by status as loud tiles that are also
  `aria-pressed` filter buttons; click to filter, click again to clear. They share one
  filter with the status dropdown.
- **Sort control** — Most recent / Duration / Cost / Status (runs are independent, so
  sorting is purely field-based; failures sort first, nulls last).
- **Runs list** — each row: status, name, project, a plain-language description, duration,
  cost, and a task success ratio (from `stats`).
- **Status filter + empty state** — filtering to a status with no matches (e.g. RUNNING)
  shows a genuine empty state explaining why, with a _Clear filter_ action.
- **Real states** — loading skeletons (a simulated ~600 ms load), the filtered empty
  state, and null-safe rendering of failed/cancelled runs.
- **Run vs task status** — a SUCCEEDED run that contains a failed-then-recovered task says
  so in one plain line in its detail (explain, don't alarm).

## Failure view (the centerpiece)

Clicking a run opens a **full-size right sheet** with a **"See full run details ↗"**
link-out by the title. A **failed** run opens a drill-stack that leads with meaning, not
status:

- **What happened** — a plain-language headline (the status is demoted to a small pill).
- **Where it broke** — an illustrated **Spine** of pipeline phases (done / failed /
  not-reached), derived by grouping each task's `process` path. The same spine shows on
  succeeded runs (all green).
- **AI interpretation** — one clearly-scoped, AI-attributed region holding the grounded,
  hedged **Likely cause** _and_ the **What next** suggestions (both are interpretive). It
  uses a dedicated **AI colour role (violet, `--ai-*`)** — deliberately _not_ the brand
  teal, so an AI panel on a FAILED run can never read as "success"-green — and carries a
  single subtle marker: a violet sparkle + **"AI · illustrative"** with a keyboard-reachable
  tooltip explaining it's a hand-built stub here, a live model in production. Deterministic
  content (headline, spine, counts) stays outside it, unlabelled.
- **Doors** to go deeper: **What ran** (a **Donut** + the stopped-task rows), **Raw
  platform error** (demoted, with a caveat on why it's unreliable), and **Complete
  results** (the one-page report — **Gauge** + **Bar** + run/task/output detail).

Honesty throughout: a run that never executed (cancelled, died-on-arrival) shows an
honest **"nothing ran"** state — no fake spine or donut — and outputs **link out by
path** (the dataset is the execution record, not the science). See
[`design/failure-panel-v3.html`](./design/failure-panel-v3.html) for the visual spec this
reimplements.

Accessibility and restrained, reduced-motion-aware motion are built in throughout:
semantic landmarks, keyboard-drillable with **focus following navigation** into each view
and back, visible focus rings, Radix focus-trap, always-visible door descriptors (not
tooltips), and status as icon + text + colour.

## Project layout

```
src/
  data/seqera-sample-data.json   # the real, provided dataset (moved here)
  styles/seqera-tokens.css       # Seqera-derived design tokens (imported globally)
  lib/                           # data layer — no JSX
    types.ts                     # types derived from the ACTUAL data shape
    useRuns.ts                   # data hook (static import + simulated latency)
    formatters.ts                # duration / cost / bytes / date / task-ratio (null-safe)
    status.ts                    # status → role → icon/colour mapping
    tasks.ts                     # task helpers (process leaf, exit sentinel, retry, role)
    phases.ts                    # group task processes into ordered spine phases
    failure.ts                   # grounded failure diagnosis + task breakdown (AI stub)
    overview.ts                  # deterministic cross-run synthesis for the summary band
    sort.ts                      # field-based run sorting (recent/duration/cost/status)
    descriptions.ts              # projectName → plain-language description
    utils.ts                     # cn() class helper
  components/
    ui/                          # shadcn/ui primitives (badge, button, skeleton,
                                 #   select, sheet) — token-wired
    viz/                         # hand-rolled SVG: Donut, Gauge, Spine, Bar
    failure/                     # drill-stack: DrillStack, Door, FailureView,
                                 #   FailureSummary, WhatRanView, RawErrorView,
                                 #   RunReport, RunIdentity, TaskRow, AiInterpretation
    OverviewSummary, HealthSummary, SortControl, RunList, RunCard,
    StatusBadge, StatusFilter, EmptyState, RunDetail, DashboardSkeleton
  App.tsx, main.tsx, index.css
```

## Accessibility

Accessibility is treated as a design constraint, not a final pass, and is audited against
the running app (axe-core across every state, a keyboard-only pass, and a computed WCAG
contrast sweep):

- **Keyboard-complete** — every control (tile filters, sort/status selects, run rows, drill
  doors, Back, sheet close) is a real, operable element with a logical tab order.
- **Focus management** — opening a run moves focus into the sheet; **closing returns focus to
  the row that opened it**; drilling a door moves focus into the new view and Back returns it.
  Focus is always visible (a single token-driven `:focus-visible` ring; no `outline:none`).
- **Semantics** — `header`/`main` landmarks, in-order headings, runs as a list, a proper
  modal dialog, and status conveyed as **icon + text + colour** (with aria-labels — never
  colour alone).
- **Contrast** — every text/status pair meets WCAG AA (4.5:1 text, 3:1 large/UI) against its
  actual background, using the token `-text` tier for small text.
- **Visualisations** — Donut, Gauge, and Spine are each `role="img"` with a descriptive
  aria-label (e.g. "77 of 88 tasks completed") and never rely on colour alone.
- **Reduced motion** — all transitions honour `prefers-reduced-motion` (CSS + framer-motion).
- **Live regions** — the result count is an `aria-live` region so filtering/sorting is announced.

Each item above was verified against the running app (axe-core at rest across every state,
a keyboard-only pass, and a contrast sweep computed from the tokens), not just reviewed in
the code.

## How this extends (deliberate omissions, not gaps)

This prototype is a focused slice — health overview → run detail → failure as a
first-class diagnostic. Some real fields are intentionally left for later so the slice
stays sharp; each is a next step with a clear home in the existing architecture:

- **Per-process resource distributions** — each run carries a `metrics[]` array (CPU /
  memory / IO time-series per process). A "resources" view could chart these (the viz
  primitives — Donut/Gauge/Bar — are already in place); omitted here to keep the failure
  story about _where_ and _why_, not resource tuning.
- **Provenance / reproducibility** — `commandLine`, `commitId`, `sessionId`, `workDir`,
  and `revision` fully identify and reproduce a run. A "provenance" panel (copy the exact
  command, link the commit, resume the session) belongs in the run detail; only `workDir`
  and `revision` surface today.
- **Group-by-pipeline view** — collapse the flat list into per-pipeline groups with roll-up
  health, for volume beyond a scannable list. The data layer already computes per-pipeline
  counts (`lib/overview.ts`); this is a presentation layer on top.
- **Density toggle** on the run detail (concise ↔ full) and **overview charts** (e.g. cost
  per run) — deferred to keep the current slice focused.

Everything shown — spine phases, donut counts, the AI cause, the raw-error caveat, the spot
note — is derived at runtime from the real dataset (`src/data/seqera-sample-data.json`); the
data layer in `src/lib/` is where each derivation lives. The design and AI principles behind
these choices are documented in [`DESIGN-DIRECTIONS.md`](./DESIGN-DIRECTIONS.md) and
[`ai-interaction-principles.md`](./ai-interaction-principles.md); see
[`NOTES.md`](./NOTES.md) for the full decision log, assumptions, and how each derivation maps
to the real data.
