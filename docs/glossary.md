---
agent-notes: { ctx: "project domain glossary (ubiquitous language); replace the example terms", deps: [CLAUDE.md, docs/adrs/0009-ubiquitous-language-glossary.md], state: active, last: "archie@2026-07-07" }
---

# Glossary

The **ubiquitous language** for this project — the domain vocabulary the team and the code share (Eric Evans, _Domain-Driven Design_). One opinionated word per concept, defined once, used everywhere: in conversation, in issue titles, in variable and file names. When everyone names a thing the same way, the agents spend fewer words describing it and the codebase stays navigable.

This file holds **domain** terms — the nouns of what you're building (Order, Invoice, Patient, Trade). It does **not** hold Summon's own process vocabulary (proof grade, wave, agent-notes); those are defined in their spec docs and referenced bare. See `docs/process/doc-ownership.md` for the boundary between this glossary, `docs/code-map.md`, and agent-notes.

**Owner:** Archie (Architecture). Cam captures new terms during Discovery; Archie arbitrates overloaded or competing terms and keeps this file the single source of truth for domain meaning.

## How to use it

- **Define what a term _is_, not what it does.** One or two sentences. A glossary is not a spec — no implementation detail.
- **Be opinionated.** When several words compete for one concept, pick one and list the rest under `_Avoid_`. This is also a guard against elegant-variation drift (`docs/process/ai-tells-catalog.md`): if the code and docs all say `Order`, nothing silently renames it to "purchase" three files later.
- **Domain terms only.** General programming concepts (cache, timeout) and Summon process terms both stay out.
- **One heading per term.** Each entry is a `**Term**:` heading; keep them unique (the `summon doctor` glossary check flags duplicates).

## Example — replace with your project's terms

> These entries are a worked example (an e-commerce domain) to show the format. Delete them and record your own domain's vocabulary below.

**Order**:
A customer's request to purchase one or more items, priced at the time of placement.
_Avoid_: purchase, transaction, cart

**Invoice**:
A request for payment issued after an Order is fulfilled.
_Avoid_: bill, receipt

**Customer**:
A party who can place an Order. Distinct from a site visitor, who has not yet placed one.
_Avoid_: user, account, buyer

## Your project's domain terms

_Add your terms here as they surface in Discovery and Architecture. Remove the example section above once you have your own._
