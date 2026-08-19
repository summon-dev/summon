---
description: "Full 5-phase discovery workflow with architecture debate and mandatory board setup."
---
<!-- agent-notes: { ctx: "full discovery workflow, 5-phase + mandatory board", deps: [docs/methodology/personas.md, docs/methodology/phases.md], state: active, last: "claude@2026-08-10", key: ["board creation is mandatory not optional", "issues created as repo issues then added to project", "project linked to repo via gh project link"] } -->
Run a full discovery workflow for: $ARGUMENTS

This is a phased process. Complete each phase and get explicit human confirmation before moving to the next. Reference `docs/methodology/personas.md` for persona details.

---

## Phase 0: Template Cleanup

If this project was just created from the template, swap the storefront README for the project placeholder and clean up template-only files:

```bash
# Swap README: replace storefront with project placeholder
if [ -f README-template.md ]; then
  mv README-template.md README.md
fi

# Remove samples directory (only useful on the template repo itself)
rm -rf samples/ 2>/dev/null

# Remove template-specific ADRs (not relevant to inheriting projects)
rm -rf docs/adrs/template/ 2>/dev/null

# Remove template research/comparison docs
rm -f docs/research/how-we-compare-*.md docs/research/agent-teams-comparison.md 2>/dev/null
rm -f docs/research/what-*-can-learn-from-*.md docs/research/what-we-learn-from-*.md 2>/dev/null
```

If `README-template.md` doesn't exist, this project has already been initialized — skip this phase.

---

## Phase 1: Vision Elicitation (Coach Cam)

Slow down. Do NOT jump to solutions. Your job is to make the human's vision legible — often to themselves for the first time.

- Ask probing questions: "What problem does this solve? For whom? What does success look like? What would make you say this failed?"
- Use the 5 Whys to find root motivations behind surface-level requests.
- Try "what if we did the opposite?" to pressure-test assumptions.
- Surface hidden constraints: timeline, budget, existing systems, skill gaps.
- Propose alternatives the human hasn't considered.

**Checkpoint:** Summarize your understanding of the vision, goals, and constraints. Ask: "Did I get this right? What did I miss?"

**Tracking artifact:** After the human confirms, produce `docs/tracking/YYYY-MM-DD-<topic>-discovery.md` summarizing the vision, goals, constraints, and key insights from elicitation. Use the standard tracking format from `docs/process/tracking-protocol.md`. Set **Prior Phase** to "None".

---

## Phase 1b: Human Model Elicitation (Pat)

After Cam's vision elicitation, invoke Pat to learn the human's product philosophy. This builds the model that informs question recommendations and proxy decisions for the rest of the project.

