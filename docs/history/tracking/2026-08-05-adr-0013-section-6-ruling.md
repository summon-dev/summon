---
agent-notes: { ctx: "Ruling: ADR-0013 §6 sequencing falsified — amend in place, reorder, correct two cost claims", deps: [docs/adrs/0013-design-authority.md, docs/history/tracking/2026-08-05-design-floor-check-design-pass.md, docs/adrs/meta/0012-executable-canon.md, docs/adrs/template.md], state: active, last: "archie@2026-08-05" }
---

# Ruling: ADR-0013 §6 sequencing

> **Disposition — do not apply this ruling as written.** Adopted: the *amendment-in-place instrument* (ADR-0012 § B's inline named-amendment form), correcting `:258` rather than excusing it, `:194` surviving verbatim, and slice B not inheriting the script-over-hook justification. **Not adopted: the reorder.** This ruling's reorder rests at lines 118 and 128 on the colour-role prerequisite — pre-digested "fact 9" in its own briefing, which was the coordinator's unverified inference rather than a verified fact. Wei's W5 dismantled it (contrast pairs are derivable from CSS declaration sites; reduced-motion needs no profile), and W1 established that § 6 orders by value at `:185`, not by size. What was actually applied to ADR-0013 is recorded in § 6 of `2026-08-05-design-floor-check-design-pass.md`.

## Verdict

**Amendment in place** — reorder § 6's list, and record the falsification as a dated amendment block inside § 6. Not a superseding note; not "no change"; no new ADR; **Status stays `Accepted`**.

Three things follow from that verdict:

1. § 6's numbered list is **rewritten**, not annotated (see § "Whether to rewrite" below).
2. Positive consequence 6 (`:258`, "Zero new supply-chain exposure") **is corrected**, not left as sloppiness.
3. Negative consequence 3 (`:265`) is updated to record that its own falsification clause **fired** and where.

The *Decision* of ADR-0013 — design authority as citation discipline, no config surface, Summon ships no taste — is untouched and was not reopened.

## Reasoning

### Why not a superseding note

In this repo's ADR vocabulary, "superseding" is a whole-ADR status transition: `docs/adrs/template.md:9` offers exactly `Proposed | Accepted | Deprecated | Superseded by [ADR-NNNN]`. There is no such thing as superseding one section. Invoking that machinery would mean writing ADR-0015 to replace ADR-0013, which is wildly disproportionate: nothing in the Decision changed. What changed is a **factual cost estimate** and an **ordering derived from it**.

### Why not "no change"

Because canon is read by agents that follow numbered lists. If step 1 keeps reading `design-floor-check` first with a correction three sections below, an implementer skimming § 6 does the wrong thing — and "leaving § 6 reading as ratified guidance while implementation follows a different order" is precisely the drift `scripts/check-canon.mjs` exists to prevent. A ratified doc must be correct **at the point of reading**, not correct in a footnote.

### Why an amendment is the proportionate instrument, and why it needs no new gate

ADR-0013 **pre-authorized this revision**. `:265` states that if the design pass finds the script expensive, "§ 6's sequencing claim ... is falsified and the ordering should be revisited rather than forced." The pass ran and the clause fired. Applying it is **executing a ratified instruction**, not overturning a ratified decision — so no Architecture Gate is owed. That is the strongest available argument for keeping this cheap, and it is the ADR's own.

### Precedent in this repo

There is no `## Amendment` / `## Revision` heading anywhere in `docs/adrs/`. The precedent that does exist is ADR-0012 § B (`docs/adrs/meta/0012-executable-canon.md:44`), which amends *ratified* policy inline: **"Policy amendment (named explicitly, per Archie): ... is hereby amended ... This is a deliberate change to ratified policy, on the record here, and its cost ... is priced in Consequences."** Bolded, named, scoped, cost priced in the same document. ADR-0012's Status block follows the same habit (a bolded `**Gate record.**` paragraph rather than a separate file). **The text below copies that pattern deliberately** — same repo, same instrument, one less invention.

### On the §258 vs §189 contradiction: correct it, don't excuse it

The §189 concession does **not** make §258 merely sloppy. Two reasons. First, `:258` sits in **Consequences**, which is the section a future reader cites when deciding whether a dependency is in-budget — an unqualified "no third party is required by anything here" is exactly the sentence someone quotes back in six months to wave a `playwright` devDependency through. Second, under the corrected ordering the claim becomes *true for steps 1–3 and false only for the deferred slice*, so the fix is a one-clause qualification rather than a retraction. Cheap, and it removes a self-contradiction from ratified canon. Correct it.

### On §189 itself

`:189` is not just optimistic, its **premise** is wrong: "the headless browser Playwright already implies for 8b" describes a project dependency that 8b does not create. `done-gate.md:33` names MCP tool calls in the agent's environment; `packages/summon-team/src/index.ts:39` excludes `.playwright-mcp` as a gitignored artifact directory. It also mislabels the class — `axe-core` and `playwright` would be **devDependencies**, and the browser binaries are neither, being outside any lockfile. All of that is inside the block being rewritten, so it is fixed by construction.

### Whether to rewrite § 6's internal order (fact 9): yes, rewrite

Annotation is insufficient here because the order is wrong **twice over**, and the second inversion is a hard dependency, not a preference:

- Slice A's arithmetic contrast check needs foreground/background **pairings**, which do not exist in CSS custom properties.
- The only place that information is recorded is § 3's stub, under `## Colour tokens and roles` (`:121`).
- So step 3 (docs-only, zero cost) **gates** the cheapest useful part of step 1.

A note saying "consider doing 3 before 1" would leave a list whose stated order is impossible to execute. Rewrite it. The list also gains a genuine seam: **slice A / slice B split at the dependency boundary**, which is what makes the reorder a design improvement rather than a retreat — and it lets ADR-0012 § B's script-over-hook tie-breaker keep its justification for slice A while forcing slice B to re-argue its form.

One pleasant consequence: `:194` ("If the implementation PR can only carry part of this, it carries 1 and 2") survives **verbatim** and becomes *more* accurate — under the new numbering, 1 and 2 are the two zero-cost prose items. Do not touch that line.

## Text to apply

Target file: `/home/noodle/dev/claude-apps/summon/docs/adrs/0013-design-authority.md`

**APPLY BOTTOM-UP, IN THIS ORDER — C, then B, then A.** Edit A changes the line count above lines 258 and 265, so applying A first invalidates the other two line numbers. Applying C → B → A keeps every number below valid.

---

### Edit C — replace line **265** (single line, the whole Negative bullet)

Old (verbatim, one line):

```
- **`design-floor-check` is unwritten and unestimated here.** "axe plus a headless browser" is a sentence, not a design: page discovery (which routes? which states?), the fixture problem for component libraries with no server, and the false-positive rate on a real app are all unaddressed. **UNRESOLVED** — it needs its own small design pass before implementation, and if that pass finds it expensive, § 6's sequencing claim ("smaller than everything else in this ADR") is falsified and the ordering should be revisited rather than forced.
```

New (verbatim, one line — the original text is preserved intact and the outcome appended):

```
- **`design-floor-check` is unwritten and unestimated here.** "axe plus a headless browser" is a sentence, not a design: page discovery (which routes? which states?), the fixture problem for component libraries with no server, and the false-positive rate on a real app are all unaddressed. **UNRESOLVED** — it needs its own small design pass before implementation, and if that pass finds it expensive, § 6's sequencing claim ("smaller than everything else in this ADR") is falsified and the ordering should be revisited rather than forced. **Fired 2026-08-05.** The pass ran (`docs/history/tracking/2026-08-05-design-floor-check-design-pass.md`), found the script the largest item in this ADR rather than the smallest, and § 6 is amended accordingly. Slice A is now designed and genuinely cheap; slice B remains unwritten and carries three named open questions (the dependency, route/state discovery, advisory-versus-gating). The fixture problem for component libraries with no server should be recorded as a **documented non-goal** of slice B's first version rather than left implied — otherwise every component-library project reads item 8 as advertising something that does not work, which is the failure Positive consequence 2 exists to retire.
```

---

### Edit B — replace line **258** (single line, the 6th Positive bullet)

Old (verbatim, one line):

```
- Zero new supply-chain exposure. No third party is required by anything here.
```

New (verbatim, one line):

```
- Zero new supply-chain exposure **across everything § 6 sequences into the first implementation wave** — steps 1 through 3 are two prose changes and a stdlib-only script, and no third party is required by any of them. The unqualified version of this claim was wrong as ratified: it contradicted § 6's own concession of "one well-known audited library," and § 6's amendment of 2026-08-05 resolves the contradiction in favour of the concession. Slice B *does* carry exposure — `axe-core`, `playwright`, and out-of-lockfile browser binaries — and that exposure is the main reason it is deferred behind its own scoping rather than shipped here.
```

---

### Edit A — replace lines **187–194 inclusive** (from `Ratification order:` through the partial-PR sentence; do **not** touch line 196's `**Honest accounting:**` paragraph)

Old (verbatim, lines 187–194, blank lines included):

```
Ratification order:

1. **`design-floor-check` — a script.** axe (or equivalent) + computed contrast + `prefers-reduced-motion` honoured + console-error capture, run against a rendered page. No new runtime dependency beyond the headless browser Playwright already implies for 8b; no third-party skill; no supply-chain exposure beyond one well-known audited library, subject to ADR-0010's release-age cooldown and ADR-0011's scan like anything else. Smaller than everything else in this ADR.
2. **The 8b amendment** (§ 4) — prose, near-zero cost, ships alongside (1).
3. **The stub + Dani's protocol** (§§ 1, 3) — docs-only.
4. **Item 8's deterministic upgrade** (§ 4's second block) — after (1) is proven in real reviews.

If the implementation PR can only carry part of this, it carries 1 and 2.
```

New (verbatim — insert exactly this in place of the above):

```
Ratification order:

1. **The 8b amendment** (§ 4) — prose, zero cost, applied at `done-gate.md:33` with the verbatim replacement wording in § 4.
2. **The stub + Dani's protocol** (§§ 1, 3) — docs-only, zero cost, and a **prerequisite for (3)**: a static contrast check has to know which tokens pair as foreground against which as background, and § 3's `## Colour tokens and roles` heading is the only place that pairing is ever recorded. CSS custom properties do not carry it.
3. **`design-floor-check`, slice A — static, zero-dependency stdlib Node**, shipping like `scripts/check-canon.mjs`: `prefers-reduced-motion` coverage (if any stylesheet declares `animation` or `transition`, assert a `@media (prefers-reduced-motion: reduce)` block exists) plus declared token-pair contrast computed arithmetically from the profile's pairings. No browser, no install step, no manifest, no third party — it runs wherever `node` is on PATH, including the Python and Rust projects Summon scaffolds into.
4. **`design-floor-check`, slice B — the rendered-page pass** (axe DOM traversal, computed contrast, console-error capture): deferred behind its own scoping, which must carry the three decisions this ADR did not make — the **dependency** (`axe-core` and `playwright` as real devDependencies, plus a separate browser-binary install outside any lockfile), **route and state discovery**, and **advisory-versus-gating** on first release.
5. **Item 8's deterministic upgrade** (§ 4's second block) — after (3) is proven in real reviews. Slice B is not a precondition for it.

