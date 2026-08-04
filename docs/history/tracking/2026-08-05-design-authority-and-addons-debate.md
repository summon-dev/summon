---
agent-notes: { ctx: "Architecture Gate debate record: design authority (ADR-0013) + optional add-ons (ADR-0014)", deps: [docs/process/team-governance.md, docs/adrs/meta/0007-canon-meta-boundary.md, docs/adrs/meta/0012-executable-canon.md, docs/process/done-gate.md, docs/attributions.md], state: active, last: "claude@2026-08-05" }
---

# Debate: Design Authority + Optional Third-Party Add-ons

**ADRs:** `docs/adrs/0013-design-authority.md` (canon), `docs/adrs/meta/0014-optional-addons.md` (meta)
**Issues:** #71, #72
**Date:** 2026-08-05
**Participants:** Archie (author) vs Wei (challenger), with Pierrot on the third-party trust surface

## Provenance of this record

Wei is read-only by design (`tools: Read, Grep, Glob, WebSearch, WebFetch`) and cannot write files. Round 1 challenges below are **transcribed verbatim by the coordinator** from Wei's returned message. Wei's completion sentinel declared `challenges=9 blocking=3 amendments_demanded=5`; nine challenges are present below, and the blocking/amendment counts match — the transcript is complete by its own declared count.

This transcription hop is itself a defect in the gate, filed as **#73**: `team-governance.md` mandates a debate artifact that the mandated challenger cannot produce.

**Techniques used by Wei** (gate requires ≥2): citation check, historical precedent, inversion, cost of being wrong, assumption surfacing, alternative technology.

## The proposal under challenge

1. **Design (ADR-0013).** Dani gains a design-authority protocol with a three-branch resolution order (project `DESIGN.md`/`PRODUCT.md` → configured external catalog → neither); a `docs/scaffolds/design-profile.md` stub ships; the Done Gate gains a visual-proof item. Rejected: copying `../design-notes`' distilled principles and `BAN:` anti-pattern list into Summon canon.
2. **Add-on (ADR-0014).** Interactive prompt (default no) + `--with impeccable` flag + `summon-team add impeccable` verb, delegating to `npx impeccable@<pinned> install` rather than vendoring.
3. Proposed seam: *"Summon owns process, impeccable owns craft, Dani routes."*

---

## Round 1 — Wei's Challenges

### C1 — "Delegating to `npx impeccable@<pinned> install` respects our supply-chain policy" — BLOCKING

**Claim under attack:** that pinning the CLI version makes the add-on policy-compliant.
**Technique:** historical precedent + citation check.

`docs/attributions.md` declines `setup-pre-commit` for *exactly this shape* — "instructs `husky lint-staged prettier` with no versions plus `npx husky init`, which would resolve to whatever is latest at run time. Summon's release-age cooldown (ADR-0010) and dependency scan (ADR-0011) forbid that for our own installs." Here the CLI pin is a decoy: CLI `3.5.0` fetches skill `v4.0.4` on a separate version line, so the 147-file / 3.3 MB artifact that actually lands on the user's disk is unpinned, un-aged, and un-scanned. Summon would ship an installer feature that does the thing Summon declined a free MIT skill over — under Summon's brand, on the user's machine, at install time. The ADR must state how the *skill payload*, not the CLI, clears ADR-0010's cooldown and ADR-0011's scan, and what happens when it can't.

**Wrong if:** impeccable exposes a way to pin or verify the skill payload (integrity hash, `--skill-version`, a lockfile) *and* the ADR requires it. Absent that, the honest options are "vendor a reviewed snapshot" or "README sentence only."

### C2 — "Summon owns process, impeccable owns craft, Dani routes" — BLOCKING

**Claim under attack:** that the seam is clean.
**Technique:** assumption surfacing + citation check.

impeccable ships `PostToolUse` + `Stop` hooks. ADR-0012 §B reserves the Hook layer for Summon's own exit-path enforcement, classifies hook assets as canon "gated on Pierrot's threat model," and sequences the exit-path hook *last* because it is "the most invasive asset." The proposal has Summon's installer plant a **third party's** hooks into the user's repo *before* Summon ships its own, skipping the threat-model gate Summon imposed on itself — and `docs/process/security-intake.md` exists precisely to route this. The tamper-boundary clause states Summon's honest property is hardening against "drift and forgetting," not an adversarial coordinator; a third-party `Stop` hook is code Summon's users will believe Summon vetted. "Dani routes" describes the prose layer while the actual conflict is two hook systems and two quality floors firing on the same events in the same repo.

**Wrong if:** the ADR requires impeccable's hooks to be disabled or namespaced on install, *and* Pierrot runs the threat-model pass as a precondition per `security-intake.md`, *and* the ADR names which floor wins when impeccable's quality floor and Summon's Done Gate disagree. Absent all three, the seam is a slogan.

