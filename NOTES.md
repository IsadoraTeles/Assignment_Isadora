# NOTES: Pipeline Run Status Dashboard

This is the decision log for the build, written as the work progressed. It is roughly
chronological, so **later entries supersede earlier ones wherever they conflict.** The
**Current state** section immediately below is the authoritative description of what
actually shipped; nothing further down the log should be read as contradicting it. When
an early decision was later changed (for example the AI region moving from teal to a
dedicated violet role, or the roadmap heading changing to "Run progress"), the change is
recorded in a later entry and reflected in Current state.

Two naming conventions are used throughout, matching the UI and the README:

- **Runs Overview:** the list screen (health summary, tiles, sortable run list).
- **Run Summary:** the interpreted per-run view that opens in a sheet.
- **full run details:** the platform's existing detailed view, which the Run Summary
  links out to and does not rebuild.

## Current state (authoritative)

- **Stack.** Vite, React, TypeScript, Tailwind v3, shadcn/ui (Radix), and
  framer-motion. Derivation logic lives in a data layer (`src/lib/`, no JSX);
  presentation lives in `src/components/`. No use of `any`; types are derived from the
  real data shape.
- **Data.** The real, provided `seqera-sample-data.json` (7 runs: 4 SUCCEEDED, 2
  FAILED, 1 CANCELLED). Nothing is fabricated. Every value on screen traces to a real
  field, and nullable fields render as an em-dash placeholder rather than "null" or a
  crash.
- **Runs Overview.** A deterministic interpretive summary band (`lib/overview.ts`, no
  AI label because it is computed and always correct), health tiles that double as
  filter toggles, a sort control (recent, duration, cost, status), and a run list where
  each row carries status, a plain-language description, duration, cost, a task-success
  ratio, and a **compact phase roadmap** of where the run reached. Runs that never
  executed show no roadmap. The three real states (loading, empty, failed) are genuine
  code paths.
- **Run Summary.** A full-size right sheet that leads with a plain-language headline,
  then shows **Run progress** (the phase roadmap, summarised as "N of N phases
  complete" or "M of N, stopped at _phase_", and "nothing ran" for a run with no
  tasks), then a **violet AI region** marked "AI, illustrative" holding the **Likely
  source** category chip, the grounded and hedged **Likely cause**, and the **What
  next** suggestions. Deeper detail sits behind doors: _What ran_ (a donut plus the
  stopped-task rows), _Raw platform error_ (demoted, with a derived caveat), and
  _Complete results_ (a one-page report). **See full run details** links out to the
  platform's full run details.
- **Two trust models.** Deterministic content (the headline, the roadmap, the counts,
  the overview band) is computed and carries no AI label. Interpretive content (source,
  cause, suggestions) sits inside the violet AI region, hedged and labelled
  illustrative. The AI region uses a dedicated **violet `--ai-*` role**, deliberately
  not the brand teal, so an AI panel on a failed run can never read as success-green.
- **Failure logic.** `lib/failure.ts` (`deriveFailureDiagnosis`, `deriveFailureSource`,
  `deriveTaskBreakdown`), `lib/phases.ts` (`derivePhases`, the roadmap), and
  `lib/tasks.ts`. The diagnosis is calibrated: exit 143 is an external kill (SIGTERM),
  not out of memory (which is 137), so the reading favours spot reclamation and the
  memory suggestion is demoted.
- **Visualization.** Hand-rolled SVG primitives (Donut, Gauge, Spine, Bar), each a
  single `role="img"` with a descriptive label, never relying on colour alone.
- **Accessibility.** Keyboard-complete, focus moves into the sheet on open and returns
  to the originating row on close, AA contrast throughout, status shown as icon and text
  and colour, reduced motion honoured, and the result count is an `aria-live` region.
- **Gates.** `format:check`, `tsc`, and `build` are clean, and a headless smoke pass
  across the states runs with zero console errors.

---

The chronological log follows. Entries below are history, kept for the reasoning; where
they describe an earlier state, Current state above is authoritative.

## Stack and setup

- **Vite, React, TypeScript**, **Tailwind v3**, **shadcn/ui** (Radix), **framer-motion**.
- Tailwind was pinned to **v3** rather than v4, because shadcn's component patterns and
  the `tailwind.config.js` theme-extension approach used here are v3-native and lower
  risk.
