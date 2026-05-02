---
agent-notes: { ctx: "Wei challenge of ADR-0003 umbrella restructure", deps: [docs/adrs/0003-research-driven-restructure-2026.md, docs/methodology/phases.md, docs/process/team-governance.md, docs/process/gotchas.md], state: complete, last: "wei@2026-05-02" }
---

# Debate: ADR-0003 Research-Driven Restructure 2026

**ADR:** [docs/adrs/0003-research-driven-restructure-2026.md](../adrs/0003-research-driven-restructure-2026.md)
**Date:** 2026-05-02
**Participants:** Archie (author, in absentia) vs Wei (challenger)
**Note:** Wei is read-only by persona definition. Round 2 below is Wei's good-faith reconstruction of Archie's strongest defense, per the gate protocol's "anticipated rebuttal" pattern. Archie may rebut directly during the human-approval step; any concessions there should be folded back into ADR-0003 before Acceptance.

---

## Round 1 — Wei's Challenges

### Challenge 1 — Survivorship bias in the research synthesis (lines 13–24)

The eight findings read like a curated highlight reel of the consensus. Notable absences:

- **Where is the dissenting evidence on spec-driven dev?** Spec Kit, OpenSpec, Tessl, Kiro are listed (line 19). The post-mortems on Spec Kit adopters who found the spec layer became a parallel maintenance burden — duplicating ADRs and code comments — are not. The "30+ frameworks" claim is a popularity argument, not a quality argument. Thirty frameworks is also the signature of a hype cycle near peak, not a stable practice.
- **"Cognition vs Anthropic has settled" (line 17) is too strong.** Both companies have commercial incentives to publish positions consistent with their products. A "settled" debate inside two vendors is not a settled debate in the field. The Devin team's revised stance and Claude's harness paper are the same two voices the ADR claims as independent evidence.
- **"Pure swarm and pure blackboard rarely outperform hierarchy" (line 18) — citation needed.** Summon is currently using blackboard for Discovery and Debugging (phases.md lines 39, 144). The ADR cites this finding to justify ripping out blackboards in two phases. The finding's domain was *code-writing*, not *discovery* and not *debugging*. Discovery and Debugging are read/research phases — exactly where Cognition's own framework says multi-agent shines.
- **The "14 catalogued failure modes" (line 23)** are presented as if they apply uniformly. Which of those 14 has Summon actually hit in production? The ADR commits to structural change against failure modes Summon may not have. That is the textbook definition of premature optimization.

### Challenge 2 — Cargo-cult risk: adopting Anthropic's harness because it's published (line 21, decision point 4)

The decision to map Pat/Sato/Tara to planner/generator/evaluator (line 35, ADR-C) is suspicious. Anthropic published this triad as a *research finding from their own infra*. Summon is a Claude Code-native framework — meaning Anthropic's harness is the *vendor's preferred shape*. There are two failure modes:

1. **We are adopting the vendor's shape because the vendor published it.** That is cargo-culting with extra steps. The fact that it shows up well in vendor-authored benchmarks is exactly what you'd expect if it's tuned for the vendor's underlying model behavior. It tells us nothing about whether it survives Summon's actual usage patterns.
2. **The Pat/Sato/Tara mapping is forced.** Pat is a *product* persona — they prioritize, write acceptance criteria, run proxy mode (governance lines 47, gotchas line 77). Pat is not a *planner* in the Anthropic harness sense. The Anthropic planner is closer to Archie. Forcing Pat into "planner" hides that the harness shape doesn't actually match Summon's persona shape, and the misfit will leak as confused responsibilities at handoff time.

If you are going to adopt the harness, name the actual planner (Archie) as planner. Don't rename Pat to fit a paper.

### Challenge 3 — "Single-writer" is doing too much work (line 30, decision point 1, ADR-B, ADR-H)

This is the most important attack and I want to be precise.

The ADR uses "single-writer" three different ways without distinguishing them:

- **(a) Single agent invocation per write** — one Sato spawn at a time within a work item.
- **(b) Single owner of a code partition** — ADR-B "owned partitions instead of self-claim market" (line 44).
- **(c) Single thread of execution for code writes** — ADR-H "single-threaded-by-default" (line 50).