### C3 — "Copying the `BAN:` list is a prose shadow of deterministic rules, banned by ADR-0012 §B" — BLOCKING

**Claim under attack:** the justification for the one rejection that shapes the whole design ADR.
**Technique:** citation check + inversion.

§B says no such thing. Its policy amendment reads: *"a deterministically-checkable rule left in prose **after its layer is available** is a defect."* The portability clause says the opposite of the rejection: methodology canon prose is "the floor everywhere: on any install lacking a primitive, the methodology remains runnable by prose discipline exactly as today." The add-on defaults to **no**. So on the modal install the detector layer is *not available*, prose is the sanctioned floor, and rejecting the `BAN:` list leaves the default user with no design floor at all — while the ADR simultaneously calls impeccable optional. You cannot cite §B to delete the fallback and cite portability to call the dependency optional.

**Wrong if:** Archie shows the detector layer is available on every install (it is not — default no, and Copilot has no Claude skill), or reframes the rejection on honest grounds ("we don't want to maintain a taste list"; "provenance is muddy — design-notes' own header credits impeccable and taste-skill") rather than on a §B citation that does not say it.

**Coordinator note:** verified. `docs/adrs/meta/0012-executable-canon.md:44` and `:62` read as Wei quotes them. The §B justification was the coordinator's framing in the scoping message, not Archie's — it was misapplied, and the correction is owed to the human.

### C4 — "The Done Gate gains a visual-proof (screenshot) item" — AMENDMENT DEMANDED

**Claim under attack:** that this is a new item.
**Technique:** citation check.

It already exists. `docs/process/done-gate.md` item **8b** (added `vik@2026-06-15`): *"Visual verification (inferential — screenshot evidence) … open the affected page(s) in a browser (via Playwright `browser_navigate` + `browser_take_screenshot`) … Screenshot evidence is sufficient. Not applicable to CLIs, libraries, or backend-only services."* An ADR that "adds" an item already in canon will produce a duplicate or a silent wording conflict. The real question is narrower: does 8b need *strengthening* (bound to tree state, listing what a screenshot must show), and does design authority change its grade?

**Wrong if:** nothing — the item is there. The amendment is mandatory: reframe as "amend item 8b" or drop the leg.

**Coordinator note:** verified at `docs/process/done-gate.md:33`. Wei is correct; this was a scoping error.

### C5 — Screenshot as "proof" contradicts ADR-0012's own receipt rule — AMENDMENT DEMANDED

**Claim under attack:** that visual evidence can be elevated to a proof grade above inferential.
**Technique:** citation check + cost of being wrong.

ADR-0012 defers the receipt schema and holds one interim rule: a check "re-executes the check itself (or verifies a fresh artifact it can bind to current state) rather than trusting a worker-reported result — a format-valid sentinel is still self-authored evidence." A screenshot the agent takes, looks at, and declares fine is textbook self-authored evidence with no binding to tree state; the file can be three commits old and nothing detects it. Calling it "visual proof" is the overclaim the tamper-boundary clause forbids. The deterministic version of this concern is a rendering/console-error check plus an axe run — a script, available today.

**Wrong if:** the ADR sequences after the receipt schema lands, or keeps the item at `inferential`, drops the word "proof," and names what invalidates the screenshot.

### C6 — The two asks don't cohere; they arrived in one sentence — AMENDMENT DEMANDED

**Claim under attack:** that these belong in a coupled ADR pair.
**Technique:** inversion.

The design-authority protocol has zero technical dependency on impeccable, and the add-on machinery has zero dependency on design — its first instance merely happens to be a design skill. Coupling holds the low-risk, reversible, docs-only change hostage to the high-risk, security-gated, supply-chain-exposed one, and lets the risky half borrow legitimacy from the safe half. Split them: the design ADR can be Accepted this week; the add-on ADR should stay Proposed and gated on Pierrot.

**Wrong if:** Archie shows the design protocol is *unimplementable* without an external catalog — which would itself argue Summon is designing for one user (C7).

### C7 — "Configured external catalog" is a feature with exactly one possible user — AMENDMENT DEMANDED

**Claim under attack:** that the three-branch resolution order earns its ceremony.
**Technique:** inversion + scale attack.

Branch 1 (project `DESIGN.md`) is the useful one. Branch 2 points at design-notes — a *personal* catalog whose own `/design-consult` Notes admit it "lives ONLY in design-notes; sibling repos reach it by opening a session here." No `npx summon-team` user has that repo, so branch 2 ships for an audience of one: the author. Branch 3 is "neither," where Dani behaves exactly as today — and for a solo dev starting a new project, branch 3 is the modal case. That is a protocol, a scaffold stub, and a gate item to route a lookup that usually lands on "do what you already did." Also unspecified: *where* the catalog is configured (ADR-0006 manifest? ADR-0012 §E registry?), and §E requires every advertised capability to carry a registry entry with status and enforcement level.

