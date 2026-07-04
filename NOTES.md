# NOTES — Pipeline Run Status Dashboard

A running log of decisions and assumptions across the build (rung 0 → failure view →
polish → accessibility → phase spine → code-quality sweep). Seed for the README and
the live presentation; sections are roughly chronological, so earlier entries may be
superseded by later ones (noted where it matters).

## Stack & setup

- **Vite + React + TypeScript**, **Tailwind v3**, **shadcn/ui** (Radix), **framer-motion**.
- Tailwind pinned to **v3** (not v4) because shadcn's component patterns and the
  `tailwind.config.js` theme-extension approach used here are v3-native and lower-risk.
- **shadcn components are hand-authored** (in `src/components/ui/`, matching the
  "new-york" style) rather than pulled via the interactive `shadcn` CLI. Reasoning:
  the CLI is interactive/network-dependent and would stall in this environment. The
  files are the same standard components, adapted to reference our design tokens.
  `components.json` is included so future `npx shadcn add <x>` calls work as expected.
- Components added: **badge, button, skeleton, select** (+ **sheet** from rung 3).
  _(Rung 0 started with a centered **dialog** for the run detail; rung 3 replaced it
  with a full-size **sheet**, and the final code-quality sweep removed the then-unused
  `dialog` and `card` primitives — see the sweep note near the end.)_
- `@types/node` added so `vite.config.ts` can use `node:path` for the `@ → src` alias.

## Data (authoritative — not fabricated)

- The real dataset `seqera-sample-data.json` (~2 MB) was **moved into `src/data/`** and
  imported statically. It was **not** invented — types were derived by profiling the
  actual file field-by-field.
- **Shape confirmed:** `{ runs: Run[] }`, **7 runs → 4 SUCCEEDED, 2 FAILED, 1 CANCELLED**.
- **Discrepancies from the brief/principles doc, resolved in favour of the real JSON:**
  - `tasks` and `metrics` are **entirely absent** (not empty arrays) on the CANCELLED
    run and the died-on-arrival FAILED run → typed as **optional** (`tasks?`, `metrics?`).
  - Extra real fields the brief didn't list: `container`, `containerEngine`, `nextflow`,
    `manifest`, and much richer `stats`/`load`. Typed them from the data.
  - The mid-run FAILED run's `errorMessage` is about **ABACAS**, not UNICYCLER as the
    principles doc guessed. We render the raw field; nothing is hardcoded, so the doc's
    guess is irrelevant to the code.
  - `errorMessage` on the on-arrival FAILED run is an **empty string `""`**, not `null` —
    `FailurePanel` treats blank-or-null uniformly ("No error message was recorded").
  - `duration`, `start`, `exitStatus`, `load.cost`, `load.executors`,
    `stats.computeTimeFmt` are genuinely **null** on some runs. Every formatter returns
    an em-dash `—` for null rather than throwing or printing "null".
  - Efficiencies are **percentages (0–100)**; `peakMemory` is **bytes**; a `formatBytes`
    helper renders GB. Runs that never executed have `executors: null` + zeroed compute →
    the detail shows **"No compute recorded"** instead of a misleading "0%".
- **Task success ratio comes from `stats` (succeedCount vs failedCount), not `tasks.length`** —
  as required, and necessary because `tasks[]` is truncated (e.g. 50 rows while stats
  reports 77 succeeded).
- **Simulated 600 ms load** lives in the `useRuns` hook so the loading state is a real
  code path (skeletons), not a fake.

## Design tokens

- `seqera-tokens.css` is copied to `src/styles/` and imported first in `index.css` so the
  CSS variables exist before Tailwind utilities reference them.
- Tokens are **wired into the Tailwind theme as `var(--…)`** so components use **roles**
  (`bg-success-soft`, `text-danger-text`, `rounded-lg`) — never raw hex.
- **Status → role mapping** is centralised in `src/lib/status.ts`:
  SUCCEEDED→success, FAILED→danger, RUNNING→primary, CANCELLED/SUBMITTED→muted.