- **shadcn components are hand-authored** (in `src/components/ui/`, matching the
  "new-york" style) rather than pulled via the interactive `shadcn` CLI, because that
  CLI is interactive and network-dependent and would stall in this environment. The
  files are the same standard components, adapted to reference the design tokens.
  `components.json` is included so future `npx shadcn add <x>` calls work as expected.
- Components added: **badge, button, skeleton, select**, plus **sheet** from rung 3. The
  first rung used a centered **dialog** for the run detail; rung 3 replaced it with a
  full-size **sheet**, and the final code-quality sweep removed the then-unused `dialog`
  and `card` primitives (see the sweep note near the end).
- `@types/node` was added so `vite.config.ts` can use `node:path` for the `@` to `src`
  alias.

## Data (authoritative, not fabricated)

- The real dataset `seqera-sample-data.json` (roughly 2 MB) was **moved into
  `src/data/`** and imported statically. It was **not** invented; the types were derived
  by profiling the actual file field by field.
- **Shape confirmed:** `{ runs: Run[] }`, **7 runs: 4 SUCCEEDED, 2 FAILED, 1 CANCELLED**.
- **Discrepancies from the brief and principles doc, resolved in favour of the real
  JSON:**
  - `tasks` and `metrics` are **entirely absent** (not empty arrays) on the CANCELLED
    run and the died-on-arrival FAILED run, so they are typed as **optional** (`tasks?`,
    `metrics?`).
  - Extra real fields the brief did not list: `container`, `containerEngine`,
    `nextflow`, `manifest`, and much richer `stats` and `load`. They are typed from the
    data.
  - The mid-run FAILED run's `errorMessage` is about **ABACAS**, not UNICYCLER as the
    principles doc guessed. The raw field is rendered as-is, and nothing is hardcoded, so
    the doc's guess does not affect the code.
  - `errorMessage` is **null** on the on-arrival FAILED run and on the CANCELLED run;
    `RawErrorView` treats blank or null uniformly ("No raw error was recorded"). An
    earlier draft of this note said `""`; the field is actually `null`, and the
    behaviour is identical either way.
  - `duration`, `start`, `exitStatus`, `load.cost`, `load.executors`, and
    `stats.computeTimeFmt` are genuinely **null** on some runs. Every formatter returns
    an em-dash placeholder for null rather than throwing or printing "null".
  - Efficiencies are **percentages (0 to 100)**, `peakMemory` is **bytes**, and a
    `formatBytes` helper renders GB. Runs that never executed have `executors: null` and
    zeroed compute, so the Run Summary shows **"No compute recorded"** instead of a
    misleading "0%".
- **The task-success ratio comes from `stats` (`succeedCount` versus `failedCount`),
  not from `tasks.length`,** as required, and it is necessary because `tasks[]` is
  truncated (for example 50 rows while stats reports 77 succeeded).
- A **simulated 600 ms load** lives in the `useRuns` hook so the loading state is a real
  code path (skeletons), not a fake.

## Design tokens

- `seqera-tokens.css` is copied to `src/styles/` and imported first in `index.css` so the
  CSS variables exist before Tailwind utilities reference them.
- Tokens are **wired into the Tailwind theme as `var(...)`** so components use **roles**
  (`bg-success-soft`, `text-danger-text`, `rounded-lg`) rather than raw hex.
- The **status-to-role mapping** is centralised in `src/lib/status.ts`: SUCCEEDED to
  success, FAILED to danger, RUNNING to primary, CANCELLED and SUBMITTED to muted.
- **Every status indicator is icon and text and colour**, never colour alone (see
  `StatusBadge`), with an `aria-label` restating the status.
- **Spacing-token caveat:** Tailwind's numeric spacing scale (1 through 8) is shared by
  the `w-*` and `h-*` sizing utilities. Overwriting keys 5 through 8 with the token
  values (24/32/48/64px) silently resized components (an `h-8` button would jump to
  64px). So token spacing is exposed under a non-colliding `token-*` namespace
  (`p-token-6`, `gap-token-5`); tokens 1 through 4 already equal Tailwind's 4px base.
  Colours, radius, shadow, and the type scale are wired directly.

## Rung 0 build

1. **HealthSummary** band: counts by status, with the Failed tile going **loud** (a
   filled danger surface plus an "N runs need attention" headline) when any run failed,
   and a calm green "All runs healthy" otherwise. It answers "is anything wrong?" at a
   glance.
2. **RunList and RunCard**: each row shows the StatusBadge, run name, project name, a
   plain-language pipeline description (mapped by `projectName` in
   `lib/descriptions.ts`), duration, cost, and the stats-based task-success ratio.
