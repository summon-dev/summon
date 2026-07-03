---
agent-notes: { ctx: "ADR: summon doctor on-demand vs cwd, canon-vs-health split, deferred --json envelope (internal shape decided)", deps: [CLAUDE.md, docs/process/ponytail-harness-review.md, scripts/check-canon.mjs, packages/summon-team/src/index.ts, packages/summon-team/package.json, docs/adrs/0003-project-risk-tiers.md, docs/adrs/0005-behavioral-benchmark.md, docs/tracking/2026-06-24-doctor-benchmark-gate-debate.md], state: active, last: "archie@2026-06-24" }
---

# ADR-0004: `summon doctor` — Home, Check-Registry Split, and the Deferred `--json` Envelope

## Status

Accepted (2026-06-24) — human-approved after the Architecture Gate (Archie/Wei debate, three rounds; Wei holds no block). Revised from the seven-agent direction review recorded in `docs/process/ponytail-harness-review.md` (Archie/Vik/Tara lenses). Implements the descoped form of GitHub issue #30. **Not yet implemented** — this ADR is the spec; the on-demand `summon-team doctor` invocation mode, the `health` registry, and the cheap canon checks are built in the implementation step that follows acceptance.

Debate record: docs/tracking/2026-06-24-doctor-benchmark-gate-debate.md

## Context

Issue #30 proposes growing `scripts/check-canon.mjs` (the CI canon drift-guard landed in commit `cd3b4dd`, modelled on ponytail's `check-rule-copies.js`) into a `summon doctor` deterministic health check, inspired by harness-engineering's `doctor`/`boot` readiness checks. As written, #30 makes three moves the review flagged:

1. **A broken portability premise.** #30 says doctor "ships to scaffolded projects (the CLI already copies `scripts/`)." It does not work today: `packages/summon-team/src/index.ts` lists `package.json` in `EXCLUDE_FILES` and `packages` in `EXCLUDE_DIRS`, so a scaffolded project receives `scripts/check-canon.mjs` but **no `pnpm doctor` script and no workspace** to run it. Worse, `check-canon`'s checks are hardcoded to *Summon's own* repo layout (`.claude/agents`, the persona roster, `done-gate.md`) — framework-introspection that a downstream app cannot satisfy and would fail CI on day one.

2. **A conflation of two concerns.** "Is the Summon *framework* internally consistent?" (canon drift, maintainers, this repo only) is a different question from "Is *this project's* Summon install wired up correctly?" (portable readiness). Subsuming the first into the second forces every scaffolded project to carry checks it can't pass.

3. **A public contract built ahead of demand.** The proposed `--json` status envelope (`status` ok/degraded/error + per-check results + `next_action`, "so agents can probe it") is an interface other software couples to. The only consumer in view (an agent gating on the result) needs a go/no-go bit the exit code already provides; nothing yet branches per-check. Archie: pin it in an ADR because it's a contract. Vik: don't build it at all yet — "a contract with one implementation and zero consumers" is a textbook YAGNI breach. Both are right about different things.

`check-canon` also already carries a `summon:` debt marker (`scripts/check-canon.mjs:82`) anticipating a status-flow-string check, and the existing `harvest-debt.mjs` already supports `--json` — so a `--json` *flag* is established convention; a *structured envelope schema* is not.

## Decision

Four decisions. The architecture is decided now; the structured envelope is deliberately deferred.

### 1. Home: doctor is a second invocation mode of the CLI, run on-demand against `cwd`