If the implementation PR can only carry part of this, it carries 1 and 2.

**Amendment, 2026-08-05 — the order above is a correction, and the order as ratified is on the record as falsified.** As ratified one day earlier, this section shipped `design-floor-check` first, claiming it carried "no new runtime dependency beyond the headless browser Playwright already implies for 8b" and was "smaller than everything else in this ADR." The design pass that Negative consequence 3 demanded ran on 2026-08-05 (`docs/history/tracking/2026-08-05-design-floor-check-design-pass.md`) and fired that consequence's falsification clause. Two findings force the change; neither touches this ADR's decision, only its sequencing and its cost estimate:

- **The dependency premise was false.** Done Gate 8b implies **no project dependency at all**. `done-gate.md:33` names Playwright's `browser_navigate` and `browser_take_screenshot` — MCP tool calls that execute in the *agent's* environment, not a library API — and `packages/summon-team/src/index.ts:39` confirms the repo's standing position by excluding `.playwright-mcp` from the scaffold as a gitignored artifact directory. A script the user runs cannot call MCP tools. So slice B needs `axe-core` and `playwright` as real devDependencies plus browser binaries: the **first dependency Summon would ever ship**, declared in a manifest the scaffold does not contain (`index.ts:47` excludes the root `package.json`), on projects that are frequently not Node at all, against a precedent where every shipped script imports nothing but `node:fs` and `node:path`. That makes slice B the largest item in this ADR, not the smallest.
- **Old step 3 was a prerequisite for old step 1, not a follow-on.** The colour-role stub feeds the contrast check; see (2) above. The dependency ran backwards inside the list as well as across it.