3. **StatusFilter** (a shadcn select) includes RUNNING on purpose so the **empty state**
   is reachable against real data. Zero matches produce an `EmptyState` that explains
   why (the dataset has no running runs) and offers a **Clear filter** action.
4. **RunDetail** (a dialog at this stage): a summary band of status, timing, duration,
   cost, compute (executors, efficiency, peak memory), and task stats. FAILED runs
   rendered a calm **`FailurePanel`** (the raw error tucked behind a disclosure, not a
   red dump), a placeholder to be expanded later.
5. **States on real paths:** loading via `DashboardSkeleton`, empty via the filtered
   empty state, and failed or cancelled handled by `RunDetail` without crashing on null
   fields.

## Accessibility (rung 0)

- Semantic landmarks: `<header>` and `<main>`; the summary is a labelled `<section>`;
  runs are a `<ul>` and `<li>` list.
- Run rows are native `<button>` elements, so they are keyboard-focusable and
  Enter/Space open the detail for free.
- **Focus is never removed.** A single token-driven `:focus-visible` outline
  (`--focus-ring`) is defined globally, and shadcn components were adapted to not use
  `outline-none`.
- Status badges carry an `aria-label`; the dialog is focus-trapped by Radix and Escape
  closes it.
- "Showing X of Y runs" is `aria-live="polite"` so filtering is announced.

## Motion (restrained, rung 0)

- List items **fade and slide in with a small stagger** on load, and `RunDetail` eases
  open (a Radix data-state animation). Nothing else animated at this stage.
- **`prefers-reduced-motion` is respected two ways:** framer-motion's `useReducedMotion`
  collapses the list variants, and a global CSS media query neutralises transitions and
  animations.

## Known trade-offs (rung 0)

- The 2 MB JSON is **statically imported**, so it is inlined into the JS bundle (roughly
  1.8 MB). That is expected for this prototype and satisfies the static-import
  requirement; a production build would fetch it or code-split. It is the sole cause of
  Vite's chunk-size warning.
- `FailurePanel` was intentionally minimal at rung 0. The grounded, cited AI summary
  described in `ai-interaction-principles.md` came in a later rung.
- No test runner was wired at this stage; validation was a typecheck plus a production
  build plus a headless-browser smoke test (loading to data, opening FAILED, CANCELLED,
  and on-arrival details, the RUNNING empty state, and keyboard Escape), all passing with
  zero console errors.

## CLAUDE.md audit and readability pass (post rung 0)

Audited the build against the `CLAUDE.md` contract and did a minimal, no-behaviour-change
readability pass.

- **Pipeline descriptions were realigned** to match the contract copy verbatim. They had
  drifted to slightly wordier variants, and were corrected in `lib/descriptions.ts`.
- **Scope note (not a bug, flagged for awareness):** `CLAUDE.md`'s rung ladder puts the
  health summary band at rung 1 and the task-success ratio at rung 2, but the rung-0
  build prompt explicitly asked for both. They were kept because they were requested, and
  the mismatch is called out so scope stays honest.
- **`FailurePanel` raw-error disclosure:** the contract says never to surface the raw
  `errorMessage` as "the reason". It was shown only behind a collapsed "Raw error output"
  disclosure, not as the diagnosis, which is compliant; the first-class reconstruction
  came at rung 3.
- **Prettier** was added (`.prettierrc.json`, `.prettierignore`, and `format` and
  `format:check` scripts). Provided artifacts (the token CSS, `CLAUDE.md`, the principles
  doc, and the data JSON) are prettier-ignored so they stay verbatim.
- Added top-of-file responsibility comments and short "why the real data forced this"
  comments at the decision sites.
- Confirmed clean: no `any`, no dead or commented-out code, and `format:check`, `tsc`,
  and `build` all passing.

## Rung 3: first-class Run Summary for failures (the centerpiece)

Built the failed-run view as a **full-size right sheet** (Radix-backed, so focus-trap and
Escape) hosting a **drill-stack** (summary, then a door, then deeper, then Back),
reimplemented in React, shadcn, and tokens from `design/failure-panel-v3.html` (matching
the layout, hierarchy, and interaction without porting the HTML or CSS).

Everything is derived from the real data, and several of the design mock's hardcoded
values were re-derived and differ:

