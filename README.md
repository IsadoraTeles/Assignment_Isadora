# Pipeline Run Status Dashboard

**Live demo → https://assignment-isadora.vercel.app/**

A run status dashboard, scoped as one experience built deeply rather than many built shallowly. I redesigned **run monitoring**: a **Runs Overview** and a **Run Summary**, with the **failed run as the centerpiece**. The design is organized around a single principle, **progressive disclosure**: the interface presents the situation first, then reveals detail only as far as the user needs, while the platform's existing full detail remains one click away. Every value on screen is derived from the real execution data, and nothing is invented.

> Runs Overview: run health at a glance, with each run showing its phase roadmap

<p align="center"><img src="images/overview.png" alt="Runs Overview: run health at a glance, with each run's phase roadmap" width="400" /></p>

> Run Summary: run progress, likely source, and the grounded cause.

<p align="center"><img src="images/details.png" alt="Run Summary: run progress, likely source, and the grounded cause" width="300" /></p>

## How to run it

```bash
npm install
npm run dev        # then open the printed URL (default http://localhost:5173)
npm run build      # runs the type-check and the production build
```

Requires Node 18 or newer (developed on Node 22).

## How it fits into the existing product

This is an addition to the current experience, not a replacement for it.

- **Replace.** The Runs Overview stands in for today's flat runs list, and adds a health summary, cost, task ratios, plain language descriptions, filtering and sorting, and a phase roadmap for each run.
- **Insert.** The Run Summary is a new step between selecting a run and the platform's existing detail. It interprets what happened before the user reaches the raw data.
- **Preserve.** "See full run details" opens the platform's existing eight tab view, unchanged. The depth that experts rely on stays available, one click away.

## What the data taught me, and why the design follows from it

The defining fact about the dataset is that it is an **execution record, not the scientific results**. It describes how each run behaved, including timing, cost, and which steps ran and whether they succeeded, but not what the pipeline produced. Those outputs live in cloud storage and are referenced only by a path. Each decision below follows from reading the data closely.

- **The raw error message is unreliable.** On the main failed run it is a truncated banner that names the wrong tool, and the run's own exit status reads 0 despite the failure. Rather than surface that message, the Run Summary **reconstructs the cause from the task level signals**, which are trustworthy.
- **Run status and task status are distinct.** A run can succeed overall while one of its tasks failed and then recovered on a retry. I present that plainly, so it is neither hidden nor alarming.
- **Two failure modes require two explanations.** One run failed mid execution, after many steps had already succeeded. Another failed on arrival, roughly eight seconds in, before any task ran. A run that never truly started shows an honest **"nothing ran"** rather than an empty chart.
- **The task list is truncated in the data,** so the authoritative counts come from the summary fields, and any partial list of task rows is labelled as a sample.
- **Exit code 143 indicates an external termination,** most plausibly a reclaimed spot machine, rather than an out of memory condition, which would report code 137. The data confirms these tasks ran on spot instances, so the diagnosis and the **"Likely source"** tag report Infrastructure, and the suggested fixes are ordered accordingly.

## Interaction decisions, and the reasoning behind them

- **Progressive disclosure throughout.** Each view presents one idea at a time, deeper detail sits behind a deliberate action, and there is always a way back. The overview supports **triage**, meaning "which runs need attention," while the Run Summary supports understanding a single run.
- **Lead with meaning, not status.** A failed run opens with a plain language account of what happened, rather than a red "Failed" badge alone. The failure is already known. The valuable information is the cause.
- **A shared phase roadmap.** A compact visualization shows the path each run travelled and where it stopped. The same component serves both screens, as a compact row on the overview and a fuller progress view in the summary, so the two representations cannot diverge.
- **Failure as a first-class diagnosis.** The summary answers four questions in sequence: **where** it broke (the roadmap), **whose fault** it most likely was (a hedged "Likely source" tag), **why** (a grounded explanation), and **what to do next** (concrete, selectable suggestions).
- **AI used with two visible levels of trust.** The interpretive content, meaning the likely source, cause, and suggestions, sits in one violet region marked **"illustrative,"** a hand built stand in for a live model. The factual content, meaning the summary line, counts, and progress, is computed directly from the data and carries no AI label, because it is always correct.

## Component and code decisions, and the reasoning behind them

- **A clear separation of logic from rendering.** The code that determines what to show, meaning reading the data, deriving the roadmap, building the diagnosis, and computing the summary, lives in a data layer (`lib/`) that contains no UI. The React components render what that layer produces. I separated them because the interpretation logic is the substantive part, the most likely to evolve, and the most likely to move to a server later, so isolating it keeps it readable and testable.
- **One roadmap component across both screens,** so the overview and the summary cannot drift apart.
- **Visualizations hand drawn in SVG,** meaning the donut, the gauges, and the roadmap, rather than imported from a charting library. This keeps them matched to the product, lightweight, and each focused on a single message.
- **Three real UI states.** Loading (a skeleton during the fetch), empty (when a filter matches nothing), and failed (the diagnosis) are all genuine code paths rather than mockups. Types are derived from the real data shape, and `any` is not used.

## Tradeoffs

- **Depth of interpretation over exhaustive raw detail.** The Run Summary explains, while the platform's existing full run details hold the exhaustive data, including full provenance, per process metrics, and raw logs. I link to it rather than rebuild it, because the summary's role is to interpret, not to duplicate.
- **A focused slice over broad coverage,** which is the scoping the brief calls for.
- **Hand built visuals over a charting library.** More initial effort, in exchange for a native feel and a lighter result.
- **Honesty over demonstration polish.** I did not simulate a real time view or recreate the results report, because the dataset is entirely retrospective and contains no live data or scientific outputs. A more impressive demo would have misrepresented what the data supports.

## What I would build next

Because the Run Summary interprets, its natural next steps deepen the interpretation rather than add raw data panels.

- **With the same data:** a richer diagnosis and fuller source classification, aggregate charts on the overview for cost and duration across runs, grouping runs by pipeline, a live model behind the summary, a toggle between a concise and a fuller view, and a functional "Rerun" action.
- **With more data:** real time runs. The roadmap is already built to fill in live as a run progresses, and needs only live telemetry, which this dataset does not include.
- **Deliberately left to the platform's existing full run details,** which I preserve and link to rather than rebuild: provenance, per process resource charts, and raw logs.

## Accessibility

I treated accessibility as a design constraint from the outset and audited it against the running application, using an automated scanner (axe), a full keyboard pass, and a colour contrast check, rather than reviewing the code alone. The application is fully keyboard operable. Opening a run moves focus into the panel, and closing it returns focus to the originating row. Status is always conveyed through icon and text as well as colour, never colour alone. The phase roadmap carries a spoken description for screen readers, and motion is disabled for users who prefer reduced motion.

## Repository documents

- **DESIGN-DIRECTIONS.md:** the design principles the work follows.
- **ai-interaction-principles.md:** how the AI behaves, and why.
- **NOTES.md:** the decision log, and the field by field check confirming that every value in the UI traces to the real data.