These are three different claims with three different consequence profiles, and the ADR conflates them.

Concretely: phases.md Phase 4 (lines 104–122) describes Grace coordinating *3+ independent items* across multiple Sato workers. The ADR proposes replacing this with "owned partitions." Either:

- **(b) is just renaming** — partitions are claimed by self-claim, owners are picked by Grace, conflicts are resolved at the partition boundary instead of at the merge boundary. Same problem, new name.
- **(b) is real** — partitions are pre-declared and frozen, in which case we lose the ability to absorb late-arriving work into an active sprint, and Grace's market-coordinator role becomes a static dispatcher. This is a regression in adaptability.

The ADR doesn't say which. That ambiguity is what the gate exists to surface.

The relevant gotcha here is `gotchas.md` line 67 (Plan-as-Bypass): partitions defined in advance are a plan; plans don't replace process. If a partition declared in the architecture phase encounters real work that crosses its boundary, the team needs to renegotiate — at which point we are back to a market with extra ceremony.

### Challenge 4 — Spec-driven overhead for XS/S items (decision point 2, ADR-A)

`docs/process/done-gate.md` already requires acceptance criteria. Each work item already has tests (TDD), an ADR if architectural, and agent-notes. Adding a feature-spec layer between ADR and TDD asks: *what does the spec contain that the ADR + tests + acceptance criteria don't?*

The ADR claims specs become "executable contracts" and "make Tara's red phase deterministic" (line 59). But Tara's red phase is *already* the executable contract — that's literally what TDD is. The spec, as described, is a paraphrase of the test plus a paraphrase of the acceptance criteria.

For an XS work item ("rename a function," "fix a typo in CLAUDE.md"), the spec layer is overhead with zero verification value. For an S item, marginal. Specs only earn their keep at M+ where the test surface is large enough that listing outcomes/scope/constraints/decisions/tasks/verification adds clarity over the test file.

**The unstated assumption: that all work items deserve the same artifact density.** Summon already sizes items XS through XL. The ADR proposes uniform spec adoption. Either ADR-A explicitly carves out XS/S items, or this becomes the next "Plan-as-Bypass" — a heavyweight artifact that the team starts skipping silently because it doesn't pay off, and now we have a process violation pattern with no accountability.

### Challenge 5 — The judge stack is mostly relabeling (decision point 6, ADR-F)

Vik+Tara+Pierrot is *already* the Phase 5 ensemble (phases.md lines 126–139). Archie's "architectural conformance" lens already exists in governance.md line 43. The "judge stack" in ADR-F adds:

- **Replay** — re-running the review on changed code. Useful, but a tooling concern, not an architectural one.
- **Disagreement review** — already exists as adversarial debate (governance.md lines 56–76).
- **Human escalation** — already exists implicitly; reviewer concerns block merge.

What's actually new? Maybe a formal threshold for when a disagreement triggers escalation. That's a one-sentence addition to governance.md, not an ADR. Calling this a "judge stack" imports academic vocabulary onto existing structure. It risks the team thinking they got something new when they got a renamed thing — and renamings drift from their referents over time. A year from now, "judge stack" will mean something subtly different than "code review ensemble" and we'll have two overlapping concepts with one workflow.

### Challenge 6 — Skills vs subagents split: which personas, what breaks (decision point 3, ADR-D, ADR-G)

ADR-G names Cloud, Debra, Diego, Dani as candidates for demotion to skills (line 49). I want to attack each:

- **Dani** is named in the Invisible UI anti-pattern (gotchas.md line 107). The team has already identified that Dani gets *under*-invoked, not over-invoked. Demoting Dani to a skill — something an agent loads when needed — is the exact wrong direction. The Invisible UI fix was to make Dani a *workflow step*, not a roster annotation. Skills are roster annotations. **This proposal recreates the bug Summon just fixed.**
- **Diego** owns docs (governance.md line 50). If Diego becomes a skill any agent loads, who is accountable for doc drift? Skills don't get retros. Agents do.
- **Debra** is the only agent with NotebookEdit (governance.md line 30). Skills, per the agentic-coding research the ADR cites, are *procedural knowledge*. NotebookEdit is a *tool grant*. You can't make Debra a skill without losing the tool isolation.
- **Cloud** spans cost, network, architecture (governance.md line 31). The 2026 research the ADR cites says skills carry *narrow* procedural knowledge. Cloud is broad. Compressing Cloud into a skill loses the depth the persona currently provides.