- **Every status indicator is icon + text + colour**, never colour alone (see `StatusBadge`),
  with an `aria-label` restating the status.
- **Spacing tokens caveat:** Tailwind's numeric spacing scale (`1..8`) is _shared_ by
  `w-*`/`h-*` sizing utilities. Overwriting keys 5–8 with the token values (24/32/48/64px)
  silently resized components (an `h-8` button would jump to 64 px). So token spacing is
  exposed under a **non-colliding `token-*` namespace** (`p-token-6`, `gap-token-5`);
  tokens 1–4 already equal Tailwind's 4 px base. Colours, radius, shadow, and the type
  scale are wired directly.

## Rung-0 build

1. **HealthSummary** band — counts by status; the Failed tile goes **loud** (filled danger
   surface + "N runs need attention" headline) when >0, calm green "All runs healthy"
   otherwise. Answers "is anything wrong?" at a glance.
2. **RunList / RunCard** — each row: StatusBadge, runName, projectName, a plain-language
   pipeline description (mapped by `projectName` in `lib/descriptions.ts`), duration, cost,
   and the stats-based task success ratio (✓ n / ✗ n).
3. **StatusFilter** (shadcn select) — includes RUNNING on purpose so the **empty state** is
   reachable against real data. Zero matches → `EmptyState` explaining _why_ (dataset has
   no running runs) + a **Clear filter** action.
4. **RunDetail** (dialog) — summary band: status, timing, duration, cost, compute
   (executors/efficiency/peak memory), task stats. FAILED runs render a calm
   **`FailurePanel`** (raw error tucked behind a disclosure, not a red dump) — a
   **placeholder** to be expanded next.
5. **States on real paths:** loading → `DashboardSkeleton`; empty → filtered empty state;
   failed/cancelled → RunDetail handles null fields without crashing.

## Accessibility

- Semantic landmarks: `<header>` / `<main>`; summary is a labelled `<section>`; runs are a
  `<ul>`/`<li>` list.
- Run rows are native `<button>`s → keyboard-focusable, **Enter/Space open detail** for free.
- **Focus is never removed.** A single token-driven `:focus-visible` outline
  (`--focus-ring`) is defined globally; shadcn components were adapted to **not** use
  `outline-none`.
- Status badges carry `aria-label`; dialog is focus-trapped by Radix (Escape closes).
- "Showing X of Y runs" is `aria-live="polite"` so filtering is announced.

## Motion (restrained)

- List items **fade/slide in with a small stagger** on load; RunDetail **eases open**
  (Radix data-state animation). Nothing else animates yet.
- **prefers-reduced-motion** respected two ways: framer-motion `useReducedMotion` collapses
  the list variants, and a global CSS media query neutralises transitions/animations.

## Known trade-offs / notes

- The 2 MB JSON is **statically imported**, so it's inlined into the JS bundle (~1.8 MB).
  That's expected for this prototype and satisfies the static-import requirement; a
  production build would fetch it or code-split. This is the sole cause of Vite's
  chunk-size warning.
- `FailurePanel` is intentionally minimal (rung 0). The grounded, cited "AI summary"
  described in `ai-interaction-principles.md` is a later rung.
- No test runner wired yet; validation this rung was a typecheck + production build + a
  headless-browser smoke test (loading→data, open FAILED/CANCELLED/on-arrival details,
  RUNNING empty state, keyboard Escape) — all pass with zero console errors.

## CLAUDE.md audit + readability pass (post rung-0)

Audited the build against the `CLAUDE.md` contract and did a minimal, no-behaviour-change
readability pass. Findings and actions:

- **Pipeline descriptions now match the contract copy verbatim** (§THE DATA). They had
  drifted to slightly wordier variants; realigned in `lib/descriptions.ts`. _(fixed)_
