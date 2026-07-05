# Pipeline Run Status Dashboard

**Live demo → https://assignment-isadora.vercel.app/**

A run status dashboard built as **one slice, deep**: rather than touching every surface of the
platform, I redesigned the **run-monitoring** experience — a Runs Overview and a Run Summary —
with the **failed run as the centerpiece**. The organizing idea is **progressive disclosure**:
read the situation first, drill down only as far as you want, and the platform's existing full
detail stays one click away. Everything shown is reconstructed from the real execution data —
nothing is fabricated.

> Runs Overview — health at a glance, each run showing its phase roadmap

<p align="center"><img src="images/overview.png" alt="Overview — run health at a glance, with each run's phase roadmap" width="400" /></p>

> Run Summary View — run progress, likely source, and the grounded cause…

<p align="center"><img src="images/details.png" alt="Failure detail — run progress, likely source, and the grounded cause" width="300" /></p>

## Run it
```bash
npm install
npm run dev        # open the printed URL (default http://localhost:5173)
npm run build      # type-check + production build
```
Requires Node 18+ (developed on Node 22).

## How it fits: replace · insert · preserve
It's an addition, not a rewrite. The **Runs Overview replaces** the flat runs list. The **Run
Summary inserts** an interpretation layer between clicking a run and the existing detail. "See
full run details" **preserves** the platform's eight tabs, unchanged, one click away.

## What the data taught me
The dataset is an **execution record, not the science** — timing, cost, task status; the real
outputs live in cloud storage, referenced by path. Every choice below follows from it:
- **The raw error is unreliable** — a truncated banner naming the *wrong* tool, and an exit
  status of `0` on a failed run. So the Run Summary **reconstructs** the cause from task signals.
- **Run status ≠ task status** — a succeeded run can hold a task that failed and recovered on
  retry; surfaced plainly, not alarmingly.
- **Two failure archetypes** — mid-run (a step killed) vs died-on-arrival (~8s, nothing ran);
  a run that never executed shows an honest "nothing ran," not a fake chart.
- **`tasks[]` is truncated** → counts come from `stats`/`load`; rows are labelled as a sample.
- **exit 143 = an external kill** (spot reclamation), not out-of-memory (137) — the tasks ran
  on spot, confirmed in the data — so the diagnosis and "Likely source" tag reflect that.

## Interaction choices, and why
Progressive disclosure (one idea per view, always a way back); lead with meaning, not status;
the **phase roadmap** shows where a run got to (overview) and its progress (summary) from one
shared component; failure is first-class — *where* it broke, *whose fault* (a hedged "Likely
source" tag), *why*, and *what next*. **AI, honestly:** interpretive content sits in one violet,
"illustrative"-labelled region; deterministic content (summary, counts, progress) is computed
and unlabelled — two trust models.

## Component & code choices, and why
A **data layer** (`lib/`, no JSX: types from the *real* data, `phases.ts`, `failure.ts`,
`overview.ts`) is isolated from **presentation** (`components/`: `ui/`, hand-rolled `viz/`,
the `failure/` drill-stack) — because the interpretation logic is the interesting, most-likely-
to-move part. One roadmap component serves both screens so they can't drift. No `any`; the three
UI states (loading, empty, failed) are real code paths.

## Tradeoffs
- **Interpretation depth over exhaustive provenance** — the Run Summary interprets; the raw
  detail (provenance, per-process metrics, logs) stays the existing detail view's job, linked to.
- **A focused slice over broad coverage** — the scope the brief rewards.
- **Hand-rolled visuals over a chart library** — native feel, lean bundle.
- **Honesty over demo flash** — no faked real-time, no recreated results report; the dataset is
  post-execution and holds no scientific outputs.

## What I'd build next
Deepen the *interpretation* (same data): richer diagnosis, overview aggregate charts, group-by-
pipeline, a live-model AI summary, "Rerun" as a real action. With *more* data: **real-time runs**
— the roadmap is built to fill in live. Left to the existing detail (not rebuilt): provenance,
per-process charts, raw logs.

## Accessibility
Audited against the running app (axe · keyboard · contrast), not just reviewed. Keyboard-
complete; focus moves into a run on open and returns to its row on close; status is icon + text
+ colour; the roadmap carries a spoken aria-label; `prefers-reduced-motion` honoured.

## Docs
- **DESIGN-DIRECTIONS.md** — design principles · **ai-interaction-principles.md** — how the AI
  behaves · **NOTES.md** — decision log and the data-faithfulness audit.