**A note on ADR-0012 § B's tie-breaker**, which this section invokes to justify a script over a hook: *"prefer the script — it runs on every runtime and plan tier."* That reasoning holds for slice A and **fails for slice B**, which requires `npm install` plus a browser download and therefore does not run on every runtime. Slice B does not inherit this section's justification for its form; it must re-argue it in its own scoping.

**What this amendment does not change.** Wei's C9 stands and remains accepted: a deterministically-checkable rule left in prose after its layer is available is a defect under ADR-0012 § B, `dani.md`'s contrast and reduced-motion rules are still that defect, and the fix is still a script that can fail a build. The sensor is **not** withdrawn, downgraded, or made optional — it is split at its dependency seam, and the half needing no dependency still ships in the first implementation wave alongside the two prose changes that turn out to gate it. What moved ahead of it are items § 6 had already priced as near-zero.
```

---

### Edit D — mechanical (not verbatim; the coordinator must locate it)

In ADR-0013's agent-notes frontmatter (line 2), set `last: "archie@2026-08-05"`. Add `docs/history/tracking/2026-08-05-design-floor-check-design-pass.md` to `deps` if it is not already present. **Do not** change `state` — it stays as-is (the ADR is still Accepted). **Do not** change the `## Status` block.

### After applying

Run `node scripts/check-canon.mjs` from the repo root. It is the only automated reader of canon and I did not verify what it asserts about ADR structure; a green run is the cheap confirmation that a 40-line block swap did not break a check.

