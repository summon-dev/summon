---
agent-notes: { ctx: "design pass for design-floor-check (#75) + the gate that partly refuted it; cost claims corrected, ordering upheld", deps: [docs/adrs/0013-design-authority.md, docs/adrs/meta/0012-executable-canon.md, docs/process/done-gate.md, packages/summon-team/src/index.ts, scripts/check-canon.mjs], state: active, last: "claude@2026-08-05", key: ["§1 sound and applied; §5's reorder REFUTED by Wei (W1/W2/W5) and withdrawn", "the false-negative finding (§6 W3) is the most important output", "page discovery resolved: URLs as arguments"] }
---

# Design pass: `design-floor-check` (#75)

> **Read this first — outcome after the gate.** This pass was written, then challenged by Wei and ruled on by Archie. **Its factual finding held; its conclusion did not.** §§ 1–2 are sound and are now applied to ADR-0013 as a cost amendment. **§ 5's recommendation to reorder § 6 was refuted and is withdrawn** — see § 6. The single most valuable thing to come out of the whole exercise is not in the original pass at all: it is Wei's **false-negative** finding at § 6 (W3), which constrains the very slice this pass proposed. §§ 3–5 are preserved unedited below so the reasoning that failed stays legible; read them against § 6, not on their own.

ADR-0013 § 6 ships `design-floor-check` first, on the claim that it is *"smaller than everything else in this ADR."* Its own Negative consequences flag the design as `UNRESOLVED` and attach a falsification clause (`docs/adrs/0013-design-authority.md:265`):

> if that pass finds it expensive, § 6's sequencing claim ("smaller than everything else in this ADR") is falsified and the ordering should be revisited rather than forced.

This is that pass. **The clause fires** — on the sizing claim. The script is the largest item in the ADR by dependency cost, and it is the only one carrying supply-chain exposure. The recommendation below was to reorder; **that part was wrong**, because § 6 does not order by size (§ 6, W1).

## 1. The dependency claim is false

ADR-0013:189 states:

> No new runtime dependency beyond the headless browser Playwright already implies for 8b

Done Gate 8b implies **no project dependency at all.** `docs/process/done-gate.md:33` specifies it "via Playwright `browser_navigate` + `browser_take_screenshot`, or manual check." Those are **MCP tool names**, not a library API — they run in the *agent's* environment, against an MCP server the coding agent connects to. `.claude/commands/sprint-boundary.md:212` uses the same agent-side tools for Step 5c. Corroborating: `packages/summon-team/src/index.ts:39` excludes `.playwright-mcp` from the scaffold as a gitignored *artifact* directory — the repo already treats Playwright as agent tooling, never as a project dependency.

A **script** the user runs cannot call MCP tools. It needs, in the user's own project:

- `axe-core` (or `@axe-core/playwright`) and `playwright` as real devDependencies
- Playwright browser binaries — a separate `npx playwright install` step, hundreds of MB, not covered by any lockfile
- both subject to ADR-0010's release-age cooldown and ADR-0011's scan, plus Done Gate 13/13b/13c on every future bump

So this is not "no new dependency." It is **the first dependency Summon has ever shipped**, and three facts make that unusually expensive here:

1. **Every shipped script today is zero-dependency stdlib Node.** `scripts/check-canon.mjs` and `scripts/harvest-debt.mjs` import only `node:fs` and `node:path` — verified, nothing else. They work anywhere `node` exists, with no install step.
2. **The scaffold ships no `package.json`.** `index.ts:47` puts the root manifest in `EXCLUDE_FILES`. A scaffolded project therefore has **nowhere to declare a devDependency and no `scripts` entry to hang a command on**. Summon's own root manifest declares no `dependencies` or `devDependencies` keys whatsoever.
3. **Summon ships into non-Node projects.** The stack landscape includes Python CLIs and Rust workspaces. A zero-dep `.mjs` script degrades gracefully there (needs only `node` on PATH); one requiring `npm install` plus browser binaries does not.