- **Roadmap phases** are grouped from each task's `process` colon-path. Grouping by the
  raw sub-workflow segment gave 11 nodes for viralrecon, which overflowed the sheet, so
  the sub-workflows roll up into a coarse **phase taxonomy** (Prepare, Read QC, Classify,
  Alignment, Assembly, Variants, Consensus, Report) via keyword rules matched against the
  sub-workflow key rather than the full path (so, for example, a Kraken DB untarred during
  genome prep does not misfile). viralrecon resolves to **5 phases**: Prepare, Read QC,
  Classify, Alignment, and **Assembly (failed)**, which reads at a glance and fits the
  sheet at any width (verified at zero horizontal overflow at 1280px and 400px). It stays
  fully data-driven: which phases appear, their order (earliest task start), and their
  status all come from the tasks, and unknown sub-workflows fall back to a humanised node.
- **The "What ran" donut** takes succeeded and failed from `stats` (the authoritative
  run-level counts) and **aborted from `load.aborted`** (stats has no aborted field).
  Total 88, so **88% completed** (the mock said 96% from the truncated `tasks[]`). The
  stopped-task rows come from the truncated `tasks[]`, so the view says "3 of 11 recorded
  here" rather than implying it is the full set.
- **The grounded AI cause** (`lib/failure.ts`, the hand-built "AI, illustrative" stub)
  reads from the failing process leaf (**UNICYCLER**), **exit 143**, the retry
  (`errorAction: "RETRY"`), and spot pricing (`priceModel: "spot"`). The claim is
  grounded, the reason is hedged, and it is always labelled. (The exact copy was later
  corrected toward spot reclamation; see the calibrated-confidence note below.)
- **The raw-error caveat is derived:** it flags the 255-character truncation and the fact
  that the text names **ABACAS**, not the failing **UNICYCLER**, computed by checking the
  raw text for the failing leaf rather than hardcoding it.
- **The INT_MAX exit sentinel:** aborted tasks carry `exit: 2147483647`, shown as "no
  exit recorded", never the raw number.
- **Two archetypes handled distinctly.** Died-on-arrival (`scruffy_colden`, roughly 8s, 0
  tasks) gets an honest **"nothing ran"** state (no roadmap, no donut, no "What ran"
  door) and a config-focused "what next". Stages are never fabricated.

**Visualization primitives** (`src/components/viz/`, hand-rolled SVG, no chart library,
each answering one question, each a `role="img"` with an `aria-label`, none relying on
colour alone): **Donut** (how much completed), **Gauge** (was CPU efficient, in the
Seqera donut style), **Spine** (where it broke), and **Bar** (how full was memory). The
Bar and Gauge appear in the Complete-results report.

**Non-failed runs** open the same full-size sheet showing the one-page **RunReport**
(reused as the "Complete results" door). Outputs **link out by `workDir` path**, because
the dataset is the execution record, not the science, and results are never fabricated.

**Accessibility and motion:** doors carry always-visible descriptors rather than
tooltips; the drill-stack moves focus into each pushed view and back on pop; push, pop,
and reveals are gated on `prefers-reduced-motion`; and status stays icon and text and
colour.

## Polish and interpretive-overview pass (design and product reasoning)

This pass was as much about **trust** as features. Four throughlines drove it.

**1. Two trust models, placed deliberately.** The product makes two kinds of claim, and
they must not look alike:

- The **Runs Overview summary band is deterministic**, computed from the data
  (`lib/overview.ts`), so it is always correct. It carries **no AI label**, because
  labelling a guaranteed-correct aggregate as AI would wrongly invite doubt. Trust here
  comes from the fact that the software did the counting.
- The **failure diagnosis is interpretive**, reasoning about a cause the data can only
  imply. So it is hedged and labelled **illustrative**. Trust here comes from honesty
  about uncertainty, not from authority.

Placing a computed synthesis and an interpretive reading side by side, each dressed for
what it is, is the point: the same product in two honestly different registers.

**2. Calibrated confidence: the AI's claim was verified before shipping.** The earlier
copy leaned toward "out of memory". Checking the signal against the domain, **exit 143 is
128 plus SIGTERM(15)**, an external termination rather than a crash, whereas an
out-of-memory kill surfaces as **137 (SIGKILL)**. The failing task's `priceModel` is
**spot**, which reclamation fits. So the reading was corrected toward **spot reclamation
or timeout**, and "raise memory" was demoted to the last suggestion with an explicit note
that it usually shows as 137, not 143. This makes the `ai-interaction-principles.md`
calibrated-confidence principle concrete: name the likely cause, hedge it, and do not
assert what the exit code contradicts. It is encoded in `lib/failure.ts`, gated on the
real exit value rather than hardcoded prose.

