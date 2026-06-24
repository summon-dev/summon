---
agent-notes: { ctx: "ADR: summon doctor home (CLI subcommand), canon-vs-portable check split, deferred --json envelope", deps: [CLAUDE.md, docs/process/ponytail-harness-review.md, scripts/check-canon.mjs, packages/summon-team/src/index.ts, docs/adrs/0003-project-risk-tiers.md], state: active, last: "archie@2026-06-24" }
---

# ADR-0004: `summon doctor` — Home, Check-Registry Split, and the Deferred `--json` Envelope

## Status

Proposed (2026-06-24) — authored from the seven-agent direction review recorded in
`docs/process/ponytail-harness-review.md` (Archie/Vik/Tara lenses). **Pending an Architecture
Gate (Archie + Wei) and human acceptance** before it gates code. Implements the descoped form
of GitHub issue #30.

## Context

Issue #30 proposes growing `scripts/check-canon.mjs` (the CI canon drift-guard landed in
commit `cd3b4dd`, modelled on ponytail's `check-rule-copies.js`) into a `summon doctor`
deterministic health check, inspired by harness-engineering's `doctor`/`boot` readiness
checks. As written, #30 makes three moves the review flagged:

1. **A broken portability premise.** #30 says doctor "ships to scaffolded projects (the CLI
   already copies `scripts/`)." It does not work today: `packages/summon-team/src/index.ts`
   lists `package.json` in `EXCLUDE_FILES` and `packages` in `EXCLUDE_DIRS`, so a scaffolded
   project receives `scripts/check-canon.mjs` but **no `pnpm doctor` script and no workspace**
   to run it. Worse, `check-canon`'s checks are hardcoded to *Summon's own* repo layout
   (`.claude/agents`, the persona roster, `done-gate.md`) — framework-introspection that a
   downstream app cannot satisfy and would fail CI on day one.

2. **A conflation of two concerns.** "Is the Summon *framework* internally consistent?"
   (canon drift, maintainers, this repo only) is a different question from "Is *this project's*
   Summon install wired up correctly?" (portable readiness). Subsuming the first into the
   second forces every scaffolded project to carry checks it can't pass.

3. **A public contract built ahead of demand.** The proposed `--json` status envelope
   (`status` ok/degraded/error + per-check results + `next_action`, "so agents can probe it")
   is an interface other software couples to — but no consumer exists today. Archie: pin it in
   an ADR because it's a contract. Vik: don't build it at all yet — "a contract with one
   implementation and zero consumers" is a textbook YAGNI breach. Both are right about
   different things.

`check-canon` also already carries a `summon:` debt marker (`scripts/check-canon.mjs:82`)
anticipating a status-flow-string check, and the existing `harvest-debt.mjs` already supports
`--json` — so a `--json` *flag* is established convention; a *structured envelope schema* is
not.

## Decision

Four decisions. The architecture is decided now; the structured envelope is deliberately
deferred.

### 1. Home: doctor is a CLI subcommand, not a loose script

`summon doctor` graduates into `packages/summon-team` as a subcommand
(`summon-team doctor` / wired to `pnpm doctor` in this repo via the workspace). Rationale: the
"travels to scaffolded projects" goal only holds if doctor ships *with the CLI binary* the
user already invokes, not as a `scripts/*.mjs` file that depends on a `package.json` the CLI
deletes. Check logic lives in importable modules the subcommand runs against an arbitrary
`cwd`. `scripts/check-canon.mjs` **composes into** doctor (the canon registry calls the same
check modules); it is not subsumed or duplicated.

### 2. Two check registries behind one runner

| Registry | Question it answers | Audience | Ships downstream? |
|----------|---------------------|----------|-------------------|
| **`canon`** | Is the Summon *framework* internally consistent? | Summon maintainers, this repo, CI | **No** |
| **`health`** (portable) | Is *this project's* Summon install wired correctly? | Any scaffolded project | **Yes** |

`canon` checks (this-repo-only): persona roster ↔ agent-file consistency, agent-notes
presence, Done-Gate item-count consistency, command ↔ file existence, status-flow-string
consistency. `health` checks (portable, layout-tolerant): every `/command` referenced in docs
has a matching `.claude/commands/*.md` and vice-versa; agent-notes `deps:` paths resolve to
real files (allowing the `docs/scaffolds/` indirection); the tracking adapter named in
`docs/integrations/README.md` is reachable; the `<!-- risk-tier: N -->` field is present.
`doctor` run **in this repo** executes both registries; the CLI ships **only the `health`
registry** to scaffolded projects.

