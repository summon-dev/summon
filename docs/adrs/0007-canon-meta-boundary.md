---
agent-notes: { ctx: "ADR: canon/meta boundary — what ships to a scaffolded project vs. what stays framework-only; classification test, zone layout, dep surgery, anti-rot sensor", deps: [CLAUDE.md, docs/adrs/template.md, docs/adrs/0003-project-risk-tiers.md, packages/summon-team/src/index.ts, scripts/check-canon.mjs, docs/process/doc-ownership.md], state: accepted, last: "claude@2026-07-03" }
---

# ADR-0007: The Canon/Meta Boundary — What Ships Into a Scaffolded Project

## Status

Accepted (2026-07-03) — ratified by the human after the Architecture Gate: Archie authored, Wei
challenged as a standalone agent (seven challenges; five accepted, two rejected on verified code
facts), debate recorded at `docs/tracking/2026-07-03-canon-meta-boundary-debate.md`. **Wei's
Round-2 challenges (C1–C7) are incorporated** — notably the PR-#45 dependency (below), the §9 sensor
scoped down to the deterministic deps-edge check, the `ai-tells-catalog.md` classification (§3), and
the individual-file rule (§1). This ADR is the spec; the file moves, scaffolder `EXCLUDE_PATHS`
additions (gated on PR #45), ADR-0003 dep surgery, `README-template.md`, `handoff.md` removal, the
new canon example ADR, and the `check-canon` sensor are a follow-up implementation PR.

**This ADR is the spec, not the build.** The file moves, the scaffolder change, the README
stub, and the ADR-0003 dep surgery are a **single follow-up implementation PR**, sequenced after
this ADR is accepted. Nothing here moves a file or edits code.

**Hard dependency on PR #45.** This ADR's exclusion mechanism (§2) assumes PR #45's
`EXCLUDE_PATHS` has landed. As of this writing #45 is **unmerged** — `main`'s scaffler carries
only the basename-matched `EXCLUDE_DIRS`/`EXCLUDE_FILES`, which cannot express a nested-path
exclude like `docs/adrs/meta/`. The follow-up implementation PR must therefore **land or absorb
#45 first**; if #45 is dropped, §2's exclusion must be re-spec'd (the zone layout stands, but the
scaffolder would need its own path-prefix removal step). The rest of this ADR — the §1 test, the
categorization, the dep surgery, the README stub — is independent of #45.

## Context

Summon's template repo **is its own development repo.** `npx summon-team <name>`
(`packages/summon-team/src/index.ts`) downloads this repo, deletes a hardcoded infrastructure
list (`EXCLUDE_DIRS` = `packages`, `site`, `node_modules`, `.git`; `EXCLUDE_FILES` = the
workspace/lock/`CHANGELOG.md`/root `package.json`), resets `CLAUDE.md`'s name fields, and inits
git. Everything that survives that deletion **ships into the user's project.**

Today, a large slice of what survives is Summon's *own* development exhaust, not the user's
starter kit:

- **Product ADRs** about building `summon-team` itself — 0004 (`doctor`), 0005 (behavioral
  benchmark), and 0006 (multi-runtime install, forthcoming). A user scaffolding a payments app
  inherits three ADRs debating *our* CLI's internals.
- **Dev-history** — `docs/code-reviews/` and `docs/tracking/` (debate records, gate transcripts).
- **War-story docs** — `docs/process/ponytail-harness-review.md` and
  `docs/process/cross-repo-lessons.md` (a specific multi-repo audit of *our* sibling projects).
- **Site design docs** — `docs/design/team-hero-sprites*.md` (marketing-sprite art bibles).
- **A stale session snapshot** — `.claude/handoff.md`, dated 2026-06-29, regenerated per session
  by `/handoff`; it describes *this repo's* merge state and has no meaning downstream.
- **The marketing `README.md`** — a sales page for Summon, shipped verbatim as the new project's
  README.