`summon-team` today is a one-shot scaffolder: a single `bin` with no subcommand router that downloads a template, deletes repo infrastructure (`package.json`, `packages/`), inits git, and exits — it is **never installed into or re-invoked from the scaffolded project**. Therefore doctor **cannot** "travel with" a persistent binary, because no persistent binary exists downstream (the original #30 premise, and an earlier draft of this Decision, both repeated that error one level up). Instead, `summon-team` grows a **second invocation mode dispatched on argv**: `npx summon-team@latest doctor` runs the `health` registry against the **current working directory**, downloading nothing and writing nothing. The existing scaffold path (`npx summon-team <project>`) is unchanged; `argv[2] === "doctor"` branches to the doctor entry point before any scaffolding logic. The doctor entry point imports **only** the `health` registry — `canon` is not in its import graph (see Decision #2). There is no committed `scripts/doctor.mjs`, no regenerated `package.json`, and no devDependency written into the scaffold — doctor is always pulled fresh from the current release, so it can never rot relative to canon. `scripts/check-canon.mjs` (the `canon` registry) **composes the same check modules** in this repo, but is not shipped, reachable, or runnable from a scaffolded project.

### 2. Two check registries behind one runner

| Registry | Question it answers | Audience | Ships downstream? |
|----------|---------------------|----------|-------------------|
| **`canon`** | Is the Summon *framework* internally consistent? | Summon maintainers, this repo, CI | **No** |
| **`health`** (portable) | Is *this project's* Summon install wired correctly? | Any scaffolded project | **No — run on-demand from current release** |

`canon` checks (this-repo-only): persona roster ↔ agent-file consistency, agent-notes presence, Done-Gate item-count consistency, command ↔ file existence, status-flow-string consistency. `health` checks assert that the **Summon-managed wiring is present and internally consistent — not that the project matches Summon's layout** (a scaffolded project is *expected* to diverge). Scope is strictly the Summon-owned surface (`.claude/`, the docs Summon installs); the user's own `src/`/app code is never inspected. v1 `health` checks: (a) every orphan `.claude/commands/*.md` is referenced somewhere in Summon-managed docs and vice-versa, matching only fenced/backtick-delimited `/command` tokens (prose mentions are advisory, non-failing); (b) agent-notes `deps:` paths **within `.claude/` and `docs/`** resolve to real files (allowing the `docs/scaffolds/` indirection). **Dropped from v1:** the "tracking adapter reachable" check (a non-deterministic network/credential probe, not a deterministic health check — it may return later as an explicit `--check-tracking` opt-in, never on the default green path) and the risk-tier-field check (sequenced behind ADR-0003 R1 — see Risk-tier coupling below).

`doctor` run **in this repo** executes both registries against the repo root. A scaffolded project runs **only** `npx summon-team@latest doctor`, which executes the `health` registry against `cwd` from the current published release — **nothing is vendored or committed downstream**, so the checks can never rot relative to canon.

**Registry reachability (resolves OQ1).** `canon` is **never registered in the shipped `doctor` entrypoint** — it is not in that entry point's import graph, so the published artifact is *physically incapable* of running `canon` against an arbitrary `cwd`. There is nothing to leak and nothing to mis-detect; the boundary is **what is compiled into the shipped entrypoint, not a runtime `cwd` guess** (an earlier draft proposed maintainer-marker sniffing — rejected: it leaks into any downstream project containing a `packages/` path and *misses at Summon root*, since the scaffolder deletes `packages/`). Maintainer `canon` runs **solely** through the in-repo standalone `pnpm check:canon`. One set of check modules; `canon` is structurally unreachable from the shipped downstream path.

Per Vik's YAGNI guard (carried verbatim from #30): **only encode invariants we actually observe.** A check with no real invariant behind it is itself debt. Each registry grows by observed need, not speculation.

### 3. The serialized `--json` envelope is DEFERRED; the internal result struct is decided now

The v1 machine interface is the **exit code**: `0` = all checks pass, non-zero = at least one failed, with a human-readable summary on stdout. A consumer **is anticipated** — a cold agent running `doctor` as a go/no-go gate before starting work (the harness's "a cold agent can start and trust the result"). That flow needs exactly one bit ("safe to proceed?") and, on failure, **stops and surfaces stdout to the human** — it does not branch programmatically per failing check. Exit-code + stdout fully serves it. A serialized `--json` envelope is only earned by a *different, not-yet-built* consumer that must **act differently per failing check without a human in the loop** (auto-remediate, route to a specific fixer). That consumer does not exist yet, so the envelope is deferred — not because no consumer is imagined, but because the imagined consumer's first real need is a gate, which the exit code already satisfies.

**Compatibility constraint (binding, not advisory).** The exit code and the human-readable stdout summary are the **stable v1 contract and are preserved verbatim** when the envelope arrives. The `--json` envelope is **purely additive**: it appears only under an explicit `--json` flag, changes neither exit code nor default stdout, and therefore breaks no existing consumer. `schemaVersion` then governs only *envelope*→*envelope* evolution (v2→v3), which is the only break it can actually prevent. This makes the exit-code→envelope transition a non-breaking addition rather than a break that `schemaVersion` merely documents.

**Internal result struct decided now; serialized envelope still deferred (resolves OQ2).** Each check returns an **internal**, in-memory result coordinated with ADR-0005's grader contract: `{ verdict, evidence[], schemaVersion }`, where `EvidencePointer = { kind:
"file" | "commit" | "span", ref }` and doctor's `verdict` vocabulary is `ok | degraded |
error`. This is a private implementation type — it lets `canon` and `health` share one runner and lets ADR-0005's grader reuse the same in-memory shape — and carries **no public commitment**: it is **not serialized to `--json` yet**. The deferred thing (above) is strictly the **serialized wire envelope** a consumer couples to. Deciding the struct now resolves the apparent tension: we are not "designing the public envelope," we are choosing an internal type shared with ADR-0005, while leaving the serialized surface unbuilt until a remediation consumer earns it. This resolves the Archie/Vik tension: decide the architecture (and the internal shape) now, build the public contract only when something depends on it, and pin it (versioned) at that point.

### 4. Negative controls scale with the suite, not per-check up front

#30's "negative-control fixture per check" is sound discipline for a mature suite but heavier than the thing it guards while the suite is small (~4–6 checks). Defer per-check fixtures until a registry is large enough that a silent regression is plausible. Two controls are required from the start, because they catch the two failure modes a health check must never have: **(a) an all-green fixture** (a healthy project must pass — catches false-FAILs, a check that fails on a correct project is as harmful as one that never fails), and **(b) at least one known-bad fixture per registry** that asserts *which* check fired (exit non-zero is not enough — a fixture might be tripping the wrong check). The all-green `health` fixture **must be a non-Summon-shaped, plausibly-diverged project** (real app `src/`, a different top-level layout, agent-notes confined to `.claude/`), **not** Summon's own repo minus a file — a fixture cloned from Summon's layout is a rigged control that proves nothing about the portability claim `health` makes.

### Risk-tier coupling (depends on ADR-0003, does not re-decide it)

The `health` registry's "risk-tier field present" check, and any future "tier-appropriate posture" check (e.g. a Tier-2 project must have a threat-model doc), read the `<!-- risk-tier: N -->` field defined by ADR-0003. This ADR notes the dependency; it does not re-open tier policy.

**Sequencing constraint (hard ordering).** The "risk-tier field present" check is **not in v1 `health`**. It is blocked on ADR-0003 R1, which wires `<!-- risk-tier: N -->` into `CLAUDE.md` and into the scaffold; ADR-0003 is Accepted-but-Not-Yet-Implemented (its status line). Until R1 lands, the field is absent from Summon's own repo, so the check would false-FAIL the framework itself. The check may be added to `health` **only after** ADR-0003 R1 has wired the field into both `CLAUDE.md` and the scaffolded template — not before.

### Not gated on this ADR

The two **cheap canon checks** — command ↔ file existence and status-flow-string consistency (the latter already flagged by the `summon:` marker at `check-canon.mjs:82`) — extend `check-canon.mjs` directly under the existing fitness-function precedent. Land them now; do not hold them hostage to the doctor redesign. Likewise **Bug A** (the Done-Gate-count scan missing `README.md`/`CHANGELOG.md`/`site/`) is a `check-canon` fix, shippable immediately.

## Consequences

### Positive

- Doctor actually runs downstream — on-demand from the current release against `cwd`. #30's "the CLI copies `scripts/`" premise was unworkable (the scaffolder deletes the workspace), and a vendored copy would rot; on-demand avoids both.
- The canon/health split stops forcing framework-introspection checks onto scaffolded apps that can't satisfy them; `canon` is structurally unreachable from the shipped entrypoint, so it cannot leak into a downstream run.
- No speculative public contract: the exit-code interface covers today's needs, and because the envelope is additive-only behind `--json` with exit-code/stdout preserved verbatim, its arrival breaks no existing consumer.
- `check-canon` composes rather than forking — one set of check modules, two registries.

### Negative

- Adding the `doctor` invocation mode to the CLI is more work than a `package.json` script alias, and couples the health check's release cadence to the CLI's. Accepted: on-demand `npx summon-team@latest doctor` is the only delivery path from which "runs downstream" is true without vendoring a copy that rots.
- **On-demand `npx` requires network access and a Node toolchain at the downstream project.** A project with no Node installed, or offline, cannot run `doctor`. Accepted: it is a developer-invoked diagnostic, not a runtime dependency; the alternative (vendoring) rots, which is worse.
- Deferring the serialized envelope means a future remediation consumer pays a small integration cost (serialize + version the already-decided internal struct then). Accepted as cheaper than building a wire contract nobody reads; the internal shape is fixed now, so the later cost is serialization, not redesign.
- Two registries are more conceptual surface than one check list. Mitigated by a single runner and a single command (`doctor`); the split is invisible to a user who just wants a green check.

### Neutral

- The exit-code-only v1 means `doctor`'s output is human-facing until a remediation consumer earns the serialized envelope. The `--json` flag convention (already on `harvest-debt.mjs`) is reserved for that moment, not claimed now.
- **On-demand pulls `@latest` every run**, so a downstream project's `doctor` result can change without the project changing, if Summon ships a stricter `health` check — a green project can go red on a Summon release. This is the *intended* always-current-canon behavior; mitigated because `health` checks gate only on Summon-owned wiring the project did not author, so a stricter check reflects a real Summon-side fix, not user churn.
- **Risk-tier check deferral leaves a latent gap:** until ADR-0003 R1 lands, `health` cannot verify tier wiring, so a misconfigured-tier downstream project is invisible to `doctor`. The gap closes when R1 lands (Risk-tier coupling, sequencing constraint); recorded so the dependency is not forgotten.
- Where the check modules physically live (`packages/summon-team/src/checks/` vs a shared package) is an implementation detail for the build step, not decided here.

### Open questions (for the Architecture Gate)

None remaining — both were resolved during the Architecture Gate (Archie/Wei debate):

- **OQ1 (canon reachability):** RESOLVED in Decision #2 → "Registry reachability." `canon` is never registered in the shipped `doctor` entrypoint and runs solely through the in-repo standalone `pnpm check:canon`. The boundary is what is compiled into the shipped entrypoint, not a runtime `cwd` guess.
- **OQ2 (shared result shape):** RESOLVED in Decision #3 → the internal result struct is decided now as `{ verdict, evidence[], schemaVersion }` with `EvidencePointer = { kind:
  "file" | "commit" | "span", ref }` and `verdict` ∈ `ok | degraded | error`, coordinated with
  ADR-0005's grader contract and **not serialized to `--json` yet**.