ADR-0013 also contradicts itself on this point. §258 claims *"Zero new supply-chain exposure. No third party is required by anything here"* while §189 concedes *"one well-known audited library."* Both cannot hold. §189 is the accurate one, and it understates the cost by omitting the browser binaries.

### Relative size, corrected

| § 6 step | Deliverable | Dependency cost |
|---|---|---|
| 2 — 8b amendment | prose edit at `done-gate.md:33` | none |
| 3 — stub + Dani protocol | one Markdown stub, one prompt paragraph | none |
| **1 — `design-floor-check`** | **script + 2 packages + browser binaries + install step + a manifest that does not exist downstream** | **first-ever, permanent** |

Step 1 is the largest by every measure available. The ordering claim is falsified on cost alone, before reaching the three open questions.

## 2. The three UNRESOLVED questions

### Page discovery — unsolved, and canon already has a dangling concept

There is no generic way to enumerate a project's routes. Worse, canon already *assumes* a solution: `sprint-boundary.md:212` says "navigate to each **registered** page/route," and **nothing in the repo defines "registered."** No registry file, no schema, no convention. That dangling word is a pre-existing defect this script would inherit and make load-bearing.

The options, none free:

- **Explicit registry** — the user lists routes in a file. Portable, zero-dep, honest. Cost: a new canon file and a new thing to keep current; goes stale silently, and a stale registry produces a *passing* check over routes that no longer exist — a false green of exactly the shape `gotchas.md` now documents twice.
- **Framework adapters** — read Next.js/Astro/SvelteKit route conventions. Accurate per framework, and an open-ended maintenance surface across N frameworks. This is the "two-layer maintenance" cost ADR-0013:263 already prices, multiplied by framework count.
- **`sitemap.xml`** — free where it exists, absent in most apps, and never covers authenticated or stateful views.

"Which states?" is harder still and has no candidate answer: logged-in vs. logged-out, empty vs. populated, error and loading states are where accessibility defects concentrate, and reaching them requires fixtures or a session — i.e. the E2E suite 8b explicitly declines to be.

**Assessment:** needs a decision, and it is a canon-shaped decision (a registry format), not an implementation detail.

### The fixture problem — confirmed hard

A component library has no server and no routes. Checking it requires rendering components in isolation, which means either depending on the project's own harness (Storybook, Ladle — a second dependency Summon does not control and cannot assume) or **generating** a harness page per component, which requires knowing the framework, the import graph, and each component's required props. Prop synthesis for arbitrary components is not a small problem.

**Assessment:** out of scope for a first version. Should be stated as a documented non-goal rather than left implied, otherwise every library project reads item 8 as advertising something that does not work — the precise failure ADR-0013:257 set out to retire.

### False-positive rate — unmeasurable right now, and the pilot corpus is thin

Trigger 2 (`0013-design-authority.md:279`) makes this the metric that decides whether the check survives on the gate, so it cannot be hand-waved. But it is unmeasurable before the script exists, and Summon has almost nothing to measure against: `site/` is a Starlight docs site with a single custom `.astro` component, and `index.ts:35` **excludes `site/` from the scaffold** — so the only available corpus is both atypical of user apps and framework-only. axe's default ruleset on a real app reliably surfaces contrast findings on brand colours and landmark/region violations that teams legitimately dispose of; without a triage story, trigger 2 fires by construction.

**Assessment:** the rule *subset* must be chosen conservatively and stated in advance, and the check should start advisory (reported, not gating) until a real rate is observed. Note that gating is precisely what Wei's C9 argued for — "her existing rules can't fail a build" — so an advisory first release is a genuine, acknowledged partial retreat from C9's point, not a quiet reinterpretation of it.

## 3. What this does *not* undermine

