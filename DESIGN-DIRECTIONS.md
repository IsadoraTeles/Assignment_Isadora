# DESIGN-DIRECTIONS.md: Seqera Run Dashboard

Design principles established with the designer. Apply them to **every** design and
code decision, not just the failure diagnosis. This is a companion to
`ai-interaction-principles.md` (how AI behaves) and `CLAUDE.md` (the project
contract). When a choice is ambiguous, check it against these.

## 1. Progressive disclosure is the spine ("opening doors")

Show one idea per view. The user drills deeper by choosing a door, and there is always
a way back. Never present everything at once. The path runs from the **Runs Overview**,
into the **Run Summary**, then to a specific facet, and finally out to the **full run
details**. Each level stays calm and minimal.

## 2. Lead with meaning, not status (at the Run Summary level)

In the Runs Overview, status is the at-a-glance signal. Once inside a run the user
already knows it failed, so lead with **what happened** and **what to do**, and demote
the status to a small confirmation. Do not re-announce "Failed" as the hero.

## 3. Doors announce themselves

Every navigational element states what lies behind it with a short, **always-visible
descriptor**, never a hover tooltip. Hover-only popups fail on touch and for keyboard
and screen-reader users, whereas visible descriptors are clearer and accessible.

## 4. Failure is first-class and diagnostic

Reconstruct the "why" from structured signals such as the failing step, exit code, and
retries. Never echo the raw error as the reason. Show the raw error, but demote it
behind a door with a note on why it is unreliable. Treat distinct failure archetypes
distinctly.

## 5. "What next" is first-class

A Run Summary must offer a path forward: concrete, actionable next steps, framed as
**suggestions the user chooses**, with the human in control and no automatic action.
"What went wrong" without "what to do" is half the job.

## 6. Show, don't just tell, and every chart answers ONE question

Visualize the important numbers so insight is immediate. The roadmap answers *where did
it break*, the donut *how much completed*, the gauges *was it efficient and did we
overpay*, and the cost bars *which run cost most*. No chart exists for decoration. Build
lightweight **hand-rolled SVG primitives** (Donut, Gauge, Spine, Bar) matched to
Seqera's own style, rather than a generic chart library.

## 7. Concise first, everything available

The guided drill is the default, and a **"Complete results" full report** with
everything on one page is the opt-in escape hatch. This serves the newcomer and the
expert who wants density: the VP's "different levels of detail," delivered by one
design.

## 8. Honesty (this is the character of the whole submission)

- Only visualize what the data supports. Runs that never executed (cancelled or
  died-on-arrival) get an honest **"nothing ran"** state, not empty donuts or fake
  roadmaps.
- Never animate to imply live progress, because nothing is running.
- Label AI output "illustrative," and hedge when the data cannot confirm a cause.
- The dataset is the **execution record, not the science**. Outputs live in cloud
  storage, referenced by path. "View outputs" links out, and we never fabricate
  results.

## 9. Native to Seqera

The sparkle marks AI, following Seqera's existing signal, and is given its own
dedicated **colour role** so it never competes with the status palette or reads as
success on a failed run. Outlined status pills, donut gauges for efficiency, calm and
generous whitespace, and tokens and roles rather than raw hex.

## 10. Accessibility is a design constraint, not a final pass

Keyboard-drillable, with focus following navigation into each view and back, AA
contrast, status shown as icon and text and colour (never colour alone), and visible
descriptors over tooltips.

## 11. Motion communicates hierarchy, never decorates

Push and pop for depth, reveals for finished results, and expand and collapse for
relationships. Respect `prefers-reduced-motion`. One or two meaningful moments beat
many.

---

**Apply-to-every-decision check:** Does this view show one idea? Does it lead with
meaning? Does each door announce itself? Is every number that matters visual? Is it
honest about what the data supports? Is it keyboard-reachable with visible focus? Does
it look like it belongs in Seqera?
