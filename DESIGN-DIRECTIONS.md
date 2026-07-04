# DESIGN-DIRECTIONS.md — Seqera Run Dashboard

Design principles established with the designer. Apply to **every** design and code
decision, not just the failure panel. Companion to `ai-interaction-principles.md`
(how AI behaves) and `CLAUDE.md` (project contract). When a choice is ambiguous,
check it against these.

## 1. Progressive disclosure is the spine ("opening doors")
Show one idea per view. The user drills deeper by choosing a door; there is always a
way back. Never dump everything at once. Overview → run detail → a specific facet →
raw detail. Each level is calm and minimal.

## 2. Lead with meaning, not status (at the detail level)
At the overview, status is the at-a-glance signal. Once inside a run, the user already
knows it failed — so lead with **what happened** and **what to do**, and demote the
status to a small confirmation. Don't re-announce "Failed" as the hero.

## 3. Doors announce themselves
Every navigational element states what's behind it with a short, **always-visible
descriptor** — not a hover tooltip. (Hover-only popups fail on touch and for keyboard /
screen-reader users; visible descriptors are clearer and accessible.)

## 4. Failure is first-class and diagnostic
Reconstruct the "why" from structured signals (failing step, exit code, retries) —
never echo the raw error as the reason. Show the raw error, but demoted behind a door,
with a note on why it's unreliable. Treat distinct failure archetypes distinctly.

## 5. "What next" is first-class
A failure view must offer a path forward: concrete, actionable next steps, framed as
**suggestions the user chooses** (human in control — never auto-act). "What went wrong"
without "what to do" is half the job.

## 6. Show, don't just tell — but every chart answers ONE question
Visualize the important numbers so insight is immediate: the spine answers *where did
it break*, the donut *how much completed*, the gauges *was it efficient / did we
overpay*, cost bars *which run cost most*. No chart exists for decoration. Build
lightweight **hand-rolled SVG primitives** (Donut, Gauge, Spine, Bar) matched to
Seqera's own style — not a generic chart library.

## 7. Concise first, everything available
The guided drill is the default; a **"Complete results" full report** (everything on
one page) is the opt-in escape hatch. This serves the newcomer AND the expert who
wants density — the VP's "different levels of detail," delivered by one design.

## 8. Honesty (this is the whole submission's character)
- Only visualize what the data supports. Runs that never executed (cancelled,
  died-on-arrival) get an honest **"nothing ran"** state — not empty donuts or fake spines.
- Never animate to imply live progress; nothing is running.
- Label AI output "illustrative"; hedge when the data can't confirm a cause.
- The dataset is the **execution record, not the science** — outputs live in cloud
  storage, referenced by path. "View outputs" links out; we don't fabricate results.

## 9. Native to Seqera
Teal sparkle = AI (their existing cue). Outlined status pills. Donut gauges for
efficiency. Calm, generous whitespace. Tokens/roles, never raw hex.

## 10. Accessibility is a design constraint, not a final pass
Keyboard-drillable; focus follows navigation into each view and back; AA contrast;
status is icon + text + colour (never colour alone); visible descriptors over tooltips.

## 11. Motion communicates hierarchy, never decorates
Push/pop for depth, reveals for finished results, expand/collapse for relationships.
Respect `prefers-reduced-motion`. One or two meaningful moments beat many.

---
**Apply-to-every-decision check:** Does this view show one idea? Does it lead with
meaning? Does each door announce itself? Is every number that matters visual? Is it
honest about what the data supports? Is it keyboard-reachable with visible focus? Does
it look like it belongs in Seqera?