- **Scope note (not a bug, flagged for awareness):** `CLAUDE.md`'s rung ladder puts the
  **health summary band at rung 1** and the **task success ratio at rung 2**, but the
  rung-0 build prompt explicitly asked for both. They're kept because they were requested;
  calling out the mismatch so scope stays honest. No deletion made without a decision.
- **`FailurePanel` raw-error disclosure:** the contract says never surface raw
  `errorMessage` _as "the reason"_. It's currently shown only behind a collapsed
  "Raw error output" disclosure (not as the diagnosis), which is compliant, but the
  first-class reconstruction ("why") is **rung 3** — left untouched this pass.
- **Prettier** added (`.prettierrc.json`, `.prettierignore`, `format` / `format:check`
  scripts). Provided artifacts (token CSS, `CLAUDE.md`, principles doc, the data JSON) are
  prettier-ignored so they stay verbatim.
- Added top-of-file responsibility comments (`App`, `lib/status`, `StatusFilter`) and
  short "why the real data forced this" comments at the decision sites (stats-vs-`tasks.length`
  ratio, `""`-vs-`null` error, optional `tasks`, null-executors → "No compute recorded").
- Confirmed clean: no `any`, no dead/commented-out code; `format:check` + `typecheck` +
  `build` all pass; smoke test still green (zero console errors).

## Rung 3 — first-class failure view (centerpiece)

Built the failed-run detail as a **full-size right sheet** (Radix-backed: focus-trap +
Escape) hosting a **drill-stack** (summary → door → deeper → Back), reimplemented in
React/shadcn/tokens from `design/failure-panel-v3.html` (matched layout/hierarchy/
interaction; did not port the HTML/CSS). Also updated the CLAUDE.md ladder to fold the
health band + task ratio into rung 0.

**Everything is derived from the real data — the design mock's hardcoded values were
re-derived, and several differ:**