- Ask the human about their decision style, quality vs. speed tradeoff, scope appetite, risk tolerance, user model, and non-negotiables (see Pat's elicitation questions in `pat.md`).
- Adapt follow-ups based on responses. Stop when you have enough signal.
- Write `docs/product-context.md` using the format defined in Pat's Human Model Lens.

**If `docs/product-context.md` already exists** (e.g., resuming a project), Pat reads it, summarizes it to the human, and asks: "Has anything changed since this was written? Any corrections?" Update if needed.

**Checkpoint:** Confirm with the human: "I've captured your product philosophy. Does this feel accurate?"

---

## Phase 2: Sacrificial Concepts (Dani)

Generate 2-3 intentionally different approaches. These are **sacrificial** — designed to provoke reactions, not to be implemented as-is.

- Vary on key dimensions: complexity, user model, technical approach, scope.
- Label each explicitly as sacrificial: "This is meant to be torn apart."
- Present trade-offs for each approach.
- Ask: "Which resonates most? Which do you hate? Why?"

**Checkpoint:** Summarize which direction the human is leaning and why. Confirm before proceeding.

---

## Phase 3: Architecture Assessment (Archie + Pierrot + Wei)

Based on the chosen direction:

- Propose a high-level architecture. Keep it simple — boxes and arrows, not a thesis.
- Identify key technology decisions that need to be made.
- For each significant choice, create an ADR using `/adr`.
- Flag risks and unknowns.
- **Threat model:** Archie creates the data flow diagrams, then Pierrot creates the initial threat model at `docs/security/threat-model.md` — STRIDE analysis, trust boundaries, attack surface inventory. This doesn't need to be exhaustive yet; it grows with the system.
- **Performance budget:** If the project has performance-sensitive requirements (user-facing latency, batch processing throughput, resource constraints), create an initial `docs/performance-budget.md` with targets.

### Adversarial Debate (Mandatory for each ADR)

For **every** ADR created in this phase, run the adversarial debate protocol. This is not optional.

1. **Invoke Wei** as a standalone agent on the ADR. Wei challenges the decision using at least 2 techniques from their persona (inversion, scale attack, assumption surfacing, alternative technology, cost of being wrong, historical precedent).
2. **Feed Wei's challenges back to Archie.** Archie must respond point-by-point.
3. **If unresolved concerns remain**, run a third round (Wei rebuttal). Cap at 3 rounds.
4. **Track the debate** in `docs/tracking/YYYY-MM-DD-<topic>-debate.md` using the format from `docs/process/team-governance.md` § Debate Tracking Format.
5. **Update the ADR** with any changes or acknowledged risks from the debate.

**Do not proceed to Phase 4 until all ADR debates are complete and tracked.**

**Checkpoint:** Summarize architectural direction, key decisions, initial threat surface, and debate outcomes (challenges raised, resolved, accepted as risks). Confirm.

**Tracking artifact:** After the human confirms, produce `docs/tracking/YYYY-MM-DD-<topic>-architecture.md` summarizing the chosen architecture, key ADRs created, technology decisions, threat surface, and debate results. Use the standard tracking format from `docs/process/tracking-protocol.md`. Set **Prior Phase** to the discovery artifact.

---

## Phase 4: Acceptance Criteria (Pat)

Before writing criteria, Pat reads `docs/product-context.md` to align acceptance criteria with the human's product philosophy.

Turn the vision into concrete, testable requirements:

- Break the vision into user stories or feature areas.
- Write acceptance criteria for the first milestone.
- Define MVP scope — what's in, what's explicitly out.
- Prioritize ruthlessly. "What's the smallest thing we could ship that would be useful?"

**Checkpoint:** Review the acceptance criteria with the human. Confirm scope.

---

## Phase 5: Planning (Grace + Tara)

Create the implementation plan:

- Create a plan document in `docs/plans/` using `/plan`.
- Identify the first sprint's work.
- Note which Summon agents should be actively engaged during implementation.
- Flag any remaining open questions or risks.
- **Test strategy:** Tara creates `docs/test-strategy.md` — what gets tested at which level, coverage targets, test data approach. This guides all future test writing.
- **Tech debt register:** Grace initializes `docs/tech-debt.md` (it will be empty, but the structure is in place for tracking).

**Checkpoint:** Review the plan. Confirm the human is ready to start building.

**Tracking artifact:** After the human confirms, produce `docs/tracking/YYYY-MM-DD-<topic>-plan.md` summarizing the plan goals, first sprint scope, test strategy decisions, and open risks. Use the standard tracking format from `docs/process/tracking-protocol.md`. Set **Prior Phase** to the architecture artifact.

### GitHub Project Board Setup (Mandatory)

After the plan is confirmed, create a GitHub Projects board to track the work. This is **not optional** — a project board is required for sprint tracking, backlog sweeps, and retro gating.

#### Pre-Flight: GitHub CLI Access

Before creating the board, verify GitHub CLI access works:

```bash
gh auth status
gh repo view --json owner,name
```

If either fails, **STOP**. Report: "GitHub CLI is not authenticated or cannot access this repo. Please run `gh auth login` and ensure this repo is accessible, then try again." Do not attempt board creation without working CLI access.

#### Step 1: Create and Link the Project

```bash
# Detect repo owner and name
gh repo view --json owner,name

# Create the project
gh project create --title "<project-name>" --owner @me

# Link the project to this repo
gh project link <NUMBER> --owner @me --repo <owner>/<repo>
```

#### Step 2: Configure Status Field (CRITICAL)

GitHub Projects v2 only creates default status options (Todo, In Progress, Done). This project requires **5 statuses**: Backlog, Ready, In Progress, In Review, Done. You MUST add the missing ones.

```bash
# 1. Get the project's node ID and Status field ID
gh project field-list <NUMBER> --owner @me --format json
# Find the "Status" field — note its ID and existing option IDs/names

# 2. Replace the status options via GraphQL.
# The mutation REPLACES the whole option set, so list all five — anything
# omitted is deleted. You need only the Status field ID from step 1.
#
# Do NOT pass projectId: `UpdateProjectV2FieldInput` does not accept it and
# GitHub rejects the whole mutation with `argumentNotAccepted`. Its inputs are
# clientMutationId, fieldId, name, singleSelectOptions, multiSelectOptions,
# iterationConfiguration.
gh api graphql -f query='
  mutation {
    updateProjectV2Field(input: {
      fieldId: "<STATUS_FIELD_ID>"
      name: "Status"
      singleSelectOptions: [
        {name: "Backlog", color: GRAY, description: "Not yet scheduled"}
        {name: "Ready", color: BLUE, description: "Scheduled for current sprint"}
        {name: "In Progress", color: YELLOW, description: "Actively being worked on"}
        {name: "In Review", color: ORANGE, description: "Implementation done, under review"}
        {name: "Done", color: GREEN, description: "Completed and verified"}
      ]
    }) {
      projectV2Field { ... on ProjectV2SingleSelectField { options { id name } } }
    }
  }'

# 3. VERIFY — mechanically, not by eye. This must exit 0 before you continue.
gh project field-list <NUMBER> --owner @me --format json | python3 -c '
import json, sys
want = ["Backlog", "Ready", "In Progress", "In Review", "Done"]
fields = json.load(sys.stdin).get("fields", [])
opts = [o["name"] for f in fields if f.get("name") == "Status" for o in f.get("options", [])]
print("Status options:", opts)
missing = [w for w in want if w not in opts]
if missing:
    sys.exit(f"BOARD SETUP FAILED — missing {missing}. Do NOT proceed to issue creation.")
print("all 5 statuses present")
'
```

**Do NOT proceed to issue creation until that check exits 0.** If it fails, add the options in the GitHub web UI as a fallback — but the statuses MUST exist before any items are added.

**Why the check is a script and not a glance.** This step fails *quietly*. `gh api graphql` returns HTTP 200 with an `errors` array on a rejected mutation, so the response looks structurally fine; and piping it into a parser discards the upstream exit status, so `$?` reports the parser's success rather than the API's failure. A real project hit exactly this: the mutation was rejected, the output looked like it worked, and the board was left with GitHub's three default statuses. Every later status transition then targets options that do not exist, and nothing notices until the sprint boundary finds a broken board — a whole sprint of lost tracking. If you do read the mutation's own response, check it for an `errors` key rather than trusting the exit code.

#### Step 3: Create Issues and Add to Project

```bash
# Create work items as repo issues (not draft items)
gh issue create --title "..." --body "..." --label "sprint:1"   # first sprint
gh issue create --title "..." --body "..."                       # backlog

# Add each issue to the project
gh project item-add <NUMBER> --owner @me --url <issue-url>
```

#### Step 4: Set Initial Statuses

After adding items, set their statuses. You need the Status field ID and option IDs from Step 2.

```bash
# Get item IDs
gh project item-list <NUMBER> --owner @me --format json

# Set status for each item
gh project item-edit --project-id <PROJECT_NODE_ID> --id <ITEM_ID> --field-id <STATUS_FIELD_ID> --single-select-option-id <OPTION_ID>
```

- First sprint items → **Ready**
- Everything else → **Backlog**

#### Step 5: Record Board Metadata

Update `CLAUDE.md` GitHub Board section with:
- Project number and owner
- Status field ID (so future commands don't need to look it up)
- Option IDs for each status (Backlog, Ready, In Progress, In Review, Done)

This metadata is required for all subsequent board operations. Without it, every status transition requires a field lookup first.

#### Step 6: Confirm

Report: "Board created and linked to repo with N items. First sprint has M items in Ready. Status field configured with 5 options: Backlog, Ready, In Progress, In Review, Done."

#### Development Environment Check

Before announcing readiness to build:

1. Check if `.devcontainer/devcontainer.json` exists.
2. **If not:** Ask the user: "No devcontainer is configured. Would you like me to set one up before starting the first sprint? I can run `/devcontainer` to create one tailored to this project's stack."
   - If yes: run `/devcontainer`.
   - If no: proceed without one.
3. **If it exists:** Confirm it's valid JSON and move on.
