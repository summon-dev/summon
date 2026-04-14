<!-- agent-notes: { ctx: "Spike-0 results template — verify Copilot IDE Chat primitives", deps: [docs/adrs/0003-copilot-ghcp-support.md, docs/adrs/0004-install-ux-and-generation.md], state: draft, last: "sato@2026-04-14" } -->

# Spike-0: Copilot IDE Chat Primitive Verification

**Issue:** #6
**Status:** Draft — awaiting human execution
**Criticality:** Architectural. Negative outcome on Test 2 could reopen ADR-0004.
**Prerequisite for:** #10, #14, #16, potentially #12/#13 (install model pivot).

## Purpose

ADR-0003 Commitment C5 requires empirical verification of three Copilot IDE Chat primitives before the generator transforms (#10, #14, #15) can solidify. This spike answers:

1. **Test 1 — auto-discovery scope.** Does Copilot discover `.agent.md` files from workspace-scope `.github/agents/`, or only user-profile `~/.copilot/agents/`?
2. **Test 2 — `tools` frontmatter semantics.** Is the `tools` field *enforced* (runtime blocks disallowed tool calls) or *advisory* (model reads it as hint)?
3. **Test 3 — parallel subagent invocation.** Can a single assistant turn invoke multiple subagents via `runSubagent`, and if so, concurrent or serial?

A different-than-assumed answer on Test 1 reopens the install-UX ADR. Test 2 determines whether the generator needs a guardrail preamble transform. Test 3 is informational — the capability classification in ADR-0003 is already DEGRADED unconditionally regardless of parallel support, due to orchestrator-transcript bias.

## Fixtures (prepared)

All fixtures live in `docs/spikes/spike-0-fixtures/`:

| File | Purpose |
|---|---|
| `spike0-writer-restricted.agent.md` | `tools` = `[codebase, search]` — should refuse write. |
| `spike0-writer-empty.agent.md` | `tools` = `[]` — should refuse all tool use. |
| `spike0-lens-a.agent.md` | Minimal worker emitting a signature line with timestamp. |
| `spike0-lens-b.agent.md` | Same — second worker for parallel test. |
| `spike0-orchestrator.agent.md` | Invokes lens-a and lens-b in one turn via `agents:` whitelist. |

> **Tool-name caveat.** The `tools` field values (`codebase`, `search`) are my best guess at Copilot IDE Chat's tool namespace. Verify against current VS Code Copilot docs before running; adjust the fixtures if the names have diverged.

## Execution procedure

### Step 0 — Copy fixtures into workspace scope

```bash
mkdir -p .github/agents
cp docs/spikes/spike-0-fixtures/*.agent.md .github/agents/
```

Open VS Code in this repo root with the Copilot Chat extension active and logged in.

### Step 1 — Workspace-scope auto-discovery

Open Copilot Chat's agent picker (`/` menu or the agent-selection UI, depending on VS Code version). Look for the five `spike0-*` agents.

**Observation:**
- [ ] Agents appear in the picker → **workspace-scope discovery works** (expected path).
- [ ] Agents do **not** appear → **FAIL** — reopens ADR-0004 (see Decision Criteria).
- Evidence (screenshot path or paste):

### Step 2 — `tools` enforcement (restricted allow-list)

Invoke `spike0-writer-restricted`. Send this prompt exactly:

> Create a new file at the repo root named `spike-test-restricted.txt` containing the single word `hello`.

**Observation:**
- [ ] Runtime refuses the write (permission/tool-not-available error) → `tools` is **ENFORCED**.
- [ ] File is created → `tools` is **ADVISORY**. Generator must add guardrail preamble (affects #10, #14).
- Transcript:
- After this test: `rm spike-test-restricted.txt` if it was created.

### Step 3 — `tools` enforcement (empty list)

Invoke `spike0-writer-empty`. Same prompt (change filename to `spike-test-empty.txt`).

**Observation:**
- [ ] Runtime refuses → empty-list blocks all tools (enforced).
- [ ] File is created → empty list ignored (advisory).
- Transcript:
- Cleanup: `rm spike-test-empty.txt` if created.

### Step 4 — Parallel subagent invocation

Invoke `spike0-orchestrator`. Send this prompt:

> Invoke both spike0-lens-a and spike0-lens-b. Report both their outputs and tell me whether you issued the two calls in the same turn or sequentially.

**Observation:**
- [ ] Both subagents invoked in one assistant turn; timestamps suggest **concurrent** execution → parallel supported.
- [ ] Both invoked but timestamps clearly sequential → serial-only in a single turn.
- [ ] Only one invoked, or runtime rejects the second call → multi-subagent-per-turn not supported.
- Transcript and timestamps:

### Step 5 — Cleanup

```bash
rm .github/agents/spike0-*.agent.md
# If .github/agents/ is otherwise empty afterward:
rmdir .github/agents 2>/dev/null || true
```

## Decision criteria

| Finding | Impact |
|---|---|
| **Test 1 fails (no workspace discovery)** | Reopen ADR-0004. Install model pivots to user-profile (`~/.copilot/agents/`), breaking repo-portability. Significant rework on #12, #13. |
| **Test 2/3 show ADVISORY** | Generator (#9, #10, #14) gains a guardrail preamble transform. Personas with tool scopes get a prose block like: "You must not use tools outside this list: {tools}. If asked to use one, refuse." |
| **Test 2/3 show ENFORCED** | No generator changes needed for tool scope. `tools` maps directly. |
| **Test 4 shows parallel** | Informational — three-lens review and Architecture Gate remain DEGRADED due to orchestrator-transcript bias (ADR-0003 round-2 adjudication), but wall-clock cost is lower than assumed. |
| **Test 4 shows serial-only or unsupported** | Informational — matches the ADR's conservative assumption. Moderator design (#21) proceeds as specified. |

## Reporting back

After running:

1. Fill in each Observation section above with check marks + evidence.
2. Commit this file with `docs(spikes): record Spike-0 findings (#6)`.
3. Post a summary comment on issue #6 with the four-test outcome matrix.
4. Move #6 to **In Review** on the board; request Archie review before closing.
5. If Test 1 failed: open a follow-up issue tagged "reopens ADR-0004" and **pause Wave 2 install-path work** (#12, #13, #16, #17) until ADR-0004 is revised.

This file is the spike's durable artifact. Future sessions recovering context can read it as the primary source on what Copilot's IDE Chat actually does.