- **Spine phases** are grouped from each task's `process` colon-path. Grouping by the raw
  sub-workflow segment gave **11 nodes** for viralrecon, which overflowed the sheet — so we
  roll those sub-workflows up into a coarse **phase taxonomy** (Prepare / Read QC / Classify /
  Alignment / Assembly / Variants / Consensus / Report) via keyword rules, matched against the
  sub-workflow key (not the full path, so e.g. a Kraken DB untarred during genome prep doesn't
  misfile). viralrecon → **5 phases**: Prepare → Read QC → Classify → Alignment → **Assembly
  (failed)** — reads at a glance and fits the sheet at any width (verified 0 horizontal overflow
  at 1280px and 400px). Still fully data-driven: which phases appear, their order (earliest task
  start), and their status (any FAILED → failed; else COMPLETED → done; else ABORTED-only →
  not-reached) come from the tasks; unknown sub-workflows fall back to their own humanised node.
  The `Spine` aria-label states the phase count ("Pipeline phases: 4 of 5 completed, failed at
  Assembly.").
- **"What ran" donut**: succeeded/failed from `stats` (authoritative run-level), **aborted
  from `load.aborted`** (stats has no aborted field). Total 88 → **88% completed** (the
  mock said 96% from the truncated `tasks[]`). The stopped-task rows come from `tasks[]`,
  which is truncated, so the view says **"3 of 11 recorded here"** rather than implying
  it's the full set.
- **Grounded AI cause** (`lib/failure.ts`, the hand-built "AI · illustrative" stub): failing
  process leaf (**UNICYCLER**), **exit 143**, retry (`errorAction:"RETRY"`), and spot pricing
  (`priceModel:"spot"`) → "killed — exit 143, gave up after a retry. Most likely out of
  memory, or a reclaimed spot machine." Claim grounded, reason hedged, always labelled.
- **Raw error caveat** is derived: it flags 255-char truncation _and_ that the text names
  **ABACAS**, not the failing **UNICYCLER** — computed by checking the raw text for the
  failing leaf, not hard-coded.
- **INT_MAX exit sentinel**: aborted tasks carry `exit: 2147483647`; shown as **"no exit
  recorded"**, never the raw number.
- **Two archetypes handled distinctly.** Died-on-arrival (`scruffy_colden`, ~8s, 0 tasks)
  gets an honest **"nothing ran"** state — no spine, no donut, no "What ran" door — and a
  config-focused "what next". Never fabricate stages.

**Viz primitives** (`src/components/viz/`, hand-rolled SVG, no chart lib, each answers one
question, `role="img"` + aria-label, never colour-alone): **Donut** (how much completed),
**Gauge** (was CPU efficient — Seqera donut style), **Spine** (where it broke), **Bar** (how
full was memory). All four are used in rung 3 (Bar/Gauge in the Complete-results report).

**Non-failed runs** now open the same full-size sheet showing the one-page **RunReport**
(reused as the "Complete results" door). Outputs **link out by `workDir` path** — the
dataset is the execution record, not the science; results are never fabricated.

**Accessibility/motion**: doors carry **always-visible descriptors** (not tooltips); the
drill-stack **moves focus into each pushed view and back** on pop (focus-follows-navigation);
push/pop + reveals are gated on `prefers-reduced-motion`. Status stays icon+text+colour.

**Gates**: `format:check` + `tsc` + `build` clean; headless smoke drills every door on the
mid-run failure, verifies the on-arrival "nothing ran" state, and runs a keyboard path
(open via Enter → door via Enter → Back via Enter, focus stays in the sheet) — **zero
console errors**.

## Polish + interpretive-overview pass — the design/product reasoning

This pass is as much about **trust** as features. Four throughlines drove it:

**1. Two trust models, placed deliberately.** The dashboard now makes two kinds of
claim, and they must not look alike:

- The **overview summary band is DETERMINISTIC** — computed from the data (`lib/overview.ts`),
  so it is _always_ correct. It carries **no AI label**, because labelling a guaranteed-
  correct aggregate as "AI" would wrongly invite doubt. Trust here comes from the fact that
  the software did the counting.
- The **failure diagnosis is INTERPRETIVE** — it reasons about a _cause_ the data can only
  imply. So it is hedged, uses the teal sparkle, and is labelled **"Illustrative."**
  Trust here comes from honesty about uncertainty, not from authority.

Putting a computed synthesis and an interpretive reading side by side — each dressed for
what it is — is the point. Same product, two honestly-different registers.

**2. Calibrated confidence — we verified the AI's claim before shipping it.** The earlier
copy leaned toward "out of memory." Checking the signal against the domain: **exit 143 =
128 + SIGTERM(15)** — an _external_ termination, not a crash. An OOM kill surfaces as **137
(SIGKILL)**. The failing task's `priceModel` is **spot**, which reclamation fits. So we
corrected the reading toward **spot-reclamation / timeout**, and demoted "raise memory" to
the _last_ suggestion with an explicit "that usually shows as 137, not 143." This is the
`ai-interaction-principles.md` "calibrated confidence" principle made concrete: name the
likely cause, hedge it, and don't assert what the exit code contradicts. (Encoded in
`lib/failure.ts`, gated on the real exit value — not hard-coded prose.)

**3. Progressive disclosure at the OVERVIEW level, not just the drill.** The synthesis band
sits above the tiles and list: takeaway first ("2 failed — these need attention"), then the
tiles to filter, then the raw sortable list. The _software_ does the cross-run aggregation
(how many pipelines, which repeated, which failed) so the user doesn't scan 7 rows to
reconstruct it. The tiles became **filter toggles** (one shared filter with the dropdown —
one source of truth) so the synthesis is also the control surface.

**4. Run status ≠ task status — surfaced honestly, without alarm.** `serene_albattani`
SUCCEEDED but contains a task (`BBMAP_BBSPLIT`, exit 1, `errorAction:RETRY`) that failed on
its first attempt and recovered on retry (`load.retries=1`). Its detail now says so in one
plain line — the run stays visibly green; we _explain_ the failed-attempt count rather than
letting it look like damage.

