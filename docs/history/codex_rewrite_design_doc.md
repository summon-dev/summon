---
agent-notes: { ctx: "Codex harness rewrite architecture and guardrails", deps: [CLAUDE.md, docs/process/done-gate.md, docs/process/team-governance.md, docs/adrs/0003-project-risk-tiers.md], state: draft, last: "codex@2026-07-15" }
---

# Codex Harness Rewrite Design

**Status:** Proposed design for a new, standalone repository

**Research baseline:** 2026-07-15

**Target:** Codex at High reasoning on the user's Sol-class entitlement, with no dependency on Ultra-only proactive delegation

**Primary objective:** Maximum safe autonomy for long-running coding work

**Document map:**

- Sections 1-4: decisions, goals, and scope
- Section 5: what Summon is trying to achieve and where its current mechanism stops
- Sections 6-13: authority, architecture, state, contracts, and run lifecycle
- Sections 14-20: scheduling, Git, guardrails, risk, recovery, context, and proof
- Sections 21-25: CLI, repository shape, build sequence, tests, and evaluation
- Sections 26-31: alternatives, risks, acceptance criteria, sources, and final recommendation

## 1. Executive Summary

Build a deterministic local control plane around Codex. The control plane, not a root agent, decides when to plan, delegate, retry, review, verify, and integrate. Codex workers remain responsible for the work that benefits from model reasoning: understanding a repository, proposing a plan, editing code, diagnosing failures, and reviewing semantics. Code owns authority.

The recommended v1 is a Python 3.12+ application using the young, version-sensitive official OpenAI Codex Python SDK through a narrow internal adapter when the Phase 0 security probe passes, with a direct app-server adapter as the expected fallback. It starts every mutating attempt in its own Codex engine process and containment domain, runs High-reasoning threads explicitly and concurrently, gives every attempt an isolated Git workspace, stores canonical state in SQLite, and accepts only schema-valid results. A worker's completion message is a claim. The supervisor independently derives the diff, runs trusted gates, records receipts tied to the exact candidate tree, obtains independent semantic review where required, and alone performs Git staging and publication.

Autonomy comes from pre-authorizing bounded, reversible actions and making their recovery deterministic. It does not come from giving an agent ambient host authority. Network access, package installation, Git ref mutation, credentials, remote APIs, and other external effects are unavailable to normal workers. They are exposed, where justified, through typed brokers with policy checks, idempotency keys, budgets, and explicit result records.

This is deliberately not a rewrite of Summon's 16 personas. Summon's durable contribution is accountable engineering: proof grades, adversarial review, risk-scaled process, independent verification, and a record of why. Its current implementation is a prompt and document distribution. The new harness turns those principles into an executing system.

The closest public reference architecture is OpenAI's [Symphony specification](https://github.com/openai/symphony/blob/4cbe3a9699a73b862466c0b157ceca0c1985d6d7/SPEC.md). Adopt its outer reconciliation loop, one workspace per work item, bounded concurrency, app-server runner, retry scheduling, and operator status surface. Treat this design as a hardened extension rather than a literal port: local SQLite state remains canonical, repository workflow text cannot grant authority, shell hooks are not trusted by default, tracker writes are brokered effects, and exact verification receipts precede publication.

## 2. Decision Summary

| ID | Decision | Rationale |
|---|---|---|
| D1 | Use a deterministic external supervisor | High/Sol must not depend on Ultra's proactive subagent behavior. Scheduling is a program decision. |
| D2 | Use Python 3.12+ and put the official openai-codex SDK behind CodexEngine, conditional on the Phase 0 security probe | AsyncCodex exposes structured output, lifecycle control, usage, and existing Codex authentication with less protocol code. Its public surface does not currently attest every required profile and approval control, so direct app-server may become the first production adapter. |
| D3 | Pin the SDK and bundled Codex runtime | The SDK and protocol are version-sensitive. Reproducibility requires exact versions, source-level compatibility checks, and runtime probes. |
| D4 | Use SQLite WAL with an append-only event log and rebuildable projections | It is sufficient for a local single-supervisor product, durable across crashes, inspectable, and operationally small. |
| D5 | Give each mutating attempt an isolated Git worktree | Shared mutable workspaces make parallel results untrustworthy. Isolation makes ownership, diff derivation, cancellation, and cleanup concrete. |
| D6 | Let only the supervisor mutate refs, commit, and integrate | A worker cannot hide changes, rewrite history, merge around a gate, or include another worker's edits. |
| D7 | Use schema-constrained model outputs plus code validation | A schema improves communication; deterministic validators decide whether a plan or result is admissible. |
| D8 | Treat completion as evidence over an exact tree | A green result for one tree says nothing about a changed tree. Gate receipts are content-bound and invalidated by integration changes. |
| D9 | Use a deny-first in-process PolicyGateway in v1 | Typed Python rules are easier to audit and test than introducing a second policy language immediately. Preserve an interface for Cedar or OPA later. |
| D10 | Keep ordinary workers offline and credential-free | External authority is isolated in brokers. Prompt injection in source text cannot directly become authority. |
| D11 | Avoid a general agent/team framework in v1 | LangGraph, AutoGen, CrewAI, and OpenHands solve broader or different problems. Keep the Codex-specific authority model explicit; retain a reversal path to a durable workflow kernel. |
| D12 | Target local Linux first | Codex sandbox behavior, process containment, worktree handling, and resource controls can be made dependable on one platform before adding portability. |
| D13 | Use Symphony as the orchestration compatibility baseline, not the security policy | Its reconciler/workspace/runner split is directly Codex-oriented and has been demonstrated internally by OpenAI. This design adds the durable state, internal DAG, policy, evidence, and integration boundaries that Symphony intentionally leaves open. |
| D14 | Ship a local per-user supervisor daemon before calling v1 production-ready | Crash recovery without automatic restart is only recoverability. Maximum autonomy requires an OS-restarted owner of wakeups, machine budgets, and active runs. |
| D15 | Disable native Codex Goals inside workers but benchmark them as a control | Goals are the strongest low-build long-running baseline; nesting them would create a second noncanonical scheduler and recovery state. |

## 3. Goals

### 3.1 Product goals

1. Complete low- and medium-risk repository tasks from one goal to a verified local integration candidate with no routine human interaction.
2. Work reliably with High-reasoning Codex even if a Codex thread never chooses to delegate.
3. Resume after a supervisor crash without repeating accepted work or an external effect.
4. Run useful work in parallel without sharing a writable checkout.
5. Make every state transition, model invocation, policy decision, artifact, gate, and integration action inspectable.
6. Bound tokens, turns, attempts, wall time, concurrency, output size, changed files, diff size, and external effects.
7. Escalate only decisions that are materially ambiguous, irreversible, privileged, or outside a pre-approved risk envelope.
8. Demonstrate whether it improves outcome quality and autonomous completion over both plain High Codex and native Codex Goals under comparable model and resource envelopes.
9. Retain a simple local installation and CLI. A user should not need Kubernetes, a workflow service, or a separate database.

### 3.2 Engineering goals

1. Make model output non-authoritative by construction.
2. Make state-machine invariants executable and property-tested.
3. Make every side-effecting activity idempotent or explicitly non-retriable.
4. Separate planning, execution, verification, and integration trust domains.
5. Keep interfaces ready for a stronger sandbox or distributed workflow backend without coupling v1 to either.
6. Allow a High-mode Codex implementation agent to build the system in small, testable vertical slices.

### 3.3 Definition of autonomy

For this system, autonomy means the ability to:

- clarify a goal through conservative assumptions when no material product fork exists;
- inspect the repository and derive a bounded plan;
- schedule and supervise multiple explicit Codex workers;
- diagnose failures and perform bounded repair or re-planning;
- validate and semantically review the result;
- publish a verified result to a dedicated local harness ref, or an exact patch for a dirty source, without changing the user's checkout;
- stop with a precise evidence package when it cannot proceed.

Autonomy does not mean unrestricted shell access, silent spending, production changes, or permission to reinterpret a denial.

## 4. Non-Goals for v1

- Production deployment, infrastructure mutation, payments, or other irreversible remote effects.
- Automatic pushes, pull requests, issue edits, or repository administration by default.
- Multi-user or multi-host scheduling.
- A hosted service.
- General-purpose chat between agents.
- Persona simulation or a fixed virtual-company roster.
- Arbitrary project-provided MCP servers, plugins, or skills.
- Full Windows and macOS containment parity.
- Perfect semantic correctness. The design improves evidence and independence; it cannot prove arbitrary programs correct.
- Replacing repository-native CI. The harness runs local gates and records evidence; CI remains a separate authority.
- A generic workflow DSL. The initial workflow is purpose-built for coding tasks.
- A mandatory issue tracker. Local CLI goals are the v1 WorkSource; Linear or GitHub can be added as adapters.

## 5. What the Current Summon Codebase Is Doing

### 5.1 Runtime shape

Summon describes itself as a virtual engineering team, but its shipped architecture is primarily a methodology distribution:

1. The scaffold CLI in [packages/summon-team/src/index.ts](../packages/summon-team/src/index.ts) downloads a template, removes Summon-development-only paths, customizes a few project files, and initializes Git.
2. [CLAUDE.md](../CLAUDE.md) supplies the coordinator with session rules, phase routing, board workflow, TDD expectations, review requirements, and the Done Gate.
3. Markdown files under .claude/agents define personas, tool lists, triggers, and report formats.
4. Markdown files under .claude/commands define workflows such as kickoff, planning, TDD, review, handoff, and sprint boundary.
5. Git, ADRs, tracking documents, handoff Markdown, and GitHub Projects act as distributed state.
6. A small executable core performs installation and selected checks: the portable [doctor](../packages/summon-team/src/doctor.ts), [canon checker](../scripts/check-canon.mjs), and [debt harvester](../scripts/harvest-debt.mjs).

There is no runtime scheduler, durable run state, typed task graph, lease manager, workspace isolator, policy engine, effect broker, retry controller, merge controller, or trace ledger. The repository states this boundary directly in [security-intake.md](process/security-intake.md): Summon emits documents and agents rather than executing them.

### 5.2 Actual product intent

The central goal is not raw throughput. [README.md](../README.md) targets solo developers and small teams who must maintain and explain the resulting software. Its core value is that missing decisions become discoverable, reversible, and attributable. The human remains product owner and final risk authority.

The rewrite should carry that intent forward as **accountable autonomy**:

- autonomous on reversible, bounded engineering work;
- conservative at trust boundaries;
- explicit about uncertainty;
- able to show what happened and why;
- unable to declare its own evidence sufficient.

### 5.3 Ideas to preserve

| Summon idea | Rewrite form |
|---|---|
| Proof grades: deterministic, inferential, human judgement | Typed gate kinds and receipts; only deterministic receipts can be mechanically passed |
| Adversarial architecture debate | Independent planner critic with a required point-by-point disposition |
| Independent review lenses | Fresh, read-only review threads selected by change triggers |
| Treat agent output as untrusted | Worker results are claims; the supervisor derives artifacts and runs checks |
| Risk-scaled workflow | Deterministic hazard classifier that can only be raised by model review |
| Unknown hazards fail closed | Unknown capability or effect is denied or escalated |
| Retros encode recurring judgement as sensors | Failure taxonomy and promotion path from advisory finding to executable gate |
| Negative controls | Gate tests include deliberately bad fixtures and mutations |
| ADR and decision provenance | Run decisions and optional generated ADRs link to event and artifact IDs |
| Canon/meta separation | Harness code and state live outside the target; project configuration is pinned and protected |
| Budget-matched evaluation | Compare against plain Codex with the same model, effort, and resource envelope |

### 5.4 Limitations to replace

1. **Prompt-only gates.** The same coordinator that performs work is expected to remember to invoke its checks.
2. **Shared worktree parallelism.** Non-overlap is suggested in prose, not enforced by leases or isolation.
3. **Self-authored completion evidence.** Sentinels and reports are produced by the worker they are intended to validate.
4. **No canonical run record.** GitHub state, sprint documents, handoffs, ADRs, and the working tree can disagree.
5. **No crash semantics.** There is no durable attempt ownership, idempotency record, or replay rule.
6. **Routine human checkpoints.** Maximum autonomy is incompatible with a human driving ordinary transitions.
7. **Capability drift.** Accepted designs, advertised commands, implemented behavior, and health checks can diverge.
8. **Unversioned installation input.** A package version can download a different live template.
9. **Advisory path restrictions.** A role with a broad write or shell tool can ignore prose about allowed paths.
10. **No run-level cost or progress control.** Some agent definitions set maxTurns, but there is no hierarchical budget reservation, aggregate usage ledger, hard process limit, or stall detector.

These are architectural findings, not a request to repair this repository. The proposed system belongs in a separate repo.

### 5.5 Drift as design evidence

The audit found examples of why capability and gate state must be executable:

- the installer advertises an add command whose accepted multi-runtime design remains unimplemented;
- the executable doctor, slash-command doctor, and canon checker cover different invariants;
- the accepted risk-tier ADR still describes future wiring rather than live policy;
- the Done Gate requires checks that are not all exposed as working project commands;
- the installed package version can fetch an unpinned live template;
- review counts and phase descriptions are duplicated across Markdown and have drifted.

Individual defects are repairable. The architectural lesson is that declared, accepted, implemented, enabled, and verified are different states. The rewrite keeps a machine-readable capability registry and generates user-visible availability from it.

## 6. Design Principles

1. **Code grants authority; models propose.**
2. **Completion is a state derived from receipts, not a word in a response.**
3. **Every writer is isolated; every integration is serialized.**
4. **Capabilities only narrow as they are delegated.**
5. **External effects are typed activities, never arbitrary worker shell commands.**
6. **The candidate tree is the unit of truth.**
7. **Fresh context is an independence control, not merely a token optimization.**
8. **Retry only what is known to be safe to repeat.**
9. **Unknown state is different from failure.**
10. **Risk can be raised by a model but never lowered below deterministic policy.**
11. **Project input is data, not instruction with authority over the harness.**
12. **The simple path stays simple.** Small changes should not summon a committee.
13. **A recurring inferential check should become a sensor when feasible.**
14. **Version-sensitive integrations fail closed at startup.**

## 7. Trust and Authority Model

### 7.1 Actors

| Actor | Trusted for | Never trusted for |
|---|---|---|
| Human owner | Product intent, irreversible approvals, policy expansion | Routine state bookkeeping |
| Supervisor | State transitions, scheduling, budgets, policy enforcement, Git integration | Semantic correctness by itself |
| Codex planner | Repository reasoning and proposed task decomposition | Scheduling, permissions, final task set |
| Codex worker | Candidate edits and diagnostic reasoning | Scope, completion, Git history, external authority |
| Codex reviewer | Semantic findings and risk escalation | Mechanical gate results, approval, merge |
| Gate runner | Executing a pinned command in a sandbox | Interpreting product intent |
| Effect broker | One typed external capability | General shell access |
| Research broker | Fetching public evidence from a typed, source-blind request | Reading repository bytes or proposing authority |
| Target repository | Source, tests, owner-authored conventions | Expanding global permissions or changing harness state |
| Web/tool output | Factual input with provenance | Instructions, authorization, or policy |

### 7.2 Authority rules

- Only the supervisor may transition canonical run, task, attempt, effect, or integration state.
- Only the supervisor may create commits, update refs, integrate patches, or mark a task accepted.
- Only the supervisor capability issuer may mint a token, and only from a current PolicyGateway ALLOW decision plus a durable budget reservation.
- A child capability set is always the intersection of parent policy, task contract, sandbox support, and remaining budget.
- A planner may add scoped checks. It cannot remove user criteria, repository-required gates, or harness defaults.
- A worker may request an effect. It cannot execute, approve, or widen one.
- A reviewer may raise risk or block a semantic gate. It cannot lower deterministic risk or waive a failed command.
- The human can approve an explicit high-risk decision. A human approval does not waive unrelated invariants.

### 7.3 Threat model

The design assumes:

- repository text, issues, generated files, dependency metadata, and web content may contain prompt injection;
- a worker can be mistaken, manipulative, truncated, stalled, or inconsistent;
- commands in a repository may be malicious;
- a process can crash at any transition;
- package registries and remote APIs can time out after applying an operation;
- multiple attempts can finish after their lease has expired;
- the target checkout can change while a run is active;
- the Codex SDK and protocol can change between releases.

The design does not claim that an ordinary workspace sandbox safely executes arbitrary hostile native code. High-risk untrusted repositories require a stronger runner tier.

## 8. System Architecture

<pre>
User / CLI / optional WorkSource
    |
    v
Trusted Supervisor
    |
    +-- Goal compiler and deterministic risk classifier
    +-- State machine / event transaction
    +-- DAG scheduler / leases / budgets
    +-- PolicyGateway
    +-- Context builder / artifact store
    +-- Git workspace and integration manager
    +-- Verification and review coordinator
    +-- Effect brokers
    |
    +---------------------+-----------------------+
    |                     |                       |
    v                     v                       v
CodexEngine          Sandboxed runners       SQLite + blobs
    |                     |                       |
    +-- planner threads   +-- trusted gates       +-- events
    +-- worker threads    +-- dependency broker   +-- projections
    +-- review threads    +-- browser/E2E later   +-- receipts
    +-- repair threads                            +-- model artifacts
    |
    v
Isolated read snapshots or per-attempt Git worktrees

Only the supervisor can cross from candidate work into Git integration.
</pre>

### 8.1 Process boundaries

The supervisor process holds:

- the SQLite connection;
- the canonical event sequence;
- access to harness state;
- Git integration authority;
- global policy and trusted project-policy snapshots;
- broker credentials, when a broker is enabled.

A normal Codex worker process receives:

- one task contract;
- one isolated workspace;
- a minimal environment;
- read-only repository instructions;
- a sandbox profile;
- no broker credentials;
- no write access to harness state, Git metadata, policy, or gate receipts;
- no read access to host credentials, user configuration, or paths outside its explicit profile;
- no network by default.

The first real-worker release must use a tested custom Permission Profile that restricts command reads as well as writes. Legacy workspace-write alone is not sufficient because write protection does not prove that host secrets are unreadable. The attempt has two nested execution domains: the engine control process can reach only the required OpenAI endpoint and hidden auth material, while command children run under a kernel-enforced no-network, secret-free filesystem profile and a different privilege identity. Both belong to one outer attempt kill domain. Merely putting engine and commands in one container or namespace is not separation. Stronger tiers move the command domain into rootless OCI, gVisor, a microVM, or a remote sandbox while preserving this split.

## 9. Technology Stack

### 9.1 Recommended v1

- **Language:** Python 3.12 or newer.
- **Packaging:** uv with a locked pyproject.toml.
- **Codex integration:** exact-pinned openai-codex package using AsyncCodex only if the security probe passes; otherwise a generated-schema app-server client.
- **Codex execution policy:** harness-generated least-privilege Permission Profiles, with project security configuration isolated or rejected.
- **Models and validation:** Pydantic v2 and generated JSON Schema.
- **Storage:** stdlib sqlite3 in WAL mode; content-addressed artifacts on disk.
- **CLI:** Typer.
- **Service:** one per-user daemon with an owner-only Unix socket and a systemd user unit on initial Linux support; foreground mode remains for development.
- **Concurrency:** asyncio supervised task wrappers, TaskGroup only within one attempt lifecycle, semaphores, and explicit cancellation.
- **Logging:** structured JSON through structlog or a minimal stdlib adapter.
- **Testing:** pytest, pytest-asyncio, and Hypothesis.
- **Git:** the Git CLI through create_subprocess_exec with argv arrays; no shell interpolation and no Git abstraction layer in v1.
- **Telemetry:** local structured events first; optional OpenTelemetry export later.