## What must NOT change

1. **The Decision.** Design authority as citation discipline, no config surface, Summon ships no taste. Out of scope for this ruling and not reopened. § 5's four rules, § 1's D1/D2/D3 precedence, § 2's dropped branch 2, § 3's stub shape, § 7's attribution grading — all untouched.
2. **`## Status` stays `Accepted`.** No status transition, no `Superseded by`, no new ADR number. The amendment executes the ADR's own falsification clause; it does not overturn it.
3. **Line 194 verbatim**: *"If the implementation PR can only carry part of this, it carries 1 and 2."* It is reused unchanged in Edit A and is *more* accurate under the new numbering. Do not rewrite it to name items.
4. **Line 196's `**Honest accounting:**` paragraph.** Still true, still correctly names the prose-rules defect as pre-existing, and its § B tie-breaker sentence is qualified by the amendment rather than replaced. Leave it alone.
5. **Line 183–185** (the C9 acceptance) and the **C9 row in the gate-response table (`:231`)**. C9 is not weakened. Editing them would read as walking back an accepted challenge, which is not what happened.
6. **The four reversal triggers (`:278–281`).** Trigger 1 still says "keep § 6," which still holds. Trigger 2's false-positive metric now bears mainly on slice B, but the trigger text needs no edit and rewriting it would invite re-litigation of a gate outcome.
7. **`docs/process/done-gate.md`.** This ruling authorises no edit there. The 8b amendment is now sequencing step 1, but it ships as its own change with § 4's verbatim wording — not smuggled in with this annotation.
8. **No Architecture Gate is owed** for these edits, and none should be convened. Convening one would concede that the Decision is in play, which it is not.

## Open points

- **Discoverability from `## Status`** — `UNRESOLVED (coordinator's discretion).` ADR-0012's precedent puts bolded meta-notes (`**Gate record.**`) directly under `## Status`, which argues for a one-line pointer there: *"**Amended 2026-08-05** — § 6's sequencing is corrected in place; the Decision is unchanged. See § 6's amendment block."* I did not read ADR-0013's Status block, so I cannot supply a safe insertion line for it and will not guess one. § 6 is inside the Decision section and the amendment is bolded at its point of reading, so this is an improvement, not a fix. Apply it only if the coordinator can place it without disturbing the gate record.
- **Rescope of #75 to slice A, and refiling of slice B** — out of my scope; Pat's and Grace's call, as the design pass itself says. This ruling makes the ordering canon; it does not touch the board.
- **The dangling "registered" in `.claude/commands/sprint-boundary.md:212`** — `UNRESOLVED`, and deliberately out of scope. It is a pre-existing defect that slice B would inherit and make load-bearing, but it is independent of ADR-0013 and should not be fixed inside this amendment.
- **Slice A's own acceptance criteria** — `UNRESOLVED`. The amendment names *what* slice A checks; it does not specify the false-positive posture for the static checks, the stylesheet-discovery rule (glob? which extensions?), or whether it starts advisory. Those belong in #75's rescope, not in the ADR.
- **Whether slice B ever ships at all** — `UNRESOLVED` by design. The amendment defers it behind its own scoping and does not promise it. If the dependency turns out to be unacceptable, slice B may be replaced by an agent-side check that keeps using MCP tools, which is what 8b already does today. That option is not foreclosed and is not chosen here.