**3. Progressive disclosure in the Runs Overview, not just the drill.** The synthesis
band sits above the tiles and list: the takeaway first ("2 failed, these need
attention"), then the tiles to filter, then the sortable list. The software does the
cross-run aggregation (how many pipelines, which repeated, which failed) so the user does
not have to scan 7 rows to reconstruct it. The tiles became **filter toggles** (sharing
one filter with the dropdown, one source of truth) so the synthesis is also the control
surface.

**4. Run status is not task status, surfaced honestly and without alarm.**
`serene_albattani` SUCCEEDED but contains a task (`BBMAP_BBSPLIT`, exit 1,
`errorAction: RETRY`) that failed on its first attempt and recovered on retry
(`load.retries = 1`). Its Run Summary says so in one plain line, the run stays visibly
green, and the failed-attempt count is explained rather than left to look like damage.

### Per-change reasoning

1. **Overview summary band:** computed at runtime from the run set (never authored), so
   it cannot drift from the data. Numbers and names are derived in `lib/overview.ts`, and
   the component only phrases them. Verified: 7 runs across 4 pipelines, rnaseq three
   times (2 ok plus 1 cancelled), viralrecon twice (1 ok plus 1 failed), 4 clean, 2
   failed, 1 cancelled.
2. **Tiles as filter toggles:** real `<button aria-pressed>` elements; clicking filters,
   and clicking the active one clears. They and the status dropdown read and write the
   same `filter` state in `App`, so the two can never disagree.
3. **Sort control:** Most recent, Duration, Cost, and Status. It is field-based because
   runs are independent and there is no cross-run sequence to honour; Status sorts
   failures first so they surface rather than hide, and nulls always sort last so a
   missing duration or cost cannot jump to the top.
4. **One AI marker:** the sparkle already means AI (Seqera's native cue), so the label
   only needs to say **illustrative**. The redundant "AI" text prefix was removed, and
   screen readers still get "AI summary" from the region's `aria-label`.
5. **Corrected AI cause copy:** see throughline 2, grounded in exit 143 plus spot plus
   `retries = 1`.
6. **Recovered-retry line:** `recoveredRetryNote()` returns the line only for a SUCCEEDED
   run with `failedCount > 0` and `retries > 0`, and null otherwise, because a non-green
   run has not "completed cleanly" and the line would be dishonest there.

**Scope held:** no group-by-pipeline view, no density toggle, no overview charts (noted
as scale-ups in the README).

## Accessibility audit and fixes

Audited the running application (not just the code) with **axe-core** across four states
(Runs Overview, the failure summary, the drilled "What ran", and a non-failed Run
Summary), a **keyboard-only** pass, and a **hand-computed WCAG contrast** sweep of every
real token pair. The approach was to verify each item against the app, fix genuine gaps,
and not rebuild.

**Checklist:**

- **Keyboard:** pass. Tiles, the sort and status selects, run rows, doors, Back, and the
  sheet close are all real controls, reachable and operable by keyboard; tab order is
  logical (tiles, sort, filter, rows); and the only focus trap is the modal sheet's,
  which is intentional and correct.
- **Focus into the sheet on open:** pass.
- **Focus returns to the originating row on close:** was a fail, now fixed. The sheet is
  opened programmatically, so Radix had no `Trigger` to restore to and focus fell to
  `<body>`. The fix captures the triggering row (`triggerRef` in `App`) and restores it
  in the sheet's `onCloseAutoFocus`. Verified that focus returns to the exact row.
- **Drill moves focus into the new view, and Back returns sensibly:** pass (each view's
  focus region takes focus on mount, re-keyed per navigation).
- **Focus is visible and never `outline:none`:** pass. No interactive control suppresses
  the outline; the one `outline-none` on the drill focus-region container was removed (it
  was a `-1` tabindex scroll target, and programmatic focus does not trigger
  `:focus-visible`, so no box appeared anyway).
- **Landmarks, headings, list, dialog:** pass after one fix. The failure headline was an
  `<h1>` inside the dialog after some `<h2>` elements, and was changed to `<h2>` so levels
  never skip. axe `heading-order` is clean.
- **Status as icon and text and colour with `aria-label`:** pass after one fix. A run
  row's `aria-label` overrides its inner text, so it was announcing the name without the
  status; the status is now folded in.
- **Contrast (WCAG AA):** pass after one fix. Every text and status pair was computed
  against its actual background, and all cleared 4.5:1 (small) and 3:1 (large or UI)
  except the teal AI sparkle at the time (`brand-solid` on `brand-soft` at 2.30:1). It was
  fixed by moving the meaningful icon and the label border to the AA `-text` tier. (The AI
  region later moved to a dedicated violet role; see the round-2 note.) Note that an early
  axe run flagged 29 contrast nodes, which was measuring mid-fade-in blended opacity; once
  the list stagger settles, axe reports zero violations, and reduced motion skips the fade
  entirely.
- **Visualization `role="img"` with a descriptive label:** pass. Donut and Gauge already
  had it; the **Spine** was a list and was converted to a single `role="img"` with a
  computed summary, matching the other primitives and giving screen-reader users the
  outcome in one line. None rely on colour alone.
- **Reduced motion:** pass. A global `@media (prefers-reduced-motion: reduce)` neutralises
  CSS animations, and framer-motion's `useReducedMotion` collapses the JS list stagger and
  the drill push and pop.
- **`aria-live` for result changes:** pass. "Showing X of Y runs" is `aria-live="polite"`,
  so filtering and sorting are announced. The interpretive band is static content in a
  labelled region, read in normal screen-reader flow, so no live region is needed.

**Fixes made (6):** (1) the AI sparkle and label border to the `-text` tier (contrast);
(2) the failure headline from `h1` to `h2` (heading order); (3) the run-row `aria-label`
now includes status; (4) the Spine converted to `role="img"` with a descriptive label;
(5) `outline-none` removed from the drill focus-region; (6) focus returns to the
originating row on sheet close.

## Final code-quality sweep (no behaviour change)

A last consistency and cleanliness pass, verified against the gates plus a smoke test that
the Run Summary renders identically.

- **Naming consistency:** the roadmap module produced "phases" but was still named in
  "stage" vocabulary. Renamed `lib/stages.ts` to `lib/phases.ts`, `Stage` to `Phase`,
  `StageStatus` to `PhaseStatus`, `deriveStages` to `derivePhases`, `stageKey` to
  `subworkflowKey`, `StageDot` to `PhaseDot`, and `FailureDiagnosis.failingStageLabel` to
  `failingPhaseLabel`, so the code speaks the same word as the UI and aria ("phases").
  Pure rename, no logic change.
- **Dead code removed:** `components/ui/dialog.tsx` (superseded by the sheet in rung 3)
  and `components/ui/card.tsx` (never used), neither of which was imported, plus a dead
  `export type { Stage }` re-export in `failure.ts`.
- **Confirmed clean:** no `any` in any type position (only the English word "any" in
  copy), no `TODO`, `console`, `ts-ignore`, or commented-out code, and every module
  carrying a responsibility comment.
- **File organisation** was left as-is, since it already separates `lib/` (data, no JSX),
  `ui/` (shadcn primitives), `viz/` (hand-rolled SVG), `failure/` (the drill-stack), and
  the top-level overview components.

## Final polish pass (clarity and consistency, grounded in real data)

- **Overview copy reports run-level failures, separate from repeats.** The band had
  conflated pipeline and run ("viralrecon failed" while another viralrecon run
  succeeded). It was rewritten to report failures at the run level and to disambiguate by
  repeat count ("one viralrecon run" for a pipeline that ran twice versus "the rnaseq-nf
  run" for one that ran once), with pipeline-repeat counts moved to a parenthetical note.
  All numbers and names are computed in `lib/overview.ts`.
- **Bold identifiers.** Pipeline and run names in the band and rows read as identifiers by
  weight rather than colour.
- **AI cause band: purpose plus a single marker.** A "Likely cause" function label was
  added, and the sparkle was folded into one tag with a self-describing tooltip.
- **Phase roadmap on all Run Summary views with tasks.** The same `Spine` now renders on
  SUCCEEDED runs (all green) near the top of the view, not just on failures. Runs with
  zero tasks (cancelled or died-on-arrival) derive an empty list and show no roadmap
  (the honest "nothing ran"). This surfaced two things worth fixing honestly:
  - **Recovered retries are not failures.** Phase status is resolved per process: a phase
    is red only if a process FAILED and never COMPLETED. `serene_albattani` (SUCCEEDED)
    has a `BBMAP_BBSPLIT` that failed on attempt 1 and completed on retry, so it now reads
    green, matching the run status; viralrecon's UNICYCLER (failed, with no successful
    attempt) stays red.
  - **Cleaner phase taxonomy.** The keyword rules were extended so nf-core genome-prep
    processes (GTF, FASTA, CHROM, BED, HISAT, SPLICE) and contaminant filtering (BBSPLIT)
    map to Prepare or Read QC rather than falling back to raw names. All five runs with
    tasks now yield five or fewer clean, canonical phases.
- **Spot instances surfaced, grounded.** Every recorded task in the failed viralrecon run
  is `priceModel: "spot"`. `recordedPriceModel()` reports a price model only when every
  recorded task shares it, never assumed. It is surfaced as a note in "What ran" and
  folded into the AI cause hedge.

## Final touches (pre-freeze)

- **AI attribution unified.** The interpretive content is the "Likely cause" and the
  "What next" suggestions (the suggestions follow from the interpretation), so they live
  in one AI-attributed region (`AiInterpretation`, replacing the separate `AiCause` and
  `WhatNext`) with a single marker, so no AI output is left unlabelled. Deterministic
  content (the headline, roadmap, task counts, and overview band) stays outside it,
  unmarked, preserving the two-trust-models distinction. The marker is a quiet icon and
  colour cue plus a small "illustrative" label, and it is a real focusable control with a
  keyboard-reachable tooltip (`aria-describedby` plus a `focus-within` visible tooltip).
  The same region, marker, and tooltip appear on both failure archetypes.
- **The escape hatch is prominent, not buried.** A link-out sits by the run title and
  status, always visible at the top of the Run Summary, shown on both failed and
  succeeded runs. It is an honest link-out with no fabricated URL: a real focus-visible
  button clearly labelled as opening the full run details. (The exact copy was
  de-duplicated in round 2 below.)

## Final four touches (pre-freeze, round 2)

A tight, frozen-scope pass of four surgical changes, verified against the gates plus a
headless smoke test (Chrome via puppeteer-core) that inspects the running app.

1. **Bold identifiers (weight, not colour).** Pipeline and run names in the overview band
   and the run rows render at **font-weight 700** (ink tier), because 600 was not distinct
   enough from the body prose; `projectName` also moved from the muted tier to ink so it
   reads as an identifier, distinguished by weight rather than an accent colour. The smoke
   test confirms the computed weight and colour.
2. **A dedicated AI colour role (violet).** The AI region had been tinted with the brand
   teal or green, which collides with success-green on a FAILED run (an AI panel that
   reads as "success" next to a failure is exactly wrong). A first-class **`--ai-*`
   role** was added to the tokens (`--ai-soft #F5F3FF` for the tint, `--ai-solid #7C3AED`
   for the marker and left border, `--ai-text #6D28D9` for small text), wired into the
   Tailwind theme as `ai.{soft,solid,text}`, and `AiInterpretation` was repointed from
   `brand-*` to `ai-*`. The sparkle glyph is kept and recoloured violet. **Contrast is
   verified on the real tint:** `ai-text` on `ai-soft` at 6.48:1 (AA small text) and
   `ai-solid` on `ai-soft` at 5.19:1 (clearing the 3:1 UI and graphic bar for the border
   and marker). It applies to both failure archetypes, since it is one shared component.
   Deterministic content stays ink, and only the AI-attributed accents are violet, so the
   two-trust-models distinction is intact. **This supersedes every earlier reference to a
   teal AI cue.**
3. **Header subtitle rewritten to the real value.** The H1 stays "Pipeline runs"; the
   subtitle now names what the product actually delivers (health synthesis plus failure
   diagnosis) rather than just "a list of runs".
4. **Escape-hatch copy de-duplicated.** Because the product already lives inside Seqera,
   the copy no longer re-names the platform; it reads **See full run details**, with the
   arrow as the existing `ArrowUpRight` icon (`aria-hidden`), and the accessible name is
   "See full run details". It is still the same real, focus-visible link-out button by the
   run title.

## Overview roadmap, progress reframe, and Likely-source tag (pre-freeze, round 3)

Four surgical additions, then re-freeze. All reuse the existing `Spine` component and
`lib/phases.ts`, nothing is hardcoded per run, and everything was verified with the gates
and a headless Chrome smoke pass across the Runs Overview and all four Run Summary
archetypes, with zero console errors.

1. **Roadmap on the run rows.** Each row that has tasks now shows the road it travelled: a
   **compact** `Spine` (a new `compact` prop) on its own slim line under the pipeline
   description, so it never crowds the metrics. Succeeded shows the full green road, and
   failed shows green up to the break with a red X at the stop phase. Runs that never
   executed (cancelled `tender_shockley`, died-on-arrival `scruffy_colden`) derive an
   empty list and show no roadmap (the honest "nothing ran"), confirmed on screen. It uses
   the same status roles and tokens as the Run Summary roadmap, with no new colours.
   - **Scannable:** phase labels are hidden by default and reveal on row hover or focus
     (`group-hover` and `group-focus-visible`, keyed to the `RunCard` button). Labels sit
     in normal flow at `opacity-0`, so revealing them reflows nothing. It is a static
     terminal state only, and no "current" or "running" node is ever drawn.
   - **Accessibility:** the compact roadmap is one `role="img"` with an enumerated
     `aria-label` ("Prepare, Read QC, Classify, Alignment done; Assembly failed."), state
     is conveyed by check and X icons plus colour, and the hover labels are also
     focus-reachable. No horizontal overflow at 400px, verified.
2. **The Run Summary roadmap reframed as run progress (both outcomes).** A shared
   `RunProgress` component is used by both the failure view and the non-failed Run
   Summary: a "Run progress" heading, a summary line ("N of N phases complete" on a clean
   run, "M of N, stopped at _phase_" on a failure), then the labelled `Spine`. A no-task
   run renders the honest "Nothing ran" line (failure and cancelled get different trailing
   context) rather than a fabricated roadmap. This replaced the earlier "Where it broke"
   (failure) and "Pipeline phases" (non-failed) headings with one consistent treatment.
3. **A "Likely source" tag in the failure diagnosis.** A new `deriveFailureSource()` in
   `lib/failure.ts` (on `FailureDiagnosis.source`) is rendered as a compact **category
   chip on the "Likely cause" heading** inside the violet AI region: the scannable "who",
   one level above the cause sentence that explains it. It is a **bare label**, not a
   second sentence. An earlier draft gave the chip its own rationale, but that restated the
   cause hedge almost verbatim ("exit 143, external kill, spot, reclaimed"), so the
   rationale was dropped to remove the duplicate text. It is derived from real fields via
   exit-code semantics (a code of 128 plus N is a termination by signal N) and whether any
   task ran, with no per-run hardcoding:
   - **0 tasks** (pre-execution death) gives **Configuration or inputs**
     (`scruffy_colden`).
   - **exit 143 or 137** (SIGTERM or SIGKILL, an external or resource kill) gives
     **Infrastructure** (`viralrecon` UNICYCLER, exit 143, with the cause sentence adding
     the spot-reclaim reading).
   - **exit 130** (SIGINT) gives **User** (interrupted by hand).
   - any other non-zero application exit gives **Pipeline or data**.

   Only Infrastructure and Configuration appear in this dataset; the other two are
   reachable by the same principled rules, since no run happens to trigger them.

4. **Data-faithfulness audit.** Went field by field through the 7 runs. Every surfaced
   number, the derived phases, the diagnosis, and the source tag trace to real fields, and
   nullable fields render as an em-dash placeholder. The full pass or fail list is in the
   README. One doc-only correction: an earlier note said `scruffy_colden.errorMessage` is
   `""`, but it is actually `null` (the code treats blank or null uniformly, so there is no
   UI change, and `RawErrorView` renders the honest "No raw error was recorded" state
   either way).

## Redundancy trim in the Run Summary (pre-freeze)

The "Likely source" chip originally carried a rationale sentence that restated the "Likely
cause" hedge almost word for word on both failure archetypes (for example the chip said
"Exit 143 is an external kill and the failing task ran on spot, most likely the machine
was reclaimed", while the cause below said nearly the same thing). The category label is
the genuinely new, scannable piece, and the sentence was the duplicate, so the source is
now a **bare category chip** ("Source: Infrastructure") on the "Likely cause" heading, and
the rationale was removed. The single-field `SourceTag` type was collapsed to a plain
`FailureSource` string, so there is no dead code. "exit 143" now appears only where it does
work: once in the cause sentence and once in the calibrated "not 137" next step.

## Verify locally

```bash
npm install
npm run dev        # http://localhost:5173
# npm run build    # tsc -b && vite build
# npm run typecheck
```