### 9.2 Why the Python SDK

At the research baseline, the official [Codex Python SDK](https://github.com/openai/codex/blob/2e1607ee2fa8099a233df7437adee5f16a741905/sdk/python/README.md) is young and version-sensitive but exposes much of the desired control surface:

- AsyncCodex and multiple active turns;
- thread start and lower-level lifecycle operations;
- run and lower-level turn handles;
- streaming, steering, and interruption;
- structured output schemas;
- model, effort, sandbox, and approval overrides;
- token usage and existing Codex authentication.

It does not document a custom approval callback, effective Permission Profile attestation, or a generic runtime capability API. Its environment option overlays the launching process environment rather than replacing it. These are launch-boundary requirements, not details the adapter may infer away. The Phase 0 probe must therefore inspect the exact pinned source and runtime, derive a harness-owned compatibility report from version metadata, initialize responses, model/config probes, and canary executions, and select direct app-server if any required fact cannot be proven.

The SDK must sit behind this interface:

~~~python
class CodexEngine(Protocol):
    async def capabilities(self) -> EngineCapabilities: ...
    async def start(self, spec: ThreadSpec) -> ThreadRef: ...
    async def run(self, thread: ThreadRef, turn: TurnSpec) -> TurnOutcome: ...
    async def steer(self, turn_id: str, message: str) -> None: ...
    async def interrupt(self, turn_id: str) -> None: ...
    async def close(self, thread: ThreadRef) -> None: ...
~~~

No domain module may import openai_codex directly. This keeps the dependency replaceable.

### 9.3 Version and capability discipline

Pin all of the following:

- openai-codex package version and artifact hash;
- bundled or selected Codex runtime version;
- expected stable protocol fingerprint;
- supported model capabilities;
- known sandbox and approval behavior.

On startup, the engine adapter must:

1. verify a signed or locally authenticated qualification record for the exact SDK, Codex runtime, OS, kernel, architecture, runner, sandbox profile, and policy fingerprint; reject an absent, failed, or stale record;
2. derive a compatibility report from pinned version metadata, initialize responses, schema fingerprints, model/config probes, and harness canaries rather than assuming a native capabilities() API;
3. run a cheap structured-output probe;
4. verify custom least-privilege read, write, deny, and network behavior with canary paths;
5. verify the configured no-escalation approval policy;
6. reject unsupported or unknown capability combinations;
7. inspect the effective configuration after all precedence layers load;
8. prove project configuration did not replace the selected permission mechanism;
9. record the fingerprint in the run.

Qualification runs the full real-runtime contract and adversarial suite during release packaging or explicit runtime onboarding. Its signed/cacheable record has a short policy-defined validity and is invalidated by any fingerprint change. Cheap startup canaries complement it; they do not replace it.

The model name must come from the runtime model catalog and user configuration. Do not encode Sol as an assumed API model slug.

### 9.4 Fallback and reversal trigger

Build a direct stdio client for the [Codex app-server](https://github.com/openai/codex/blob/2e1607ee2fa8099a233df7437adee5f16a741905/codex-rs/app-server/README.md) if the Phase 0 spike proves the Python SDK cannot provide and attest every one of these required controls:

- deterministic no-escalation approval behavior;
- concurrent turn routing;
- structured outputs;
- reliable interrupt and shutdown;
- sandbox selection;
- selection and enforcement of a least-privilege Permission Profile;
- token usage;
- stable authentication reuse;
- sufficient configuration isolation.

A direct client must generate schemas from the pinned runtime during the build and treat bounded-ingress errors with jittered backoff. Its protocol gateway uses a default-deny allowlist for RPC methods, notifications, fields, sandbox modes, and configuration keys. It must reject unknown methods and fields, host-unsandboxed process/spawn, full-access modes, arbitrary environment injection, capability disabling, and config, policy, plugin, or credential mutation. Sandboxed command/exec with a validated argv vector may be allowed; arbitrary or unknown command surfaces may not. Do not adopt experimental websocket transport.

[Permission Profile selection through app-server](https://github.com/openai/codex/blob/2e1607ee2fa8099a233df7437adee5f16a741905/codex-rs/app-server/README.md) has two explicit paths, chosen by the Phase 0 probe and recorded in the qualification fingerprint:

1. **Pinned configuration path:** put one harness-generated default profile in the private CODEX_HOME, prevent project/user precedence from changing it, read back the resolved configuration, and attest behavior with filesystem and network canaries.
2. **Experimental protocol path:** only when per-thread selection is required and the pinned runtime exposes it, set `capabilities.experimentalApi=true`, generate and pin both stable and `--experimental` schema bundles, allowlist the exact profile fields on `thread/start` and `turn/start`, and attest the effective profile. Unknown or moved experimental fields fail startup.

Never send experimental profile fields under a stable-only schema, infer success from an accepted request, or fall back to a broader default. Prefer the pinned configuration path when it can prove the same least-privilege result; use direct experimental control only as a consciously version-locked dependency with its own reversal test.

The TypeScript SDK is too thin for the control-plane role. Rust plus direct app-server would provide tighter type and process control, but it would materially raise implementation cost for a High-mode build. It remains a valid later hardening path for the runner or engine adapter.

### 9.5 Symphony compatibility

Preserve these language-neutral component contracts from Symphony:

- WorkSource: discover eligible goals and reconcile cancellation or priority changes;
- WorkflowLoader: load trusted project defaults and non-authoritative prompt context;
- Orchestrator: reconcile desired work with active durable runs;
- WorkspaceManager: create, validate, preserve, and clean isolated workspaces;
- AgentRunner: start the pinned Codex engine, stream events, and stop it;
- StatusSurface: expose active work, retry state, usage, and errors.

Depart deliberately:

| Symphony v1 choice | This design |
|---|---|
| Tracker and filesystem recovery; exact in-memory state is not restored | SQLite event history and rebuildable projections |
| One issue maps to one continuing agent workspace | One goal maps to an internal validated DAG with a workspace per mutating attempt |
| Repository WORKFLOW.md includes runtime config, prompts, commands, and hooks | Repository config is pinned input that can narrow policy; executable hooks are disabled unless separately trusted |
| Agent commonly writes ticket state, comments, and PR links | Supervisor-owned typed brokers perform tracker and remote effects |
| Safety, approval, and sandbox posture are implementation-defined | Least-privilege profile and deny-first policy are launch preconditions |
| Shell command strings and arbitrary workspace hooks are conforming | Supervisor and gates use typed argv or reviewed adapters; arbitrary hooks are not accepted |
| App-server payload compatibility may tolerate equivalent shapes | Runtime and schemas are pinned; unknown authority-bearing fields fail closed |
| No required VCS workflow or exact completion proof | Supervisor-owned Git objects and exact-tree receipts |

The internal state machine governs authority and recovery boundaries, not the worker's reasoning steps. Workers receive outcome objectives and can reason flexibly inside their task contract. This keeps Symphony's objective-oriented lesson without putting merge, credentials, or completion inside a model context.

## 10. Canonical State

### 10.1 Storage location

Store state outside every target and worker workspace:

<pre>
$XDG_STATE_HOME/codex-harness/
  control.db
  projects/&lt;repo-id&gt;/
    state.db
    artifacts/
    worktrees/
    logs/
    locks/
$XDG_RUNTIME_DIR/codex-harness/control.sock
</pre>

The per-user daemon also owns an owner-only control database and socket under $XDG_STATE_HOME and $XDG_RUNTIME_DIR. The control database contains only cross-project reservations, wakeups, daemon instance identity, and project registry; project events remain in their project database. Socket requests carry idempotent request IDs, validate peer UID, and never accept raw projection edits.

The repo ID is derived from the canonical repository path plus an initialization nonce. Moving a repo requires an explicit relink operation.

Project configuration may live at .codex/harness.toml for portability, but the supervisor stores and hashes the trusted snapshot. A project file can narrow policy or add gates; it cannot widen immutable or global limits without a separate user trust action. Workers cannot edit .codex.

Create state directories with mode 0700, create data files with mode 0600, open files without following symlinks, and keep the database, WAL, artifacts, and logs unreadable to worker profiles. Write an artifact to an attempt-owned temporary file, fsync it, hash it, atomically move it into the content-addressed store, fsync the destination parent directory, then reference it from an event. Orphaned complete artifacts are safe for garbage collection; an event never points at a partial write.

### 10.2 Event log

The events table is append-only:

| Column | Meaning |
|---|---|
| sequence | Monotonic local order |
| event_id | Globally unique ID |
| run_id | Owning run |
| aggregate_type / aggregate_id | Run, task, attempt, effect, or integration |
| aggregate_version | Compare-and-swap transition version |
| event_type | Versioned event name |
| occurred_at | Supervisor timestamp |
| actor | Human, supervisor, engine thread, gate runner, or broker |
| causation_id / correlation_id | Trace lineage |
| payload_json | Schema-versioned event body |
| payload_hash | Integrity and deduplication |
| previous_event_hash / event_hash | Optional local tamper-evident chain |

The chain is tamper-evident, not tamper-proof. Host compromise is outside the local database's guarantees.

Every event type has a closed payload schema. Before the append transaction, an ingress sanitizer scans free text and structured values, replaces durable sensitive text with a content-addressed redacted artifact reference, and retains only keyed hashes where correlation is required. A raw user goal, human answer, effect argument, model message, or tool payload is never placed directly in `payload_json`; an explicitly retained raw value goes only to the encrypted TTL vault and the event holds its vault handle and audit metadata. Projections copy only already-sanitized typed fields and references. Schema validation rejects unexpected free-form fields, and tests inspect the database, WAL, projections, logs, and ordinary artifact store for secret canaries after every ingress path.

Enforce application-level append-only behavior through the repository API, SQLite set_authorizer in ordinary mode, and triggers that reject event updates or deletes. OS file permissions protect the database from workers; SQLite has no table-level user permissions. Schema migrations use an explicit maintenance mode and produce their own backup and audit record. Configure foreign keys, a busy timeout, WAL with `synchronous=FULL`, and a single per-project writer lock. Run SQLite work on a dedicated writer thread or async adapter so synchronous database calls never block the model event loop.

### 10.3 Rebuildable projections

Use ordinary tables for efficient reads, updated in the same SQLite transaction as each appended event:

- projects and trusted_config_snapshots;
- capabilities with declared, implemented, enabled, and last-probed status;
- runs and goal_contracts;
- tasks, dependencies, and path_claims;
- attempts, leases, heartbeats, and Codex thread IDs;
- workspace_snapshots and integration candidates;
- artifacts and content hashes;
- gate_specs, gate_runs, and receipts;
- reviews and finding dispositions;
- effect_requests, authorizations, executions, and reconciliations;
- budget_accounts, reservations, and settlements;
- policy_decisions;
- human_questions and answers.

At any time, a doctor command must be able to rebuild projections from events and compare them with the stored projections.

CLI help and feature discovery read the same capability registry. A feature cannot be advertised as available unless its adapter is implemented, startup-probed where necessary, and enabled by effective policy.

### 10.4 Transaction rule

Every meaningful action follows:

1. load aggregate at version N;
2. validate transition and policy;
3. append event at N + 1;
4. update projection;
5. commit;
6. perform a leased external activity if required;
7. append the activity result.

An external activity is never hidden inside the same conceptual transition as its request.

The durability claim includes host reboot and power loss on an attested local filesystem, not only Python-process crashes. Reject network filesystems and storage whose file, directory, rename, lock, or `fsync` semantics have not passed the backend probe. Authority-bearing writes follow this stable order:

1. write and `fsync` already-produced input artifacts and their containing directories, then verify hashes;
2. commit the activity intent or GitObjectRequest under SQLite `synchronous=FULL` and confirm the transaction;
3. for a GitObjectRequest, create and `fsync` the object closure and directories, verify reachability and the expected object ID, then durably record its result before any publication can name it;
4. dispatch the external effect, ref compare-and-swap, or patch promotion only after every referenced input is durable;
5. durably synchronize the Git ref and reflog or promoted artifact plus its parent directory before reporting local publication success; remote effects rely on their idempotency and reconciliation contract;
6. commit the result receipt under `synchronous=FULL`.

The constrained Git adapter configures and probes the pinned Git release's object and reference fsync support and independently verifies the intended object/ref after synchronization. If a platform cannot attest that order, publication and remote effects are unavailable there. VM-backed power-cut tests exercise each boundary; process-kill tests alone are insufficient for the production durability claim.

### 10.5 Cross-database budget reservations

The per-user daemon's control.db is canonical for user-global capacity; each project database is canonical for its run, task, and attempt accounts. Do not pretend the two SQLite files share an atomic transaction. Use a leased, idempotent reservation handshake:

1. append a project BUDGET_RESERVATION_PREPARED event with a globally unique reservation ID; this does not authorize activity;
2. reserve global capacity in control.db under that ID with project/run identity, amount, daemon epoch, and a short expiry;
3. append GLOBAL_RESERVATION_LINKED in the project log with the control reservation version;
4. activate the control reservation by compare-and-swap, binding the project event ID and hash;
5. append BUDGET_RESERVATION_ACTIVATED only after reading the active control record back;
6. start activity only from the activated project event, then renew the lease while its fenced attempt is live;
7. record project usage/result first, settle or release control capacity idempotently, then append the linked project settlement.

On restart, PREPARED without a control reservation is released; RESERVED without a link expires; LINKED without ACTIVE is reacquired or released; ACTIVE is kept only when the referenced project event, attempt epoch, and live kill domain agree. Otherwise the attempt is fenced and capacity is conservatively held until reconciliation or expiry. The systemd unit uses control-group kill semantics so a dead daemon cannot leave an unaccounted engine running. This protocol may temporarily reduce available capacity after a crash, but it cannot create capacity or authorize an activity before both ledgers agree.

## 11. State Machines

### 11.1 Run state

<pre>
QUEUED -> INTAKE
INTAKE -> EXPLORING -> PLANNING
INTAKE -> PLANNING for the validated small-task fast path
PLANNING
  -> CONTRACTING
  -> EXECUTING
  -> VERIFYING
  -> PUBLISHING
  -> FINALIZING
  -> SUCCEEDED

Repair and control transitions:
  EXPLORING | PLANNING | CONTRACTING | EXECUTING | VERIFYING
    -> REPLANNING -> PLANNING
  VERIFYING -> EXECUTING for a contract-preserving repair
  PUBLISHING -> VERIFYING when publication preconditions become stale before the publication activity is dispatched
  any resumable active state -> AWAITING_HUMAN | PAUSED
  AWAITING_HUMAN | PAUSED -> suspended_from after revalidation

Terminalization transitions:
  any active state -> FINALIZING with requested_status=BLOCKED | FAILED | BUDGET_EXHAUSTED
  any pre-finalizing nonterminal state -> CANCELLING
  CANCELLING -> FINALIZING with requested_status=CANCELLED | CANCELLED_WITH_UNKNOWN_EFFECT
  FINALIZING -> requested terminal status only after closure prerequisites pass
</pre>

Small tasks may skip EXPLORING and the second planner pass, but never skip contract validation or required gates.

PAUSED records suspended_from and resumes only to that state after the pause reason, leases, budgets, config, target snapshot, and effect status are revalidated. AWAITING_HUMAN is not an authority limbo: independent work may continue, while the blocked transition remains fenced. FINALIZING grants no new work or effect leases; it retries only cleanup, settlement, reconciliation, and closure-object persistence after a crash.

### 11.2 Task state

<pre>
PROPOSED -> VALIDATED -> READY -> LEASED -> RUNNING -> CANDIDATE
CANDIDATE -> VERIFYING -> ACCEPTED -> STAGED

Brokered-input branch:
  RUNNING -> AWAITING_EFFECT
  AWAITING_EFFECT -> READY after a bound effect receipt, rematerialized environment, and revalidation
  AWAITING_EFFECT -> NEEDS_REPLAN | BLOCKED | FAILED | CANCELLED

Repair and re-plan branches:
  CANDIDATE | VERIFYING -> NEEDS_REPAIR | NEEDS_REPLAN
  NEEDS_REPAIR -> SUPERSEDED plus a versioned replacement task in READY
  NEEDS_REPLAN -> SUPERSEDED plus a replacement plan version
  ACCEPTED | STAGED -> SUPERSEDED only through an invalidating replacement transaction

Failure and control branches:
  LEASED | RUNNING -> RETRYABLE_FAILED -> READY
  any nonterminal state -> BLOCKED | FAILED | CANCELLED
  BLOCKED -> READY after its typed blocking condition changes and the contract is revalidated
  BLOCKED -> SUPERSEDED | FAILED | CANCELLED
</pre>

STAGED means the accepted candidate has been serially incorporated into the run's integration tree while the run remains EXECUTING. It is not publication to a user branch. A dependent task bases from the staged parent tree. Repair never mutates a staged task in place: a new task version names replaces_task_id, the old version becomes SUPERSEDED, and the supervisor invalidates every descendant attempt, analysis artifact, environment, and receipt whose base contains the old parent before rebuilding the replacement lineage.

### 11.3 Attempt state

<pre>
CREATED -> LEASED -> STARTING -> RUNNING -> QUIESCING -> CAPTURED -> SUCCEEDED

Terminal or retry branches:
  STARTING | RUNNING | QUIESCING -> RETRYABLE_FAILED | FATAL_FAILED
  any nonterminal state -> FENCED | CANCELLED
</pre>

Cleanup from STARTING onward executes in a supervisor finally path. An attempt cannot reach CAPTURED until its lease is fenced for writes, its engine has stopped, and its containment domain is empty.

### 11.4 Effect state

<pre>
PROPOSED
  -> POLICY_CHECKED | CANCELLED
POLICY_CHECKED
  -> AUTHORIZED | AWAITING_HUMAN | DENIED | EXPIRED | CANCELLED
AWAITING_HUMAN
  -> POLICY_CHECKED after one valid answer is consumed
  -> DENIED | EXPIRED | CANCELLED
AUTHORIZED
  -> EXECUTING | EXPIRED | CANCELLED
EXECUTING
  -> SUCCEEDED | FAILED | UNKNOWN
  -> UNKNOWN when cancellation is requested after dispatch
UNKNOWN
  -> RECONCILING -> SUCCEEDED | FAILED | UNRESOLVED_AFTER_CANCELLATION
</pre>

UNKNOWN is not retried blindly. The broker first checks the remote system using the idempotency key or asks the human if reconciliation is impossible.

UNRESOLVED_AFTER_CANCELLATION is terminal for the effect but not evidence that nothing happened. The run mirrors it as CANCELLED_WITH_UNKNOWN_EFFECT. The effect remains visible in the RunClosureManifest and reconciliation queue; cancellation never waits forever on an unreachable remote system.

### 11.5 Human decision state

<pre>
REQUESTED -> ANSWERED | EXPIRED | CANCELLED
ANSWERED -> CONSUMED | REJECTED_STALE
</pre>

A human answer is bound to the question digest, run and task versions, requested operation, evidence hash, authorizing identity, and expiry. In one transaction, the supervisor validates it, marks it CONSUMED, and returns the blocked aggregate to POLICY_CHECKED; authorization is still a new policy decision. A changed tree, policy, risk tier, operation, or budget marks the answer REJECTED_STALE rather than carrying authority forward.

### 11.6 Required invariants

1. SUCCEEDED is derivable only when every required gate passed against the exact current integration tree.
2. Changing the integration tree invalidates every receipt not explicitly reusable for the new tree.
3. A dependency task is runnable only if the staged integration SHAs of its dependencies are ancestors of its worker base.
4. One fenced lease epoch owns an attempt. Results from an expired epoch cannot advance state or integrate.
5. Active mutating leases may not have overlapping owned path sets unless they are deliberately serialized.
6. A child capability set is a subset of its parent and task policy. Retry and re-plan cannot widen it.
7. A gate receipt is keyed by the full candidate tree or commit hash, sanitized execution-view manifest, opaque carry-forward manifest, command hash, gate-config hash, environment hash, runner version, and relevant input hashes.
8. The event log is append-only and model-authored summaries are noncanonical.
9. No model event directly creates an authorization, receipt, commit, or accepted state.
10. Budget reservation precedes activity start. Settlement never allows the account to go below its hard floor.
11. At most one integration lease exists per run.
12. Clean-source publication uses no-dereference atomic compare-and-swap to a direct dedicated harness ref; dirty-source publication uses an atomically promoted exact patch from a private object store. Neither path autonomously updates the user's branch, index, or working tree.
13. Deterministic risk is recomputed over each captured candidate and each staged or final cumulative tree; risk may rise but never fall without a new explicitly authorized run contract.
14. A candidate tree is captured only after its per-attempt containment domain is empty and the source has been made immutable.
15. A SUPERSEDED required task is complete only when its replacement chain reaches STAGED or a validated newer plan reassigns every acceptance obligation to tasks that reach STAGED.
16. A worker or gate may use only an EnvironmentReceipt whose source tree, lockfiles, setup inputs, required executables, and gate set match its exact contract.
17. Every terminal run event references an immutable RunClosureManifest; SUCCEEDED additionally requires a VerificationManifest and PublicationReceipt.

## 12. Structured Contracts

All model-facing contracts are Pydantic models exported as strict JSON Schema. Reject unknown fields for authority-bearing objects. Store a redacted raw-output artifact separately from its parsed representation; unredacted retention follows the optional encrypted-vault policy in Section 16.6.

### 12.1 GoalContract

~~~json
{
  "objective": "Observable outcome, not an activity",
  "constraints": ["Must preserve existing CLI behavior"],
  "acceptance_criteria": [
    {
      "id": "AC-1",
      "claim": "The new behavior is covered by a regression test",
      "proof_kind": "deterministic"
    }
  ],
  "assumptions": [
    {
      "text": "Linux is the initial target",
      "reversibility": "easy",
      "confidence": "high"
    }
  ],
  "out_of_scope": ["Production deployment"],
  "risk_hints": ["dependency_change"],
  "target_ref": "recorded by supervisor"
}
~~~

The goal compiler may ask a human only when two plausible interpretations lead to materially different, costly, or irreversible outcomes. Otherwise it chooses the safer reversible assumption and records it.

### 12.2 Plan and task contract

A planner proposes:

~~~json
{
  "tasks": [
    {
      "id": "task-fix",
      "objective": "Implement the reported behavior and add a regression test",
      "dependencies": [],
      "mode": "mutating",
      "owned_paths": ["src/**", "tests/**"],
      "read_paths": ["src/**", "tests/**"],
      "acceptance_criteria": ["AC-1"],
      "suggested_checks": [
        {"argv": ["pytest", "-q", "tests/test_case.py"], "cwd": "."}
      ],
      "capabilities": ["repo_read", "workspace_write", "command_exec"],
      "risk_flags": [],
      "expected_artifacts": ["patch", "worker_result"],
      "budgets": {
        "turns": 6,
        "attempts": 2,
        "wall_seconds": 1200,
        "changed_files": 6
      }
    }
  ]
}
~~~

Code validates:

- IDs and dependency references;
- acyclicity;
- acceptance coverage;
- path normalization, symlinks, and protected paths;
- write-set overlap;
- capability availability and inheritance;
- risk triggers;
- task and run budgets;
- concurrency limits;
- command argv syntax;
- whether a smaller serial plan is preferable.

Planner commands are suggestions. Trusted gates are the union of harness defaults, user criteria, and pinned project gates. A planner may add checks after command-policy validation but cannot redefine the trusted set.

For a regression fix, the supervisor may create a DifferentialRegressionReceipt. It stages the test-only portion on the recorded bad base in an isolated verification environment, proves the targeted check fails there for the expected reason, then proves the same check passes on the candidate. The red tree is evidence only: it is never an accepted task, never staged into the integration tree, and never supplied as a dependency base. If a reliable test-only split is not possible, the final passing receipt remains required and the reproduction is inferential evidence.

### 12.3 WorkerResult

~~~json
{
  "status": "candidate",
  "summary": "Implemented the narrow behavior and added regression coverage",
  "claimed_files": ["src/module.py", "tests/test_module.py"],
  "checks_attempted": [
    {
      "argv": ["pytest", "-q", "tests/test_module.py"],
      "reported_exit_code": 0
    }
  ],
  "acceptance_claims": [
    {"criterion_id": "AC-1", "claim": "covered", "evidence_hint": "test name"}
  ],
  "issues": [],
  "requested_effects": [],
  "follow_up": null
}
~~~

The supervisor ignores claimed files and reported exit codes for authority. It independently computes the actual changed paths and executes the required checks.

### 12.4 ReviewResult

~~~json
{
  "verdict": "changes_required",
  "findings": [
    {
      "id": "finding-1",
      "severity": "important",
      "category": "correctness",
      "path": "src/module.py",
      "line": 42,
      "claim": "This branch loses the previous fallback",
      "evidence": "The caller can pass an empty value",
      "suggested_check": "Add a regression case for an empty value"
    }
  ],
  "residual_risks": [],
  "risk_escalations": []
}
~~~

A semantic review is inferential. Its schema makes findings actionable and auditable; it does not turn the model into a deterministic oracle.

### 12.5 GateReceipt

~~~json
{
  "gate_id": "pytest-required",
  "proof_kind": "deterministic",
  "candidate_tree": "sha256-or-git-tree",
  "execution_view_manifest": "sha256",
  "opaque_carry_forward_manifest": "keyed-sha256",
  "argv_hash": "sha256",
  "config_hash": "sha256",
  "environment_hash": "sha256",
  "runner_digest": "sha256",
  "started_at": "timestamp",
  "duration_ms": 1234,
  "exit_code": 0,
  "stdout_artifact": "artifact-id",
  "stderr_artifact": "artifact-id",
  "writable_delta_hash": "sha256",
  "result": "passed"
}
~~~

### 12.6 EffectRequest

~~~json
{
  "kind": "dependency_resolve",
  "resource": "pypi:example-package",
  "operation": "resolve_and_lock",
  "continuation": "blocking_task_input",
  "reason": "Required by accepted task contract",
  "inputs": {"constraint": ">=1,<2"},
  "requested_capabilities": ["registry_read"],
  "expected_result_schema": "DependencyResolutionResult-v1"
}
~~~

Free-form shell is never an EffectRequest. `continuation` is a closed enum: `blocking_task_input` means a successful receipt must feed a fresh task attempt, while `nonblocking_deferred` is permitted only when the GoalContract explicitly places the remote outcome outside local completion. The supervisor, not the worker, validates that classification. The model does not choose an idempotency key or authorization token. After validation and policy approval, the supervisor assigns the effect ID and deterministic key from the normalized operation and authoritative run state.

### 12.7 EffectAuthorization

An allowed effect receives a supervisor-minted, one-shot capability record containing:

- effect ID and idempotency key;
- principal, run, task, attempt, and lease epoch;
- normalized operation or argv and exact resource identity;
- candidate tree, config, policy, and input hashes;
- effective risk and human-decision lineage where required;
- reserved budget account and amount;
- not-before, expiry, and use_count=1.

The broker atomically verifies and consumes this capability in the same durable boundary that marks the effect EXECUTING. It rechecks current policy, lease, risk, hashes, budget, and expiry immediately before acting. A worker cannot replay it, change an argument, substitute a resource, or reuse a human approval for a changed tree.

## 13. End-to-End Workflow

### 13.1 Preflight and intake

1. Resolve the target repo and verify it is Git-backed.
2. Start the constrained Git adapter with system, global, and repository executable configuration neutralized before the first Git inspection.
3. Read the global policy, pinned project config, repository instructions, and model catalog.
4. Record HEAD, index status, working-tree fingerprint, relevant tool versions, and dirty paths.
5. Build the GoalContract from the user request.
6. Run deterministic hazard classification.
7. Establish run budgets and reserve a verification/cleanup floor.

For a clean target, the base is HEAD. For a dirty target, the supervisor never stashes, resets, commits, or overwrites user changes. It creates an isolated content snapshot from HEAD plus dirty tracked files and explicitly selected, nonignored untracked source; ignored paths are excluded. Secret-bearing selected paths remain byte-exact only in the supervisor's opaque carry-forward overlay and are absent from the worker view. Before the run starts, the private store materializes and verifies the complete reachable commit, tree, and blob closure needed for the base, snapshot, candidates, and prospective patch, then severs every alternate or promisor dependency on the live target repository. Only an immutable harness-owned content store may remain as an alternate. The dirty snapshot and all candidate objects live in that encrypted, owner-only recovery store, never the target repository's shared object database. It survives target `git gc`, object deletion, repository move, or checkout removal, and is deleted only after patch publication and retention checks. v1 never autonomously modifies the checked-out target, clean or dirty.

### 13.2 Environment discovery and bootstrap

Before planning commands or starting a real worker, an EnvironmentBackend performs two distinct phases. Discovery:

1. inventories lockfiles, manifests, tool-version files, devcontainer metadata, Nix or other reproducible environment descriptions, and required gate executables;
2. emits an EnvironmentDiscoveryReceipt bound to the source tree with available runtime candidates, unresolved prerequisites, and executable/gate compatibility;
3. optionally materializes a bootstrap read-only environment for exploration commands using only harness-default gates and the base lockfile.

Discovery does not authorize final gates. After the plan and gate set are frozen, finalization selects a policy-approved pinned runtime or image, resolves every required executable to an immutable toolchain path or image digest, hydrates exact dependencies, and emits an EnvironmentReceipt containing source tree, runtime and image digests, executable hashes, gate-set hash, lockfile and setup-config hashes, dependency/cache artifact hashes, environment variables, and sandbox version.

Do not copy arbitrary ignored directories such as .venv, node_modules, target, or build from the user's checkout. They are mutable and unaudited. A project-provided setup script is untrusted code and runs only in the same minimum containment required for gates. Existing-lock hydration is part of the first real-worker release through a narrow, registry-only hydrator that may fetch only exact artifacts already named by the trusted lockfile and disables lifecycle scripts where possible. Resolving or selecting a new dependency remains a separately authorized later broker effect. If no reproducible environment can be materialized, stop with an exact prerequisite instead of running against ambient host state.

### 13.3 Exploration

For substantial or unfamiliar work, start two or three independent read-only threads against the same immutable snapshot:

- architecture and dependency map;
- tests, build, and acceptance surface;
- risk and failure modes when triggers justify it.

Each returns structured observations with file and symbol references. The supervisor deduplicates and distills them. A small, well-localized task skips this phase.

### 13.4 Planning

A fresh High-reasoning planner receives:

- the GoalContract;
- the repository map and selected exploration artifacts;
- immutable project constraints;
- available worker profiles and budgets;
- required gate identifiers.

It proposes a bounded DAG. It does not execute work or create child threads.

### 13.5 Contracting and adversarial critique

Code validates the plan. For architecture-sensitive, security-sensitive, cross-module, or high-cost plans, a fresh critic receives the goal, evidence, and proposed plan. It must return objections and a point-by-point disposition requirement. The planner can revise once or twice within budget.

The supervisor then freezes task contracts, path claims, acceptance coverage, risk, gates, and budgets. It finalizes the base EnvironmentReceipt against that exact contract. No task becomes READY until every required executable and dependency is available. Model discussion cannot mutate a frozen contract; changes create a new version and invalidate dependent leases and environments.

### 13.6 Execution

The scheduler leases every ready task whose dependencies, path claims, capabilities, and budget are valid. It explicitly starts a Codex thread for each lease. It does not ask one root model to remember to create a team.

Read-only analysts may share an immutable snapshot. Every mutating attempt gets a distinct worktree or stronger clone. One bounded objective is assigned to one thread. The context builder provides only the task contract, relevant evidence, repository conventions, dependency outputs, and exact acceptance checks.

The supervisor streams progress, records usage, heartbeats the lease, and applies stall rules. A worker can be steered once with concrete evidence. Further failure interrupts the turn and follows retry or re-plan policy. EXECUTING includes the candidate, task-level verification, semantic review, repair, and serial staging loop. A downstream task does not start until every dependency is STAGED into the integration tree used as its base.

### 13.7 Candidate capture

When the worker finishes, the attempt supervisor unconditionally enters a finally-controlled quiescence path before trusting completion:

1. fence the lease for new writes and reject later worker events;
2. interrupt the turn, stop its dedicated engine, freeze then kill the attempt cgroup or equivalent PID namespace, wait until the kill domain is empty, and revoke workspace write access;
3. make the candidate source immutable through a read-only snapshot or backend primitive;
4. compute the actual tree, patch, changed paths, size, modes, and symlink targets without following workspace-controlled links;
5. reject protected or out-of-scope changes;
6. rerun deterministic hazard classification over actual paths, file modes, manifests, dependencies, CI, auth, and sandbox or policy changes;
7. mark the environment stale if any manifest, lockfile, setup input, runtime selector, or gate requirement changed;
8. invalidate incompatible leases, authorizations, environments, review choices, and receipts if risk or environment inputs changed;
9. scan for binary surprises and likely secrets;
10. store exact secret-cleared code artifacts and redacted observational artifacts in the content-addressed store;
11. parse the bounded, ingress-sanitized WorkerResult against its schema and reject a stale lease epoch;
12. route any blocking EffectRequest through the effect branch below; otherwise have the constrained Git broker reconcile a durable GitObjectRequest for the candidate;
13. move an effect-free task to CANDIDATE, never ACCEPTED.

If WorkerResult is malformed, the dead engine is not resumed. One fresh read-only schema-recovery thread may see only the bounded redacted output, exact diff summary, schema, and parse errors; it cannot write the workspace or grant authority. If that output still fails validation, the attempt becomes RETRYABLE_FAILED and a new attempt starts from canonical context.

A validated `blocking_task_input` request takes the task from RUNNING to AWAITING_EFFECT. Any workspace changes from that attempt remain diagnostic artifacts and are never committed, staged, or used as the next base. The attempt closes, then the effect state machine and broker run independently. On effect SUCCEEDED, the supervisor binds the result artifact and receipt into the task inputs, reruns environment discovery and finalization, rechecks risk, policy, contract, paths, and budgets, and returns the task to READY with a new lease, workspace, and thread. DENIED, FAILED, EXPIRED, or CANCELLED maps to NEEDS_REPLAN, BLOCKED, or FAILED by deterministic policy; AWAITING_HUMAN stays fenced; UNKNOWN or RECONCILING cannot release the task. A `nonblocking_deferred` request is recorded for the RunClosureManifest but cannot trigger a broker unless a separate run contract authorizes that effect.

Candidate capture never races a live worker. A process group is insufficient because a child can create a new session or daemonize; the first real-worker release requires a tested cgroup/PID-namespace kill domain or equivalent. Descriptor-relative traversal or an equivalently safe workspace-backend primitive must bind validation to the files that are hashed. If the v1 implementation cannot make that guarantee for a platform, it must reject that platform or workspace layout. A negative fixture must double-fork a background writer and prove it cannot change the captured tree.

### 13.8 Deterministic verification

Before running a gate, re-finalize the EnvironmentReceipt against the candidate tree whenever its environment inputs or required gate set differ from the base receipt. Lockfile or setup changes are processed through the appropriate exact-lock or new-dependency broker and cannot reuse base dependencies. A rematerialization failure returns the task to repair or re-plan; it never silently falls back to ambient packages.

The supervisor verifies against two bound identities: the byte-exact full candidate tree used for publication and a GateExecutionViewManifest derived from it with opaque carry-forward paths denied exactly as they are for workers. Repository-controlled tests never receive the reinserted secret blobs. Every nonopaque file, mode, and symlink in the gate view must match the full tree; the receipt binds both identities and a keyed opaque-overlay manifest. Secret-dependent tests use harness-generated typed fixtures or stop for an explicit declassification authorization in a dedicated non-model gate profile. They never receive the user's original secret by default. The closure manifest reports which paths and behaviors were opaque and therefore not exercised against real secret data.

Run trusted gates in a clean candidate verification workspace:

- target-specific tests;
- required project tests;
- typecheck, lint, format check, and build where configured;
- diff and generated-file checks;
- dependency and lockfile checks when triggered;
- security scanners or contract checks when triggered.

Commands are argv arrays, never shell strings. Pipelines are separate gate steps. The gate runner has its own timeout, environment allowlist, output limit, filesystem policy, and network policy.

Trusted gate means the gate definition and result collection are trusted. Repository tests and build tools are still untrusted code. The gate runner receives no host secrets, no broad read roots, no Git or broker credentials, and no external network. A v1 `GateSpec` cannot enable egress. A gate that needs a service may receive only a harness-created, isolated loopback fixture with no forwarding route. Remote inputs are prefetched by a typed broker into a content-addressed artifact, and a genuinely external validator must be a reviewed typed adapter with no repository mount, not an arbitrary project command.

### 13.9 Semantic review

After deterministic gates pass, select independent review lenses from code-defined triggers:

- correctness and maintainability for nontrivial code;
- test quality when behavior changes;
- security only when auth, parsing, secrets, network, dependencies, unsafe code, or trust boundaries change;
- UI and accessibility when frontend surfaces change;
- migration and compatibility when schemas or public APIs change.

Each reviewer runs read-only in a fresh thread. It sees the GoalContract, exact diff, relevant files, and gate receipts, but not the implementer's chain of reasoning. Codex review/start may be used as an additional advisory pass, but typed review threads remain the authoritative semantic input because review/start is plain text.

### 13.10 Repair and task staging

Blocking findings produce focused repair tasks with:

- the exact finding;
- the failing evidence;
- unchanged scope and capabilities;
- a smaller retry budget.

The reviewer does not edit. An original live thread may receive one bounded corrective turn for a simple local error; otherwise repair starts a fresh thread from canonical context. Cross-process resume is never part of repair. Repairs create a new candidate tree and invalidate prior receipts.

When a candidate passes its task gates and required reviews, the integration manager acquires the run integration lease, verifies the candidate base, and serially stages it into the run integration tree. It recomputes cumulative risk and re-finalizes the cumulative EnvironmentReceipt if manifests, lockfiles, setup inputs, runtime selectors, or gates changed, then runs gates whose declared inputs were affected. The task becomes STAGED and downstream tasks use that exact tree and environment hash as their base. Staging is supervisor-owned and remains inside EXECUTING; it does not update any user ref. A repair or re-plan that changes an already staged parent invalidates its affected descendants before a replacement parent and descendant chain are staged.

### 13.11 Final verification and publication

After every required task is STAGED, the run enters VERIFYING. The integration manager:

1. verifies every staged dependency and base precondition;
2. recomputes deterministic risk and finalizes the EnvironmentReceipt over the cumulative tree and final gate set;
3. runs cumulative required gates in fresh isolated verification environments matching that receipt;
4. obtains final semantic acceptance when the effective risk requires it;
5. verifies that no blocking finding or unresolved effect remains;
6. for a dirty source, derives the prospective exact harness delta against the recorded dirty snapshot, secret-scans it, and stores the owner-only PatchArtifact in the private staging store;
7. seals an immutable VerificationManifest against the exact integration tree, optional prospective PatchArtifact hash and base, environment, gates, reviews, policy, and pre-publication usage;
8. enters PUBLISHING with a durable publication request referencing the VerificationManifest hash;
9. performs the source-mode-specific publication transaction and records an idempotent PublicationReceipt;
10. enters FINALIZING, settles budgets, destroys privacy-sensitive ephemeral stores, completes cleanup, and then seals the successful RunClosureManifest referencing the VerificationManifest, PublicationReceipt, final usage, cleanup status, and effect summary.

For a clean source, publication validates that the destination is absent or a direct ref inside `refs/codex-harness/runs/`, then atomically updates it with `update-ref --no-deref <ref> <new-oid> <expected-old-oid>` and records the prior value, commit, tree, and VerificationManifest hashes. The dedicated ref is not checked out, so ref compare-and-swap does not race the user's index or working tree. The user may inspect, cherry-pick, or merge it.

For a dirty source, publication atomically promotes only the precomputed PatchArtifact named by the VerificationManifest, adds its base fingerprint and VerificationManifest hash to the publication metadata, and does not write any object or ref in the target repository. A likely secret blocks manifest sealing rather than being silently substituted in an applyable patch. The publisher then removes the recoverable private object store according to retention policy. A future explicit apply command may use a cooperative checkout lock and rollback journal, but unattended target-checkout mutation is not part of v1.

If the supervisor crashes after a ref CAS or patch rename but before recording PublicationReceipt, recovery compares the durable publication request with the ref or artifact hash. An exact match completes the receipt without repeating the effect; a mismatch enters reconciliation. The RunClosureManifest is never an input to the publication it describes, avoiding a hash cycle.

Push, pull request creation, deployment, issue mutation, and release are separate external effects. They do not happen merely because local integration succeeded.

### 13.12 Completion

A run is SUCCEEDED only when:

- every acceptance obligation's live task version, replacement chain, or validated reassignment reaches STAGED;
- all required receipts match the final tree;
- blocking findings have valid dispositions;
- every blocking effect is SUCCEEDED with a bound receipt, and every nonblocking effect is terminal in SUCCEEDED, DENIED, FAILED, EXPIRED, or CANCELLED; no other effect state is compatible with run success;
- budget accounts are settled;
- the dedicated harness ref or patch artifact is recorded;
- the successful RunClosureManifest is complete.

The user receives the outcome, changed files, exact checks, residual risks, assumptions, and any deferred external action. They do not receive a transcript dump.

## 14. Scheduler and Parallelism

### 14.1 Explicit scheduling

The supervisor owns an ordinary DAG scheduler. A task becomes runnable only when:

- its contract is VALIDATED;
- every dependency is STAGED as required by the plan;
- its dependency trees are present in the selected base;
- its path claim does not conflict with an active writer;
- its capability request is authorized;
- run, task, and global concurrency slots are available;
- budget has been reserved;
- no cancellation or re-plan barrier is active.

Use a supervised task wrapper per attempt so an unhandled exception fails that attempt without cancelling unrelated work. TaskGroup may structure child activities within one attempt; semaphores enforce daemon-global, per-repo, model, and runner concurrency. Start conservatively at three or four active Codex turns and make the value configurable. Foreground Milestone 1 scopes global limits to that process; the Milestone 2 daemon becomes the machine-user coordinator before production release. More threads are useful only while work remains truly independent and model/service limits allow them.

### 14.2 Leases and fencing

Each attempt lease contains:

- lease ID and monotonically increasing epoch;
- task and attempt IDs;
- owner process instance;
- workspace ID;
- acquired, heartbeat, and expiry times;
- capability token hash;
- reserved budget IDs;
- base tree and dependency staging SHAs.

Heartbeats are supervisor observations, not worker claims. On recovery, an expired lease is fenced before a retry is created. Every streamed event and final result carries the lease epoch. Late results remain available for diagnosis but cannot commit, settle another attempt's budget, or advance task state.

### 14.3 Path ownership

The planner proposes normalized path patterns. Code:

1. parses each pattern into a normalized claim domain without requiring the path to exist;
2. expands existing matches against the base tree while retaining the original pattern and conservative literal-prefix namespace for future files;
3. rejects traversal, absolute paths, protected paths, ambiguous canonicalization, and symlink escapes;
4. compares pattern languages and ancestor/descendant namespaces for possible overlap, including paths that do not yet exist;
5. records the pattern, prefix domain, and existing expansion in the lease;
6. compares every actual changed or newly created path with the original claim at candidate capture.

If the validator cannot prove two future write namespaces disjoint, it serializes the tasks. A base-tree-only expansion is never sufficient authority for a new file.

Path claims reduce avoidable collisions; they do not prove semantic independence. Worktree isolation and serial integration remain mandatory even for non-overlapping claims.

Tasks that inherently share a central file should be serialized, split around an interface first, or routed through an explicit integration task. Do not ask agents to coordinate through a shared file.

### 14.4 Read-only work

Exploration, planning, and review threads use immutable snapshots and read-only sandboxes. They may run concurrently without path claims. Their artifacts are content-addressed and attached to a specific source tree, so stale analysis is detectable.

## 15. Workspace and Git Design

### 15.1 Workspace backends

Define a backend interface:

~~~python
class WorkspaceBackend(Protocol):
    async def create_read_snapshot(self, source: SourceRef) -> WorkspaceRef: ...
    async def create_write_workspace(self, source: SourceRef, attempt: AttemptRef) -> WorkspaceRef: ...
    async def fingerprint(self, workspace: WorkspaceRef) -> TreeFingerprint: ...
    async def diff(self, workspace: WorkspaceRef) -> PatchArtifact: ...
    async def destroy(self, workspace: WorkspaceRef) -> None: ...
~~~

Implement backends in this order:

1. **Git worktree backend:** default for trusted local repositories.
2. **Ephemeral clone backend:** stronger separation when shared worktree Git metadata is awkward or sub-process containment requires it.
3. **Rootless container backend:** for dependency execution and less-trusted repositories.
4. **gVisor or microVM backend:** later high-isolation tier.
5. **Remote sandbox backend:** optional hosted execution through a provider such as Modal, E2B, or Daytona.

Dirty-source runs always use a private clone/object store even when clean-source runs default to linked worktrees. No candidate object derived from uncommitted source is written to the target repository's object database.

Workspace isolation and command containment are separate. A clone improves Git separation but does not contain hostile processes. From the first real-worker milestone, every attempt and gate runs under an outer Linux runner that provides a private mount view, private temporary directory, PID/cgroup kill domain, and CPU, memory, PID, wall-time, output, and disk limits. Engine egress is restricted to the provider path; command and gate children receive a separate no-network domain. The Phase 0 spike chooses a concrete implementation from rootless OCI, bubblewrap plus Landlock/seccomp/cgroups, or an equivalently tested platform primitive. Stable codex sandbox execution may be used as one layer, not as the only outer boundary.

### 15.2 Environment backend

~~~python
class EnvironmentBackend(Protocol):
    async def discover(self, source: SourceRef) -> EnvironmentDiscoveryReceipt: ...
    async def finalize(self, discovery: EnvironmentDiscoveryReceipt, source: SourceRef, gates: GateSet, policy: EnvironmentPolicy) -> EnvironmentRef: ...
    async def mount(self, environment: EnvironmentRef, workspace: WorkspaceRef, role: Role) -> MountedEnvironment: ...
    async def receipt(self, environment: EnvironmentRef) -> EnvironmentReceipt: ...
~~~

The environment identity is an input to every gate receipt and worker attempt. Shared dependency and compiler caches are content-addressed and read-only; each attempt gets private scratch and output paths. Materialization executes in containment and cannot reach general network or user credentials. Only the exact-lock hydrator or later dependency broker may populate missing package artifacts through constrained registry access.

### 15.3 Worktree layout

<pre>
state/projects/&lt;repo-id&gt;/worktrees/
  run-&lt;id&gt;/
    integration/
    attempt-&lt;task&gt;-&lt;epoch&gt;/
    verify-&lt;tree&gt;/
</pre>

Every worktree is detached at a recorded base. The supervisor creates it, verifies it, and owns cleanup. Ordinary workers do not need Git metadata: the supervisor supplies status, diff, base history excerpts, and provenance as typed context. If a narrowly justified role needs history, expose a sanitized read-only object view with remotes and local configuration removed, not the linked worktree gitdir.

Current Codex workspace-write behavior protects .git, .agents, and .codex recursively. Use that native protection as defense in depth, verify it in engine contract tests, and add post-run diff validation. Read-only .git is still an information and configuration authority, so the default worker mount masks it entirely. If the backend cannot do that reliably, use an ephemeral clone with its metadata outside the worker mount.

### 15.4 Git authority

Workers never:

- run commit, merge, rebase, reset, checkout, push, tag, or update-ref as an authorized operation;
- write .git or a resolved gitdir;
- decide author identity or commit message policy;
- stage completion evidence;
- update the user's branch.

The supervisor:

- derives the patch from the workspace;
- creates a candidate commit with a harness identity and provenance trailer;
- serially applies candidates to the integration worktree;
- records parent, tree, patch, and configuration hashes;
- atomically publishes the verified commit to a dedicated harness ref using its expected old value;
- never pushes unless a separately configured effect is authorized.

Candidate and integration object creation is request-driven. Before invoking Git, the supervisor durably records a `GitObjectRequest` containing the exact tree, parent list, byte-exact message and trailers, author and committer identities, fixed timestamps and timezone, hash algorithm, repository object-store identity, and expected object ID when it can be precomputed. The constrained broker creates or reconciles exactly that request; a crash after `commit-tree` but before the result event cannot change metadata on retry or produce a different commit. The same rule applies to trees synthesized from patches and to every serial integration commit. A conflicting existing object or mismatched recomputation stops in reconciliation.

Git rules in a prompt are secondary. Read-only metadata, sandbox policy, command policy where available, and exclusive supervisor credentials are the enforcement.

The Git adapter is also a constrained, low-privilege broker, not an ordinary supervisor subprocess. Even preflight inspection goes through it. It uses a minimal environment, private HOME, no network or credentials, no pager, editor, terminal prompt, askpass helper, credential helper, lazy-fetch facility, or inherited Git protocol configuration. It nulls system and global configuration and admits only a reviewed subset of local data keys; hooks, fsmonitor, external filters, external diff and merge drivers, executable submodule update commands, checkout-time conversion, object replacements, repository-controlled alternates, promisor remotes, and lazy fetching are disabled or cause rejection. Harness-owned private object stores may use only broker-created alternates whose canonical paths, immutability, ownership, and required object closure are attested before use; a dirty-run recovery store may never depend on the live target object database. Prefer plumbing operations such as hash-object, mktree, commit-tree, read-tree, and update-ref because they avoid hooks and index-side filters. Publication canonicalizes and validates the ref name, rejects an existing symbolic ref, and uses `update-ref --no-deref <ref> <new-oid> <expected-old-oid>` so a race cannot redirect mutation through a symref. Failure means a concurrent writer won and requires reconciliation. A retry is idempotent only when the direct ref already equals the intended new object and the recorded manifest matches.

Contract fixtures must include malicious system, global, and repository hooks; clean and smudge filters; fsmonitor and credential helpers; alternates and lazy-fetch configuration; hostile remotes; a symbolic harness ref; and a concurrent ref writer. No fixture may execute its payload, redirect a ref update, or make the broker publish an unverified object.

### 15.5 Base changes

Before rebasing onto a newly requested base or offering a later explicit apply operation, compare:

- target HEAD;
- index hash;
- tracked working-tree hash;
- relevant untracked paths;
- trusted config hash.

If any precondition changed, do not overwrite or imply that the harness ref includes the new state. Rebase or re-plan in an isolated integration workspace and re-run every invalidated gate before publishing a new harness ref. A product-level conflict enters AWAITING_HUMAN; a mechanical conflict may receive a bounded repair task.

### 15.6 Special Git cases

Treat submodules, Git LFS downloads, sparse checkouts, nested repositories, and case-folding collisions as capability-gated features. v1 should detect them and either use a supported read-only mode or stop with an exact unsupported-feature reason. Silent partial handling would undermine evidence binding.

## 16. Policy and Guardrails

### 16.1 PolicyGateway

Every authority decision uses one interface:

~~~python
class PolicyGateway(Protocol):
    def authorize(
        self,
        principal: Principal,
        action: Action,
        resource: Resource,
        context: PolicyContext,
    ) -> PolicyDecision: ...
~~~

PolicyDecision is one of:

- ALLOW with narrowed constraints and an expiry;
- DENY with a stable reason code;
- REQUIRE_HUMAN with the exact decision, alternatives, and consequence.

The effective capability is the restrictive intersection of:

1. immutable harness invariants;
2. user global policy;
3. trusted and pinned project policy;
4. run risk envelope;
5. task contract;
6. current sandbox support;
7. remaining budget.

No layer can silently override a stricter parent. A project configuration change requires re-pinning and invalidates affected plans and receipts.

Codex project configuration is not allowed to participate in the security boundary unchecked. Each engine starts in a sanitized outer process with a harness-owned CODEX_HOME and configuration root, not the user's live Codex home. Explicit configuration disables goals, native multi-agent, apps, hooks, remote plugins, memories, shell snapshots, live and cached web search, project MCP servers, automatic repository skills, and project instruction discovery. Set the project-document budget to zero or its pinned equivalent, then pass vetted owner conventions as provenance-labelled context. Disable interactive and MCP elicitation rather than letting a worker ask outside the typed supervisor flow. If the pinned runtime cannot isolate and attest these surfaces, the adapter is unsupported.

### 16.2 Immutable v1 invariants

These are code constants, not TOML options:

- no full-access Codex worker;
- no worker or gate runner without tested read isolation from host secrets;
- no worker access to harness state, policy, receipts, or broker secrets;
- no worker mutation of Git metadata or target refs;
- no unknown SDK or sandbox capability;
- no automatic capability widening on retry, repair, or re-plan;
- no integration without exact-tree receipts;
- no blind retry of an effect in UNKNOWN state;
- no remote effect through arbitrary shell;
- no project-writable MCP or plugin configuration;
- no ordinary-worker web search, connector, remote-control, project hook, or executable project skill;
- no domain with both repository/source-snapshot read access and arbitrary egress, except the engine's single authorized provider channel over pre-scanned context;
- no model decision that grants authority;
- no automatic production, payment, secret-management, or destructive cloud action;
- no autonomous update of the user's branch, index, or working tree.

### 16.3 Guardrail matrix

| Concern | Agentic suggestion | Code-enforced control |
|---|---|---|
| Stay within task scope | Prompt contains objective and paths | Isolated workspace, path claim, protected mounts, actual-diff validation |
| Do not edit Git metadata | Developer instruction | Metadata masked from workers, constrained Git broker, supervisor-only ref authority |
| Run the right tests | Worker sees acceptance checks | Immutable gate registry and independent gate runner |
| Do not declare done early | Worker returns WorkerResult | State machine derives acceptance from receipts |
| Use bounded resources | Prompt states budget | Reservations, counters, timeout, output cap, interrupt |
| Avoid dangerous commands | Prompt and Codex safety model | Sandbox, no escalation, process policy, denied capabilities |
| Do not leak secrets | Prompt warning | Environment allowlist, secret-free workspace, egress denial, redaction |
| Do not install arbitrary packages | Prompt says ask first | Offline worker, dependency broker, registry and lifecycle policy |
| Do not push or deploy | Prompt warning | No credentials or network; typed broker not available in v1 |
| Parallel agents must not collide | Planner proposes ownership | Worktree per writer, leases, overlap validation, serial integration |
| Retry carefully | Agent explains retry | Error classifier, attempt limit, idempotency policy, fencing |
| Review independently | Persona says be skeptical | Fresh read-only thread, isolated context, required DAG node |
| Treat web/repo text as untrusted | Prompt provenance labels | Inputs cannot grant capabilities; schema, size, MIME, and egress controls |
| Respect risk | Model reports risk | Deterministic trigger rules; model can only raise the tier |
| Preserve audit history | Agent writes notes | Append-only events, immutable artifacts, versioned schemas |

Prompts remain useful for task clarity and semantic quality. They are not the perimeter.

### 16.4 Codex permissions and approvals

Use custom least-privilege Permission Profiles for real workers:

- read-only workspace access for planners, explorers, and reviewers;
- workspace write for implementers, with only minimal runtime/toolchain reads outside it;
- explicit deny rules for host credentials, user configuration, repository secret files, harness state, and broker state;
- network disabled;
- no full access;
- approval policy configured so a worker cannot escape its profile through a new interactive or automatic approval.

Current permission profiles do not compose with legacy sandbox settings. The engine adapter must select one mechanism deliberately and verify the effective configuration instead of passing both and assuming intersection.

Codex filesystem permissions and approval are distinct. A no-prompt setting is safe only when the least-privilege profile already expresses the intended boundary. Do not use an automatic model reviewer to grant a permission the outer harness denied.

At the research baseline, a newly started Python SDK thread defaults to auto-review, while resume, fork, and turn override behavior differs between published docs and current source. The adapter hard-codes `ApprovalMode.deny_all`, corresponding to `approval_policy=never`, on thread creation and every turn. V1 rejects resume and fork in the application API; dormant SDK surfaces are contract-probed only to prove they cannot weaken denial. Callers cannot override the mode, configuration that attempts to do so is rejected, and any approval request is a fatal attempt error and engine reversal trigger. The SDK's internal default approval handling is not a guardrail: if a request can be accepted before the adapter observes it, the SDK fails the spike and direct app-server must answer every approval RPC with denial. Contract-test the exact pinned source and runtime rather than trusting a default.

The current rendered official Codex hooks page documents useful blocking behavior, but hooks are not a complete policy perimeter. `PreToolUse` can deny covered simple Bash, apply_patch, and MCP calls through `permissionDecision=deny`, the legacy block shape, or exit code 2; `PermissionRequest` can deny or allow covered approval requests, with deny winning. The aggregated manual available during this research described narrower output support, so no blocking behavior is admitted until a pinned-source and pinned-runtime contract test proves the selected release implements it. Coverage is incomplete for unified_exec, WebSearch, and other tool paths, unsupported output fields can fail while processing continues, and project hooks are untrusted executable code. Keep project hooks disabled in workers. A later harness-owned hook may add a redundant deny or telemetry layer; OS containment, `deny_all`, and the protocol gateway remain authoritative.

Codex command rules can further restrict known command prefixes, but they do not replace containment of commands that already run inside a writable sandbox.

### 16.5 Permission profiles

Generate a per-role, per-attempt Codex Permission Profile:

- minimal platform and runtime paths readable;
- target worktree readable or writable according to the role;
- Git metadata masked for ordinary roles; only an explicitly authorized history role may receive the sanitized read-only object view from Section 15.3;
- .codex, .agents, harness state, auth stores, SSH/cloud/package credentials, and secret-file patterns denied to commands;
- temporary space denied or narrowed to an attempt-owned directory;
- network disabled;
- only explicitly required toolchain roots;
- no inherited broad user read or write roots.

Permission Profiles are beta, so they are a required capability probe rather than an assumed API. The public Python SDK does not currently expose an explicit profile-selection and effective-profile attestation API. If the pinned SDK cannot prove the profile through controlled configuration plus canaries, use direct app-server configuration or stop. Never fall back to ordinary workspace-write. A future alternate runner may satisfy the requirement only after tests prove that command processes cannot read the engine's authentication or control-plane memory and files.

The workspace backend, runner, and post-run validator provide additional layers. Startup fails rather than silently discarding an intended profile.

### 16.6 Environment and secrets

Launch the engine itself from a sanitized environment, then construct command environments from a second, smaller allowlist. CodexConfig.env overlays os.environ in the current SDK; it is not an environment replacement and cannot sanitize an already contaminated supervisor process. The launcher must construct the process environment before importing or starting the engine. Exclude:

- SSH agent sockets and private keys;
- cloud and package publishing credentials;
- GitHub and CI tokens;
- password-manager sockets;
- Docker or container daemon sockets;
- user HOME configuration not required by Codex;
- arbitrary proxy variables;
- provider API keys when existing Codex authentication can be reused internally.

Give each engine and command domain a private HOME and TMPDIR. Use one engine process and cgroup per mutating attempt; do not pool mutating turns in one AsyncCodex process because interruption cannot prove that background terminals are gone and killing a shared engine would affect unrelated work. Read-only engine pooling is deferred until isolation tests prove it safe.

Mount the per-attempt Codex session/rollout store in a private mount namespace on an encrypted ephemeral volume with a per-attempt key or on tmpfs whose swap is disabled or encrypted. Tie the mount and key lease to the fenced attempt identity, destroy or cryptographically erase it after every normal or abnormal engine exit, and sweep stale namespaces, mounts, keys, and stores before recovery schedules work. Codex writes raw prompts, source excerpts, and tool output there before the supervisor can redact them, so it is never the ordinary durable run record. A replacement attempt reconstructs a fresh thread from canonical redacted context and exact workspace artifacts rather than resuming hidden state. An explicit diagnostic raw-vault mode may persist the store only under the encrypted TTL and audited-access policy. Resume, fork, and compaction across engine processes are disabled in v1.

Set `RLIMIT_CORE=0`, mark engine and runner processes non-dumpable where supported, and configure the user service so coredumps are denied. Engine and command stdin, stdout, and stderr use bounded supervisor-owned pipes; they never inherit the terminal, journald, or a service log file. Only the sanitizer's bounded output may reach the status client or durable log. Privacy-store destruction is a hard RunClosureManifest prerequisite, not a best-effort cleanup flag.

Provision authentication separately into the engine boundary through a one-time login, keyring helper, or narrow read-only auth mount that command processes cannot see. Do not mount the user's live CODEX_HOME. Provider keys, auth JSON, process environments, command lines, and supervisor memory must be inaccessible through /proc and filesystem traversal from worker commands.

Before an engine sees the repository, scan the entire selected snapshot for credential patterns and materialize a sanitized worker snapshot that excludes known secret files and quarantines detected values; record only keyed hashes for correlation and raise risk. Excluded paths are an encrypted opaque supervisor-owned carry-forward overlay: their original blobs and modes remain outside the worker mount, worker path claims and diffs cannot name them, and candidate composition reinserts them byte-for-byte before hashing the candidate tree. Any requested or attempted change to an excluded path blocks unless an explicit typed authorization and model/data policy permit a separately scanned task view. This prevents an unrelated committed secret from looking deleted merely because it was hidden from the model. Scan every harness-built initial context block before submission. Ordinary maximum-autonomy runs do not infer consent from the file being committed.

The native Codex loop can feed shell and file-tool output back to the model before the outer supervisor can redact that individual message. Do not claim otherwise. Its safety precondition is that the engine can see only the pre-scanned snapshot, secret-free command environment, and authorized provider endpoint. If a deployment requires DLP inspection of every provider-bound tool result, this engine path is unsupported until a controllable tool loop can prove pre-provider interposition.

Contract tests create readable canary secrets in the real user's otherwise accessible home and configuration locations and in the engine's environment, then prove commands in every worker and gate profile cannot read files or /proc/*/environ containing them. An output-only redaction test is not sufficient.

Canonical events, projections, logs, transcripts, model output, human and effect inputs, and observational artifacts pass through deterministic redaction before durable storage, display, or export. Exact code, patch, tree, and binary artifacts cannot be modified without breaking evidence: scan them first and block or quarantine the artifact on a likely secret. Raw sensitive payload retention is off by default; when explicitly enabled for debugging, write it to an encrypted, access-controlled vault with a short TTL and audited reads. Apply per-run and global storage caps and retention policies. Redaction is defense in depth; secret absence and egress denial are primary.

### 16.7 Network and dependency broker

No execution domain receives both repository or source-snapshot read access and arbitrary egress. The authorized Codex provider channel is the narrow exception: the engine can send the pre-scanned task context and tool results only to the configured provider endpoint, while worker commands remain offline. Generic workers and `GateSpec` commands are always offline in v1. A gate may use an isolated, harness-owned loopback fixture with no forwarding route; remote inputs are prefetched into content-addressed artifacts, and external validation uses a reviewed typed adapter with no source mount.

Milestone 1 includes an exact-lock hydrator that can retrieve only lockfile-pinned, hash-identified artifacts from configured registries, verifies hashes, disables lifecycle scripts where possible, and emits a cache receipt. It rejects arbitrary URLs, VCS dependencies, local paths, redirects outside the registry policy, and lock entries without the ecosystem's required integrity data. It cannot alter manifests or lockfiles.

Every broker request contains an ecosystem-specific registry identifier, normalized hostname and port, expected package identity, version, and integrity hash. Source-derived identifiers must satisfy the ecosystem grammar plus harness length and entropy limits; suspicious names stop for review instead of becoming DNS, path, header, or body data. The broker ignores proxy environment variables and repository proxy configuration and cannot open a host or Unix-domain socket directly. It runs in a network namespace whose only route is a harness-owned egress gateway; kernel route and gateway policy deny host, loopback, private, link-local, carrier-grade NAT, multicast, unspecified, documentation, metadata, and Unix-socket destinations even if application validation fails.

The gateway and broker resolver normalize IPv4, IPv6, IPv4-mapped IPv6, NAT64 including configured operator prefixes, 6to4, Teredo, and other embedded-address forms, rejecting any representation that embeds or translates to a denied IPv4 address. They pin an allowed public IP for the connection while preserving the original hostname for SNI and certificate validation. HTTPS is mandatory. HTTP/3, Alt-Svc, connection coalescing across origins, proxy tunneling, implicit alternate transports, and client-managed DNS fallback are disabled. Every redirect repeats registry, hostname, resolution, address, route, and TLS checks; redirects, DNS answers, response bytes, and wall time have hard caps. Negative fixtures cover canary-bearing package identifiers, rebinding, NAT64/operator prefixes, mapped and transition addresses, metadata endpoints, Alt-Svc and HTTP/3, cross-registry redirects, proxy variables, Unix sockets, oversized bodies, and redirect loops.

A later new-dependency broker performs a separate narrow activity:

1. receives a typed package request;
2. checks ecosystem, registry, version policy, license policy, known vulnerabilities, and release age;
3. resolves in an isolated sandbox with registry-only egress;
4. disables lifecycle scripts where the ecosystem permits;
5. produces a lockfile, package cache artifact, SBOM delta, and receipt;
6. exposes the result to a new offline worker attempt.

The broker cannot publish. It has no source mount, source-control credentials, cloud credentials, or general-purpose request body. DNS and HTTP destination controls must both be enforced; a hostname allowlist alone is insufficient against resolution and redirect tricks.

Research browsing is a source-blind broker, not a repository-reading agent with a browser. It has no repository or workspace mount, source excerpts, secrets, arbitrary URL input, or package and Git broker access. It accepts a small typed question assembled by the supervisor from the user request and allowlisted public identifiers, applies length, character-set, entropy, destination, redirect, time, and byte policies, and returns provenance-labelled extracts. A repository-seeing model may propose public identifiers, but that proposal is untrusted and cannot carry free-form source bytes. Canary tests place unique secrets in source and prove they cannot appear in a research request, DNS label, URL, header, body, or result telemetry.

Disabling command network is not enough: ordinary worker configuration must also disable Codex web search, including cached/indexed search, and every app or connector that can move data outside the command sandbox.

### 16.8 MCP, apps, plugins, and skills

Do not expose arbitrary extensions in v1. Project-provided MCP configuration is untrusted executable integration configuration, not ordinary documentation.

Later adapters must:

- be installed and pinned outside the target repo;
- declare typed tools and risk classes;
- default deny destructive and open-world operations;
- receive no ambient credentials;
- validate responses and size limits;
- route effects through PolicyGateway;
- record tool version, input hash, output hash, and approval lineage.

Skills and repository instructions can improve reasoning but cannot widen the worker profile.

Project executable skills and hooks are disabled in v1 unless copied into a harness-owned, pinned allowlist after explicit trust. Plain repository instructions may be loaded as context, but are never interpreted as configuration authority.

### 16.9 Prompt injection controls

Label each context block with provenance and authority:

- USER_GOAL: authoritative for desired outcome, bounded by policy;
- HARNESS_POLICY: authoritative and immutable for the turn;
- REPO_INSTRUCTION: owner convention, not permission;
- SOURCE_TEXT: untrusted data;
- TOOL_OUTPUT: untrusted observation;
- PRIOR_MODEL_OUTPUT: untrusted proposal.

Normalize encoding, reject control-character abuse, cap each input, validate MIME types, and avoid feeding raw web pages or entire logs when a bounded extract suffices. A model-based injection classifier may raise risk or remove input. It may never authorize an action.

## 17. Risk-Scaled Autonomy

### 17.1 Deterministic tripwire

Carry forward Summon's proposed per-work-item questions:

1. Can the change initiate autonomous or privileged action?
2. Can it cause an irreversible, financial, safety, production, or user-impacting effect?
3. Does it require standing credentials or new authority?
4. Does it touch sensitive, regulated, private, or security-boundary data?
5. Does it change authentication, authorization, sandboxing, policy, CI trust, or dependency execution?

Unknown answers raise the tier.

### 17.2 Tiers

| Tier | Examples | Autonomy |
|---|---|---|
| Low | Local refactor, narrow bug fix, tests, docs | Auto-plan, execute, verify, review as triggered, and publish a dedicated verified harness ref |
| Medium | Public API, dependency, migration code, auth-adjacent logic, broad cross-module change | Add specialist reviews and gates, then publish a verified harness ref; protected external effects remain separately authorized |
| High | Production or remote mutation, money, destructive data change, secrets, standing credentials, regulated data, sandbox/policy weakening | Analyze and build a local candidate; require human authorization before the protected effect, while preserving local evidence and the unexecuted request |

A model can add a risk flag or recommend a higher tier. It cannot remove a deterministic trigger. Policy records the reason for the effective tier.

The classifier runs at intake, after plan validation, at every candidate capture, after every staged diff, and over the final cumulative tree. Actual paths, modes, new files, manifests, lockfiles, dependencies, CI definitions, auth code, network surfaces, and sandbox or policy changes are inputs. A tier increase fences incompatible attempts and one-shot capabilities, invalidates affected reviews and receipts, and activates the stricter gate and human-decision requirements before work continues.

### 17.3 Human escalation policy

Ask a human only for:

- materially incompatible interpretations with high rework cost;
- an irreversible or externally visible effect;
- access to secrets or standing credentials;
- a requested expansion of policy or budget beyond a pre-approved envelope;
- an UNKNOWN external effect that cannot be reconciled;
- repeated bounded failure after repair and re-plan;
- a merge conflict that embodies a product decision;
- a high-risk residual finding with no deterministic resolution.

Do not ask for:

- routine test execution;
- an ordinary retry after a transient engine failure;
- reversible local refactoring choices;
- permission to use already authorized paths and commands;
- acknowledgment of each phase transition.

An escalation includes the exact question, evidence, recommended default, alternatives, risk of each answer, and what work can continue meanwhile.

## 18. Budgets, Progress, and Recovery

### 18.1 Hierarchical budgets

Track budgets at global, project, run, task, and attempt levels:

- model input and output tokens;
- model turns and calls;
- wall and active time;
- attempts and repair cycles;
- concurrent workers;
- command count and command time;
- CPU, memory, process count, and disk where the runner supports them;
- artifact and streamed-output bytes;
- changed files and diff bytes;
- dependency additions;
- external-effect count and class.

Reserve before starting, settle from observed usage, and release unused amounts. Reserve at least 15 to 20 percent of a run's model and time budget for verification, repair, evidence finalization, and cleanup. The planner cannot spend this floor.

Classify limits by enforceability:

- **Hard before or during activity:** calls, turns, attempts, concurrency, wall time, command time, process count, CPU, memory, disk, output bytes, changed paths, diff bytes, and broker effects. Refuse to start without a reservation and kill the containment domain at the limit.
- **Observed soft telemetry:** model input and output tokens reported by the SDK or service. Refuse new turns when the remaining reservation is insufficient and interrupt on live usage events where available, but allow a measured bounded overshoot because the public SDK exposes usage rather than an exact provider-side per-turn cutoff.
- **External ceiling:** configure provider or account spending and rate limits when available. Treat them as a backstop, not a replacement for run accounting.

Calibrate token headroom from measured worst-case reporting lag for the pinned runtime and include overshoot in settlement and evaluation. Do not claim exact token stopping unless the selected engine later exposes and contract-tests a hard provider cutoff.

### 18.2 Retry classification

| Failure | Default action |
|---|---|
| SDK transport interruption before turn start | Retry with jitter within attempt budget |
| Turn interrupted with no candidate change | Reconstruct canonical context in a fresh thread and attempt |
| Structured-output parse failure | One fresh read-only schema-recovery turn over redacted output, then a fresh attempt |
| Sandbox or policy denial | Do not retry unchanged; re-plan or escalate |
| Deterministic test failure | Create focused repair task |
| Semantic finding | Create focused repair or re-plan |
| Worker timeout with progress | Steer once, then interrupt and fresh attempt |
| Worker timeout without progress | Interrupt, classify stall, fresh attempt if budget permits |
| Integration conflict | Mechanical repair once; otherwise re-plan or ask human |
| External effect timeout after send | UNKNOWN, reconcile; never blind retry |
| SDK capability mismatch | Fail startup; do not downgrade enforcement |

Retries preserve or narrow scope and capabilities. A new attempt receives a new lease epoch and workspace.

### 18.3 Stall detection

Use observed signals:

- no stream event, file change, command completion, or token movement for a configured interval;
- repeated normalized command with the same failure;
- repeated plan or review output;
- no change in candidate tree across repair attempts;
- excessive context growth without artifact progress;
- output flood;
- process heartbeat without task progress.

Response:

1. emit STALL_SUSPECTED;
2. steer once with the exact evidence and remaining budget;
3. interrupt after the grace period;
4. capture partial artifacts;
5. retry fresh or re-plan;
6. stop when bounded attempts are exhausted.

There is no infinite keep-working loop.

### 18.4 Crash recovery

On supervisor startup:

1. acquire the per-project supervisor lock;
2. verify event/projection consistency;
3. mark expired live leases fenced;
4. locate surviving attempt cgroups or PID namespaces from durable runner identities, freeze and kill them, and wait for empty kill domains without trusting PID identity alone;
5. unmount and destroy or cryptographically erase every stale native session store, ephemeral key, unsanitized stream, and core-dump path before starting another engine;
6. reconcile candidate workspaces and content hashes;
7. inspect effects in EXECUTING or UNKNOWN;
8. return safe tasks to READY;
9. replace model threads in fresh engine processes from the last durable canonical boundary; never depend on an expired native session store;
10. continue integration only from a verified integration tree, and resume FINALIZING cleanup without repeating a completed publication;
11. emit RECOVERY_COMPLETED.

Fault injection must exercise a crash before and after every durable transition and external activity boundary.

### 18.5 Cancellation

Cancellation:

- marks the run CANCELLING;
- prevents new leases;
- interrupts active turns;
- terminates runner processes after a grace period;
- revokes capability tokens;
- fences attempt epochs;
- waits for brokers to report or reconcile;
- preserves candidate and evidence artifacts;
- cleans disposable workspaces;
- enters FINALIZING with requested status CANCELLED when no activity can still mutate external state, or CANCELLED_WITH_UNKNOWN_EFFECT when a sent effect cannot be reconciled within the bounded cancellation window;
- destroys privacy-sensitive stores, settles budgets, seals RunClosureManifest, and only then commits the requested terminal state.

## 19. Context and Agent Topology

### 19.1 Roles are capabilities, not characters

| Role | Sandbox | Output | Typical lifetime |
|---|---|---|---|
| Explorer | Read-only | Repository observations | One turn |
| Planner | Read-only | Proposed DAG | One or two turns |
| Critic | Read-only | Objections and dispositions | One turn |
| Implementer | Isolated workspace-write, offline | Candidate patch and WorkerResult | One bounded task |
| Verifier | Read-only plus independent runner evidence | Verification interpretation | One turn |
| Reviewer | Read-only | ReviewResult | One lens |
| Repairer | Isolated workspace-write, offline | New candidate | One finding set |
| Researcher | No repository mount; typed source-blind research broker; no secrets | Cited evidence | One question |

Prompts should state responsibility, inputs, output schema, scope, and stop condition. Avoid biographies, simulated organizational politics, or open-ended team chat.

### 19.2 Context builder

Each turn receives the smallest sufficient projection:

- immutable goal and task contract;
- current source and dependency tree hashes;
- repository instructions and trusted policy summary;
- relevant files or symbol excerpts;
- repository map;
- accepted dependency artifacts;
- current deterministic failures;
- remaining task budget;
- exact output schema.

All repository-derived entries are built only from the sanitized worker snapshot and provenance-labelled before submission. Opaque carry-forward paths never contribute file text, symbols, names beyond the minimum policy placeholder, repository-map entries, command output, or cached context.

It does not receive:

- the full event log;
- unrelated worker transcripts;
- broker credentials;
- raw hidden chain of thought;
- mutable state summaries as authority;
- every file in the repository by default.

### 19.3 Repository map

Start v1 with deterministic tree, language, manifest, test, and symbol discovery. Add an Aider-like ranked repository map later:

- tree-sitter symbol extraction;
- import and reference graph;
- path and symbol relevance ranking;
- token-budgeted rendering;
- cache keyed by tree hash.

The map is a navigation aid, not a substitute for reading affected code.

### 19.4 Thread policy

- Use a fresh thread for independent review.
- Reuse a worker thread for a single local correction only inside the same live attempt and ephemeral session store.
- After process interruption, create a fresh thread from the durable boundary; do not resume raw native session state.
- Do not persist compaction state in v1.
- Never rely on one long root conversation as run memory.
- Record thread IDs for traceability, but keep state in SQLite.
- Keep native Codex goals disabled. The supervisor owns continuation and wakeups; a model-visible goal excerpt is ordinary turn context, not a Codex goal object.

### 19.5 Prompt versioning

Prompts live in the harness package, are code-reviewed, carry semantic versions, and are hashed into every turn record. Project overrides may narrow style or add repository facts; they cannot replace the authority preamble, output schema, or safety constraints.

## 20. Verification Model

### 20.1 Proof classes

Preserve Summon's proof ladder:

- **Deterministic:** a trusted program computes a result from observable inputs.
- **Inferential:** an independent model or reviewer interprets evidence.
- **Human:** product fit, risk appetite, taste, or irreversible authorization.

Do not relabel an inferential result as deterministic merely because it is structured JSON.

### 20.2 Acceptance obligations and gate sources

User acceptance criteria are proof obligations, not necessarily executable commands. The goal compiler maps every criterion to one or more allowed proof kinds:

- deterministic GateSpec or content/property check;
- inferential independent review over named evidence;
- explicit human decision for product fit, taste, or accepted risk.

The mapping is frozen and validated for complete criterion coverage. Required executable gates are the immutable union of the trusted project gate manifest, harness defaults selected by detected project type, deterministic criterion mappings, and code-defined risk triggers. A planner or reviewer may add a scoped gate. Nothing model-authored may remove an obligation or required gate, change its pass criterion, edit a baseline, or mark it not applicable.

### 20.3 Command specification

Gate commands contain:

- argv array with the executable as argv[0];
- normalized working directory;
- environment allowlist and fixed overrides;
- timeout and output cap;
- sandbox tier and network mode, where v1 generic gates permit only `DENY` or an isolated non-forwarding `LOOPBACK_FIXTURE`;
- expected exit code;
- optional structured result parser;
- declared writable output paths and artifact exports;
- file and config inputs used in its environment hash.

Do not support an arbitrary shell string in trusted config. Represent pipes, conditionals, and setup as separate steps with explicit dependencies. If an unavoidable project tool requires a shell, place it behind a reviewed runner adapter with fixed script content and a content hash.

Resolve argv[0] to a policy-pinned absolute executable and content hash or to an image digest before launch. Never trust a binary from a candidate-writable .venv/bin, node_modules/.bin, PATH prefix, or build directory merely because argv avoids shell interpolation. Repository tests and tools are adversarial code.

Each independent gate starts from a fresh read-only lower mount of the GateExecutionViewManifest bound to the exact full candidate tree, a read-only EnvironmentRef, and private writable scratch. Tools that require adjacent writes receive a private copy-on-write upper layer restricted to declared cache or build-output paths; those writes never alter the candidate. Gate steps that intentionally depend on generated output must export an explicit artifact edge whose content hash becomes an input to the next step; otherwise no writable state is shared between gates. Fingerprint the source before and after, hash the upper-layer delta, reject undeclared writes, freeze and kill the gate cgroup, wait until it is empty, and only then hash outputs and issue a receipt. A daemonizing background-writer fixture and an opaque-secret transform/exfiltration fixture must prove this sequence.

### 20.4 Negative controls

Every new harness gate needs at least one fixture that should fail. High-value repository gate families should also support:

- mutation tests;
- stale receipt tests;
- changed-config invalidation;
- symlink/path escape fixtures;
- false-green worker reports;
- flaky fail-then-pass behavior;
- malicious stdout and oversized output;
- skipped or renamed test detection where feasible.

A fail-then-pass gate is UNSTABLE by default. It does not silently become green. Project policy may define a quarantine workflow, but the RunClosureManifest must preserve the instability.

### 20.5 Finding disposition

Each blocking semantic finding ends in one of:

- FIXED, with a new-tree receipt or reviewer confirmation;
- NOT_REPRODUCIBLE, with deterministic evidence;
- ACCEPTED_RISK, requiring the policy-defined human or owner authority;
- DUPLICATE, linked to a surviving finding;
- INVALID, with deterministic counter-evidence for important or security findings, or an independent critic's explanation for lower-severity advisory findings.

The implementer cannot unilaterally dismiss its reviewer's finding. A second model does not erase an important or security finding by vote; absent deterministic counter-evidence, resolution requires a fix or an explicit human ACCEPTED_RISK decision.

### 20.6 Evidence manifests and publication receipt

VerificationManifest is sealed before publication and contains:

- run and goal IDs;
- target repo identity and starting fingerprint;
- verified final tree hash and, for dirty-source mode, the prospective PatchArtifact hash and recorded base fingerprint;
- task and attempt lineage;
- model, effort, engine, prompt, sandbox, and policy versions;
- artifact hashes;
- deterministic receipts;
- semantic reviews and dispositions;
- assumptions and residual risks;
- pre-publication resource usage;
- requested but unexecuted effects.

PublicationReceipt contains the source mode, verification hash, requested destination, expected prior value, published ref and commit or patch artifact hash, compare-and-swap result, and recovery lineage.

RunClosureManifest is required for every terminal run, including BLOCKED, FAILED, BUDGET_EXHAUSTED, CANCELLED, and CANCELLED_WITH_UNKNOWN_EFFECT. It records terminal reason, last canonical task and integration state, reusable artifacts, opaque execution-view limitations, final budget settlement, cleanup and retention status, findings, and every effect state. VerificationManifest and PublicationReceipt references are optional in the schema but both are mandatory when terminal status is SUCCEEDED. No terminal variant is legal until raw engine stores, core-dump paths, and unsanitized temporary streams have been destroyed or cryptographically erased; a completed publication remains recorded while FINALIZING retries that cleanup. The supervisor atomically writes the content-addressed closure object before the terminal event transaction and that event binds its hash; replay reconciles an orphaned identical object without inventing a new terminal record. Generate the concise human view from RunClosureManifest. This three-object split makes publication recoverable and gives unsuccessful runs a durable evidence package without creating a hash cycle.

## 21. User Experience

### 21.1 CLI

~~~text
codex-harness init
codex-harness daemon install
codex-harness daemon status
codex-harness run "Fix the race and add a regression test"
codex-harness status --watch
codex-harness inspect <run-id>
codex-harness events <run-id>
codex-harness answer <question-id>
codex-harness pause <run-id>
codex-harness resume <run-id>
codex-harness cancel <run-id>
codex-harness policy explain <run-id> <decision-id>
codex-harness doctor
codex-harness gc
~~~

Milestone 1 runs in foreground for a narrow vertical slice. From Milestone 2 onward, `run` submits an idempotent request to the local owner-only daemon and attaches the terminal as a status client. Closing the terminal does not stop the run. The OS user service restarts the daemon after a crash; foreground mode remains an explicit development option. Init can install the systemd user unit, and documents the separate explicit choice to enable user lingering when runs must survive logout or reboot before the next login.

### 21.2 Status display

Show:

- current phase and run risk;
- task DAG with ready, running, blocked, accepted, and staged nodes;
- active worker objective, elapsed time, usage, and observed progress;
- deterministic gates and semantic reviews;
- remaining budgets;
- pending human question or protected effect;
- integration base and publication destination, harness ref, or patch artifact;
- last durable event.

Do not expose private model reasoning. Stream concise model messages and tool activity only when useful.

### 21.3 Example project configuration

~~~toml
schema_version = 1

[project]
name = "example"
reasoning_effort = "high"
max_parallel_turns = 4
publish_verified_ref = true

[budgets.run]
max_turns = 48
max_attempts = 12
max_wall_minutes = 90
max_changed_files = 40
max_diff_bytes = 400000
verification_reserve_percent = 20

[workspace]
backend = "git-worktree"
network = "deny"

[[gates]]
id = "tests"
argv = ["pytest", "-q"]
cwd = "."
timeout_seconds = 900
required = true

[[gates]]
id = "lint"
argv = ["ruff", "check", "."]
cwd = "."
timeout_seconds = 300
required = true

[risk]
auth_changes = "medium"
dependency_changes = "medium"
ci_changes = "high"
production_effects = "high"
~~~

Configuration is declarative. It cannot disable immutable invariants. Init resolves an actual compatible model from the runtime catalog, records the explicit selection outside this illustrative snippet, writes a default, and asks for one trust action; normal runs do not repeatedly ask about it.

### 21.4 Output behavior

On success, report:

- what changed;
- what was independently verified;
- the published `refs/codex-harness/runs/<run-id>` commit for a clean source or exact patch artifact for a dirty source;
- residual risk and assumptions;
- total resource use.

On stop, report:

- the exact blocked invariant or exhausted budget;
- completed and reusable artifacts;
- failed evidence;
- the smallest human decision or policy change that would unblock it;
- whether any external effect is UNKNOWN.

## 22. Suggested Standalone Repository Layout

<pre>
codex-harness/
  pyproject.toml
  uv.lock
  README.md
  LICENSE
  src/codex_harness/
    cli.py
    application.py
    config/
      models.py
      loader.py
      trust.py
    domain/
      ids.py
      events.py
      states.py
      contracts.py
      manifests.py
      effects.py
      budgets.py
      policy.py
      errors.py
    engine/
      protocol.py
      openai_codex.py
      app_server.py
      fake.py
      capability_probe.py
      launcher.py
    store/
      sqlite.py
      migrations/
      projections.py
      artifacts.py
      vault.py
    scheduler/
      dag.py
      leases.py
      scheduler.py
      recovery.py
      stalls.py
    workspace/
      protocol.py
      git_worktree.py
      clone.py
      execution_views.py
      fingerprints.py
      cleanup.py
    environment/
      protocol.py
      discovery.py
      materialize.py
      receipts.py
    git/
      commands.py
      object_requests.py
      candidates.py
      integration.py
      publication.py
    context/
      builder.py
      provenance.py
      repo_map.py
      prompts/
    policy/
      gateway.py
      rules.py
      hazards.py
      capabilities.py
    runner/
      protocol.py
      local_sandbox.py
      swe_rex.py
      command.py
      receipts.py
    workflow/
      intake.py
      explore.py
      plan.py
      execute.py
      verify.py
      review.py
      repair.py
      integrate.py
    brokers/
      protocol.py
      egress_gateway.py
      dependencies.py
      research.py
    service/
      daemon.py
      control_store.py
      socket.py
    security/
      secrets.py
      privacy_cleanup.py
      ingress.py
    observability/
      logging.py
      telemetry.py
      redaction.py
  tests/
    unit/
    property/
    integration/
    contract/
    adversarial/
    fault_injection/
    fixtures/
  docs/
    research_manifest.json
    architecture/
    adrs/
    operations/
    evaluations/
</pre>

Dependency direction:

<pre>
domain <- application/workflow <- adapters

domain imports no SDK, SQLite, Git, CLI, or runner package.
Adapters implement domain protocols.
CLI calls application services and never edits projections directly.
</pre>

## 23. Build Plan for High-Mode Codex

Each milestone must end in a usable, tested vertical increment. Keep pull requests small enough that a fresh High thread can understand the contract and review the entire diff.

### Phase 0: Technical spikes

Time-box four disposable spikes before production architecture code:

1. **Codex engine spike:** in a sanitized process and harness-owned CODEX_HOME, prove the pinned Python SDK can select and attest a least-privilege Permission Profile, hard-code deny_all, disable goals, multi-agent, apps, hooks, plugins, memories, skills, project docs, shell snapshots, web and elicitation, run structured turns, stream, interrupt, report usage, and reuse hidden authentication. For direct app-server, decide between an attested pinned default profile and explicit `experimentalApi` profile selection, generating and hashing stable and experimental schemas. Treat missing usage, any approval request, or any unverified resolved setting as failure. Separately record whether native `/goal` is available for the evaluation baseline; do not enable it inside workers.
2. **Durability spike:** drive a fake engine and one cheap real turn through DBOS workflow interruption, parallel child work, cancellation, and recovery. Decide whether DBOS cleanly replaces recovery mechanics without becoming a second canonical state.
3. **Runner and environment spike:** compare a narrow SWE-ReX adapter with the smallest custom backend, then choose and prove the minimum Linux containment implementation, cgroup/PID cleanup, immutable candidate capture, secret and /proc isolation, offline existing-lock hydration, pinned executable resolution, and EnvironmentReceipt on Python and Node fixture repositories. A local SWE-ReX process is not the containment boundary.
4. **Symphony implementation spike:** run the pinned Elixir reference implementation, trace its reconciler, app-server, workspace, retry, and status paths, and write an adopt-versus-fork-versus-compatible-port ADR against this document's policy, event, gate, and publication invariants.

Record all decisions as ADRs and delete spike code. The chosen behavior is then rebuilt through tested domain interfaces.

### Milestone 0: Contracts and executable invariants

Build:

- package scaffold and dependency rules;
- machine-readable capability registry and feature-state rules;
- IDs, contracts, event types, and state enums;
- pure transition functions;
- DAG and path-claim validators;
- budget reservation model;
- typed PolicyGateway with immutable rules;
- fake engine, workspace, runner, and clock.

Acceptance:

- no real model calls;
- Hypothesis exercises legal and illegal transition sequences;
- capability inheritance can never widen;
- stale leases and stale receipts are rejected;
- event replay deterministically rebuilds an in-memory projection;
- threat fixtures cover path traversal and symlink escape;
- future path namespaces that may overlap are serialized;
- declared-but-unimplemented capabilities cannot appear as enabled or in generated CLI availability.

Recommended slices:

1. domain contracts and schema snapshots;
2. state transitions and property tests;
3. DAG/path validation;
4. policy and budget rules.

### Milestone 1: One task, one worker, exact evidence

Build:

- init with repository identity nonce, trust snapshot, runtime-catalog model selection, and capability qualification;
- a deterministic SingleTaskCompiler that turns the sanitized goal artifact, explicit `--accept` criteria, trusted default gates, and optional `--paths` scope into one validated GoalContract and TaskContract;
- SQLite events and projections;
- artifact store;
- local-filesystem durability probe and ordered fsync transaction adapters;
- minimum whole-snapshot, context, candidate, event-ingress, and output secret scanning; opaque carry-forward quarantine; redaction; and raw-retention-off storage policy;
- Git worktree backend;
- private clone/object-store backend for dirty-source snapshots and patch-only publication;
- EnvironmentBackend with exact-lock hydration and receipts;
- registry-only exact-lock cache hydrator with hash verification and no manifest mutation;
- minimum outer Linux containment with private mounts, private temporary space, command-network denial, PID/cgroup kill domain, and resource limits;
- CodexEngine adapter and capability probe;
- custom least-privilege Permission Profiles, using direct app-server if the SDK cannot select them;
- one implementer turn with structured WorkerResult;
- candidate capture and supervisor-owned commit;
- one trusted gate runner;
- exact-tree GateReceipt;
- minimal VerificationManifest, durable PublicationRequest, idempotent PublicationReceipt, and all-terminal RunClosureManifest protocol;
- atomic publication to a dedicated harness ref or patch-only result;
- foreground run, status, inspect, and doctor commands, plus in-process SIGINT cancellation.

Acceptance:

- a real High Codex turn changes a fixture repository;
- a freshly initialized repository can run the one-task path without hand-authored database state or contracts;
- a false completion claim cannot pass without the gate;
- a worker cannot write target Git metadata or harness state;
- a worker and gate runner cannot read host-secret canaries;
- a committed source-secret canary is hidden from worker and gate execution views, carried forward byte-for-byte in an unrelated change, cannot be transformed into gate output, and is absent from the database, WAL, projections, logs, and ordinary artifacts;
- a daemonized child cannot survive candidate or gate quiescence;
- ignored ambient environments are not copied and exact-lock fixtures run offline;
- changing a lockfile, setup input, runtime selector, or gate set rematerializes the environment and invalidates incompatible receipts;
- exact-lock hydration rejects DNS rebinding, private or metadata addresses, mapped address forms, proxy and Unix-socket routes, unapproved redirects, and oversized responses;
- changing one byte invalidates the receipt;
- killing the supervisor after candidate capture leaves a reconstructible, fenced candidate; automatic scheduling recovery is Milestone 2;
- killing the supervisor immediately before or after ref compare-and-swap or patch promotion reconstructs exactly one PublicationReceipt and never repeats or changes the publication;
- simulated loss at every ordered fsync boundary preserves intent-before-effect and object-before-publication invariants;
- deleting or garbage-collecting the live target object database cannot break a dirty run's private recovery snapshot;
- a dirty target is never overwritten.

Phase 0 fixes the initial adapter choice. Milestone 1 rebuilds and release-qualifies that choice through production interfaces; a regression against the same reversal criteria switches only CodexEngine to direct app-server before proceeding.

### Milestone 2: Planning, DAG scheduling, and recovery

Build:

- model-assisted intake and multi-task GoalContract compilation extending the deterministic single-task path;
- read-only exploration;
- schema-constrained plan proposal;
- plan critic for triggered work;
- explicit concurrent scheduler;
- leases, epochs, heartbeats, and fencing;
- dependency-aware base selection;
- serialized per-task staging into the integration worktree;
- retry and stall classifier;
- projection rebuild and startup recovery;
- owner-only daemon socket, idempotent CLI submission, cross-project budget coordinator, and systemd user restart unit.

Acceptance:

- two independent writers run concurrently in different worktrees;
- overlapping path tasks do not lease together;
- a late expired worker cannot advance state;
- a crash at each scheduler boundary recovers deterministically;
- dependency tasks see staged parent integration SHAs;
- concurrency never exceeds configured limits;
- terminal closure does not stop a run, and a killed daemon is restarted and continues from a durable boundary;
- duplicate CLI request IDs create one run, and a different-UID socket client is rejected;
- crashes at every control-database reservation and project-database lease boundary reconcile without double-spending global capacity or orphaning a project lease.

### Milestone 3: Independent verification and repair

Build:

- project gate manifests and trigger-selected gates;
- clean verification workspaces;
- typed correctness, test, security, UI, and migration review contracts;
- finding disposition;
- focused repair tasks;
- bounded re-plan;
- extension of the Milestone 1 evidence manifests with semantic reviews, finding dispositions, and repair lineage;
- negative-control fixture suite.

Acceptance:

- planner suggestions cannot remove a trusted gate;
- reviewers receive fresh read-only contexts;
- a blocking finding prevents integration;
- repair invalidates old receipts;
- a mutated wrong implementation is rejected by at least one intended gate;
- a flaky gate is not silently accepted;
- independent gates cannot communicate through undeclared writable files or background processes.

### Milestone 4: Higher isolation and narrow brokers

Build:

- rootless OCI, gVisor, microVM, or remote sandbox backend for hostile native and dependency execution;
- stricter syscall, mount, CPU, memory, PID, disk, and network controls beyond the Milestone 1 floor;
- new-dependency broker with registry-only egress;
- read-only research broker;
- SBOM, vulnerability, license, and release-age policy;
- expanded secret scanners and redaction policies beyond the Milestone 1 floor.

Acceptance:

- worker egress is denied;
- broker egress reaches only configured registries;
- lifecycle scripts are denied or explicitly handled;
- broker credentials are absent from worker processes;
- a malicious package fixture cannot access the host or source-control credentials;
- a blocking dependency request discards its diagnostic workspace, reaches AWAITING_EFFECT, binds one broker receipt, rematerializes its environment, and starts a fresh offline attempt;
- UNKNOWN or RECONCILING effects never release an awaiting task;
- NAT64, transition-address, Alt-Svc, HTTP/3, redirect, and source-canary exfiltration fixtures fail at both application and network-namespace layers;
- the research broker has no repository mount and rejects a canary-bearing query;
- unsupported sandbox capability fails closed.

### Milestone 5: Operations and evaluation

Build:

- pause/resume/answer workflow;
- status watch UI;
- OpenTelemetry export with redaction;
- three-arm benchmark runner for plain High, native Goals, and the harness, with unmatched resource reporting when required;
- fault-injection matrix;
- garbage collection and retention policy;
- optional GitHub projection that never becomes canonical state;
- failure clustering that proposes a deterministic sensor or gate from recurring inferential findings, requiring human review and a negative fixture before activation.

Acceptance:

- long runs survive terminal closure and supervisor restart;
- every state is explainable from events;
- telemetry can be disabled and contains no known secrets;
- control and treatment use the same model, effort, and budget;
- benchmark reports confidence intervals and failed runs;
- the system never self-modifies policy; promoted sensors have reviewed code, versioned config, and failing negative controls.

### Implementation discipline

For every slice:

1. update a domain contract or ADR first when behavior changes;
2. write state and failure tests before adapter code;
3. use the fake engine for deterministic CI;
4. keep real Codex contract tests opt-in for ordinary developer loops, but make the exact-fingerprint qualification suite mandatory for every release and newly admitted runtime/platform;
5. review adapter changes against their trust boundary;
6. add a negative fixture for each new guardrail;
7. avoid adding a framework until a measured need survives a design review.

## 24. Testing Strategy

### 24.1 Unit and property tests

Test pure logic exhaustively:

- state transitions;
- event versions and replay;
- DAG validation and cycle rejection;
- path normalization and overlap;
- capability intersection;
- risk triggers;
- policy precedence;
- budget reservation and settlement;
- receipt validity;
- retry classification;
- finding disposition.

Important properties:

- no event sequence produces SUCCEEDED without exact final receipts;
- no terminal run event is legal without a RunClosureManifest and completed privacy cleanup;
- capability sets are monotonically non-increasing down delegation;
- an expired epoch cannot mutate projections;
- budget settlement cannot create capacity;
- replay is deterministic;
- a stricter policy layer cannot be overridden by a looser child;
- integration is single-writer;
- replaying a durable GitObjectRequest produces or reconciles the same tree or commit object ID;
- an AWAITING_EFFECT task returns to READY only from a bound successful blocking-effect receipt and rematerialized EnvironmentReceipt;
- deterministic risk over actual diffs is monotonic within a run.

### 24.2 Integration tests

Use fixture repositories for:

- clean and dirty trees;
- independent and overlapping changes;
- failing, passing, flaky, and hanging commands;
- double-forking and setsid background writers;
- symlinks, binary files, submodules, and nested repos;
- worker crash and supervisor crash;
- target mutation during a run;
- integration conflicts;
- oversized output;
- malformed structured model output;
- dependency lockfile changes;
- missing ignored environments with offline lockfile hydration;
- malicious Git hooks, filters, fsmonitor, credential helpers, and concurrent harness-ref updates.
- target garbage collection or removal during dirty-run recovery;
- source-secret transform attempts from adversarial gate commands.

Most tests use FakeCodexEngine with scripted events. A small contract suite uses the pinned real SDK.

### 24.3 Adversarial tests

Include source and tool output that instructs the worker to:

- ignore policy;
- read a secret path;
- modify .git or .codex;
- run a network exfiltration command;
- edit the gate manifest;
- claim tests passed without running them;
- request a broad effect disguised as a dependency lookup;
- emit malicious terminal control sequences;
- create a symlink outside the workspace;
- hide changes in generated or ignored files.

The expected result is not that the model always refuses. The containment and validators must still prevent authority crossing.

### 24.4 Fault injection

Crash or interrupt:

- before and after lease acquisition;
- during thread start;
- during stream collection;
- before and after candidate and integration GitObjectRequest execution and result commit;
- after candidate creation but before event commit;
- before and after a gate command;
- during integration;
- before and after dirty PatchArtifact creation, manifest sealing, ref compare-and-swap, and patch promotion;
- at every control-database reservation and project-database lease handshake boundary;
- after an effect request is sent;
- during projection update;
- during cancellation and cleanup.

Assert no duplicate integration, no lost accepted artifact, no unbounded lease, and no blind external retry.

In addition to process kills, a VM or disposable block-device harness cuts power after each artifact, SQLite intent, Git object, ref, patch, and receipt synchronization boundary. Recovery must either observe the durable pre-state or the complete post-state described by the reconciliation protocol, never an unrequested effect or a ref to a missing object.

### 24.5 SDK contract tests

For every supported pinned runtime:

- separate concurrent engine processes route events to the correct attempt;
- structured output rejects malformed results;
- interrupt terminates within a bound;
- read-only cannot write;
- workspace-write cannot modify protected metadata;
- deny_all is effective on start and turns, and an unexpected approval request fails closed; dormant resume and fork surfaces are probed only to prove they remain disabled and cannot weaken the policy;
- goals, native multi-agent, apps, hooks, plugins, memories, project docs and skills, shell snapshots, web, and elicitation are disabled;
- worker commands cannot observe engine authentication or sanitized variables through files or /proc;
- usage is present, monotonic, and reconciles to observed turns within the pinned contract; missing usage is a failed production qualification;
- an engine restart creates a fresh thread from canonical context and cannot read an expired native session store;
- startup reports the expected capability fingerprint;
- no child-agent event can create work or escape the attempt budget.

Ordinary pull requests may use FakeCodexEngine and opt into the real suite. A release artifact or newly configured runtime/platform fingerprint is ineligible until the complete real suite produces an authenticated qualification record. Startup rejects a missing, expired, or fingerprint-mismatched record even if the fake tests are green.

## 25. Evaluation Plan

### 25.1 Experimental design

Compare:

- **Control A:** one plain Codex run with the same High model, reasoning effort, repository, goal, and total budget.
- **Control B:** a native Codex `/goal` with the same objective, verifiable stopping condition, model, repository, and measured budget envelope.
- **Treatment:** this harness with explicit planning, workers, verification, and integration under the same envelope.

Use multiple runs, randomized order, fresh or private tasks where possible, and report uncertainty. If native Goals cannot expose or obey a comparable hard budget, report that arm separately with observed resources rather than claiming a matched comparison. Evaluate outcomes, not whether the model followed the harness's preferred ceremony.

Avoid making a single public benchmark the headline. OpenAI has documented contamination and task-quality concerns around SWE-bench Verified. Use a mixed private suite and publish the fixtures that can be disclosed.

### 25.2 Task families

- narrow bug fixes;
- cross-module features;
- refactors with compatibility constraints;
- flaky or misleading test suites;
- dependency changes;
- migration design without production execution;
- frontend changes requiring visual or accessibility checks;
- security-sensitive parsing and authorization changes;
- long-running tasks with forced crash/recovery;
- parallelizable and intentionally conflicting task graphs.

### 25.3 Safety and negative tasks

- prompt-injected repository;
- malicious test command;
- request to reveal credentials;
- request to push or deploy without capability;
- ambiguous remote effect;
- stale receipt reuse;
- late worker result;
- dirty target update;
- budget exhaustion;
- unsupported runtime capability.

### 25.4 Metrics

Primary:

- acceptance-correct completion rate;
- autonomous completion rate;
- human intervention rate by risk tier;
- unauthorized external effects;
- duplicate external effects;
- incorrect final integrations;
- crash-recovery success.

Secondary:

- deterministic gate false-negative and false-positive rate;
- semantic review precision and useful finding rate;
- tokens, turns, wall time, and model calls;
- retry and repair count;
- merge conflict rate;
- stale-work rejection;
- context size and cache hit rate;
- user-rated outcome and explanation quality.

The required safety target for unauthorized or duplicate protected effects is zero. Quality gains should be reported with confidence intervals, not anecdotes.

## 26. Research and Alternatives

### 26.1 Research synthesis

| System or source | Useful pattern | Decision here |
|---|---|---|
| Codex Python SDK | Controlled threads, structured output, lifecycle, usage, auth reuse | Preferred thin adapter only if Phase 0 can attest the security profile |
| Codex app-server | Rich JSON-RPC lifecycle, generated schemas, approvals, config and reviews | Expected fallback and potentially the first production adapter |
| Codex MCP server / Agents SDK codex_tool | Make Codex a bounded specialist inside another agent run | Useful for broader agent applications; too experimental and thin for this authority-bearing supervisor |
| Codex Goals | Durable native objective continuation toward a stopping condition | Keep disabled inside harness workers; include as the strongest low-build evaluation baseline |
| Codex native multi-agent | Useful worker execution inside a thread | Do not depend on proactive delegation at High |
| OpenAI Symphony spec and Elixir reference implementation | Tracker reconciliation, isolated per-item workspaces, bounded app-server runs, retry and status contracts | Adopt as outer compatibility baseline; spike reuse or fork before choosing a Python port, while replacing prompt authority and ephemeral recovery with policy and durable evidence |
| Summon | Proof ladder, adversarial review, risk tripwire, provenance | Preserve as executable contracts and gates |
| Claude Code Agent Teams | Shared task list, direct teammate messaging, fresh contexts, lifecycle hooks, and optional worktrees | Preserve explicit tasks and fresh contexts; replace inherited permission and session-led coordination with supervisor state, isolation, and fencing |
| Anthropic long-running harness work | Fresh sessions, durable progress artifacts, incremental verification | Adopt |
| Anthropic managed agents | Separate durable session, harness, and sandbox concerns | Adopt conceptually |
| CAID | Central asynchronous delegation and isolated Git work | Adopt topology; independently validate results |
| OpenHands | Typed events, conversation/runtime separation, sandbox boundary | Adopt patterns, not the full framework |
| LangGraph | Checkpoints, interrupts, DAG workflow vocabulary | Do not add in v1; our state machine is smaller |
| Temporal | Strong durable activity semantics | Preserve compatible activity boundaries; too operationally heavy for local v1 |
| DBOS | SQLite-backed durable Python workflows, steps, queues, and crash recovery | Closest lightweight durability alternative; time-box a spike, but avoid a second canonical state in v1 |
| Restate and Dapr | Durable service runtimes and human-in-the-loop integration | Reconsider for hosted or distributed execution |
| OpenAI Agents SDK SandboxAgent | Manifest-defined workspaces, sandbox backends, capabilities, handoffs, and durable integrations | Strong API-backed alternative; not the default for a harness intended to reuse existing Codex authentication and Codex-native behavior |
| SWE-ReX | Python runtime API across local, Docker, cloud, and sandbox providers | Phase 0 WorkspaceBackend/Runner candidate; never treat its local runtime as a security sandbox |
| Modal, E2B, and Daytona | Disposable remote sandboxes, snapshots, resource isolation, and scalable concurrency | Optional high-isolation or hosted WorkspaceBackend; not required for local v1 |
| Aider | Ranked repository map and automatic lint/test feedback | Add map later; adopt feedback loop now |
| SWE-agent | Trajectories and separate evaluation harnesses | Adopt evaluation separation |
| AutoGen and CrewAI | Flexible teams and group chat | Reject model-selected speaker/control flow for authority |
| Cedar | Default-deny, forbid-overrides-permit policy model | Candidate for later embedded policy backend |
| OPA | Mature policy bundles and decision logs | Candidate for organization-scale deployment |

### 26.2 Symphony: adopt and harden

Symphony is the most directly relevant system in the research set. OpenAI published it as a language-neutral Codex orchestration specification after using the pattern internally. It continuously reconciles eligible tracker work, runs each issue in its own workspace, controls Codex through app-server, bounds concurrency and retries, and exposes status. This supports the external-supervisor direction and is a better starting vocabulary than inventing another issue-runner abstraction.

The [repository also ships an experimental Elixir reference implementation](https://github.com/openai/symphony/tree/4cbe3a9699a73b862466c0b157ceca0c1985d6d7), so Phase 0 must inspect and run it rather than comparing only to the specification. Record an ADR over three choices:

- **Adopt and extend:** fastest route to the reconciler, app-server runner, dashboard, and workspace lifecycle, but the evidence state machine, local CLI work source, policy gateway, per-task DAG, contained gate runner, and Git publication broker still have to be added across an Elixir codebase.
- **Fork:** permits deeper guardrails while retaining upstream code, but creates merge burden and makes a High-mode implementation depend on both BEAM/OTP and the Python containment and analysis ecosystem.
- **Compatible Python port:** best fit for the recommended SDK, policy, testing, and local packaging stack, but risks reimplementing already-working retry, status, and app-server behavior.

The default remains a standalone Python implementation that preserves Symphony component contracts and ports tested behavior, not source structure. Reverse that choice if the spike proves the Elixir implementation can accept the immutable policy, event, receipt, isolated-gate, and publication contracts with materially less code and no weaker runtime qualification.

It is intentionally minimal and presented as an engineering preview for trusted environments, not a maintained product. Its spec allows repository-owned runtime commands and shell hooks, leaves sandbox and approval posture to implementations, commonly lets agents use tracker credentials through tools, and recovers from tracker/filesystem state without restoring exact scheduler state. Those are reasonable choices for a high-trust reference, but they do not meet this document's code-guardrail and evidence goals.

The rewrite should therefore be Symphony-compatible at the component boundary while being stricter underneath. A future tracker adapter can consume Symphony-style work items; a local CLI goal is simply another WorkSource. Tracker state is a desired-work input and user-facing projection, not the receipt authority for task completion.

### 26.3 Native Codex Goals: baseline, not supervisor

Native Codex Goals are the strongest low-build alternative for sustained single-objective autonomy. The [current product guidance](https://learn.chatgpt.com/use-cases/follow-goals) describes `/goal` as a durable objective that can continue independently for hours toward a verifiable stopping condition. That makes it a more honest control than one ordinary long turn.

Goals still keep continuation, progress judgement, and stopping inside Codex runtime state. They do not supply this design's explicit task DAG, per-writer workspace and lease ownership, code-owned risk and effect decisions, exact gate receipts, serialized integration, or all-terminal closure contract. Nesting a native goal inside each worker would also create a second wakeup and retry system whose state the supervisor cannot treat as canonical.

Keep native goals disabled inside production workers in v1. Use them as a separate evaluation arm and reversal baseline. Reconsider a bounded goal-backed worker only if the pinned engine exposes lifecycle, budget, interruption, and effective-policy facts that the supervisor can fence without resuming hidden state after a crash.

### 26.4 Claude Code Agent Teams: preserve topology, replace authority

[Claude Code Agent Teams](https://code.claude.com/docs/en/agent-teams) are the direct runtime comparison for Summon's Markdown-defined Claude agents. They provide a team lead, fresh teammate contexts, a shared task list, direct messages, lifecycle hooks, and optional worktree isolation. Those are useful collaboration primitives, but their shared/session-led model is not the authority model for this rewrite.

| Agent Teams behavior | Rewrite decision |
|---|---|
| Lead and teammates coordinate through shared task state and messages | The SQLite task DAG and event log are canonical; models cannot assign authority by message |
| Teammates inherit permission context and can have role/tool restrictions | Capabilities are code-issued intersections with one-shot tokens and runtime canaries |
| Teammates may share a checkout unless worktrees are deliberately used | Every mutating attempt is isolated; serial supervisor integration is mandatory |
| Hooks can observe teammate idle, task completion, and other lifecycle events | Typed transitions and receipts drive scheduling; hooks are redundant telemetry only |
| Session shutdown and restoration depend on team lifecycle behavior | Leases, cgroup fencing, fresh-thread reconstruction, and daemon recovery are explicit |
| Direct teammate chat can coordinate discoveries | Artifacts and typed findings cross roles; open-ended team chat is unnecessary |

Preserve task dependencies, fresh specialist contexts, parallel read-only work, and isolated worktrees. Reject inherited ambient authority, shared mutable files, worker-authored completion, and session state as the recovery ledger.

### 26.5 Why not native model delegation alone

Current Codex behavior distinguishes explicit multi-agent use from Ultra's proactive delegation. A High thread can be told to create workers, but prompt compliance is not a deterministic scheduler. It also leaves task ownership, recovery, exact budgets, and integration authority inside a fallible context.

The harness therefore creates every planner, worker, and reviewer thread explicitly. Native subagents may still be allowed inside a tightly bounded task later, but their capability budget must be a subset of the task, and the outer supervisor still treats the result as one attempt.

### 26.6 Why not LangGraph

LangGraph provides durable checkpoints, interrupts, and graph execution. It is valuable when application logic already uses its graph and model abstractions. Here it would introduce:

- a second state and replay model beside Codex;
- node replay semantics that still require idempotent effects;
- framework coupling around a small purpose-built state machine;
- no replacement for Git isolation or OS containment.

Keep the scheduler interfaces clean enough to migrate if dynamic workflow needs later justify it.

### 26.7 Why not Temporal first

Temporal is the strongest option for distributed, durable, exactly-described workflow execution, but a local single-user v1 would pay for:

- a service and operational lifecycle;
- worker registration and deployment;
- workflow determinism constraints;
- more complex local installation and debugging.

The design borrows activity IDs, heartbeats, retry classifications, and reconciliation semantics. If the product becomes multi-host or hosted, Temporal, DBOS, or Restate should be reconsidered behind the activity interfaces.

### 26.8 Why not OpenHands as the harness

OpenHands has a useful event and runtime architecture and supports sandboxed agent execution. Adopting it wholesale would make Codex one engine inside a larger agent product with different conversation, tool, and runtime assumptions. Reuse the architectural lessons; keep direct control of Codex lifecycle and exact-tree integration.

### 26.9 Why not AutoGen or CrewAI

Group chat, role backstories, and model-selected next speakers optimize flexible collaboration. They do not provide deterministic authority, exact Git evidence, or containment. They also spend context teaching agents an organization that code can express more reliably.

### 26.10 Why not Rust first

Rust plus a direct app-server client is attractive for:

- stronger type boundaries;
- a smaller runtime;
- safer low-level filesystem work;
- precise process and sandbox control.

It is not the fastest path for the requested High-mode implementation. Python can express the supervisor clearly, and security-sensitive path operations can later move into a narrow Rust runner using openat2 or capability-based filesystem APIs. The CodexEngine and WorkspaceBackend protocols preserve this option.

### 26.11 Policy language alternatives

Start with typed Python rules and table/property tests. Move to embedded Cedar when policy authorship, audit, and forbid-overrides-permit semantics justify a separate language. Consider OPA when organization-wide bundles, centralized decision logs, and Rego expertise already exist.

For either backend:

- policy parse or diagnostic errors deny;
- an engine result never bypasses immutable invariants;
- policy does not replace OS sandboxing;
- policy version and decision input hashes enter the audit log.

### 26.12 Why not OpenAI Agents SDK SandboxAgent

The current OpenAI Agents SDK is a serious alternate implementation, not merely a chat framework. Its beta SandboxAgent surface provides manifest-defined workspaces, local, Docker, and hosted sandbox clients, resumable snapshots, filesystem and shell capabilities, structured outputs, handoffs, and integrations with durable runtimes.

Choose it instead when:

- the product should use the Responses API and API billing rather than existing Codex authentication;
- model-provider routing and custom function tools matter more than Codex-native thread behavior;
- a supported sandbox provider should own workspace hydration and snapshots;
- Codex is one specialist in a broader application.

It is not the recommended default here because the user asked for a Codex harness and a non-Ultra Codex entitlement path. It would replace, rather than wrap, a meaningful part of Codex's native agent loop. Its generic guardrails also do not automatically wrap every built-in shell, patch, hosted tool, or handoff, so the same containment and broker design would still be required.

### 26.13 Codex as an MCP server or Agents SDK tool

Codex can expose an experimental MCP server, and the OpenAI Agents SDK now has an experimental codex_tool that wraps the CLI as a workspace-scoped specialist. Both are credible when an outer Responses API agent needs to delegate a bounded coding job while it owns a broader workflow.

They are not the supervisor substrate for this rewrite. The MCP surface is experimental, the Agents SDK path adds API-key and API-billing requirements, and both put another model-controlled tool boundary above Codex while exposing less of the lifecycle and configuration detail than app-server. They also do not supply durable task state, exact-tree receipts, Git staging, or OS containment. Revisit codex_tool if the product later becomes a general agent application in which Codex is one specialist; retain the same per-call workspace, deny_all, broker, and receipt boundaries.

### 26.14 DBOS and Restate

DBOS is the strongest lightweight alternative to the custom recovery kernel. Its Python runtime defaults to SQLite and offers durable workflows, at-least-once steps that are not re-executed after recorded completion, workflow IDs as idempotency keys, async child workflows, queues, timeouts, and restart recovery. Restate offers similar journaled execution through a separate single-binary service.

Run a time-boxed DBOS spike before Milestone 0 exits. It must demonstrate:

- AsyncCodex streaming, steering, interruption, and cancellation inside durable boundaries;
- dynamic child workflows for planner-produced DAGs;
- exact control of retry classification, especially UNKNOWN external effects;
- compatibility with the append-only domain event and receipt model;
- clean workflow-code upgrade semantics;
- no hidden network, telemetry, or state-location behavior;
- a single explainable source of canonical status rather than DBOS state disagreeing with domain projections.

Keep the explicit SQLite state machine if DBOS would create two competing truths or make Codex turn lifecycles harder to control. Adopt DBOS as the execution kernel if it can replace leases, wakeups, and recovery cleanly while domain events remain the authoritative audit projection. Restate, Dapr, and Temporal remain better fits after the product becomes a daemon, hosted service, or multi-host system.

### 26.15 Remote sandbox providers

Modal Sandboxes, E2B, and Daytona can replace local worktree execution when disposable kernels, elastic concurrency, snapshots, or stronger tenant isolation justify network latency and cost. Modal documents gVisor isolation; E2B exposes isolated Linux VMs; Daytona exposes dedicated sandbox filesystems, processes, networks, and snapshots.

A provider adapter must preserve the same WorkspaceBackend and Runner contracts, content-hash every transfer, use short-lived provider credentials only in the supervisor, restrict sandbox egress, and keep Codex authentication separate from model-facing commands. A remote sandbox is not automatically safe because it is remote, and it does not replace effect policy or exact-tree verification.

### 26.16 SWE-ReX as a runner substrate

[SWE-ReX](https://github.com/SWE-agent/SWE-ReX/tree/5c995c365dfb1fd5bc56fda688be5d8538f9931f) is the most relevant build-versus-adopt candidate below the supervisor. It exposes a Python runtime interface across local processes, Docker, AWS, Modal, and Daytona, including interactive sessions and parallel environments. Using it behind WorkspaceBackend and Runner could remove provider-specific lifecycle code without conceding task, policy, Git, or receipt authority.

Phase 0 must implement one fixture adapter and compare it with the smallest custom runner on exact snapshot import/export, process-tree termination, resource and network enforcement, secret isolation, offline gates, crash recovery, deterministic artifact transfer, provider credential handling, and version pinning. SWE-ReX's local runtime is execution plumbing, not a security sandbox; it is acceptable only inside the same tested outer containment required of custom local execution. Adopt it when its adapter reduces lifecycle code and every invariant remains externally attestable. Reject it if it hides process identity, network policy, filesystem mutations, or cleanup state needed for fencing and receipts.

## 27. Risks and Reversal Criteria

| Risk | Mitigation | Reversal trigger |
|---|---|---|
| Version-sensitive Python SDK changes | Exact pin, adapter, source check, capability probe, real contract tests | Required control unavailable or repeatedly unstable: use direct app-server adapter |
| Minimum local containment is insufficient for hostile native code | Offline worker plus outer runner from Milestone 1 | Untrusted repositories or native dependency execution exceeds tested boundary: require rootless OCI, gVisor, microVM, or remote tier |
| SQLite single-writer limits | One supervisor, short transactions, WAL, bounded event payloads | Hosted or multi-host product: migrate activity/state backend |
| Planner DAG is poor | Code validation, critic, simple-task fast path, bounded re-plan | Persistent plan overhead without quality gain: use deterministic templates for more task classes |
| Parallel work increases conflicts | Path claims, isolated worktrees, serial integration | Conflict rate exceeds benefit: lower concurrency or plan interface-first tasks |
| Semantic review creates noise | Triggered lenses, structured findings, disposition metrics | Low precision: tune triggers, prompts, or model routing; never waive deterministic gates |
| Gate commands are malicious | Trusted config snapshot, argv-only runner, containment | Projects require arbitrary build scripts: require stronger sandbox tier |
| Local audit log is edited | Hash chain and immutable artifact hashes | Multi-user trust requirement: external append-only store or signed attestations |
| Model/token cost exceeds control | Hierarchical budget and matched evaluation | No measured quality/autonomy gain: simplify exploration and review stages |
| Maximum autonomy harms user work | Isolated attempts and atomic publication to a non-checked-out harness ref | Any checked-out target mutation: fail the release and remove the responsible code path |

## 28. Resolved Defaults and Deferred Extensions

These are binding implementation defaults unless a named Phase 0 reversal criterion fires; only the explicitly described extensions are deferred:

1. **Publication default:** atomically publish a clean-source result to `refs/codex-harness/runs/<run-id>` and a dirty-source result as an exact patch from a private object store; never update the checked-out target autonomously.
2. **Explicit apply:** defer a cooperative-lock and rollback-journal command until after v1; cherry-pick or merge the harness ref meanwhile.
3. **Initial concurrency:** four model turns maximum, lowered automatically by service limits and task availability.
4. **Containment implementation:** select the minimum Linux runner in Phase 0 and ship it in Milestone 1; add higher isolation in Milestone 4.
5. **Policy engine:** typed Python v1; reconsider Cedar after policy surface and users are known.
6. **Daemon:** foreground in Milestone 1 only; make the per-user daemon and OS restart integration part of Milestone 2 and the production definition.
7. **Repository map:** deterministic basic map v1; tree-sitter ranking after outcome measurement.
8. **External Git operations:** disabled in v1; add a GitHub broker only as a separate effect class.
9. **Model routing:** High reasoning by default. Use cheaper models only after task-class evaluation, never by untested heuristic.
10. **Native Codex subagents:** disabled as an authority mechanism. Experiment later within a worker's inherited limits.
11. **Native Codex Goals:** disabled inside harness workers; retained as a separate evaluation control.
12. **Symphony implementation:** build a compatible Python control plane unless the Phase 0 Elixir adopt/fork spike proves every invariant can be added with materially less code.
13. **Runner substrate:** compare SWE-ReX with the smallest custom backend in Phase 0; either remains subordinate to the same containment and receipt contracts.

## 29. Acceptance Criteria for the Rewrite

The first production-worthy release is not complete until all of these are demonstrated:

1. A High-reasoning run explicitly schedules more than one independent Codex worker without relying on worker self-delegation.
2. Parallel writers never share a writable checkout.
3. Workers cannot mutate Git metadata, harness state, trusted config, or gate receipts.
4. A worker that falsely reports success cannot advance past verification.
5. Every accepted candidate has deterministic receipts bound to its exact final tree.
6. Any tree change invalidates affected receipts.
7. A stale lease result cannot integrate.
8. A supervisor crash at every tested transition recovers without duplicate integration.
9. No run autonomously changes the user's branch, index, or working tree; clean-source publication is an atomic dedicated-ref update and dirty-source publication is patch-only from a private object store.
10. Normal workers have no outbound network and no broker credentials.
11. Unknown or high-risk effects cannot execute without the required authority.
12. Hard budgets stop calls, turns, retries, processes, time, output, and concurrency; token telemetry prevents new turns and demonstrates a documented bounded overshoot.
13. Policy and SDK capability failures are fail-closed and explainable.
14. The RunClosureManifest for every terminal outcome can reconstruct task, model, artifact, gate, review, budget, effect, and integration lineage.
15. Negative fixtures prove that each claimed guardrail rejects at least one realistic bad case.
16. A budget-matched three-arm evaluation compares the harness with plain High Codex and native Codex Goals, reporting an unmatched Goals arm separately if its budget cannot be controlled.
17. Exact-lock environments materialize without copying ignored ambient dependencies, and every receipt binds the resulting environment.
18. Attempt and gate kill domains are empty before immutable capture, including in daemonizing negative fixtures.
19. The owner-only daemon survives terminal closure, restarts after a forced crash, deduplicates CLI submissions, and preserves user-wide limits.
20. Every admitted SDK/runtime/platform fingerprint has a current real-runtime qualification record; fake-only CI can never authorize startup or release.
21. Generic workers and gates have no external network; dependency and research brokers have no repository mount, reject source-secret exfiltration canaries, and pass the full SSRF negative suite.
22. Candidate and integration Git object creation, clean-ref publication, and dirty-patch promotion reconcile to exactly the pre-recorded request across every injected crash boundary.
23. Every terminal run has destroyed or cryptographically erased native raw-session stores and unsanitized streams, with coredumps disabled, before its RunClosureManifest is accepted.
24. Power-cut tests over an attested local filesystem preserve intent-before-effect, durable-object-before-publication, and receipt reconciliation ordering.

## 30. Source Basis

All external capability claims should be rechecked when implementation begins because the research baseline is version-sensitive.

The Codex analysis used a freshly fetched official manual, the current rendered official hooks page, and stable and experimental protocol schemas generated from the locally installed codex-cli 0.144.4 on 2026-07-15. The hooks page took precedence where the aggregated manual lagged it. The Python SDK claims were checked against the pinned official repository commit below. These observations justify the design spike and version pin; they are not a promise that an unpinned future runtime has identical behavior.

### Research manifest

This design review used the following reproducibility record. The new standalone repository must store the same fields in a machine-readable `docs/research_manifest.json`, vendor or archive authority-bearing schemas and protocol notes where licensing permits, and regenerate the record before implementation if any source moves.

| Input | Pin or digest |
|---|---|
| Retrieval/check time | `2026-07-15T17:43:13+09:00` |
| OpenAI Codex source, including Python SDK | commit `2e1607ee2fa8099a233df7437adee5f16a741905` |
| OpenAI Symphony source | commit `4cbe3a9699a73b862466c0b157ceca0c1985d6d7` |
| SWE-ReX source | commit `5c995c365dfb1fd5bc56fda688be5d8538f9931f` |
| Local Codex CLI | `0.144.4`; Linux executable SHA-256 `2b3edc9cdfd1717fba3dbc92817205a8a2c7511d459e456d4817eeff6f78ed7a` |
| Codex launcher | SHA-256 `134063e133f0b4244fa3b251acf973d4fe4b4aeeacbdc135211bf480f59f1477` |
| Stable app-server schema bundle | SHA-256 `adc11a6af5e26a5cb5043d4d7982cde60be61739ce195433330eef7956766ed3` |
| Experimental app-server schema bundle | SHA-256 `bce0a0b8b08d39a7eaa3df0356c3b43f37a8c747dcff03415553c1dc013a3350` |
| Fetched Codex manual | SHA-256 `94b99e780560657d676b381a3c8c3c99ff9223cb943f388287b4a80011caadbd` |
| Rendered hooks behavior | release reference at `https://developers.openai.com/codex/hooks`, checked at the timestamp above |
| Python SDK wheel | Not installed or runtime-qualified during research; source claims only. Phase 0 must pin package version, wheel hash, bundled runtime hash, and qualification record before use. |

The schema-bundle digest is the SHA-256 of the sorted stream of each relative path's `sha256sum` line. Record the exact generator command and file-level digest manifest in the standalone repository; a bundle digest alone is insufficient for update review.

### OpenAI and Codex

- [Codex manual](https://developers.openai.com/codex/codex-manual.md): aggregated multi-agent, sandboxing, approvals, Permission Profiles, configuration, and safety snapshot; the rendered hooks release reference supersedes its lagging hook section.
- [Codex Python SDK README](https://github.com/openai/codex/blob/2e1607ee2fa8099a233df7437adee5f16a741905/sdk/python/README.md): package setup, authentication reuse, threads, and turn results.
- [Codex Python SDK API reference](https://github.com/openai/codex/blob/2e1607ee2fa8099a233df7437adee5f16a741905/sdk/python/docs/api-reference.md): AsyncCodex, concurrent active turns, lifecycle, output schemas, sandbox, usage, steering, and interruption.
- [Codex app-server README](https://github.com/openai/codex/blob/2e1607ee2fa8099a233df7437adee5f16a741905/codex-rs/app-server/README.md): JSON-RPC lifecycle, generated schemas, events, approvals, and backpressure behavior.
- [Codex MCP server interface](https://github.com/openai/codex/blob/2e1607ee2fa8099a233df7437adee5f16a741905/codex-rs/docs/codex_mcp_interface.md): experimental MCP control surface and relation to app-server protocols.
- [Open-source Codex orchestration with Symphony](https://openai.com/index/open-source-codex-orchestration-symphony/): internal orchestration pattern, published reference implementation, and reported operational experience.
- [Symphony repository and Elixir reference implementation](https://github.com/openai/symphony/tree/4cbe3a9699a73b862466c0b157ceca0c1985d6d7): runnable implementation used for the adopt/fork/port spike.
- [Symphony specification](https://github.com/openai/symphony/blob/4cbe3a9699a73b862466c0b157ceca0c1985d6d7/SPEC.md): reconciler, work source, isolated workspace, agent-runner, retry, status, and recovery contracts.
- [Follow goals with Codex](https://learn.chatgpt.com/use-cases/follow-goals): native durable objective and stopping-condition baseline.
- [Harness engineering](https://openai.com/index/harness-engineering/): mechanical architecture rules, repository maps, invariant enforcement, and evaluation feedback loops.
- [Unlocking the Codex harness](https://openai.com/index/unlocking-the-codex-harness/): app-server architecture and programmatic Codex control.
- [Codex agent approvals and security](https://developers.openai.com/codex/agent-approvals-security): relationship between approval policy and sandbox boundaries.
- [Codex hooks](https://developers.openai.com/codex/hooks): blocking behavior for covered PreToolUse and PermissionRequest events and documented interception gaps.
- [Running Codex safely](https://openai.com/index/running-codex-safely/): containment and local execution principles.
- [Designing agents to resist prompt injection](https://openai.com/index/designing-agents-to-resist-prompt-injection/): authority separation and prompt-injection defenses.
- [Why we no longer evaluate SWE-bench Verified](https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/): contamination and benchmark-quality caution.
- [Separating signal from noise in coding evaluations](https://openai.com/index/separating-signal-from-noise-coding-evaluations/): outcome-oriented coding-agent evaluation.

### Harness and coding-agent research

- [Claude Code subagents](https://code.claude.com/docs/en/sub-agents): Markdown-defined roles, tool restrictions, independent context, automatic delegation, and worktree isolation in the Summon substrate.
- [Claude Code agent teams](https://code.claude.com/docs/en/agent-teams): experimental shared tasks, teammate communication, permission inheritance, coordination costs, and documented recovery limitations.
- [Claude Code hooks](https://code.claude.com/docs/en/hooks): blocking lifecycle hooks available to a Claude-native harness; distinct from the current Codex hook semantics discussed above.
- [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents): incremental progress, clean state, structured handoff, and verification.
- [Harness design for long-running application work](https://www.anthropic.com/engineering/harness-design-long-running-apps): planner, generator, evaluator, and context-reset patterns.
- [Managed agents](https://www.anthropic.com/engineering/managed-agents): separation of durable session, harness, and sandbox concerns.
- [CAID paper](https://arxiv.org/abs/2603.21489): central asynchronous delegation with isolated work and controlled integration. Its reported PaperBench and Commit0 gains motivate the topology but do not establish that every project will see the same gains.
- [OpenHands event architecture](https://docs.openhands.dev/sdk/arch/events): typed event streams and immutable-event patterns.
- [OpenHands conversation architecture](https://docs.openhands.dev/sdk/arch/conversation): separation of agent conversation and runtime services.
- [OpenHands runtime architecture](https://docs.openhands.dev/openhands/usage/architecture/runtime): sandbox boundary and runtime topology.
- [SWE-ReX repository](https://github.com/SWE-agent/SWE-ReX/tree/5c995c365dfb1fd5bc56fda688be5d8538f9931f): pinned Python runtime implementation used for the runner spike.
- [SWE-ReX usage](https://swe-rex.com/latest/usage/): local, Docker, cloud, and sandbox-provider runtime interfaces.
- [SWE-agent documentation](https://swe-agent.com/latest/): agent trajectories and separate evaluation patterns.
- [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence): checkpoints, durable state, and interrupts.
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents): graph and orchestrator-worker patterns.
- [Temporal documentation](https://docs.temporal.io/): durable workflows, activities, retries, and recovery.
- [Aider repository map](https://aider.chat/docs/repomap.html): ranked symbol-level repository context.
- [Aider lint and test integration](https://aider.chat/docs/usage/lint-test.html): automatic feedback loops.
- [AutoGen selector group chat](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/selector-group-chat.html): model-selected team conversation, considered and rejected for authority-bearing scheduling.
- [CrewAI crews](https://docs.crewai.com/en/concepts/crews): role-based collaborative agent teams, considered and rejected for authority-bearing scheduling.
- [Dapr Agents](https://docs.dapr.io/developing-ai/dapr-agents/): durable service-oriented agent workflows considered for later distributed deployment.

### Policy, protocols, and infrastructure

- [Cedar authorization](https://docs.cedarpolicy.com/auth/authorization.html): default-deny and forbid-overrides-permit semantics.
- [OPA WebAssembly](https://www.openpolicyagent.org/docs/wasm): embedded policy evaluation option.
- [Model Context Protocol security best practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices): confused-deputy, token, and tool security considerations.
- [Git worktree documentation](https://git-scm.com/docs/git-worktree.html): isolated linked working trees.
- [SQLite WAL documentation](https://www3.sqlite.org/wal.html): local concurrency and durability behavior.
- [OpenTelemetry generative AI semantic conventions](https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/): optional telemetry vocabulary.
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/): code and model orchestration, tools, handoffs, guardrails, and sessions.
- [OpenAI Agents SDK Sandbox Agents](https://openai.github.io/openai-agents-python/sandbox_agents/): beta manifest-defined workspaces, capabilities, and sandbox clients.
- [OpenAI Agents SDK guardrails](https://openai.github.io/openai-agents-python/guardrails/): scope and limitations of input, output, and function-tool guardrails.
- [OpenAI Agents SDK Codex tool](https://openai.github.io/openai-agents-python/tools/#experimental-codex-tool): experimental workspace-scoped Codex delegation inside an Agents SDK run.
- [DBOS AI quickstart](https://docs.dbos.dev/ai/ai-quickstart): SQLite-backed durable agent workflows and ecosystem integrations.
- [DBOS workflow guarantees](https://docs.dbos.dev/python/tutorials/workflow-tutorial): determinism, idempotent workflow IDs, step semantics, and recovery.
- [Restate durable agents](https://docs.restate.dev/ai/patterns/durable-agents): journaled durable execution through a service runtime.
- [Modal Sandboxes](https://modal.com/docs/guide/sandboxes): isolated remote code execution and sandbox lifecycle.
- [Modal sandbox networking and security](https://modal.com/docs/guide/sandbox-networking): gVisor isolation and network behavior.
- [E2B documentation](https://www.e2b.dev/docs): agent-oriented isolated Linux VM sandboxes.
- [Daytona documentation](https://www.daytona.io/docs/en/): dedicated sandbox compute, process control, and snapshots.

## 31. Final Recommendation

Implement the narrowest trustworthy vertical slice first: one explicit High Codex worker in an isolated and contained workspace, one materialized environment receipt, one schema-valid result, one independently contained gate, one exact-tree receipt, one supervisor-staged commit, one atomically published harness ref or prebound dirty-source patch, and one recoverable SQLite event history.

Do not begin with a team roster, a dynamic agent marketplace, a generic graph framework, a daemon, or remote effects. Once the one-worker path proves that model claims cannot bypass code-owned state, add explicit DAG concurrency, independent reviewers, and bounded repair. This ordering gives non-Ultra Codex small contracts to build against and establishes the security properties before autonomy increases the blast radius.