Wei's C9 stands. A prose rule that cannot fail a build is still a defect under ADR-0012 §B, and that defect predates this ADR. Nothing here argues for leaving `dani.md`'s checklist unenforced. The disagreement is only with **what ships first**, and specifically with the estimate that put a dependency-bearing browser harness ahead of two zero-cost prose changes.

ADR-0012 §B's tie-breaker also deserves a note. It prefers a script over a hook because a script *"runs on every runtime and plan tier."* That reasoning holds only for a **zero-dep** script. One requiring `npm install` plus browser binaries does **not** run on every runtime — it fails on Python and Rust projects, and on any scaffold that still has no `package.json`. The tie-breaker's own justification argues for the static slice below.

## 4. A first slice that is genuinely small

Split the floor by dependency cost, because the split falls almost exactly along it:

**Slice A — static, zero-dep, stdlib Node (ships like `check-canon.mjs`):**

- **`prefers-reduced-motion` coverage.** Structural and greppable: if any stylesheet declares `animation` or `transition`, assert a `@media (prefers-reduced-motion: reduce)` block exists. Low false-positive rate, no browser, catches the omission that actually happens.
- **Declared token-pair contrast.** Compute WCAG contrast arithmetically from CSS custom properties. No DOM required — the maths needs only two colours.

**Slice B — requires a browser (axe DOM pass, computed contrast, console-error capture):** deferred behind its own scoping, carrying the dependency decision, page discovery, and the advisory-vs-gating call.

### This inverts the ordering a second time

Slice A's contrast check needs to know **which colours pair as foreground and background**. That information does not exist in CSS custom properties — but it is exactly what § 3's stub collects, under its `## Colour tokens and roles` heading (`0013-design-authority.md:121`).

So step 3 (the stub, docs-only, zero-cost) is a **prerequisite** for the cheapest useful part of step 1, not a follow-on to it. § 6 has the dependency backwards.

This also softens ADR-0013:264's worry that the stub "may go unfilled forever": under this ordering the profile becomes an input to a check that fails a build, which is a far stronger reason to fill it in than documentation alone.

## 5. Recommendation

1. **Ship § 6 steps 2 and 3 now, in one docs-only PR** — the 8b amendment (verbatim wording at `0013-design-authority.md:154-162`, applied to `done-gate.md:33`) plus the stub and Dani protocol. Zero dependencies, immediately useful, and ADR-0013:194 already sanctions a partial PR.
2. **Do not apply item 8's deterministic upgrade** (`0013-design-authority.md:166-168`). It is explicitly gated on the script existing; it stays unapplied.
3. **Rescope #75 to Slice A** and refile Slice B, with the dependency decision, the route-registry format, and advisory-vs-gating called out as its open questions.
4. **Record the falsification in ADR-0013** — a superseding note on § 6, not a silent reinterpretation. The ADR asked to be told; leaving § 6 reading as ratified guidance while implementation follows a different order is the drift `check-canon.mjs` exists to prevent.
5. **Fix the dangling "registered" in `sprint-boundary.md:212`** — either define it or reword it. Independent of everything above.

Whether this rises to an ADR amendment or a § 6 superseding note is Archie's call, and item 3's rescope is Pat's.

---

## 6. Responses to the second gate

