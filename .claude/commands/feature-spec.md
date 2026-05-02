<!-- agent-notes: { ctx: "stub: scaffold a feature spec for the current work item per ADR-0004", deps: [docs/scaffolds/feature-spec.md, docs/adrs/0004-feature-spec-artifact.md, docs/methodology/phases.md], state: stub, last: "claude@2026-05-02" } -->

Scaffold a feature spec for the current work item, per [ADR-0004](../../docs/adrs/0004-feature-spec-artifact.md). The spec sits at the Architecture→Implementation seam (Phase 2.5).

## Steps

### 1. Confirm the spec is required

Ask the work-item ID, title, and size. Per [ADR-0004 § 4](../../docs/adrs/0004-feature-spec-artifact.md#4-size-carve-out):

| Size | Spec status |
|---|---|
| **XS** | **Forbidden** — refuse to scaffold; commit + tests are the contract |
| **S** | **Optional** — only scaffold if the user supplies a one-line opt-in rationale; verify Pat + Tara sign-off intent |
| **M** | **Required** — scaffold |
| **L** | **Required** — scaffold |
| **XL** | **Required + decomposition review** — scaffold and prompt the user to schedule decomposition with Pat + Archie + Grace |

If XS, refuse: "Per ADR-0004, XS items are forbidden specs — the commit message and test diff are sufficient executable contract."

If S without opt-in rationale, ask for the rationale before proceeding.

### 2. Resolve the slug

Slug = lowercased work-item title with non-alphanumerics replaced by `-`, trimmed (e.g., `harness-contract`, `feature-spec-artifact`). Final path: `docs/specs/<work-item-id>-<slug>.md`.

If `docs/specs/` does not exist, create it.

### 3. Copy the template

Copy `docs/scaffolds/feature-spec.md` to `docs/specs/<work-item-id>-<slug>.md`. **Do not** modify the template in place.

### 4. Fill the header

Fill the YAML header with:
- `ctx:` — work-item title in 6–10 words
- `deps:` — known ADRs and prior specs the spec will cite
- `state: draft`
- `last:` — author and date
- `work-item:` — ID
- `size:` — XS/S/M/L/XL (XS will not reach this step)
- `author:` — Pat (or human/coordinator-in-proxy-mode)
- `canonical-on:` — `draft` (will become a date when human/proxy confirms)

### 5. Hand off to Pat

Pat is the authoring agent per [ADR-0004 § Ownership](../../docs/adrs/0004-feature-spec-artifact.md#3-ownership). Spawn Pat as a standalone agent to draft Outcomes, Scope (with AC citations), Constraints, Key Decisions (with ADR citations or "no ADR applies"), Task Breakdown, and Verification Plan.

If the human is unavailable (proxy mode) and the spec is non-architectural, the coordinator may author per ADR-0004 § Lifecycle step 3.

### 6. Trigger the Phase 2.5 pipeline

After Pat hands back a draft:

1. **Cam coherence pass** (mandatory, single-round) — pressure-test spec-vs-AC drift. If drift, return to Pat.
2. **Archie escalation** (conditional) — if any Key Decision touches cross-component interfaces, persistence, security, or external dependencies, Archie reviews. If Archie deems a Key Decision architectural, **stall the spec, open a new ADR, halt the work item until Accepted**.
3. **Tara verifiability gate** (mandatory) — confirm the Verification Plan is sufficient before red phase. If not, return for sharpening.

### 7. Become canonical

When Cam, (conditionally) Archie, and Tara have all approved AND the human (or Pat in proxy mode for non-architectural items) confirms, flip `state: draft` → `state: active` and set `canonical-on:` to today's date.

The work item may now enter Phase 3 (Tara red phase). Tara's hard backstop activates: Tara MUST refuse to author tests for any M+ item that has no spec link.

## Important

- Specs are append-only after canonical. Amendments use `## Amendment YYYY-MM-DD` sections per [ADR-0004 § Lifecycle](../../docs/adrs/0004-feature-spec-artifact.md#2-lifecycle).
- Scope bullets without AC citations are non-conformant.
- Key Decisions without ADR citations OR a "no ADR applies because…" declaration are non-conformant.
- Sato MUST NOT author the spec (per ADR-0004 § Alternative D rejection).
- Specs are *strictly additive* — never paraphrase ADRs, ACs, or tests.