The line between agent and skill is the ADR's load-bearing claim about future maintainability. Get it wrong and you either lose accountability (Diego, Dani) or lose tool isolation (Debra) or lose depth (Cloud). The ADR commits to a direction without showing it has actually drawn that line.

### Challenge 7 — 8 ADRs in one cycle is a throughput problem Wei should have flagged at planning (line 41–50)

Each follow-on ADR carries its own gate: Archie writes, Wei challenges, multi-round debate, tracking artifact, ADR update, human approval (governance.md lines 84–97). At a realistic 1–2 hours of human attention per ADR, eight ADRs is 8–16 hours of human gate time. The ADR concedes this on line 66 ("sprint throughput will drop"). But "throughput will drop" understates the risk:

- **Gate fatigue.** By ADR-F, the human will be skimming. The gate stops working as a gate.
- **Cross-ADR coupling.** ADR-B (owned partitions) depends on ADR-D (agents vs skills) depends on ADR-A (spec schema). Sequencing matters and the ADR explicitly says they "may be ordered, parallelized, or merged" (line 52). Translation: the sequencing is unsolved.
- **Intermediate states are unstable.** Between accepting ADR-A and accepting ADR-E, Summon is half-restructured. Sprints landing in that window run on a hybrid that nobody designed.

This is a sequencing question that should be resolved *in this ADR*, not deferred. A staged rollout plan with explicit halt-points belongs in the Decision section, not punted to the eight follow-ons.

### Challenge 8 — The "what we will not relitigate" list is itself the most attackable part (line 26)

Line 26 names six things off-limits: phase-dependent teams, Wei adversarial debate, Tara TDD, Vik+Tara+Pierrot ensemble, agent-notes, handoff.md. Two of those are exactly what the ADR is about to change:

- **Vik+Tara+Pierrot ensemble** is "already a judge stack in spirit" — but ADR-F formalizes it. So it *is* being relitigated, just under a different name.
- **handoff.md as continuity artifact** — but decision point 4 (line 35) says "cross-session continuity moves from prose handoff to a structured progress-note schema." So handoff.md is *also* being relitigated.

You can't both protect something from challenge and replace it. Pick one. The "not relitigated" list looks like a rhetorical move to narrow the debate surface.

---

## Round 2 — Anticipated Archie Rebuttal

