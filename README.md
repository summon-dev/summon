# Summon

**A virtual engineering team for code you have to answer for later.**

A lone agent says "looks clean, shipping." Summon is the engineering team that asks **"who decided this?"** — and holds the merge until someone has.

Summon drops a full AI engineering team into [Claude Code](https://claude.ai/code) — 16 agents with real process: architecture gates, TDD, multi-lens code review, and the standing to say *no*. Not a bag of agents. A team that catches what a solo pass leaves out.

**Try it:** `npx summon-team my-project` — full setup in [Quick Start](#quick-start).

---

## Summon caught its own team skipping a gate. That's the whole pitch.

**Before — a capable agent, working alone**

A Claude session set out to make Summon better: pull the best ideas from two well-regarded external repos and wire them in. It did good work — four commits that reshaped the team's review lenses and definition of "done."

Every commit was clean. Tests passed. The diff read well. It shipped.

What no one wrote down: four of those changes rewrote *how the team itself operates* — its review gates, its definition of done. There was no decision record. No ADR. No second opinion. Nothing that would let a future maintainer ask *"why is the Done Gate shaped like this, and who agreed to it?"* and get an answer. The work looked finished because nothing in a solo pass is built to notice the **absence** of a decision.

**After — the same work, run through Summon**

Here's the uncomfortable part, and it's the actual point: this happened *in the Summon repo*, by an agent that had every gate available — and skipped them anyway. Gates you have to remember to invoke get skipped. That's human, and no amount of prompt-tuning a single agent reliably fixes it, because the agent making the change is the same one that would have to notice it was skippable.

What Summon changes is the **aftermath**. Run through the team, the omission became *legible and reversible*: seven agents reviewed the change as independent reviewers, each with standing to halt. Wei (the devil's advocate) named it — the team had rewritten its own governance with no record. Archie (architecture) reclassified the four merged commits from "done" to *a spike to ratify or revert*, and the gated follow-on work stayed paused until two ADRs were written, argued across three rounds, and ratified by the human. [ADR-0004](docs/adrs/0004-summon-doctor.md) and [ADR-0005](docs/adrs/0005-behavioral-benchmark.md) now exist.

A bare agent leaves no decision-shaped hole for anyone to find later — the work just looks done. Summon left a reviewer the standing to stop the merge and a trail that says who decided what, and when. Judge *that* — not a promise that nothing ever slips.

**Read the receipt yourself:** the full episode — verdicts, the freeze, the two ratified ADRs — is recorded in [`docs/process/ponytail-harness-review.md`](docs/process/ponytail-harness-review.md). Click through to the merge that got frozen.

---

## Who Summon is for

- **The solo developer or two-to-three-person team who owns what they ship and has to live with it.** You're the one paged when it breaks and the one explaining, six months later, why a decision was made.
- **Builders of software meant to be maintained** — a product, an internal tool, a library others depend on — where *"why is it like this?"* is a question someone will actually ask.
- **People who already trust agents to do the work** but don't trust a single pass to catch what it silently left out — the missing ADR, the skipped review lens, the decision no one recorded.

## Who Summon is *not* for

- **Throwaway prototypes and spikes you'll delete next week.** If the code has no future, it has no decisions worth recording — the gates are pure overhead, and you should skip them.
- **Pure exploration where maximum flexibility beats traceability.** If you're still discovering what you're building and want to rewrite the world hourly, governance that asks "why did you change this?" is friction in exactly the wrong place.
- **Throughput-maximizing churn** — content pipelines, one-off scripts, glue you'll regenerate rather than maintain. There's no accountability surface for the process to protect.

If you're not going to maintain it or answer for it, use a bare agent. Summon earns its keep precisely when **someone will ask why later.**

---

## Questions you're actually asking

**"Isn't 16 agents overkill for one person?"**

You never run 16 at once. The methodology summons only the agents a phase needs — discovery pulls Cam, a security-touching change pulls Pierrot, most work touches three or four. The rest aren't standing around billing you; they're there for the moment you hit a problem they own. The real overkill is shipping an architecture nobody reviewed because the one agent you had didn't know it was supposed to stop.

**"Won't the agents just agree with each other?"**

They're built not to, and there's a receipt. In the episode above, the team argued its own keystone features down to the studs: Wei called a proposed process-metric a Goodhart trap — *fatal* for the headline claim. Debra flagged a construct-validity hole and said a handful of runs is an anecdote, not a number. Vik called a proposed `--json` envelope "a contract with one implementation and zero consumers" and demanded it be cut — and it was. That's not seven agents nodding. Wei's entire job is to break consensus that forms too fast; Pierrot holds a hard security veto; the review lenses are scored independently, not blended into one agreeable summary.

**"Isn't this just code review with extra steps? I can prompt one agent to 'review as a skeptic.'"**

You can, and you should — but that gets you an *opinion*. A skeptic prompt grades the code in front of it; it has no standing to halt the merge or to reclassify shipped work as unratified. The difference Summon makes isn't a sharper reviewer, it's that the verdict has teeth: in the episode above, work actually *froze*, and didn't resume until two ADRs were argued and ratified. A prompt gives you a comment. This gave you a stop and a written decision trail.

**"Isn't this just prompt theater — ceremony that makes me feel rigorous without changing the output?"**

Fair fear, and theater is the exact failure mode we built against — a process that only ever blesses what you were already going to do is worse than none, because it launders the decision. Ours leaves evidence in the git log instead: ADRs written *before* the code they govern, work frozen mid-stream when a decision got skipped, reviews that come back with "MISS" and a file:line, not a thumbs-up. The test is simple — if the team never tells you no, it isn't working. Ours does, on its own maintainers.

**"Won't all this slow me down and burn tokens?"**

It costs more than firing one prompt at the wall — that's the honest trade. But the expensive thing was never tokens; it's building three sprints on top of an architecture decision nobody made, then unwinding it. The gates spend a little up front to avoid the big rework. And you pay per *phase*, not per agent: a typo fix goes straight to the work, while the heavy ceremony only fires when the change is heavy enough to earn it.

**"I move fast. Won't the gates just get in my way?"**

The gates are sized to the work, not bolted on uniformly. A one-line fix doesn't summon an architecture debate. The Architecture Gate fires precisely when you're about to make a call that's expensive to reverse — the exact moment "move fast" quietly turns into "move fast in the wrong direction for two weeks."

**"I already know what I'm building — why do I need Cam interrogating me?"**

Then the interview is short. Cam isn't there to stall a clear vision; Cam's there for the far more common case where the vision is clear in your head and ambiguous on the page — the gap that becomes three rewrites. If you genuinely know, you'll prove it in two minutes and the team moves on.

---

## Quick Start

```bash
npx summon-team my-project
cd my-project
# Open in Claude Code, then run /quickstart
```

Or use the GitHub template directly:

1. Click **[Use this template](https://github.com/summon-dev/summon/generate)** on GitHub
2. Clone your new repo
3. Open it in Claude Code — it will detect the fresh project and guide you through setup

**Requirements:** [Claude Code](https://claude.ai/code) (CLI, desktop app, or IDE extension) and a Claude API key or Claude Pro/Team subscription.

---

## How it works

1. **You describe what you want to build.** Cam interviews you until the vision is sharp.
2. **The team plans.** Archie designs architecture. Pat writes work items. Grace organizes the sprint.
3. **The team builds.** Tara writes failing tests. Sato makes them pass. One commit per issue.
4. **The team reviews.** Vik checks simplicity. Tara checks coverage. Pierrot checks security. Three parallel lenses.
5. **The team ships.** Done gate passes. Sprint boundary runs. Retrospective captures learnings.

You're the product owner and the final decision-maker. The team handles the engineering discipline.

## The team

Summon installs 16 specialized agents that know each other and know when to invoke each other:

- **Cam** probes your vague idea until the vision is concrete — before anyone writes code
- **Archie** designs the architecture and writes ADRs — before implementation starts
- **Tara** writes failing tests first — then **Sato** makes them pass
- **Vik** reviews for simplicity, **Tara** checks test quality, **Pierrot** catches security issues — three lenses, in parallel
- **Grace** manages sprints, tracks velocity, coordinates handoffs
- **Pat** owns the backlog, writes acceptance criteria, prioritizes ruthlessly
- **Wei** plays devil's advocate when the team converges too quickly

Plus 6 more specialists: cloud ops, SRE, data science, UX/design, documentation, and pedagogy. The team self-organizes around your work using a 7-phase methodology — from discovery through sprint boundary.

**[Meet the team →](https://summon-dev.github.io/summon/team/overview/)** — the full roster as 16-bit hero sprites, with each agent's role and the moment it's invoked.

## What you get

- **Mandatory architecture gates** — no implementation without an ADR
- **TDD enforced** — failing tests before code
- **Multi-lens code review** — simplicity, test quality, and security in parallel, plus Archie's architectural-conformance lens when the change touches core types
- **Adversarial debate** — Wei challenges assumptions; Pierrot has security veto
- **Sprint boundaries** — retrospectives, velocity tracking, kaizen
- **Done gate** — 16-item checklist before any work item closes

## Slash commands

| Command | What it does |
|---------|-------------|
| `/kickoff` | Full project discovery (30-60 min) |
| `/quickstart` | Fast setup (5 min) |
| `/plan` | Implementation planning |
| `/tdd` | TDD workflow for a feature |
| `/review` | Guided human review session |
| `/code-review` | Multi-lens automated code review |
| `/handoff` | Save session state for next time |
| `/resume` | Pick up where you left off |
| `/sprint-boundary` | Sprint wrap-up: retro + gate + sweep |
| `/doctor` | Project health check |
| `/design` | Sacrificial concept exploration |
| `/adr` | Create an Architecture Decision Record |

Plus more for cloud reviews, scaffolding, devcontainers, dependency pinning, and grilling a claim of "done" — 24 commands in all.

## What's inside

```
.claude/
  agents/       16 specialized agents
  commands/     24 slash commands (/kickoff, /tdd, /review, /handoff, ...)

docs/
  methodology/  7-phase team methodology, persona catalog
  process/      Governance, done gate, gotchas, sprint tracking
  integrations/ GitHub Projects + Jira adapters
  scaffolds/    Project templates (code-map, test strategy, threat model, ...)
  adrs/         Architecture Decision Records

CLAUDE.md       Runtime instructions — Claude Code reads this first
```

## Contributing

Summon is open source under the MIT license. Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
