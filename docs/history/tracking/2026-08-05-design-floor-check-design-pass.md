---
agent-notes: { ctx: "design pass for design-floor-check (#75); falsifies ADR-0013 §6 sequencing on dependency cost", deps: [docs/adrs/0013-design-authority.md, docs/adrs/meta/0012-executable-canon.md, docs/process/done-gate.md, packages/summon-team/src/index.ts, scripts/check-canon.mjs], state: active, last: "claude@2026-08-05" }
---

# Design pass: `design-floor-check` (#75)

ADR-0013 § 6 ships `design-floor-check` first, on the claim that it is *"smaller than everything else in this ADR."* Its own Negative consequences flag the design as `UNRESOLVED` and attach a falsification clause (`docs/adrs/0013-design-authority.md:265`):

> if that pass finds it expensive, § 6's sequencing claim ("smaller than everything else in this ADR") is falsified and the ordering should be revisited rather than forced.

This is that pass. **The clause fires.** The script is the largest item in the ADR, not the smallest, and it is the only one carrying supply-chain exposure. The recommendation is to reorder, not to abandon — with a genuinely small first slice identified in § 4.

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
