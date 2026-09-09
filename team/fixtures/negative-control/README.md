---
agent-notes: { ctx: "the negative-control fixture: a planted-defect diff the review formation must not wave through", deps: [team/fixtures/negative-control/planted.diff, team/lines/tdd.json, scripts/team-log.mjs, docs/methodology/team-layers.md], state: draft, last: "claude@2026-09-09", key: ["one planted defect per floor lens: simplicity, test-quality, security, conformance", "pass = every lens files a finding and the verdicts are not unanimous", "the persona layer's reversal instrument"] }
---

# Negative control

A review formation is only worth running if its lenses disagree. This fixture is a small diff with one deliberate defect per floor lens, and a rule: the formation must find all four and must not return a unanimous verdict on it. A formation that waves this through has stopped arguing, whatever its output looks like on real work.

## The planted defects

| Lens | Defect in `planted.diff` | What a working lens says |
|---|---|---|
| simplicity | `Notifier` interface with one implementation and a factory for one product | rung 1 of the ladder: the interface and the factory should not exist |
| test-quality | a test that asserts only that a result exists, and reads the wall clock | asserts content, not existence; pin the time |
| security | an API key hardcoded, and a query built by string concatenation from user input | secret in source; injection |
| conformance | the shared `Order` type gains a field only the PDF renderer uses | consumer-specific leakage in a shared type |

The defects are obvious on purpose. The control does not measure how sharp the lenses are; it measures whether they are running and whether they still split.

## Running it

1. Hand `planted.diff` to the review formation as item `negative-control`, with the log configured. The composed formation's Log section tells it to write a `finding` per defect it sees and a `verdict` per lens.
2. Then run the bound check:

```
pnpm team:control
```

It exits 0 only if every one of the four lenses filed at least one finding in its latest round and the latest verdicts are not unanimous. A `revise` or `veto` on the security or simplicity defect beside an `accept` elsewhere is the expected shape.

## What a failure means

- **A lens filed nothing:** that lens is not running, or its text no longer produces a finding on an obvious defect. Check the persona's Dissent and the lens file before touching the diff.
- **Unanimous verdicts:** the formation agrees with itself on a diff built to split it. This is the decomposed-team decision record's first reversal trigger; re-argue the persona layer on the evidence rather than retuning the fixture.

Do not make the defects subtler to make the control harder. The control is a floor, not a benchmark.
