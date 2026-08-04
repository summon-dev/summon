<!-- agent-notes: { ctx: "Security review of ADR-0014 impeccable add-on delegation", deps: [docs/adrs/0010-dependency-release-age-cooldown.md, docs/attributions.md, docs/adrs/0011-dependency-supply-chain-scan.md, docs/security/threat-model.md, docs/sbom/dependency-decisions.md], state: draft, last: "pierrot@2026-08-05", key: ["CLI pin does not pin the skill payload", "hook is local-only and correctly fails open", "verdict: proceed-with-conditions"] } -->

# ADR-0014 Trust-Surface Analysis — `summon-team` installing `impeccable`

**Reviewer:** Pen-testing Pierrot (security + compliance)
**Date:** 2026-08-05
**Scope:** The proposal that `npx summon-team <name>` offer to run `npx impeccable@<pinned> install` — interactive prompt (default no), `--with impeccable`, `summon-team add impeccable`.
**Method:** Read the vendored copy at `/home/noodle/dev/claude-apps/design-notes/.claude/skills/impeccable/` and the npm tarball extracted via `npm pack impeccable@3.5.0` (extracted and read; **the installer was never run and no impeccable script was executed**).

**Findings:** 7 (1 Critical, 2 Important, 3 Minor, 1 Pass)
**Verdict:** **proceed-with-conditions** — six conditions, [below](#verdict).

---

## Q1 — The pinning gap (ADR-0010)

### F1 — CRITICAL: pinning the CLI does not pin the payload. ADR-0010's guarantee does not hold on this install path.

**What I verified.** `npm pack --dry-run impeccable@3.5.0` reports **30 files, 1.1 MB unpacked**, and every one of them is under `cli/`. The tarball contains no `SKILL.md`, no `reference/`, and no `scripts/` — none of the 147 files / 3.3 MB that actually land in `.claude/skills/impeccable/`. The npm package is a downloader, not the payload.

The payload is fetched at run time. In `cli/bin/commands/skills.mjs`:

- line 23 — `const API_BASE = 'https://impeccable.style';`
- line 565 — `await downloadFile(\`${API_BASE}/api/download/bundle/universal\`, tmpZip);`
- line 2037 (comment, in the `update` path) — `// Download the latest skills directly from impeccable.style.`

**The URL carries no version and no digest.** It is a bare "give me the current universal bundle" endpoint. The zip is unpacked with `unzipSync` (fflate) and its entries are written to disk by `extractZip` (skills.mjs:540–553).

**The ruling: ADR-0010's guarantee does not hold here.** ADR-0010 §2 scopes the cooldown to "the versions the change deliberately chooses," and its whole mechanism is *choose a version, check that version's publish age, pin it*. `npx impeccable@3.5.0` satisfies that for the 30-file downloader and for nothing else. The 147 executable `.mjs` files that get written into the user's `.claude/` and then invoked automatically by two hooks are resolved as *whatever the vendor's web server is serving at that instant*. There is no version to age-check, because the request does not name one.

**Why Critical, specifically.** This is not "an unpinned dependency" in the ordinary sense. Three things stack:

1. **The payload executes automatically, unprompted, on a hair trigger.** Install wires a `PostToolUse` hook (matcher `Edit|Write|MultiEdit`) and a `Stop` hook, both running `scripts/hook.mjs`. Every file edit in every future session invokes downloaded code.
2. **npm's protections stop at the tarball.** `dist.integrity` (`sha512-mpm428oMTESAX…`), publish-time transparency, 2FA, the ability to yank a bad version and have every resolver notice — all of that covers `impeccable-3.5.0.tgz` and covers *nothing it subsequently downloads*. A bundle served from a vendor's own host has no public version history, no attestation, and no yank semantics. If the bundle served at 14:00 differed from the one served at 13:00, nobody outside the vendor can tell.
3. **The compromise does not require compromising the vendor's npm account** — the far softer targets of the hosting account, DNS, or the CDN in front of `impeccable.style` all yield the same result: arbitrary code executing inside the working directory of every Summon user who said yes.

*Proof grade: verified* for the tarball contents, the URL, and the absence of a version parameter in it (commands run, lines read). *Inferential* for "no pin flag exists anywhere in the CLI" — I confirmed the download URL takes no version and that the `update` path documents itself as fetching latest, but I did not exhaustively audit all 87 kB of `skills.mjs` for an undocumented pin. If such a flag exists, it changes the remediation but not the default-path risk.

**Adjacent, lower severity:** `IMPECCABLE_BUNDLE_PATH` (skills.mjs:560) redirects the bundle source to an arbitrary local directory or zip, validated only for existence (`copyOrExtractLocalBundle`, skills.mjs:572–587). Any process that can set the environment for the install can substitute the entire payload. It requires pre-existing env control, so it is not an escalation on its own — but it means Summon's own installer must not pass through a caller-controlled environment without thought.

**What would restore the guarantee:** see [the ranked recommendation](#ranked-recommendation-integrity-verification). Short version: Summon must verify the payload it received against a digest Summon blessed, because the CLI's own pin cannot do it.

### F2 — IMPORTANT: the skill version is invisible to Summon's dependency tooling.

`SKILL.md:4` declares `version: 4.0.4`. That artifact has its own release cadence (upstream tags `cli-vX`, `skill-vX`, `ext-vX` independently) and it is the part that contains the executable surface. Summon's `docs/sbom/dependency-decisions.md` and ADR-0011's scan both reason about package-manager coordinates. Neither would ever see `skill-v4.0.4`, so a skill release with a regression or a compromise passes through Summon's entire supply-chain apparatus without leaving a trace in it. Any adoption must record the skill version explicitly and by hand.

---

## Q2 — Fail-open analysis of the hooks

### F3 — PASS. The hook fails open, deliberately, and the `git-guardrails` standard does not transfer to it.

**The hook does fail open, unambiguously.** `scripts/hook.mjs`:

- lines 15–16 — `Contract: never break a turn. Always exit 0.`
- lines 64–78 — a top-level `.catch()` that swallows any error, attempts an audit-log write inside its own `try`, and calls `process.exit(0)`.
- lines 31–39 — malformed stdin JSON is caught and falls through to `runHook` rather than erroring.
- line 61 — `process.exit(result.exitCode || 0)`.

**Applying the `docs/attributions.md:41` test honestly: it passes, and the standard does not apply.** `git-guardrails-claude-code` was declined because *a guardrail* failed open: it advertised that it would block dangerous git operations, and on a machine without `jq` it silently permitted them. The stated reason for declining was precise — "a guardrail that silently permits what it claims to block is worse than none, because it produces belief in protection that isn't there."

impeccable's hook makes no such claim. It is `PostToolUse` and `Stop`, and its output channel is `hookSpecificOutput.additionalContext` (hook.mjs:8–13) — it appends advice to the model's context *after* the edit has already happened. It has no allow/deny decision to get wrong. When it fails, the user gets **no design advice**; they do not get **false assurance that a dangerous operation was blocked**. The failure mode is degraded advice, not phantom protection. For an advisory linter, exiting 0 on error is the correct engineering choice — the alternative is a design-linting bug that breaks the user's agent turn.

**The stronger reassurance, which I went looking for and did not find a problem with: the hook is local-only.** `scripts/hook-lib.mjs` is 2,153 lines / 86 kB and runs on every single file edit, so it is the highest-frequency third-party code in the whole proposal. Grepping it for `fetch(`, `http`/`https` URLs, `child_process`, `spawn`, `exec`/`execSync`, `net.`, and `WebSocket` returns **two hits, both non-executable**: a doc comment at line 6 and a documentation URL in a comment at line 1131. Its only filesystem writes are a cache (`:612`), a target file (`:646`), and an appended audit log (`:1502`).

So the code that reads your source files on every edit makes no network calls and spawns no subprocesses. That is the single most reassuring fact in this review, and it is why F1's remediation is worth building rather than the whole proposal being worth killing: the *shipped* payload is well-behaved. The risk is entirely about whether the payload you receive is the payload I read.

**Also clean:** `extractZip` (skills.mjs:540–553) explicitly guards zip-slip — it resolves each entry against the target root and throws `Refusing to extract entry outside target dir` for anything escaping it. The comment says they hand-rolled extraction specifically to get that guard. Good work; noted because it is evidence the author thinks about this class of problem.

### F4 — MINOR: residual costs and blind spots around the hooks.

- The `Stop` hook (30s timeout) runs the *full* detector rule set over every UI file touched in the session. A solo dev should be told their turn end can pause for up to half a minute.
- The hook wiring lives in `.claude/settings.local.json`, which is machine-local and untracked. It is therefore **invisible to code review and to git** — no reviewer, no CI check, and no teammate can see that two hooks were installed. Trust decisions that leave no trace in version control are trust decisions nobody can audit later.
- Nothing re-triggers review after `impeccable update` replaces the payload.

---

## Q3 — Consistency ruling vs. the declined skills

### F5 — IMPORTANT: as proposed, this is **not consistent** with the posture in `docs/attributions.md`.

`docs/attributions.md:42` declined `setup-pre-commit` for this reason:

> instructs `husky lint-staged prettier` with no versions plus `npx husky init`, which would resolve to whatever is latest at run time. Summon's release-age cooldown (ADR-0010) and dependency scan (ADR-0011) forbid that for our own installs

That is F1, restated. Summon declined a third-party skill because it resolved code at run time to whatever was latest — then would ship a first-party installer that resolves 147 files of executable code at run time to whatever is latest. Pinning `impeccable@3.5.0` does not distinguish the two cases. It relocates the unpinned fetch one level down, from the package manager (where it is visible to every tool Summon owns) to a vendor HTTP endpoint (where it is visible to nothing).

I considered the differences a defender would reach for, and they do not close the gap:

| Proposed difference | Does it help? |
|---|---|
| impeccable is a real, maintained product with a named author, a homepage, Apache-2.0 | Addresses **reputation**, not **integrity**. F1 is not a claim that the author is untrustworthy; it is that the delivery channel has no verification, so the author's trustworthiness is not the thing being relied on. |
| Install is opt-in, prompt defaults to no | Real and necessary — it makes the exposure consented rather than silent. It does not make the consented payload verifiable. Consent to "install impeccable" is not consent to "execute whatever `impeccable.style` serves, forever." |
| The three declined skills were low-quality; this one is not | The declines were not quality judgements. `wizard` was declined while explicitly noting it "does several things right" (attributions.md:43). The bar was *surface Summon should design deliberately rather than inherit* — which describes this case exactly. |

There is also an asymmetry that runs the wrong way. `docs/attributions.md:39` notes that upstream ships none of the three declined skills in its own plugin manifest, "so declining them agrees with the author's own judgement rather than contradicting it." No such alignment argument is available here: pbakaus ships impeccable as the product. Declining or conditioning it is Summon's judgement alone, and so it needs its own stated reasoning rather than borrowing upstream's.

**Ruling.** Recommending and auto-installing impeccable *as proposed* would make ADR-0010 and the declined-skills section decorative — rules Summon applies to other people's installers and waives for its own. That is precisely the "override erosion" failure ADR-0010:64 names as the thing that decays the rule to theatre.

**I am not exercising the veto**, and I want to be explicit about why rather than leaving it implicit. A veto is for an active vulnerability or a compliance violation. What I found is a structural gap in a delivery channel, in front of a payload I read and found well-behaved (F3): no network calls, no subprocess spawns, zip-slip guarded, permissive license. Vetoing a good product over a fixable channel problem would be crying wolf, and it would spend the veto's credibility exactly where it is least deserved. The gap is real and it is disqualifying *as proposed* — so it becomes conditions, and the conditions are not optional.

---

## Q4 — Disclosure requirements

### F6 — IMPORTANT: consent given once silently extends to every future update, and the prompt must say so.

Write the prompt for the person who presses Enter without reading — which is most people, most of the time. That means the *default* must be safe (it is: default no) and the *text* must lead with consequence, not with feature description. Four facts, in this order:

1. **This downloads and runs third-party code.** Not "adds a design skill." Summon's installer runs no third-party code today; this is the change. Name the vendor and the license: `impeccable` by pbakaus, Apache-2.0, `impeccable.style`.
2. **It installs 147 files (3.3 MB), most of them executable scripts, into `.claude/skills/impeccable/`.**
3. **It wires two hooks that run automatically** — one on every file edit, one at the end of every turn — in `.claude/settings.local.json`, which is untracked, so the wiring will not show up in git or in code review. Say what the hooks do (analyse the file you just edited for design problems and add notes to the conversation) and that they run locally with no network access.
4. **Updates re-download the latest payload from `impeccable.style`, not from npm.** This is the one a careful reader most needs and would never guess. Saying yes once is, in practice, standing consent for every future bundle that endpoint serves. If Summon implements the digest gate (C1), say instead: *Summon verifies the installed files against a known checksum and will warn you if they differ.*

Plus a one-line escape hatch: how to remove it (`--with impeccable` is opt-in; deleting the skill directory and the two `settings.local.json` entries reverses it).

Non-interactive and CI runs must never install it. A default-no prompt that becomes default-yes when nobody is watching is not a default-no prompt.

---

## Addenda

### F7 — MINOR / compliance: Apache-2.0 when delegating vs. vendoring.

**Delegating (the proposal):** Summon distributes none of impeccable's code. Apache-2.0 §4's conditions — carry the license, include NOTICE, mark modified files, retain attribution notices — attach to *distribution of the Work or Derivative Works*, and Summon does neither. The user receives the code directly from npm and from `impeccable.style`, and the §3 patent grant and §7/§8 disclaimers run to them from the licensor. **No license obligation falls on Summon.** Recommending software is not distributing it.

**If Summon ever vendors** (option 2 below): §4 attaches in full — the license text and any upstream NOTICE ship with the 3.3 MB payload, and any Summon modifications must be marked as changed. Cheap, but it is a real obligation and it must be done at the moment of vendoring, not later.

**Does `docs/attributions.md` need an entry for a merely-recommended dependency? Yes** — and not because the license requires it, since it does not. Because that file's demonstrated purpose is broader than its license function: it already records three skills Summon *declined*, whose code Summon by definition does not carry. It is a register of third-party material Summon has *considered and ruled on*. A dependency Summon recommends and auto-installs is a far stronger relationship than one it declined, so omitting it while listing the declines would be backwards. The entry also gives the declined-three section the counterpart it currently lacks: here is one we accepted, on these conditions, and here is what made it different. State plainly in the entry that Summon distributes no impeccable code and therefore carries no Apache-2.0 §4 obligation — that sentence is what stops a future reader from over-reading the entry as a distribution claim.

### Ranked recommendation: integrity verification

Not a menu. Do **option 1**.

**1. CHOSEN — Summon verifies the installed tree against a digest Summon blessed.** Record in `docs/sbom/dependency-decisions.md` both the CLI version (`3.5.0`) and a rolled-up sha256 over the extracted `.claude/skills/impeccable/` tree for a known skill version (`4.0.4`). `summon-team add impeccable` runs the install, hashes the resulting tree, and compares. On mismatch: loud, specific warning; do not wire the hooks; tell the user exactly what to do.

Why this one. It is the only option that is both in Summon's control and proportionate to a 3.3 MB third-party payload. The technique is already proven against this exact payload — the CLI itself does the same thing for drift detection (`hashSkillFile`, skills.mjs:604–608, sha256 over normalised content), so the normalisation pitfalls are already solved upstream and readable. And crucially, **verify-then-wire is a real gate rather than after-the-fact theatre**: the install *writes* files without executing them, and execution only begins at the next hook invocation. Blocking the hook wiring blocks execution. Re-blessing a digest per skill release is manual work, and that is the point — it is exactly the human-in-the-loop friction ADR-0010:35 requires for adopting a new version, applied to the artifact that ADR-0010 currently cannot see.

*Open engineering question, flagged rather than assumed:* the CLI writes the settings entry itself, so "do not wire the hooks" requires either installing in a mode that skips hook wiring or reverting the settings write on mismatch. `getHookConsent` / `setHookConsent` are imported at skills.mjs:20 from `../../lib/impeccable-config.mjs`, which suggests hook consent is a config value Summon could pre-set to decline — promising, but **UNRESOLVED**: I did not trace it, and this should be settled before the ADR is accepted. If it turns out to be impossible without patching upstream, option 1 degrades to "warn loudly and instruct the user to remove," which is materially weaker and should be documented as such rather than quietly accepted.

**2. Vendor a pinned copy into Summon.** Strongest integrity available — the payload lands in git, reviewable, diffable, bisectable, and the unpinned network fetch disappears entirely. Not chosen because it makes Summon the maintainer and redistributor of 147 files of someone else's executable code, forks the update path away from upstream, triggers Apache-2.0 §4 in full (F7), and would need an ADR-0007 canon/meta ruling on whether third-party skill code is something Summon ships. Revisit if option 1's hook-gating proves impossible.

**3. Ask upstream for a versioned, digest-addressed bundle.** `/api/download/bundle/universal?version=4.0.4` with a published sha256 — or better, publish the bundle to npm as its own package so registry protections, provenance, and yank semantics cover it. This is the correct long-term fix and a reasonable, friendly ask. It is not in Summon's control, so it must not gate this work: file it upstream, ship option 1 regardless, drop option 1 if and when option 3 lands.

**4. Consent-only — prompt clearly, verify nothing.** Rejected. It is what the proposal already is, and it is what `docs/attributions.md:42` declined once already (F5).

---

## Verdict

**PROCEED-WITH-CONDITIONS.** All six are prerequisites to merge, not follow-ups.

- **C1 — Payload integrity gate.** Implement option 1: bless a digest, verify the installed tree, refuse to wire the hooks on mismatch. If the hook-wiring block proves impossible without patching upstream, the degraded form (warn loudly, instruct removal) is acceptable *only* if the ADR records that it is a downgrade and why. Resolve the `setHookConsent` question first.
- **C2 — Consent prompt discloses the four facts in Q4**, in that order, led by "this downloads and runs third-party code," and including the update-channel fact (F6).
- **C3 — `docs/sbom/dependency-decisions.md` entry** recording CLI version `3.5.0`, skill version `4.0.4`, Apache-2.0, the unpinned-fetch risk, and the blessed digest. This is where ADR-0010's log lives and it is what makes F1/F2 visible to future sessions instead of dying in this document.
- **C4 — `docs/attributions.md` entry** alongside the three declines, stating that Summon distributes no impeccable code and carries no Apache-2.0 §4 obligation (F7).
- **C5 — `docs/security/threat-model.md` updated** with the two new surfaces: third-party code execution in the scaffolder, and the always-on `PostToolUse`/`Stop` hook as a standing local execution point. This is a genuine change to the attack surface and the threat model must not lag it. I own this and will write it once C1's shape is settled.
- **C6 — Default stays no.** `--with impeccable` remains explicit opt-in; non-interactive and CI runs never install it.

Meet those six and the inconsistency in F5 dissolves — Summon would be doing to impeccable exactly what it faulted `setup-pre-commit` for not doing, which is the only honest way to adopt it. Ship it without them and ADR-0010 becomes a rule Summon enforces on strangers.
