---
agent-notes:
  ctx: "gate record — Wei refutes the slice A measurement that proposed dropping the contrast check"
  deps: [docs/adrs/0013-design-authority.md, .claude/agents/wei.md]
  state: canonical
  last: "claude@2026-08-05"
  key:
    - "verdict REFUTED; the contrast-drop proposal is withdrawn, the motion correction survives"
    - "the probe measured the sensor's shape, not the domain: 1 pair vs ~35 under ancestor scoping"
    - "corpus was not clean — Pierrot 1.78:1 and Pat 2.23:1 hover borders, reasoned about in prose at TeamGrid.astro:148-155 with no sensor"
    - "yield was applied in one direction only; the replacement check scores zero on the same corpus"
---
# Gate record: the slice A measurement, refuted

**Date:** 2026-08-05 · **Challenger:** Wei (standalone agent, read-only) · **Verdict: `REFUTED`**

## What was on the table

ADR-0013 §6, as amended by the cost amendment (PR #83), rescoped step 1 into slice A / slice B and left open *"whether slice A is worth building at all."* A probe implementing slice A **exactly as specified** was run against Summon's own site (384 lines of source CSS). It reported **one** co-declared foreground/background pair, which was the pair a human had already hand-computed and annotated at `global.css:5-6`. On that basis PR #85 proposed **striking slice A's contrast check** and adding `dani.md:80`'s second clause in its place.

Wei was briefed with pre-digested facts **carrying explicit proof grades** — nine `VERIFIED (file:line)` and five `INFERENCE (mine, unverified)` — and told to default to `REFUTED`. This was a direct response to the §8 process note from the previous gate, where an ungraded coordinator inference was laundered into Archie's premises as established fact.

## Verdict

`REFUTED`. Not "needs work." The proposal's central empirical claim did not survive contact with the corpus it cited.

## Challenges and dispositions

| # | Challenge | Severity | Disposition |
|---|---|---|---|
| **C1** | **I5 is self-refuting.** The claim "contrast cannot be paid down by any static script" offered as its proof that *Tailwind declares the pair in markup* — `class="bg-indigo-600 text-white"`. That string is a co-declared pair against a published constant palette, with no cascade, no specificity, no inheritance. It is *easier* to check than CSS. The sentence proving impossibility contains its own counterexample. | fatal | **Accepted.** I5 withdrawn as overreach. The honest finding is that the *co-declared-at-one-selector* formulation has low yield, not that static analysis cannot do this. Everything downstream fell with it. |
| **C2** | **The probe measured the sensor's shape, not the domain.** Widening to ancestor-scoped pairs within a single file yields **~35** statically resolvable pairs on the identical 384 lines, versus the 1 reported. | fatal | **Accepted, and independently verified.** `TeamGrid.astro` has 7 `color:` declarations against a literal `.hero-card { background: #0f172a }`, plus 16 accent hues as literals in the same file's frontmatter. §6's pairing rule is widened accordingly. |
| **C3** | **The corpus contains an unadjudicated relationship the check exists to surface.** `.hero-card:hover { border-color: var(--accent) }` against `#0f172a` — Pierrot's `#7f1d1d` is 1.78:1. | fatal | **Accepted, verified, and found to be stronger than stated.** Recomputing all 16 hues independently finds **two** below WCAG 1.4.11's 3:1 — Pierrot `#7f1d1d` at 1.78:1 **and Pat `#9f1239` at 2.23:1**, which Wei missed. `TeamGrid.astro:148-155` then proves Dani reasoned about *exactly those two costumes* in 3:1 terms and recorded the mitigation as a CSS comment with no sensor behind it. That is § Context gap (2) verbatim, live in the corpus the probe called clean. |
| **C4** | **Wrong metric, contaminated sample.** The corpus was styled by Dani holding the contrast rule, and `global.css:5-6` is the fossil of a real defect (`#6366f1` at 4.47:1) that a human eye caught — evidence *for* the check, cited against it. Defects-found is the wrong measure for a regression guard: a smoke detector that does not sound in a house that is not burning has not failed. | fatal | **Accepted.** §6 now states slice A's measure as **pairs covered**, plus whether it would have caught the defects known to have occurred. |
| **C5** | **The instrument was applied in one direction only.** The amendment struck a check scoring 1 and added one scoring **0** on the same corpus, in the same document, citing yield. Neither file contains a single `animation:` declaration or `autoplay` attribute. | fatal | **Accepted, verified by re-grep — zero of both.** The "no auto-playing animations" addition is **withdrawn**. Greppability is not yield. |
| **C6** | **V8 inverts the Tailwind inference.** `global.css:1` is `@import "tailwindcss"` — Summon's site *is* a Tailwind project, and it styles entirely in plain CSS + custom properties. The single observed "user with a UI who uses Tailwind" is precisely the case where a CSS-side check sees everything. n=1, and the 1 contradicts the inference. | serious | **Accepted, verified.** `global.css:1` does read `@import "tailwindcss"`. The claim "the modal Summon user with a UI is the user this check cannot see" is deleted. Wei's `shadcn/ui globals.css` sub-claim is flagged by Wei itself as from training, unverified here, and is **not** relied on. |
| **C7** | **I2/I3 rest on a menu default in an elicitation prompt.** The scaffold files are *questions Summon asks the user*, with Tailwind one of four options marked "(Recommended)". That is not a distribution over user projects. | serious | **Accepted.** "Structural, not a thin-corpus artifact" was unearned and is removed. |
| **C8** | **Gate-grade bar applied to an advisory artifact, and the asymmetry points at KEEP.** #83 already bars slice A from the Done Gate, so false-positive cost is ~0. Dropping it forecloses the only instrument that would ever measure its real-project yield. | serious | **Accepted**, and recorded in §6: shipping advisory is what produces the corpus that I2 was guessing at. |
| **C9** | **Process — a change of mind wearing a correction's clothes.** The *cost* amendment corrected something **false**. This one said "we built it, we measured, we changed our minds," which is what supersession is for. Running both through in-place strikethrough one day apart teaches that ratified canon is editable whenever someone learns something. | serious | **Largely moot post-refutation**, and the point is conceded in principle. What lands is now a genuine correction: §6's *motion* spec is factually a false negative (C-verified), and its *pairing rule* was too narrow. Nothing is struck on preference. |
| **C10** | **`#75` is unresolvable canon.** Citing a Summon issue as the evidentiary basis inside a file that must "remain readable and applicable in a scaffolded project" fails the stranger test. | minor | **Partly accepted.** The load-bearing numbers are now inline in §6 rather than delegated to the issue. The `#75` pointer is retained for the working record only. |
| **C11** | **I1 is right but unsourced.** SC 2.3.3's note does exclude colour/opacity changes from "motion animation," but the amendment stated it bare while making it load-bearing for a property list shipped to strangers. | minor | **Accepted.** §6 now cites SC 2.3.3's exclusion note at the point of claim. |
| **C12** | **The added check is imprecise where it matters.** `animation … infinite` fires on a legitimate loading spinner, whose correct mitigation is reduced-motion handling, not removal. | minor | **Moot** — the check is withdrawn under C5. Worth re-reading if it is ever proposed again. |

## What survived

Recorded so the correction is not over-applied:

- **The motion false-negative finding**, which Wei verified independently. `global.css:81` (transform, covered at `:89`), `:124` and `:141` (paint, uncovered), file-level check returns PASS. The motion/paint property split is the correct fix.
- **The selector-matching scope exclusion**, and its consequence that slice A stays advisory.
- **The `## Status` meta-note** and the discipline of preserving struck text with `~~`.
- **#83's binding constraint**, untouched: slice A may not be gate-wired under `design-floor-check`.
- **That contrast has a slice-B half.** Inherited, computed, cross-component, and `color-mix()`-against-inline-custom-property pairs genuinely need a browser. The error was the leap from *there is a slice-B half* to *there is only a slice-B half*.

## What nobody has checked

- **Any real user project.** Wei has no more corpus than the coordinator did — which is its point: neither party should be writing "structural, not a thin-corpus artifact" into canon.
- **The false-positive rate of either surviving check on a real app.** Still unmeasured, still the number that decides whether slice A ever leaves advisory.
- **Whether WCAG 1.4.11 binds a hover `border-color`.** Arguable. That it is arguable is the argument *for* a sensor that surfaces it rather than a prose comment that settles it silently.
- Wei could not read PR #85's diff or issue #75 (read-only, no `gh`), and did not re-read `dani.md`; it took `dani.md:78`/`:80` on the coordinator's grade and said so.

## Process note

The graded-facts briefing worked, and worked in the direction it was designed for: **four of the five items Wei was told were inference are the ones it broke**, and it spot-checked five verified items rather than spending turns re-deriving all nine. Grading facts did not make the agent credulous about the verified ones — it made the soft targets legible. This is the mitigation the previous gate's §8 note asked for, and it should be written into `gotchas.md` rather than left in two history files.

One thing the grading did **not** catch: the coordinator designed the probe, ran it, and interpreted it. No grading discipline fixes a single-author measurement. The refutation came from an independent reader of the same corpus, which is the only control that would have worked.