Everything above § 6 is the pass as originally written. Wei (devil's advocate) and Archie (design authority) were then run as standalone agents. **Wei's verdict: `REFUTED`** — the factual finding is real and warrants correcting §§ 189/258, but it "does not support the conclusion the pass draws from it." That is largely right. Dispositions below; each was verified against the repo rather than taken on the agent's word.

| # | Challenge | Severity | Disposition |
|---|---|---|---|
| **W1** | The pass falsifies an **aside** and treats it as the rationale. § 6 is titled *"C9's sensor goes first"* and orders by value at `:185` — *"if only one ships, the sensor is worth more, so it ships first."* The words "worth more" appear nowhere in the pass. | fatal | **Accepted.** Verified: `:185` reads exactly that. The pass demolished the sizing aside at `:189` and let the reader infer the ordering fell with it. To reorder § 6 you must argue the docs-only steps are worth *more*; the pass never attempted it. The reorder is **withdrawn**. |
| **W2** | The dependency argument attacks **slice B**. Slice A is zero-dep, so it can *be* step 1 — the finding justifies **rescoping**, not **reordering**. | fatal | **Accepted, and it is the cleanest hole in the pass.** Rescoping is order-preserving. This is now exactly what ADR-0013 § 6 says. |
| **W3** | **Slice A passes green on an obviously inaccessible site** — no `alt` text, unlabeled inputs, `div` click handlers with no keyboard path, no landmarks, inverted heading order, focus traps. The pass demanded a false-*positive* story and never asked for a false-*negative* one. | serious | **Accepted, and promoted to the most important finding of the exercise.** It constrains the slice the pass itself proposed. Now a **binding constraint** in ADR-0013 § 6: slice A ships under an honest narrow name, advisory, and may not satisfy Done Gate item 8. Item 8's upgrade stays gated on slice B. |
| **W4** | *"C9 stands"* is a courtesy. Compose the three retreats — defer the DOM sensor, ship advisory, couple contrast to an optional file — and **Dani's rules still cannot fail a build.** No re-entry condition named. | serious | **Accepted as to the compounding**, and it cuts against W3's remedy in the opposite direction: honouring W3 makes this *worse*, not better. Recorded honestly rather than resolved — slice B is deferred **and explicitly not promised** in § 6, which is the truthful statement of where this stands. The re-entry condition is the false-negative measurement; naming an owner and a date is open (§ 7). |
| **W5** | The colour-role prerequisite is an artifact of one formulation. Contrast pairs **are** derivable from CSS: any rule setting `color` and `background-color` on the same selector declares a pair. And reduced-motion needs no profile at all. | serious | **Accepted.** Verified by inspection: declaration-site pairing is a fact about CSS, and choosing the token as the unit of analysis was the error. The "second inversion" is **withdrawn** — the stub is not a prerequisite for slice A. Partial caveat retained: *inherited* backgrounds (fg on a child, bg on a distant ancestor) are not statically recoverable, so static contrast coverage is genuinely partial — which reinforces W3 rather than rescuing the pass. |
| **W6** | Coupling the only build-failing check to the artifact the ADR calls most likely to never exist, and calling that an improvement, inverts the risk. | serious | **Moot** — the coupling is gone with W5. The underlying double standard (applying the false-green test to a disliked option and not to the recommended one) is a fair hit and is the same blind spot W3 names. |
| **W8** | Page discovery is **not unsolved**. Take URLs as arguments — `design-floor-check http://localhost:3000/ /about`. No registry, no staleness, no per-framework surface, zero canon additions. This is how `axe-cli`, `pa11y`, and Lighthouse CI work. | serious | **Accepted.** The pass assumed auto-discovery and never questioned it, then escalated the result to "a canon-shaped decision." Now recorded as **resolved** in ADR-0013's Negative consequence 3. The dangling `"registered"` at `sprint-boundary.md:212` drops to a wording fix. |
| **W9** | Recommendations 1 and 3 **are** the reorder; deferring recommendation 4 to "Archie's call" executes it before ratifying it. | serious | **Accepted, and it landed on live work.** The steps 2+3 commit had cited `:194` ("it carries 1 and 2") as sanction; verified, `:194` means **script + 8b**, not 8b + stub. Commit message corrected to state that it is neither that partial nor a reorder. |
| **W10** | "Largest by every measure available" — the table has one discriminating axis. | minor | **Accepted.** Overreach. § 6's amendment says "ranked on one axis." |
| **W11** | Browser binaries are **double-counted**: 8b's MCP server already put browsers on the machine, so the marginal cost is a manifest entry plus `axe-core`. | minor | **Partly accepted.** A project-level Playwright install can share a browsers cache, so "hundreds of MB" overstates the *marginal* cost. It does not rescue the claim that mattered: the MCP install is not a *project* dependency and cannot be depended on by a script, which is W2's point and remains the substance. |
| **W12** | A zero-dep `.mjs` still needs `node` on PATH, and projects with CSS to grep mostly have a `package.json` anyway — so slice A's portability edge is largely notional. | minor | **Noted, not resolved.** Fair, and it weakens the § 3 tie-breaker argument without changing any decision. `index.ts:47` being a scaffolder choice rather than a law is a good observation for whoever specs slice B. |

**W7** (the recommended first PR ships prose and zero enforcement, in service of retiring a defect defined as *"checkable rules left in prose"*) is accepted as an accurate description and left standing as a cost. Shipping steps 2 and 3 remains defensible — both are ratified, independently complete, and unblocking — but Wei is right that they pay down none of the § B defect, and the PR should not be described as if they do.

**Wei's counter-argument for no change at all** deserves recording because one leg of it survives everything above: *"the cost of being wrong is asymmetric against deferral."* Build the sensor and find it noisy, and trigger 2 removes it — one line, reversible, and you have learned the false-positive rate that is otherwise unmeasurable. Defer it, and the § B defect rides another cycle while `:253` sits Accepted promising the modal user "a deterministic accessibility floor that can fail a build." That asymmetry is real and is **not** resolved by this amendment; it is the strongest argument for paying slice B's cost sooner rather than later, and it should be the first thing read when slice B is scoped.

**Archie's ruling** (`2026-08-05-adr-0013-section-6-ruling.md`) returned *"amendment in place — reorder § 6."* The **amendment-in-place instrument was adopted**; the **reorder was not.** Archie's ruling rests at its lines 118 and 128 on the colour-role prerequisite — pre-digested fact 9 in its own briefing — which W5 dismantled. Adopted from it: that no `## Amendment` heading precedent exists so ADR-0012 § B's inline named-amendment form is the instrument to copy; that `:258` gets **corrected rather than excused** because *Consequences* is what a reader quotes in six months; that `:194` must survive verbatim; and that slice B may not inherit § B's script-over-hook justification.

## 7. Still open

- **The false-negative rate of slice A** — the measurement this whole ADR failed to ask for (W3). No owner, no method. Blocks slice A from the Done Gate under any name.
- **A re-entry condition for slice B** (W4). Deferred-and-not-promised is honest, but an indefinite deferral with no trigger is what W4 predicts becomes permanent.
- **Whether slice A is worth building at all** given W3 and W12 — a zero-dep check that catches little, on projects that mostly could have afforded the real one. Not asked here.
- **Slice A's acceptance criteria**, and the `"registered"` wording fix at `sprint-boundary.md:212`.

## 8. Process note, on how the gate itself failed and half-worked

The Silent-Starvation mitigations (`docs/process/gotchas.md`) worked: both agents produced complete artifacts on the first attempt — Archie's skeleton landed on turn 1 and refined to 19 KB with zero `TBD` left, and Wei, who cannot write files, returned the full structured output it was asked for.

But the mitigation introduced a new failure. Archie was handed ten "pre-digested verified facts" to spend its turn budget on reasoning instead of reading. **Nine were verified; fact 9 was the coordinator's own unverified inference, stated in the same declarative register.** Archie had no way to distinguish them and built a ruling on it. Wei, briefed on the same facts, was explicitly told to default to refuted and attacked the premise instead — which is the only reason it was caught.

**The lesson:** pre-digestion transfers the coordinator's errors into the subagent's premises with the authority of established fact. Facts handed to an agent should carry their proof grade the way Done Gate items do — `verified: file:line` versus `inference` — and an agent asked to rule should be told which is which. Filed as a candidate gotcha; not yet added to canon.