(Wei's good-faith reconstruction. Archie should respond directly when this is escalated.)

### Re: Challenge 1 (survivorship bias)
Archie's strongest defense: the ADR explicitly commits to *direction*, not implementation. The eight findings are framing for downstream ADRs; each follow-on ADR can carry its own dissenting-evidence section. Concession would be: add a "considered and rejected" subsection to this ADR before Acceptance, listing the strongest counter-evidence per finding.

### Re: Challenge 2 (cargo-cult harness)
Archie's defense: the planner/generator/evaluator triad is functionally equivalent regardless of vendor origin — it's a control-loop pattern that predates Anthropic's paper. The Pat mapping is debatable but not load-bearing for the umbrella ADR; ADR-C resolves it. **Wei's counter-counter:** if ADR-C resolves it, this umbrella ADR shouldn't pre-commit to "Pat/Sato/Tara" as the mapping (line 35). Strike that parenthetical and let ADR-C name the agents.

### Re: Challenge 3 (single-writer ambiguity)
Archie's strongest defense: the umbrella ADR is *supposed* to be high-level and the three meanings collapse to one operational rule — "one writer per code partition at a time." ADR-B and ADR-H disambiguate. **Wei's counter-counter:** then say that explicitly in the umbrella. One sentence: "single-writer means: at most one Sato invocation writing inside a given partition at a given time. Partition definition and partition lifecycle are deferred to ADR-B." That sentence costs nothing and prevents a year of meaning-drift.

### Re: Challenge 4 (spec overhead for XS/S)
Archie's defense: ADR-A will carve out item sizes. **Wei's concession:** acceptable if ADR-A *must* address sizing as an explicit acceptance criterion. Add to umbrella: "ADR-A must specify spec applicability by work-item size." Otherwise this attack stands.

### Re: Challenge 5 (judge stack is relabeling)
Archie's defense: formal naming creates a referent that tooling and metrics can attach to. "Code review ensemble" can't have a SLA; "judge stack" can. **Wei's partial concession:** fair if ADR-F adds something measurable (escalation thresholds, replay mechanics, disagreement quantification). If ADR-F is just renaming, my attack stands. The umbrella should constrain ADR-F to deliver measurable additions.

### Re: Challenge 6 (skills vs subagents misclassification)
Archie's strongest defense: ADR-G is *proposed*, not committed. The migration list is debatable per persona. **Wei's counter-counter:** then this ADR should not name specific personas (line 49) at the umbrella level. Naming Dani in particular contradicts gotchas.md line 107 (Invisible UI). At minimum, strike Dani from the umbrella's example list and let ADR-D justify each persona individually with reference to known anti-patterns.

### Re: Challenge 7 (8 ADRs throughput)
Archie's defense: that's why they ship as separate ADRs — to spread the load. **Wei's counter-counter:** spreading load doesn't solve sequencing, gate fatigue, or unstable intermediate states. The umbrella needs a rollout plan section that names: the order, the halt-points, what happens to in-flight sprints during the transition, and a "rollback" path if an ADR fails its gate.

### Re: Challenge 8 ("not relitigated" list)
Archie's defense: "not relitigated" means the *core principle* isn't up for debate, even though the implementation evolves. **Wei's concession:** acceptable framing if the line is rewritten as "the *principle* of X is not up for debate; the *artifact* may evolve." Current wording reads as protection, not principle.

---

## Round 3 — Wei's Verdict

### Must change before Acceptance (3 items)

1. **Disambiguate "single-writer" in the Decision section.** Add the one-sentence operational rule that distinguishes invocation, partition, and thread. Without this, every follow-on ADR will inherit the ambiguity. (Challenge 3.)
2. **Strike the Pat/Sato/Tara mapping** from line 35. Defer the planner/generator/evaluator naming to ADR-C. The umbrella ADR should not pre-commit to a persona mapping that ADR-C is supposed to debate. (Challenge 2.)
3. **Add a rollout/sequencing section** specifying ADR order, halt-points, and intermediate-state handling. "May be parallelized or merged" (line 52) is not a plan. (Challenge 7.)

### Absorbed into follow-on ADRs (4 items)

4. **Spec applicability by work-item size** — ADR-A acceptance criterion. (Challenge 4.)
5. **Judge stack must deliver measurable additions** — ADR-F acceptance criterion. (Challenge 5.)
6. **Persona-by-persona justification** — ADR-D and ADR-G must each cite the anti-pattern they avoid; specifically address Invisible UI for Dani. (Challenge 6.)
7. **Considered-and-rejected appendix** — each follow-on ADR carries its own dissenting-evidence section. (Challenge 1.)

### Conceded after rebuttal (1 item)

8. **"Not relitigated" framing** — accept Archie's principle/artifact distinction if the wording is tightened. Minor rewrite, not blocking.

### Net Recommendation

**ACCEPT WITH AMENDMENTS.**

The direction is sound: single-writer code paths and explicit harness contracts are real improvements over the current shape. The umbrella framing is the right move — committing to direction without committing to implementation gives the follow-on ADRs room to be debated properly.

But three changes are non-negotiable before this ADR can move to Accepted: disambiguate single-writer, strike the premature persona mapping, and add a rollout plan. The remaining attacks are correctly deferred to follow-on ADRs *provided* this umbrella ADR adds the acceptance criteria above to constrain those ADRs.

If the human approves moving to Accepted without amendments 1–3, that's an acknowledged risk and Wei wants it logged in the consequences section as such.