**Wrong if:** the ADR names the config surface, adds the §E registry entry, and either drops branch 2 or defines a catalog *format* other repos could produce. If branch 2 survives as "point at my personal repo," say so on the record as a meta-only convenience.

### C8 — `summon-team add <thing>` is a plugin architecture built for n=1 — AMENDMENT DEMANDED

**Claim under attack:** that a generic `add` verb is the right first shape.
**Technique:** cost of being wrong + historical precedent.

`packages/summon-team/src/index.ts` has zero optional-component machinery today, so this defines the extension point for every future add-on — a public CLI surface, semver-visible, effectively permanent. Summon's own precedent cuts against it: ADR-0006 established "earn the generator before building it," ADR-0012 §C earn-gated the workflow layer on *one* ceremony surviving real sessions, and Done Gate item 16 (YAGNI) asks "did we build more than was asked?" Three entry points (prompt + `--with` + `add`) for one add-on, in the PR that introduces the concept, is three surfaces to support forever on evidence of one. Ship `--with impeccable` alone, or the README sentence, and earn `add`.

**Wrong if:** a second concrete add-on is already committed to a sprint. One hypothetical add-on is not two.

### C9 — The highest-value design work here needs no third party — ARGUMENT ONLY

**Claim under attack:** that Dani's gap is *authority*.
**Technique:** inversion.