A sibling PR (**#45**) made the first, ad-hoc cut at this: it added an `EXCLUDE_PATHS`
path-prefix mechanism to the scaffolder and used it to drop `docs/code-reviews/` and
`docs/tracking/`. That is the right *tactic* with no stated *rule* — the next stray file (a new
war-story, ADR-0007, ADR-0008) has nothing to classify it against, so the exclude list grows by
whack-a-mole and rots. **This ADR generalizes #45's start into a principled, durable boundary.**

## Decision

Nine parts. §1 is the durable rule; everything else applies it.

### 1. The classification test (the heart of this ADR)

> **A file is _meta_ if it is about building or operating Summon itself. A file is _canon_ if
> it is about the user's project or the methodology they practice.**

One question decides it: **"When a stranger scaffolds a payments app with `summon-team`, does
this file help *them* build *their* app — or does it only make sense to someone working on
Summon?"** Help the user → canon (ships). Only makes sense to a Summon maintainer → meta
(repo-only).

The test keys on **subject**, not location or format. A Markdown file, an ADR, and a script are
each classified the same way: by what they are *about*, not by which directory they sit in today.

**Subject beats directory — the individual-file rule.** Directory granularity (§2, "`docs/`
process is canon") is a **copy convenience, not a classifier.** A meta file sitting inside an
otherwise-canon directory is classified **individually** by the subject test and excluded
individually (`EXCLUDE_PATHS` takes file paths, not only dir prefixes — §2). The directory can
never override the subject test; if it could, the exact misclassification §1 exists to prevent
would leak back in through path-granularity. So "all of `docs/process/` is canon" is shorthand
for "every current file in `docs/process/` is canon *by subject*" — verified per file, not
assumed from the folder. (See the `ai-tells-catalog.md` classification in §3, which turns on
exactly this.)

**Worked examples — canon (ships):**

| File | Why canon |
|------|-----------|
| `docs/methodology/phases.md` | Describes the methodology the user practices. |
| `docs/adrs/0003-project-risk-tiers.md` | A reusable process mechanism the user's project runs. |
| `docs/adrs/template.md` | The user writes *their own* ADRs from it. |
| `docs/scaffolds/threat-model.md` | A stub the user fills in for *their* system. |
| `docs/process/done-gate.md`, `gotchas.md`, `tracking-protocol.md` | The process the user runs. |
| `docs/sprints/` (empty `.gitkeep`) | The user's own sprint plans land here — an empty scaffold dir is canon even though *our* filled-in sprint records would be meta. |

**Worked examples — meta (repo-only):**

| File | Why meta |
|------|----------|
| `docs/adrs/0004-summon-doctor.md` | Designs *our* CLI's internals; irrelevant to a user's app. |
| `docs/code-reviews/`, `docs/tracking/` | Records of *our* development sessions. |
| `docs/process/ponytail-harness-review.md`, `cross-repo-lessons.md` | Audits of *our* sibling repos. |
| `docs/design/team-hero-sprites*.md` | Art direction for *our* marketing site. |
| `.claude/handoff.md` | A snapshot of *this repo's* session state. |
| `README.md` (marketing) | A sales page for Summon the product. |
| **This ADR (0007)** | It is about building Summon; see §8. |

The `docs/sprints/` row is the test doing real work: the **directory concept** is canon (the
user gets an empty place for their sprint plans), while any **filled-in Summon sprint record**
would be meta. Subject, not path.

### 2. Zone layout within one repo (records the ratified mechanism)

We keep **one repo** and separate the two audiences by **zone**. The scaffolder's exclude
mechanism (#45's `EXCLUDE_PATHS`, path-prefix based) drops the meta zones wholesale:

- **`docs/history/`** — new dir. Absorbs all dev-history and war-story and design content:
  `docs/code-reviews/` → `docs/history/code-reviews/`, `docs/tracking/` →
  `docs/history/tracking/`, `docs/process/ponytail-harness-review.md` and `cross-repo-lessons.md`
  → `docs/history/`, `docs/design/` → `docs/history/design/`.
- **`docs/adrs/meta/`** — new dir. Holds the product ADRs (0004, 0005, 0006) and this one (0007).
  **Canon ADRs stay in `docs/adrs/`** (0001 conventional-commits, 0002 tdd-workflow, 0003
  project-risk-tiers) alongside `template.md`, and they ship.

The scaffolder excludes `docs/history/` and `docs/adrs/meta/` via `EXCLUDE_PATHS`. That is the
whole enforcement surface for *exclusion*: two path prefixes (plus any individually-classified
meta file, per §1's individual-file rule), not a growing per-file guess-list.

**Reconciling the two matchers (why `EXCLUDE_PATHS` is the right tool here).** The scaffolder has
*two* exclusion matchers, and they are not interchangeable:

- `EXCLUDE_DIRS` / `EXCLUDE_FILES` (on `main`) match by **basename** during the copy filter —
  they strip a top-level `packages/`, `site/`, `package.json`. A basename matcher **cannot**
  express "exclude `docs/adrs/meta/` but keep `docs/adrs/`": both share the basename `adrs`/`meta`
  has no top-level meaning, and a bare `meta` basename would nuke any `meta` dir anywhere. This is
  the real limit — and it is why the meta zones need the *other* matcher.
- `EXCLUDE_PATHS` (PR #45) is **path-prefix based**: it runs a **post-copy removal loop**
  (`for (const rel of EXCLUDE_PATHS) rmSync(resolve(targetDir, rel), { recursive: true })`)
  against the scaffolded tree, so a nested prefix like `docs/history` or `docs/adrs/meta` — and an
  individual file path — is removed correctly. This is exactly the shape the zone boundary needs.

So the mechanism is **sound given #45** (see §Status): the meta zones and any individually-classified
meta file go in `EXCLUDE_PATHS`, not `EXCLUDE_DIRS`. Nested-path exclusion is not a limitation of
the scaffolder — it is a limitation only of the *basename* matcher, which is why the boundary uses
the path matcher.

*Why zone-in-one-repo over a second repo (ratified, recorded here for the record):* a second repo
means two git histories, two CI configs, a submodule or a publish step to reunite them, and a
constant "which repo does this file go in" tax on every commit — for a project whose entire meta
corpus is a few dozen files. A directory boundary enforced by a path-prefix exclude buys the same
separation at a fraction of the operational cost, and keeps the dev-history physically next to the
code it documents. The exit cost is low: if the corpus ever outgrows a directory, promoting
`docs/history/` to its own repo is a `git filter-repo`, not a redesign.

### 3. Categorization of current content

Every meaningful `docs/` area and stray file, classified:

| Area / file | Class | Fate |
|-------------|-------|------|
| `docs/methodology/` (phases, personas, agent-notes, debt-markers) | **Canon** | Ships as-is |
| `docs/scaffolds/` (all stubs + templates) | **Canon** | Ships as-is |
| `docs/integrations/` (tracking adapters) | **Canon** | Ships as-is |
| `docs/process/` — done-gate, gotchas, team-governance, doc-ownership, operational-baseline, tracking-protocol, ai-tells-catalog | **Canon** | Ships as-is |
| `docs/adrs/` 0001, 0002, 0003 + `template.md` | **Canon** | Ships from `docs/adrs/` |
| `docs/sprints/` (empty) | **Canon** | Ships as an empty scaffold dir |
| `docs/code-reviews/` | **Meta** | → `docs/history/code-reviews/` |
| `docs/tracking/` | **Meta** | → `docs/history/tracking/` |
| `docs/process/ponytail-harness-review.md` | **Meta** | → `docs/history/` |
| `docs/process/cross-repo-lessons.md` | **Meta** | → `docs/history/` |
| `docs/design/` | **Meta** | → `docs/history/design/` |
| `docs/adrs/` 0004, 0005 (+ 0006 when the multi-runtime branch lands) | **Meta** | → `docs/adrs/meta/` |
| `.claude/handoff.md` | **Meta** | Removed + gitignored (§7) |
| `README.md` (marketing) | **Meta** | Repo-only; replaced downstream by a stub (§6) |
| This ADR (0007) | **Meta** | → `docs/adrs/meta/` (§8) |

Two rows in this table are subject-test calls a folder-level rule would get wrong, and are worth
defending:

- **`ai-tells-catalog.md` is CANON (subject test, not folder).** `CLAUDE.md`'s index frames it as
  "keeping *Summon's own docs* from reading as machine-built," which reads meta — and by the
  individual-file rule (§1) that framing, if accurate, would pull it out of the canon `docs/process/`
  folder into `docs/history/`. It stays canon on the **subject** underneath the framing: the
  reusable *discipline* it teaches — keep a project's human-facing prose from reading as
  AI-generated — is methodology **any Summon-run project practices**, since every scaffolded
  project's agents (Cam, Diego, Pat) write docs. The catalog is a shared writing-quality reference,
  not a record of Summon's development. **Caveat for the follow-up PR:** the catalog currently
  carries a few *Summon-specific* calibration examples; those are generalized (or marked as
  illustrative) so the shipped file reads as a portable reference, not an internal memo. If that
  generalization proves impossible, the classification flips to meta — the subject test decides,
  and the "Summon's own docs" framing is the thing to watch.
- **The product-ADR row lists only files that exist.** 0004 and 0005 are in-repo and move now;
  0006 (multi-runtime) is on an unmerged branch, so it is named parenthetically as a *future* move,
  not as a concrete migration row. Shipping a migration row for a file that doesn't exist would be
  the exact list-rot this ADR exists to kill.

### 4. Sever the one canon→meta agent-notes dep (ratified)

ADR-0003 is canon and ships. Its agent-notes `deps` today read
`[CLAUDE.md, docs/process/cross-repo-lessons.md, docs/process/done-gate.md, docs/adrs/0002-tdd-workflow.md]`
— and `cross-repo-lessons.md` becomes meta. Left alone, 0003 ships downstream carrying a `dep`
to a file that **does not exist in the user's copy**, which is exactly the dangling reference the
`health` registry's "agent-notes deps resolve" check (ADR-0004 §2) is built to fail. A canon file
must not depend on a meta file.

**Sever it.** Rewrite 0003's `deps` to drop `cross-repo-lessons.md`. Nothing is lost: 0003's
Context cites the audit for two concrete deployments (`alpaca-trader`, `predictasaurv2`) as the
motivating evidence for tiering. The **one line of rationale 0003 actually needs** — *"a single
fixed ceremony over-serves throwaway projects and under-serves money-moving ones"* — is inlined
into 0003's Context so the argument stands on its own, and the `dep` on the war-story is dropped.
The war-story remains in `docs/history/` for anyone who wants the full audit; canon no longer
*points* at it. (This is the only canon→meta `dep` in the repo today — see §5a.)

### 5. Two coupling types the boundary must handle

Cutting the zones creates two kinds of dangling reference. They are not the same problem and get
different policies.

**5a. HARD coupling — agent-notes `deps` that cross canon→meta.** These are machine-checked
downstream: `checkAgentNotesDeps` **ships today** in the `health` registry
(`packages/summon-team/src/doctor.ts`, in `runHealth`) and runs against the user's repo via
`npx summon-team doctor`. It resolves every agent-notes `dep` under `.claude/`/`docs/` and errors
on a missing target — with one deliberate suppression: a missing dep is **only** flagged when its
immediate parent directory still exists downstream (an absent parent is read as "not-yet-generated,"
not a fault). That heuristic makes the break **precise and real** for the case that matters here: a
canon file whose `dep` points at a meta file **pulled out of a still-present canon directory** —
exactly 0003 → `docs/process/cross-repo-lessons.md` after the file moves to `docs/history/` (parent
`docs/process/` still ships, target gone → **error on day one**). A `dep` written directly at a
path *inside* an excluded zone (`docs/history/…`, `docs/adrs/meta/…`) is instead silently
*suppressed* downstream (its parent dir was excluded) — not an error, but a latent dangling pointer
that turns into one the moment the check tightens. Both are defects. Policy: **canon→meta `deps`
are forbidden.** There is exactly one today (0003 → `cross-repo-lessons.md`); §4 severs it. The
suppression is also why the pre-ship sensor belongs in `check-canon.mjs`, which sees *both* zones
in-repo and catches every canon→meta edge deterministically, rather than relying on the downstream
`doctor`, whose heuristic hides the in-zone half (§9). Meta→meta `deps` are **fine** — the two
files move into the exclude zone *together*, so the reference never dangles (e.g. 0004's `deps`
on `docs/tracking/…` and `ponytail-harness-review.md` are meta→meta and need no surgery).
Meta→canon `deps` are **fine** — the canon target ships, but since the meta file itself never
ships, its `deps` are never resolved downstream anyway. **Only canon→meta is a defect.**

**5b. SOFT coupling — prose mentions of meta paths in shipped canon docs.** Roughly ten shipped
canon files *mention* meta paths in body text: `.claude/commands/` — kickoff, plan, tdd,
code-review, sprint-boundary, handoff; and `docs/process/team-governance.md`,
`docs/methodology/phases.md`, `docs/process/gotchas.md`, `docs/process/tracking-protocol.md`.
Example: a command that says "see the debate record in `docs/tracking/…`." In a user's copy that
becomes a link to a file they don't have. This is **not** machine-checked by `doctor` (prose
links aren't `deps`), so it is cosmetic-but-real: a dead pointer erodes trust in the docs.

Policy for soft refs, in priority order:

1. **Prefer generic phrasing over a specific dead path.** "the debate record for this decision"
   beats "`docs/tracking/2026-06-24-…md`" in a *shipped* doc. When a canon doc must cite the kind
   of artifact, name the *kind*, not the *instance*.
2. **When a concrete example is genuinely load-bearing, mark it as a Summon-repo example.** Phrase
   it as "in Summon's own repo, e.g. …" so a downstream reader reads it as an illustration, not a
   file they should find. An illustrative example that is visibly *ours* is not a dead pointer.
3. **Soft refs are a warning, not a build failure.** Unlike hard `deps`, a dangling prose mention
   does not break `doctor`; fixing all ten in the follow-up PR is desirable but not a merge
   blocker, and the sensor (§9) reports them as **warn**, not **fail** (see §9).

### 6. README: add a stub, repair First-Run Detection

`CLAUDE.md`'s First-Run Detection already keys on **`README-template.md` existing** as one of its
"this project is uninitialized" signals — but **that file was never created**, so the signal is
dead, and the scaffolder ships the marketing `README.md` unchanged as the user's README.

Decision: **add `README-template.md`** to the repo root — a minimal *project* README stub (project
name placeholder, one-line description, "built with Summon", a `/quickstart` pointer). The
scaffolder installs it as the new project's `README.md` (copy `README-template.md` → `README.md`,
then remove the template file), the **same reset pattern** it already applies to `CLAUDE.md`. The
marketing `README.md` stays **repo-only** (meta; excluded from the scaffold copy).

This does double duty: it stops shipping a sales page as the user's README **and** repairs
First-Run Detection — the template file exists to key on, and its post-scaffold removal is a clean
"initialized" signal. (Mechanics — whether the scaffolder deletes `README-template.md` after the
copy or First-Run keys on the marketing README's absence — is an implementation detail for the
follow-up PR; the decision is: stub ships as `README.md`, marketing README does not ship.)

### 7. `.claude/handoff.md`: remove and gitignore

`.claude/handoff.md` is per-session scratch, regenerated by `/handoff`; the committed copy is a
stale 2026-06-29 snapshot of *this repo's* merge state. It is meta and it is also *noise even in
this repo* — a committed session snapshot invites merge churn and misleads the next session.
Decision: **remove it from the repo and add `.claude/handoff.md` to `.gitignore`.** `/handoff`
continues to write it locally per session; it simply stops being tracked, so it can neither ship
downstream nor rot in git. (One narrow risk: `/handoff` is the documented cross-session baton, and
git was one way to carry it between machines. It was never reliable for that — a stale snapshot is
worse than none — so untracking it loses nothing real; a contributor who needs the baton across
machines copies the file deliberately.) The follow-up PR also **scrubs any `/handoff` (and
adjacent process) prose that implies git carries the baton**, so the docs match the untracked
reality rather than promising a cross-machine handoff that gitignoring removes.

### 8. Where this ADR lives

ADR-0007 is **meta** — it is about building Summon, and by its own test (§1) it does not help a
stranger build their app. It is authored at `docs/adrs/0007-canon-meta-boundary.md` for review
convenience (next to the ADRs it reasons about), and the follow-up PR **moves it to
`docs/adrs/meta/0007-canon-meta-boundary.md`** with the other product ADRs. Its agent-notes `deps`
point only at canon (`CLAUDE.md`, `template.md`, `0003`) and at code (`index.ts`,
`check-canon.mjs`) — all meta→canon or meta→code, both allowed (§5a), so this ADR itself never
creates a forbidden edge.

### 9. Anti-rot enforcement: extend `check-canon.mjs` with a boundary sensor (recommended)

Summon's culture is **"encode the fix as a sensor, not just an issue"** (`retro.md`,
`debt-markers.md`, and `scripts/check-canon.mjs` — the existing canon fitness function). The
boundary defined here is precisely the kind of invariant that rots silently: months from now
someone adds a new canon doc that `deps` a fresh war-story, or a canon command that cites a new
`docs/tracking/` transcript, and nothing complains until a user's `doctor` goes red — far from the
commit that caused it.

**Recommendation: add one function to `check-canon.mjs`'s existing check list, not a new script.**
`check-canon.mjs` is a plain array of check functions (`checkAgentFiles`, `checkPersonaRoster`, …)
run in-repo by CI — there is no "registry" abstraction to register into; the boundary check is one
more function alongside those. It has **one job**, deterministic and structured:

**The `deps`-edge check (FAIL).** Over every **shipped canon file** (everything not under an
`EXCLUDE_PATHS` prefix), flag any agent-notes `dep` whose target is under `docs/history/` or
`docs/adrs/meta/` (or is the marketing `README.md`). That is a **hard CI failure.** It is
~15 structured lines — parse the leading `agent-notes` block (the same shape `doctor.ts` already
parses), test each `dep` string against the two zone prefixes — with **near-zero false positives**,
because it matches path prefixes, not prose.

**Why the sensor belongs in `check-canon.mjs`, not `doctor` (the two-tool story).** The shipped
downstream `doctor` (§5a) *does* catch a canon→meta dep — but only in the **user's** repo, **after
it has already shipped**, and only for the non-suppressed half (a dep pulled out of a still-present
dir; the in-zone half is silently suppressed). Catching a defect in a user's project is the failure
mode, not the guard. The in-repo `check-canon.mjs` sensor catches the **same edge in CI, before it
ships**, and — seeing both zones present in-repo — catches the half `doctor`'s parent-dir heuristic
hides. Pre-ship, full-visibility, deterministic: that is why it lives in `check-canon`.

**Why this clears the YAGNI bar (I weighed it — this half is sound; the other half I cut).** Vik's
reflexive objection is "don't build a checker for an invariant with one instance." But ADR-0004's
own test is *"only encode invariants we actually observe"* — and we **observe this one failing right
now**: 0003 → `cross-repo-lessons` is a live canon→meta edge this ADR exists to sever. The sensor is
a **regression test for a defect we fix in the same PR**, not a speculative guard. It is not the
`--json`-envelope YAGNI case (a contract with zero consumers); it is a deterministic assertion with a
concrete, shipped failure mode behind it. **Build the deps-edge check.**

**What I am NOT building — the prose-ref check is a non-goal (cut after the Round-2 gate).** An
earlier draft also flagged *body-text* mentions of meta paths as a warning. That is dropped, for
three reasons that compound: (a) it **contradicts §5b**, which deliberately blesses illustrative
"in Summon's own repo, e.g. `docs/tracking/…`" mentions — the check would fire on exactly the prose
§5b permits; (b) it would fire on `doc-ownership.md`, which **must** name the zones to document the
boundary (§Neutral) — so the warning count can **never trend to zero**, making it permanent noise
no one must act on; (c) a prose-mention matcher is false-positive-prone in a way a path-prefix
`dep` matcher is not. An advisory nobody must action, that structurally cannot reach zero, is the
real ceremony breach. Soft refs (§5b) stay a **style rule enforced by review**, not a sensor. (If a
future contributor still wants a prose guard, the only version that avoids the contradiction is an
opt-in allowlist marker — `<!-- canon-ok -->` on the blessed §5b examples and on `doc-ownership.md`
— which is more machinery than the problem is worth today. Recorded as a non-goal, not a plan.)

*(Scope note: the sensor introspects Summon's own repo layout and `EXCLUDE_PATHS`, so it is
structurally this-repo-only and never reaches a scaffolded project, per ADR-0004 Decision 2. It is
authored in the follow-up PR alongside the file moves, not here.)*

**Cheap on-brand mitigation for the numbering split (OQ2/C7).** Because `docs/adrs/meta/`
fragments the ADR sequence (0003 in `adrs/`, 0004+ in `adrs/meta/`), the same `check-canon.mjs`
pass can assert **ADR numbers are contiguous and unique across *both* directories** — a few lines
that turn the numbering-rot risk into a machine-caught error. Recommended as a rider on the sensor,
not a blocker.

## Consequences

### Positive

- **A user's scaffolded project stops inheriting Summon's development exhaust** — no product ADRs
  about our CLI, no war-stories about our sibling repos, no stale handoff, no sales-page README.
  The starter kit is the methodology and their own stubs, nothing else.
- **The boundary is a rule, not a list.** A future contributor classifies any new file with one
  question (§1) instead of guessing whether to add it to an exclude array. #45's whack-a-mole
  becomes a principle.
- **Exclusion collapses to two path prefixes** (`docs/history/`, `docs/adrs/meta/`) plus the
  README swap — a small, legible scaffolder surface instead of a per-file list that grows forever.
- **The boundary can't silently rot:** the §9 sensor fails CI on a new canon→meta `dep` at the
  commit that introduces it, not months later in a user's `doctor`.
- **First-Run Detection is repaired** as a side effect — `README-template.md` finally exists for
  the signal that already references it.

### Negative

- **A one-time bulk move touches history-linked paths.** `docs/tracking/…` and
  `ponytail-harness-review.md` are referenced by prose across ~10 canon files (§5b) and by
  meta→meta `deps`; the follow-up PR is a wide, mechanical diff. Accepted: it is a single planned
  migration, and the sensor keeps it from regressing.
- **Hiding the product ADRs removes a set of worked ADR examples from the user's copy.** A user
  who wanted to see a *real, meaty* ADR (0003, 0004) now sees only the three canon ADRs plus
  `template.md`. Mitigation (adopted from the Round-2 gate, OQ3): `template.md` and 0003 already
  ship as canon examples, and the follow-up PR **adds a purpose-built canon example ADR for a
  fictional user-domain decision** (e.g. "Postgres vs SQLite for the app's store"), giving a
  scaffolded project one meaty worked ADR **without leaking Summon internals** — strictly better
  than shipping a redacted product ADR about our CLI.
- **Two zones are more structure than one flat `docs/`.** A contributor must now know that
  dev-history goes in `docs/history/` and product ADRs in `docs/adrs/meta/`. Mitigation: the §9
  sensor and the §1 test make the rule mechanical, and `doc-ownership.md` records the shipping
  rule so it is discoverable.
- **The soft-ref policy (§5b) is judgement, enforced by review, not by a sensor.** After the
  Round-2 gate cut the prose-ref warning (§9), dead prose pointers are caught only by review
  discipline, so they can accumulate if a reviewer misses one. Accepted: an unactionable warning
  that structurally cannot reach zero (it would fire on the §5b-blessed examples and on
  `doc-ownership.md`) is worse than no sensor — the soft-ref failure mode is cosmetic, and a hard
  `dep` never dangles because §5a/§9 forbid and machine-check it.

### Neutral

- **`docs/history/` grows without bound** — it is an append-only attic of Summon's development.
  That is fine; it never ships and never runs. If it ever becomes unwieldy, promoting it to its own
  repo is a `git filter-repo`, not a redesign (§2).
- **The shipping rule wants a home in `docs/process/doc-ownership.md`** — a short "What ships"
  subsection stating the §1 test and the two exclude zones, so the boundary is documented where
  ownership already lives. This is a follow-up-PR edit, noted here for completeness.
- **`docs/sprints/` ships empty.** The user's sprint plans land there; Summon's own filled-in
  sprint records (were there any) would be meta. Today it holds only `.gitkeep`, so no move is
  needed — the row exists to fix the classification for the day someone adds a real sprint plan.

### Open questions (for the Architecture Gate)

- **OQ1 — Is the §9 sensor a YAGNI violation? RESOLVED (Round 2).** The gate **split** it: the
  deterministic **deps-edge FAIL** is kept (a regression guard for the observed 0003 break, ~15
  structured lines, near-zero false positives) and the **prose-ref WARN is cut to a non-goal** (it
  contradicts §5b and cannot trend to zero — §9). The remaining check is sound and not the
  zero-consumer contract case.
- **OQ2 — `docs/adrs/meta/` vs a filename/frontmatter convention. RESOLVED as accept-as-risk.**
  The human ratified the directory mechanism. A subdirectory is one `EXCLUDE_PATHS` prefix; a
  per-file `class: meta` marker would spare the numbering split but forces the scaffolder to parse
  every ADR's frontmatter to decide exclusion. The accepted trade is **numbering rot** (0003 in
  `adrs/`, 0004+ in `adrs/meta/` — ironic for an anti-rot ADR), **mitigated** by the contiguous-and-
  unique ADR-number assertion added to `check-canon.mjs` (§9), which turns the rot risk into a
  machine-caught error rather than a latent trap.
- **OQ3 — Does hiding the meta ADRs cost users a worked-ADR example? RESOLVED (Round 2).** Not by
  shipping a redacted product ADR (that still leaks CLI internals), but by **authoring a new canon
  example ADR for a fictional user-domain decision** in the follow-up PR (Consequences → Negative).
  `template.md` + 0003 + that example give a scaffolded project meaty ADR material with zero Summon
  internals.
- **OQ4 — Should `.claude/handoff.md` be *deleted* or kept-but-gitignored?** §7 removes it from
  tracking and gitignores it. The alternative is keeping a tracked, always-empty template handoff.
  I chose untrack-and-ignore; the residual question is whether losing the git-carried baton across
  machines matters to any real workflow.