Per Vik's YAGNI guard (carried verbatim from #30): **only encode invariants we actually
observe.** A check with no real invariant behind it is itself debt. Each registry grows by
observed need, not speculation.

### 3. The `--json` structured envelope is DEFERRED until a real consumer exists

The v1 machine interface is the **exit code**: `0` = all checks pass, non-zero = at least one
failed, with a human-readable summary on stdout. This is everything a CI step or a probing
agent needs today. A structured `--json` envelope (`status` enum, per-check results,
`next_action`) is **not built now** — there is no consumer. When the first real consumer
appears (an agent or the harness that branches on the output), the envelope is added then,
and **must** carry a `schemaVersion` field so it can evolve without silently breaking
consumers. This resolves the Archie/Vik tension: decide the architecture now, build the
contract only when something depends on it, and pin it (versioned) at that point.

### 4. Negative controls scale with the suite, not per-check up front

#30's "negative-control fixture per check" is sound discipline for a mature suite but heavier
than the thing it guards while the suite is small (~4–6 checks). Defer per-check fixtures
until a registry is large enough that a silent regression is plausible. Two controls are
required from the start, because they catch the two failure modes a health check must never
have: **(a) an all-green fixture** (a healthy project must pass — catches false-FAILs, a check
that fails on a correct project is as harmful as one that never fails), and **(b) at least one
known-bad fixture per registry** that asserts *which* check fired (exit non-zero is not
enough — a fixture might be tripping the wrong check).

### Risk-tier coupling (depends on ADR-0003, does not re-decide it)

The `health` registry's "risk-tier field present" check, and any future "tier-appropriate
posture" check (e.g. a Tier-2 project must have a threat-model doc), read the
`<!-- risk-tier: N -->` field defined by ADR-0003. This ADR notes the dependency; it does not
re-open tier policy.

### Not gated on this ADR

The two **cheap canon checks** — command ↔ file existence and status-flow-string consistency
(the latter already flagged by the `summon:` marker at `check-canon.mjs:82`) — extend
`check-canon.mjs` directly under the existing fitness-function precedent. Land them now; do
not hold them hostage to the doctor redesign. Likewise **Bug A** (the Done-Gate-count scan
missing `README.md`/`CHANGELOG.md`/`site/`) is a `check-canon` fix, shippable immediately.

## Consequences

### Positive

- Doctor actually ships and runs downstream (it travels with the CLI binary, the way #30
  intended but the current code prevents).
- The canon/health split stops forcing framework-introspection checks onto scaffolded apps
  that can't satisfy them.
- No speculative public contract: the exit-code interface covers today's needs; the envelope
  is added with a real consumer and a version field, avoiding a silent breaking change later.
- `check-canon` composes rather than forking — one set of check modules, two registries.

### Negative

- Moving doctor into the CLI package is more work than a `package.json` script alias, and
  couples the health check's release cadence to the CLI's. Accepted: it's the only home from
  which "ships to scaffolded projects" is true.
- Deferring the envelope means a future consumer pays a small integration cost (define +
  version the schema then). Accepted as cheaper than guessing the shape now and maintaining a
  contract nobody reads.
- Two registries are more conceptual surface than one check list. Mitigated by a single runner
  and a single command (`doctor`); the split is invisible to a user who just wants a green
  check.

### Neutral

- The exit-code-only v1 means `doctor`'s output is human-facing until a machine consumer
  earns the envelope. The `--json` flag convention (already on `harvest-debt.mjs`) is reserved
  for that moment, not claimed now.
- Where the check modules physically live (`packages/summon-team/src/checks/` vs a shared
  package) is an implementation detail for the build step, not decided here.

### Open questions (for the Architecture Gate)

- Should the `canon` registry remain a standalone `pnpm check:canon` for fast maintainer CI,
  with `doctor` calling the same modules — or is one entry point enough?
- Does the `health` registry's result shape need to match ADR-0005's grader-result shape now
  (decide-once on a shared result/evidence envelope), even though neither is serialized to
  `--json` yet? Cross-reference ADR-0005 §grader contract.