`dani.md` carries a prose WCAG checklist — 4.5:1 contrast, `prefers-reduced-motion`, focus order, bundle budgets — and not one sensor. Under §B's ratified policy amendment, contrast ratios and reduced-motion are deterministically checkable and the Script layer *is* available today, which makes leaving them in prose a defect by Summon's own ratified policy, now, with no observed failure required. Done Gate item 8 even names "deterministic aids: axe/Lighthouse" and nobody built them. An axe/Lighthouse script is smaller than this whole proposal, ships on every runtime and plan tier (§B's tie-breaker prefers exactly this), carries no supply-chain exposure, and would raise item 8 from `inferential` toward `deterministic`. Dani's problem is not that she lacks a catalog; it is that her existing rules cannot fail a build.

**Wrong if:** nothing here blocks the proposal — but if the answer to "why not this instead?" is "it's less interesting," that is the groupthink Wei exists to catch.

---

## What Wei is NOT challenging

- **That design is a real gap in Summon.** Dani is thin relative to Vik/Tara/Pierrot, and a project-level `DESIGN.md` as first-resolution authority is straightforwardly right.
- **Not vendoring impeccable.** Delegating rather than copying 147 files is correct; the objection is to *how* the delegation is pinned (C1), not to delegation.
- **Default-no on the prompt.** Opt-in for a 3.3 MB third-party payload with hooks is the only defensible setting.
- **Rejecting a wholesale copy of design-notes' distilled principles.** Copying a personal catalog into shipped canon is a maintenance and provenance liability — design-notes' own `BAN:` header credits impeccable and taste-skill, so Summon would be laundering third-party expression through a sibling repo. The rejection is right; only its §B justification is wrong (C3).
- **Persona-based routing as the mechanism.** If design authority exists, Dani is the right owner. The problem is "routes" being asked to carry a hooks-and-quality-floor conflict (C2).

---

## Round 2 — Archie's Responses

Archie authored both ADRs **with Wei's Round 1 in hand** (the Round 1 parallel invocation produced no artifact from Archie — see the failure note below), so authoring and response collapsed into one pass. Point-by-point dispositions live in the ADRs themselves rather than being duplicated here:

- **ADR-0013 § Responses to the Architecture Gate** — C2 (vocabulary half), C3, C4, C5, C6, C7, C9.
- **ADR-0014 § Answers to the review** — C1, C2, C8, plus Pierrot's six conditions.

Summary of dispositions:

| # | Verdict | Design changed? |
|---|---|---|
| C1 | **Conceded in full — "it cannot."** ADR-0010 recorded as *inapplicable*, not bypassed. Wei's "wrong if" clause was **not** satisfied: impeccable exposes no `--skill-version`, no lockfile, no integrity hash. Recorded as human-ratified **exception #1** with a counting mechanism. | Yes |
| C2 | **Conceded; the hook half removed rather than mitigated.** Summon installs with `--no-hooks` and plants zero hooks. All three of Wei's "wrong if" requirements met. | Yes — largest single change |
| C3 | **§B citation withdrawn as wrong.** Rejection of the `BAN:` list re-justified on provenance, maintenance and scope. Wei's third path taken with a twist: the default user's floor becomes a **sensor** (`design-floor-check`), not prose. | Yes |
| C4 | **Conceded outright.** Verified at `done-gate.md:33`. Reframed as an amendment to 8b with verbatim replacement wording. | Yes |
| C5 | **Conceded.** Grade stays `inferential`; "proof" appears nowhere; amended text states outright that a screenshot is not proof. Invalidators named. | Yes |
| C6 | **Conceded and executed.** ADR-0013 declares zero hard dependency on ADR-0014, in both directions. | Yes (structural) |
| C7 | **Branch 2 dropped**, not shrunk. No config surface at all. The profile stub *is* the portable catalog format. §E registry rows named with the honest caveat that the registry is unbuilt. | Yes (materially) |
| C8 | **Accepted, and taken further than demanded.** Only the interactive prompt ships; `--with` and `add` both deferred. Wei proposed shipping `--with` — the human narrowed harder. | Yes |
| C9 | **Accepted as sequencing, not rejected as an alternative.** `design-floor-check` ships **first**; the protocol second. The pre-existing §B defect named as pre-existing rather than absorbed into scope. | Yes |

**Seven of nine challenges changed the design; two of three blocking challenges were conceded in full and the third (C3) had its cited justification withdrawn.**

## Round 3 — Wei's Rebuttal

**Not held.** The gate calls Round 3 conditional — *"if needed… on inadequately addressed points."* No challenge was deflected: every blocking challenge was conceded, and each amendment-demanded challenge produced a design change or an explicit on-the-record concession. Re-running Wei against its own accepted arguments would be ceremony. **The human may still call Round 3** at ratification; if any disposition above reads as a deflection rather than a concession, that is the trigger.

## Resolution

**Both ADRs ratified by the human on 2026-08-05, as written.** ADR-0013 → Accepted. ADR-0014 → Accepted, merge still gated on Pierrot's C5.

Two positions were ratified with their costs stated rather than glossed: ADR-0013 § 5 rule 4 ("Summon ships no taste") and its closed-door consequence, and ADR-0014 § 7's recorded exception #1 to ADR-0010 — accepted with a Critical security finding in hand, on the explicit basis that a counted exception is more defensible than a manufactured distinction.

The missing-meta-zone question is **filed as its own decision** rather than settled inside an add-on PR, per Archie's objection to deciding it by side effect. C5 is unblocked narrowly: the two threat surfaces are recorded in ADR-0014 § 11 by Pierrot.

| Gate item | State |
|---|---|
| ADR written (Archie) | ✅ `docs/adrs/0013-design-authority.md` (canon, 281 lines), `docs/adrs/meta/0014-optional-addons.md` (meta, 407 lines) |
| Wei invoked as a standalone agent, ≥2 techniques | ✅ 9 challenges; six techniques named (citation check, historical precedent, inversion, cost of being wrong, assumption surfacing, alternative technology) |
| Multi-round debate executed | ✅ Round 1 + Round 2; Round 3 conditionally waived, see above |
| Debate tracked | ✅ this file |
| ADR updated from the debate | ✅ seven of nine challenges changed the design |
| **Human approved** | ✅ 2026-08-05 — both ratified as written |

Pierrot's security review (`2026-08-05-addon-trust-surface.md`) returned **proceed-with-conditions**: 7 findings, 1 Critical, veto explicitly declined. Condition **C5 (threat-model update) is a prerequisite to merge** and is **not yet satisfied** — it is blocked on an unresolved zone question (Summon has no meta home for a living security register; only `docs/history/` for the past and `docs/adrs/meta/` for decisions). That is ADR-0014's § Zone classification `UNRESOLVED`, and it is Pierrot's and the human's to settle, not an add-on ADR's to decide by side effect.

### Process failures observed during this gate

Recorded because the gate's own machinery failed, not only its subject matter:

1. **Wei cannot write the artifact the gate mandates.** `wei.md` is read-only by design; `team-governance.md` requires a debate file. Round 1 was lost entirely to this before being re-run with a message-based deliverable. Filed as **#73**.
2. **Three of four first-attempt agent runs produced zero files.** Wei, Pierrot and Archie each exhausted their `maxTurns` (15/20/25) on required reading and returned a plausible-looking opening line with a clean tree behind it. Every one was caught by `git status` rather than by reading the returned message — which is the "Treat Agent Output as Untrusted" rule doing exactly its job, against a failure mode subtler than the one it describes: not a truncated report claiming success, but a truncated report claiming *nothing*, which reads as progress. The fix that worked on every re-run: write the artifact on turn 1 and refine it, and hand the agent pre-digested verified facts instead of a reading list.
3. **The gate's debate-artifact path is stale** — it says `docs/tracking/`, ADR-0007 puts these in `docs/history/tracking/`. Known since ADR-0012 (Archie M2), still unfixed. Folded into #73.