### Per-change "why"

1. **Overview summary band** — computed at runtime from the run set (never authored), so it
   can't drift from the data. Numbers/names are derived in `lib/overview.ts`; the component
   only phrases them ("twice" vs "N times", name lists). Verified: 7 runs / 4 pipelines,
   rnaseq ×3 (2 ok + 1 cancelled), viralrecon ×2 (1 ok + 1 failed), 4 clean / 2 failed / 1
   cancelled.
2. **Tiles → filter toggles** — real `<button aria-pressed>`; clicking filters, clicking the
   active one clears. They and the status dropdown read/write the _same_ `filter` state in
   `App`, so the two can never disagree.
3. **Sort control** — Most recent / Duration / Cost / Status. Explicitly field-based because
   **runs are independent — there is no cross-run sequence** to honour; "Status" sorts
   failures first (surface, don't bury). Nulls always sort last so a missing duration/cost
   can't jump to the top.
4. **One AI marker** — the sparkle already means "AI" (Seqera's native cue), so the pill
   only needs to say **"Illustrative."** Removed the redundant "AI ·" text; screen readers
   still get "AI summary" from the region's aria-label.
5. **Corrected AI cause copy** — see throughline 2. Verbatim, grounded in exit 143 + spot +
   retries=1.
6. **Recovered-retry line** — see throughline 4. `recoveredRetryNote()` returns the line
   only for a SUCCEEDED run with `failedCount>0` and `retries>0`; null otherwise (a
   non-green run hasn't "completed cleanly", so the line would be dishonest there).

**Scope held:** no group-by-pipeline view, no density toggle, no overview charts (noted as a
scale-up in the README). **Gates:** `format:check` + `tsc` + `build` clean; smoke verifies
the computed band matches the data, a tile filter toggles (mouse + keyboard, aria-pressed),
sort reorders (cost puts the priciest run first), the retry line shows on `serene_albattani`,
and the failure shows the corrected copy + single marker — **zero console errors**.

## Accessibility audit + fixes

Audited the running app (not just the code) with **axe-core** across four states (overview,
failure summary, drilled "What ran", non-failed detail), a **keyboard-only** Playwright
pass, and a **hand-computed WCAG contrast** sweep of every real token pair. Approach: verify
each item against the app, fix genuine gaps, don't rebuild.

**Checklist (pass / fix):**

- **Keyboard** — PASS. Tiles, sort/status selects, run rows, doors, Back, and sheet close are
  all real controls, reachable and operable by keyboard; tab order is logical (tiles → sort →
  filter → rows), and the only focus trap is the modal sheet's (intentional/correct).
- **Focus into sheet on open** — PASS.
- **Focus returns to the originating row on close** — **was FAIL → fixed.** We open the sheet
  programmatically, so Radix had no `Trigger` to restore to and focus fell to `<body>`. Fix:
  capture the triggering row (`triggerRef` in `App`) and restore it in the sheet's
  `onCloseAutoFocus`. Verified focus returns to the exact row.
- **Drill moves focus into the new view; Back returns sensibly** — PASS (each view's focus
  region takes focus on mount; re-keyed per navigation).
- **Focus visible, never `outline:none`** — PASS. No interactive control suppresses the
  outline; removed the one `outline-none` on the drill focus-region container (a `-1` tabindex
  scroll target — programmatic focus doesn't trigger `:focus-visible`, so no box appears).
- **Landmarks / headings / list / dialog** — PASS after one fix: the failure headline was an
  `<h1>` inside the dialog (after `<h2>`s) → changed to `<h2>` so levels never skip. axe
  `heading-order` clean.
- **Status as icon+text+colour with aria-labels** — PASS after one fix: a run row's
  `aria-label` overrides its inner text, so it was announcing the name without the **status**
  — now folded in ("…viralrecon…, status Failed").
- **Contrast (WCAG AA)** — PASS after one fix. Every text/status pair was computed against its
  _actual_ background; all cleared 4.5:1 (small) / 3:1 (large/UI) **except the teal AI sparkle**
  (`brand-solid` on `brand-soft` = **2.30:1**). Fixed by moving the meaningful icon (and the
  "Illustrative" pill border) to the AA `-text` tier (`brand-text` = 4.80:1). NB: an early axe
  run flagged 29 "contrast" nodes — that was measuring mid-**fade-in** (blended opacity); after
  the list-stagger settles axe reports **zero** violations, and reduced-motion skips the fade
  entirely.
- **Viz `role="img"` + descriptive label** — PASS. Donut/Gauge already had it; the **Spine** was
  a list → converted to a single `role="img"` with a computed summary
  ("Pipeline stages: 10 of 11 completed, failed at Assembly unicycler."), matching the other
  primitives and giving SR users the outcome in one line. None rely on colour alone (icons +
  labels).
- **Reduced motion** — PASS. Global `@media (prefers-reduced-motion: reduce)` neutralises CSS
  animations; framer-motion `useReducedMotion` collapses the JS list-stagger and drill push/pop.
  Verified: list rows render at opacity 1 (no fade) and drilling still works with motion off.
- **aria-live for result changes** — PASS. "Showing X of Y runs" is `aria-live="polite"`, so
  filtering/sorting is announced. The interpretive band (incl. "N failures need attention") is
  static content in a labelled region, read in normal SR flow — no live region needed as it
  doesn't change.

**Fixes made (6):** (1) AI sparkle + pill border → `-text` tier (contrast); (2) failure headline
`h1`→`h2` (heading order); (3) run-row `aria-label` now includes status; (4) Spine → `role="img"`

- descriptive label; (5) removed `outline-none` from the drill focus-region; (6) focus returns to
  the originating row on sheet close.

**Verification harness:** axe-core (WCAG 2.0/2.1 A + AA) → 0 violations at rest across all states;
keyboard-only Playwright run (tab order, tile/select/row/door/Back operation, focus into/out of
sheet, focus return); reduced-motion emulation; contrast computed from the tokens. Zero console
errors throughout.

## Final code-quality sweep (no behaviour change)

A last consistency/cleanliness pass — verified against gates + a smoke test that the
failure view renders identically (same phase spine, headline, cause, retry line; zero
console errors).

- **Naming consistency:** the spine module produced "phases" but was still named in
  "stage" vocabulary. Renamed `lib/stages.ts → lib/phases.ts`, `Stage → Phase`,
  `StageStatus → PhaseStatus`, `deriveStages → derivePhases`, `stageKey → subworkflowKey`,
  `StageDot → PhaseDot`, and `FailureDiagnosis.failingStageLabel → failingPhaseLabel` — so
  the code speaks the same word as the UI/aria ("phases"). Pure rename, no logic change.
- **Dead code removed:** `components/ui/dialog.tsx` (superseded by the sheet in rung 3) and
  `components/ui/card.tsx` (never used) — nothing imported either — and a dead
  `export type { Stage }` re-export in `failure.ts`.
- **Confirmed clean:** no `any` on any type position (only the English word "any" in copy);
  no `TODO`/`console`/`ts-ignore`/commented-out code; every module carries a
  responsibility comment (added brief top-of-file headers to the remaining `ui/`
  primitives and `main.tsx`).
- **File organisation** left as-is — it already separates `lib/` (data, no JSX), `ui/`
  (shadcn primitives), `viz/` (hand-rolled SVG), `failure/` (the drill-stack), and
  top-level overview components.

## Final polish pass — clarity + consistency (grounded in real data)

- **Overview copy — run-level failures, separate from repeats.** The band conflated
  pipeline and run ("viralrecon failed" while another viralrecon run succeeded). Rewritten
  to report failures at the RUN level and disambiguate by repeat count: "one viralrecon run"
  (pipeline ran twice) vs "the rnaseq-nf run" (ran once); pipeline-repeat counts moved to a
  parenthetical note. All numbers/names computed in `lib/overview.ts`.
- **Bold identifiers.** Pipeline/run names in the band render **semibold** (`Name`, ink tier)
  so they read as identifiers, not prose — weight, not colour. Run-row names were already
  semibold (verified).
- **AI cause band — purpose + single marker.** Added a "Likely cause" function label and
  folded the sparkle into ONE tag "AI · illustrative" (no separate floating icon). The tag
  self-describes via `title` + `aria-describedby` → "Generated for this prototype from the
  run's real fields; a live model in production."
- **Phase spine on ALL detail views with tasks.** The same `Spine` now renders on SUCCEEDED
  runs (all green) near the top of the detail, not just failures. Runs with zero tasks
  (cancelled, died-on-arrival) derive `[]` → no spine (honest "nothing ran"). This exposed
  two things worth fixing honestly:
  - **Recovered retries aren't failures.** Phase status is now resolved PER PROCESS: a phase
    is red only if a process FAILED and never COMPLETED. `serene_albattani` (SUCCEEDED) has a
    `BBMAP_BBSPLIT` that failed on attempt 1 and completed on retry — it now reads green,
    matching the run status (and the existing "recovered on retry" task note). viralrecon's
    UNICYCLER (FAILED, no successful attempt) stays red.
  - **Cleaner phase taxonomy.** Extended the keyword rules so nf-core genome-prep processes
    (GTF/FASTA/CHROM/BED/HISAT/SPLICE) and contaminant filtering (BBSPLIT) map to Prepare /
    Read QC instead of falling back to raw names. All 5 runs-with-tasks now yield ≤5 clean,
    canonical phases (0 ugly fallbacks).
- **Spot instances surfaced (grounded).** Every recorded task in the failed viralrecon run is
  `priceModel: "spot"`. `recordedPriceModel()` reports a price model only when EVERY recorded
  task shares it — never assumed. Surfaced as a note in "What ran" ("All 50 recorded tasks ran
  on spot instances…") and folded into the AI cause hedge ("These tasks ran on spot instances,
  so exit 143 … most likely means the machine was reclaimed").
- **README** gained a "How this extends (deliberate omissions)" section: per-process `metrics[]`
  distributions and provenance (`commandLine`/`commitId`/`sessionId`) as next steps, not gaps.
- **Gates:** `format:check` + `tsc` + `build` clean; axe 0 violations across overview / failure
  summary / what-ran / succeeded detail; smoke confirms the copy, all-green success spine,
  no-spine cancelled/on-arrival, single AI marker + tooltip, and the spot note. Zero console
  errors. Accessibility + code quality unchanged (icon+text+colour, focus, no `any`).

## Final touches (pre-freeze)

- **Bold identifiers in the overview band** — confirmed already applied and rendering at
  font-weight 600 (ink tier): pipeline/run names in the computed sentence are semibold,
  distinct from prose by weight only. Run-row names are semibold too.
- **AI attribution — consistent scope, self-explanatory, subtle.** The interpretive content
  is the "Likely cause" AND the "What next" suggestions (the suggestions follow from the
  interpretation), so they now live in ONE AI-attributed region (`AiInterpretation`, replacing
  the separate `AiCause` + `WhatNext`) with a SINGLE marker — no AI output is left unlabelled.
  Deterministic content (headline, spine, task counts, overview summary) stays outside it,
  unmarked, preserving the two-trust-models distinction. The marker is a quiet **icon + colour**
  cue (teal sparkle = Seqera's native AI signal) plus a small "AI · illustrative" label — not a
  loud pill. It's a real focusable control with a keyboard-reachable tooltip (`aria-describedby`
  - a `focus-within` visible tooltip): _"AI-generated interpretation. 'Illustrative' = a
    hand-built stub in this prototype; a live model in production."_ Same region + marker + tooltip
    on BOTH failure archetypes (mid-run and died-on-arrival).
- **Escape hatch — prominent, not buried.** Added **"Open full run in Seqera ↗"** in `RunIdentity`
  (by the run title/status, always visible at the top of the detail — shown on failed AND
  succeeded runs). Honest link-out: no fabricated URL, so it's a real focus-visible button clearly
  labelled as opening the run in the platform. The "Complete results" and "Raw platform error"
  doors are unchanged.
- **Gates:** `format:check` + `tsc` + `build` clean; axe 0 violations (overview + failure); smoke
  confirms bold summary names, keyboard-reachable AI tooltip, What-next carrying attribution under
  the AI region, and "Open full run" visible/focusable on both a failed and a succeeded run. Zero
  console errors.

## Final four touches (pre-freeze, round 2)

A tight, frozen-scope pass — four surgical changes, then re-freeze. Verified against
all gates plus a headless smoke test (Chrome via puppeteer-core) that inspects the
running app.

1. **Bold identifiers (weight, not colour).** Pipeline/run names in the overview band
   AND the run rows now render at **font-weight 700** (`font-bold`), **ink tier** —
   600/semibold wasn't distinct enough from the body prose. The band's `Name` helper
   and both run-row identifiers (run name + `projectName`) bumped 600→700; `projectName`
   also moved from the muted tier to ink so it reads as an identifier, distinguished by
   weight, not an accent colour. Smoke test confirms computed `fontWeight: 700` and ink
   `rgb(23,15,38)` on all of them.
2. **Dedicated AI colour role (violet).** The AI interpretation region was tinted with
   the brand **teal/green**, which collides with success-green on a FAILED run (an AI
   panel that reads as "success" next to a failure is exactly wrong). Added a first-class
   **`--ai-*` role** to the tokens — `--ai-soft #F5F3FF` (tint), `--ai-solid #7C3AED`
   (sparkle marker + left border), `--ai-text #6D28D9` (small text) — wired into the
   Tailwind theme as `ai.{soft,solid,text}`, and repointed `AiInterpretation` from
   `brand-*` to `ai-*`. The teal sparkle glyph is **kept**, recoloured violet. **Contrast
   verified on the real tint:** `ai-text` on `ai-soft` = **6.48:1** (AA small text),
   `ai-solid` on `ai-soft` = **5.19:1** (clears the 3:1 UI/graphic bar for the border +
   marker). Applied to **BOTH** failure archetypes (mid-run viralrecon and died-on-arrival
   rnaseq-nf) — it's one shared component, and the smoke test opens both and confirms the
   violet bg/border/marker + AA on each. Deterministic content stays ink; only the
   AI-attributed accents are violet, so the two-trust-models distinction is intact.
3. **Header subtitle rewritten to the real value.** H1 stays "Pipeline runs"; the subtitle
   changed from "Run status across your recent pipeline executions." to **"Run health at a
   glance — with plain-language diagnosis for the runs that failed."** — it now names what
   the dashboard actually delivers (health synthesis + failure diagnosis), not just "a list
   of runs".
4. **Escape-hatch copy de-duplicated.** The dashboard already lives inside Seqera, so
   "Open full run in Seqera" re-named the platform redundantly. Changed to **"See full run
   details ↗"** (the ↗ is the existing `ArrowUpRight` icon, `aria-hidden`; accessible name =
   "See full run details"). Still the same real, focus-visible link-out button by the run
   title — smoke test confirms it's present and receives focus.

**Gates:** `format:check` + `tsc` + `build` clean; headless smoke test asserts the new
subtitle string, `fontWeight 700` + ink on band and row identifiers, the violet AI region
(bg `rgb(245,243,255)`, border `rgb(124,58,237)`, marker `rgb(109,40,217)`, computed
contrast 6.48:1) on **both** failures, and the focusable "See full run details" button —
**zero console errors**.

## Verify locally

```bash
npm install
npm run dev        # http://localhost:5173
# npm run build    # tsc -b && vite build
# npm run typecheck
```
