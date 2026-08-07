---
agent-notes:
  ctx: "Review of --ref flag and typecheck gate on feat/scaffolder-ref"
  deps: [packages/summon-team/src/index.ts, packages/summon-team/src/template-ref.ts, packages/summon-team/test/template-ref.test.ts, packages/summon-team/test/cli.test.ts, packages/summon-team/tsconfig.json, packages/summon-team/tsconfig.test.json, .github/workflows/ci.yml]
  state: active
  last: "code-reviewer@2026-08-08"
---
# Code Review: `--ref` template pinning + `typecheck` gate

**Date:** 2026-08-08
**Reviewed by:** Vik (simplicity), Tara (testing), Pierrot (security), Archie (conformance), Ines (operational)
**Branch:** `feat/scaffolder-ref` (cd34c91, 5fc260f) vs `main` (82cd76c)
**Files reviewed:** `packages/summon-team/src/index.ts`, `packages/summon-team/src/template-ref.ts`, `packages/summon-team/test/template-ref.test.ts`, `packages/summon-team/test/cli.test.ts`, `packages/summon-team/tsconfig.json`, `packages/summon-team/tsconfig.test.json`, `package.json`, `packages/summon-team/package.json`, `.github/workflows/ci.yml`
**Verdict:** Changes requested — one Critical (silent flag drop), three Important

## Context

Two commits.

`feat(cli): --ref` (#98) — `TEMPLATE = "github:summon-dev/summon"` carried no git ref, so `npx summon-team` always pulled the live default branch. The npm version pins the installer, not the template, so merging to main *is* publishing and no branch could be validated through the real install path. Adds `--ref <branch|tag|commit>`, a new `src/template-ref.ts` (`validateRef` / `buildTemplateSpec` / `describeDownloadFailure`), 57 unit tests and 9 CLI tests.

`fix(build): typecheck` (#100) — no `typecheck` script existed and the single tsconfig (`rootDir: "src"`, `include: ["src","test"]`) failed TS6059 before evaluating anything, so a Done Gate item graded `deterministic` had no command behind it. Splits into `tsconfig.json` (build, src only) and `tsconfig.test.json` (noEmit, `rootDir: "."`, `allowImportingTsExtensions`), adds scripts to both package.jsons, fixes the exposed errors including a real one (`ExecFileException.code` is `string | number | null | undefined`; `exitCodeOf` collapses the non-numeric branch).

Verification of the pre-digested facts I was handed: I re-derived giget 2.0.0's URL construction and cache-path construction from `node_modules/.pnpm/giget@2.0.0/.../giget.OCaTp9b-.mjs` rather than trusting the summary, and I probed the live GitHub tarball API. Where a finding rests on inference rather than observation, I say so inline.

---

## Findings

### Critical

#### C1 — `--ref=<value>` is silently ignored and the install reports success

`packages/summon-team/src/index.ts:145` (`args.indexOf("--ref")`), `:191-193` (project-name scan).

The parser only recognises the space-separated form. `args.indexOf("--ref")` never matches the token `--ref=feat/x`; the token then starts with `-`, so the project-name scan skips it too. It is discarded by every branch in `main()` — there is no unknown-flag check anywhere in the file (`grep` for `Unknown` returns nothing; the only three `startsWith("-")` sites are the two arity checks and the name scan).

**Observed, not inferred.** I ran the built CLI:

```
$ node dist/index.js --ref=no-such-ref-xyz myproj
◇  Template downloaded
◇  Project ready
└  Ship like a team of 10. You're the only human.
EXIT:0
```

`no-such-ref-xyz` does not exist in any repository. The run downloaded the default branch, wrote a complete project, and exited 0.

**Why this is Critical rather than a papercut.** This is a false green in the one code path built to eliminate false greens. Issue #98 exists because "you cannot tell which template content you actually installed" was unacceptable; `--ref=` reintroduces exactly that, and reintroduces it in the shape that is hardest to catch — total success. A reviewer running `npx summon-team --ref=v0.1.0-pre-registers proj` to validate a release candidate gets a green scaffold of main, concludes the tag is good, and ships. `=` and space are interchangeable in most CLIs the audience uses daily (`--filter=`, `--target=`, `npm --workspace=`), so this is not an exotic typo; it is the form half your users will reach for first.

The same hole exists for `--local=path` on main, which is why fixing it at the *unknown-flag* level rather than the `--ref` level is the better trade: one check closes both, plus `--reff`, `--Ref`, and every future flag.

**Fix.** After the existing arity checks, reject any remaining `-`-prefixed argument that is not in the known set (`--version`, `-v`, `--help`, `-h`, `--local`, `--ref`, `--yes`, and whatever the add-on phase consumes — enumerate them, do not guess). Exit 1 with `Unknown option: --ref=feat/x. Did you mean --ref feat/x?`. Supporting `=` as well is optional sugar; *refusing* it is the part that matters, because refusing turns a silent wrong install into a visible one.

**What would have to be true for this to be wrong:** that some later phase of `main()` consumes `--ref=` — it does not; I read the whole function and confirmed by execution — or that the `=` form is out of contract and the CLI is documented as space-only. `--help` at `index.ts:130` prints `--ref <ref>`, which is a convention hint, not a rejection. A hint the machine does not enforce is not a contract.

---

### Important

#### I1 — `--ref refs/pull/N/head` passes validation and resolves, widening the content trust boundary to any GitHub user

`packages/summon-team/src/template-ref.ts:14` (`ALLOWED_REF_CHARS`), used at `src/index.ts:174`.

`refs/pull/1/head` is letters, digits and slashes — it satisfies the allowlist, has no `..`, no leading/trailing slash. And GitHub resolves it:

```
$ curl -s -o /dev/null -w "%{http_code}" -L \
    "https://api.github.com/repos/summon-dev/summon/tarball/refs/pull/1/head"
200
```

**Observed** (the 200). **Inferred** (well-established GitHub semantics, not tested here): `refs/pull/N/head` is the PR head commit, and for a pull request opened *from a fork*, that commit is authored by someone with no push access to `summon-dev/summon`.

Before this diff, template content came from `main`'s HEAD, i.e. the set of people who can push to the repo. After it, `--ref` can address any object GitHub's tarball endpoint resolves for that repo, which includes fork-PR heads. The payload is not inert data: it is `CLAUDE.md`, `.claude/agents/*.md`, `.claude/commands/*.md`, `.claude/hooks/`, and `scripts/*.mjs` — instructions a coding agent reads and treats as authoritative, plus scripts the project's own `pnpm` invokes. Prompt injection with an execution path.

The exploit is social, and it is *native to the intended workflow*: the whole point of `--ref` is that people will paste refs from PR threads. `Thanks for the report — repro'd and fixed, try npx summon-team --ref refs/pull/57/head test-proj` is an entirely ordinary-looking message on an open-source issue.

I am grading this Important rather than Critical because it requires the user to paste an attacker-supplied string, and because Summon's threat model already treats `--local` as trusted. But the counter-argument is real and I want it on the record: `--local` points at a directory the user chose from their own disk, while `--ref` points at a *remote* string the user copied from someone else. Those are not the same trust posture, and the diff treats them as if they were.

**Fix (small, and it costs nothing legitimate).** Reject refs beginning with `refs/` in `validateRef`. Branches, tags and SHAs all resolve on the tarball endpoint without the `refs/` prefix — `main`, `v0.1.0`, `0123abc…` all work as-is — so no honest invocation loses anything, and `refs/pull/`, `refs/remotes/`, and future ref-namespace surprises close together. If you want the narrower cut, reject `refs/pull/` specifically, but the broad one is easier to defend and easier to test.

**What would have to be true for this to be wrong:** that GitHub does not serve fork-PR heads through the tarball endpoint (I observed a 200 for a `refs/pull/` path but did not diff the returned bytes against the PR head), or that `summon-dev/summon` never receives fork PRs. The second is a policy claim about a public repo that invites contribution, so it is not a defence.

#### N1 (verification note — not a finding) — Pierrot's core question, answered: the allowlist is sufficient, and it is load-bearing in a second place nobody documented

Not a defect — recording the verification, because the design rests on it and I was asked to pressure it.

`ALLOWED_REF_CHARS = /^[A-Za-z0-9._\/-]+$/` plus the explicit `..` / leading-`-` / leading-`/` / trailing-`/` / empty rejections is **sufficient for the URL threat**, and I confirmed the mechanism rather than assuming it:

- giget builds `tar: ${githubAPIURL}/repos/${parsed.repo}/tarball/${parsed.ref}` (giget dist:274). The ref lands in path position only. With `..`, `%`, `\`, `?`, `#`, `:` and `@` all excluded, there is no way to escape `/repos/summon-dev/summon/tarball/` — you can only append deeper path segments, which GitHub reads as a longer ref name. C1 and I1 aside, the URL cannot be retargeted.
- The percent-encoding rationale in the source comment is correct and worth keeping: the WHATWG URL parser treats `%2e` as a dot when identifying single- and double-dot path segments, so a denylist on the literal `..` genuinely loses to `%2e%2e%2f`. **Tara's veto on this point is well founded — a denylist would not do, and I am not arguing for one.**
- giget's own ref group is `(?<ref>#[\w./@-]+)` (dist:135). The app's allowlist is a strict subset (giget additionally permits `@`), so every ref that passes `validateRef` is consumed whole by giget's regex. No parser-differential.

The undocumented second job: giget writes the cache tarball to `resolve(cacheDirectory(), providerName, template.name, (template.version || template.name) + ".tar.gz")` (dist:394-402). It sanitises `template.name` with `.replace(/[^\da-z-]/gi, "-")` — and does **not** sanitise `template.version`, which *is the ref*. The ref therefore reaches a `resolve()` on the local filesystem unfiltered. `validateRef`'s `..` rejection is the only thing standing between a crafted ref and writing a `.tar.gz` outside the giget cache directory. That is worth a line of comment in `template-ref.ts:8-13`, because the current comment justifies the allowlist purely in terms of the URL, and a future editor who satisfies themselves that the URL is safe could relax the rule without ever learning about the filesystem path.

The allowlist also incidentally closes ANSI-escape injection into `describeDownloadFailure`'s output, which echoes the ref back to a terminal at `template-ref.ts:114-121`. No control characters can reach it.

Tar extraction (zip-slip) is node-tar's job via giget's `tarExtract`, and giget's `onentry` only strips a leading path component (dist:442-451) — it never prepends `..`. Unchanged by this diff; not a finding.

The 404 message leaks nothing sensitive: it carries the API URL and the repo name (both public) and no credential. `GIGET_AUTH`, if set, goes into a header, not the message. Note only that giget's `Tarball not found: ${tarPath}` variant would echo an absolute home-directory path — to the user's own terminal, so not a disclosure.

#### I2 — Nothing runs `pnpm typecheck` in CI, so the restored gate is still a memory exercise

`.github/workflows/ci.yml:24-38`. The steps are `check:canon`, `build`, `check:doctor`, `test`. No `typecheck`.

`pnpm build` is tsup, which is esbuild — it strips types without checking them. `pnpm test` is vitest, likewise. So the branch that was written specifically because "a proof grade is a claim about what was *run*, and it decays from deterministic to inferential in silence when the command behind it goes missing" has left the command sitting outside the only thing that runs commands unattended. The gate now depends on a human remembering, which is precisely the inferential grade the commit set out to escape.

This is a two-line fix and it is the highest-leverage item in the review after C1:

```yaml
      - name: Typecheck
        run: pnpm typecheck
```

Place it before `Build` — a type error should fail faster than a bundle.

While you are in there: `check:css` also exists in `package.json` and is also absent from CI. Out of this diff's scope, but the same failure mode, and the commit message already flags "Formatted" and "Linted" as having no scripts at all. That retro item is real; the fix for this one shouldn't wait for it.

**What would have to be true for this to be wrong:** a second workflow or a pre-push hook running typecheck. `.github/workflows/` contains only `ci.yml` and `deploy-site.yml`, and `deploy-site.yml` builds the site only.

#### I3 — The one behaviour that justifies the `NOT_FOUND` regex is the one behaviour with no test

`packages/summon-team/src/template-ref.ts:97` and `test/template-ref.test.ts:154-197`.

`NOT_FOUND = /(?::\s*404\b)|(?:\b404 Not Found\b)/` is deliberately anchored on status position rather than `message.includes("404")`, and the reason is good: giget's message embeds the request URL, which embeds the user's ref, so `--ref v404-hotfix` plus an unrelated 500 would otherwise be reported to the user as "your ref doesn't exist" — sending them to re-check a branch name that is fine while the actual server error goes unmentioned.

There is no test for that case. Every one of the 15 `describeDownloadFailure` tests uses a ref with no digits in it. Replace the regex with `message.includes("404")` and the entire 244-line suite still passes green. The complexity is unprotected: the next person to read that regex sees an elaborate alternation with no test explaining why it isn't a substring check, and simplifying it is a rational-looking move that silently breaks the behaviour.

**Fix.** One test, and it is the highest-value test in the file:

```ts
it("does not blame the ref when the ref merely contains 404 and the failure is not a 404", () => {
  const err = new Error(
    "Failed to fetch https://api.github.com/repos/summon-dev/summon/tarball/v404-hotfix: 500 Internal Server Error",
  );
  const message = describeDownloadFailure(err, "v404-hotfix");
  expect(message).not.toMatch(/does not exist|doesn't exist|spelled correctly/i);
});
```

I checked the regex against this input by hand and it behaves correctly today — `v404-hotfix` matches neither alternative, since there is no `:`-then-404 and no literal `404 Not Found`. The test pins a property that already holds; that is exactly what makes it worth having.

Related and worth a comment rather than a test: `NOT_FOUND`'s correctness *depends on `validateRef` rejecting `:` and whitespace*. A ref of `x:404` or `404 Not Found` would defeat the anchoring, and both are unrepresentable only because a different function in the same file forbids them. That coupling is invisible at the regex's definition site. One sentence — "safe because `validateRef` forbids `:` and spaces in refs" — is what keeps a future loosening of the allowlist from quietly breaking error classification.

---

### Suggestions

#### S1 — Repeated `--ref` turns the second value into the project name

`src/index.ts:145,187-193`. `indexOf` finds the first occurrence; `consumedValueIdx` therefore marks only that one value index. `summon-team --ref a --ref b` yields `ref = "a"` and `projectArg = "b"` — a project literally named `b`, scaffolded from `a`, with no warning. Same shape on main for `--local`. Derived from reading the code (I did not run it, to avoid a second live download); the logic is short enough that I am confident. Rolled into C1's fix if the unknown-flag check is generalised to "count occurrences of each known flag and reject duplicates".

#### S2 — `describeDownloadFailure` hardcodes the repo that `buildTemplateSpec` takes as a parameter

`template-ref.ts:110,116` say `summon-dev/summon` in prose, while `buildTemplateSpec(template, ref)` at `:53` accepts any template — and a test at `test/template-ref.test.ts:147` exercises `github:other-org/other-repo`. The module is parameterised on the template in one function and asserts a constant in another. Today `TEMPLATE` is the only caller so nothing lies, but ADR-0006's multi-runtime work is the kind of change that introduces a second template, and the failure mode is an error message confidently naming the wrong repository. Take the repo as an argument, or derive it from the spec.

**Archie's answer to "does `template-ref.ts` sit at the right seam?"** Yes, and I'd keep `describeDownloadFailure` where it is despite it being presentation. Its correctness depends on knowing how the URL was built — the `NOT_FOUND` anchoring is only sound because this module also owns the ref charset (see I3). Splitting message construction into a UI layer would put those two facts in different files with nothing linking them, which is a worse outcome than a module that mixes a little presentation with its domain. The module returns a plain string and does no I/O, so it stays testable; that is the property that actually matters. S2 is the one place where the mixing has leaked a hardcoded fact, and it is fixable without moving the function.

This package is meta under ADR-0007 (installer code, never shipped into a scaffolded project), so canon-zone rules don't bind it; `check:canon` passes. No shared/core types cross a package boundary here, and no ADR governs CLI flag surface — correctly, a flag is not an architectural decision. No conformance violations.

#### S3 — `buildTemplateSpec` appends `#` unconditionally

`template-ref.ts:53-56`. If `TEMPLATE` ever gains its own ref, the result is `…#main#feat/x`; giget's `(?<ref>#[\w./@-]+)` stops at the second `#`, takes `main`, and **discards the user's ref silently** — the same false-green class as C1, arriving through a different door. Unreachable today. A one-line `if (template.includes("#")) throw new Error(...)` is arguably YAGNI for a constant that hasn't changed; I'd still take it, because the cost is one line and the failure it prevents is invisible. Your call.

#### S4 — Vik: the arg parsing is *not* yet ready for a real parser, and `consumedValueIdx` is the right shape

Direct answer to the question posed. `main()` at ~120 lines of sequential flags is on the edge but not over it: four flags, one of which is a subcommand, and every branch is a linear read with no nesting. Introducing a parser dependency here would be the wrong rung of the ladder — you'd add a dependency to replace code a junior can read at 2am. Hold.

`consumedValueIdx` (`:187-190`) is genuinely the right generalisation: a `Set` seeded from a list of flag indices is what stops the *next* value-taking flag from reintroducing the `skipIdx` scalar bug, and it was introduced at the moment the second value-flag appeared, not speculatively. That is the pattern working as intended.

The duplication worth naming: `:136-143` and `:145-155` are now verbatim-identical arity checks differing only in flag name and message. Two is not three. Do not extract yet — but when the third value-taking flag lands (ADR-0006's `--target` is the visible candidate), extract `requireValue(args, "--ref", usage)` then, and let it own the duplicate-occurrence check from S1 and the unknown-flag check from C1 at the same time. Naming the trigger now is worth more than extracting now.

I have no objection to the `--help` short-circuit ruling. A global `--help` that an unrelated typo can defeat is worse than an unreported typo, `--local` already behaves this way, and `test/cli.test.ts:352-360` pins it by name with the reasoning attached. That comment is the thing that keeps a future reviewer from "fixing" it; leave it in.

#### S5 — Tara: the pre-occupied-directory technique passes for the right reason, but nothing stops it from passing for the wrong one

Direct answer to the question posed. The technique is sound *as written*, because the assertions distinguish outcomes rather than just checking non-zero: `test/cli.test.ts:373-388` asserts the output contains `already exists` **and** `not.toMatch(/letters, numbers, hyphens, or underscores/i)`, so a ref misread as a project name produces a different, detected failure. That is the difference between a test that pins behaviour and a test that pins "something went wrong", and this one is on the right side.

The fragility is what happens under refactor. If the emptiness check at `src/index.ts:232-244` moves below the download — or giget's `Destination … already exists` check (dist:433) becomes the only guard — these tests start reaching the network. They would then be slow and flaky rather than red, which is the worst failure mode for a suite: intermittent, environment-dependent, and easy to dismiss.

Cheap hardening, using a lever giget already provides: giget reads `GIGET_GITHUB_URL` from the environment (dist:263). Set it to a non-routable host in these tests' env, e.g. `GIGET_GITHUB_URL: "http://127.0.0.1:1"`. Any accidental network attempt then fails instantly and loudly with a connection-refused, instead of quietly succeeding against the real repo. That converts "these tests happen not to hit the network" into "these tests cannot hit the network", which is the property the comment at `:321-323` is currently asserting on the honour system.

Untested parts of the `--ref` contract: a valid ref reaching `downloadTemplate` at all (deliberate — needs network, and I agree with the call, though a `vi.mock("giget")` unit test asserting `downloadTemplate` was called with `"github:summon-dev/summon#feat/x"` would close it with no network and is the single largest coverage gap in the feature); duplicate `--ref` (S1); the `=` form (C1 — a test here would have caught it); and I3's regex case.

#### S6 — Nothing in a scaffolded project records which ref it came from

Ines. For a flag whose entire purpose is "verify a branch through the real install path", the artifact it produces is silent about its own provenance. A tester who scaffolds three candidates into three directories has no on-disk way to tell them apart, and neither does anyone they hand the directory to. A line in the generated `CLAUDE.md`, or a `.summon-install.json` with `{ ref, version, installedAt }`, closes it. This is the same argument the `--ref` feature itself makes, applied one step further downstream.

#### S7 — `tsconfig.json` is now the config no command runs

`packages/summon-team/tsconfig.json` / `tsconfig.test.json`. The split is correct and the rationale in the commit message is right. Two consequences worth knowing about:

`typecheck` runs `-p tsconfig.test.json`, which sets `allowImportingTsExtensions: true` and includes `src` as well as `test`. So a `src` file importing `./foo.ts` typechecks clean under the gate while being invalid under the build config. tsup/esbuild resolves it happily, so nothing catches the drift. Scoping `include` to `["test"]` in the test config (it extends the base, so `src` is still typechecked transitively through imports) or adding a second `tsc --noEmit -p tsconfig.json` invocation would close it. Low stakes today; noting it because "the gate is more permissive than the build" is a surprising property to leave undocumented.

Nothing invokes `tsconfig.json` directly anymore — it survives as the base config and as tsup's path source. That is fine, but it means `rootDir`/`outDir` correctness is now verified by nothing.

#### S8 — `[object Object]` in the failure detail

`template-ref.ts:100`. `messageOf({nope: true})` falls through to `String(err)` → `Could not download the template. ([object Object])`. `test/template-ref.test.ts:240` only asserts non-empty, so this is covered-but-unspecified. `JSON.stringify` with a try/catch, or dropping the detail when it stringifies to `[object Object]`, reads better. Cosmetic.

---

## Lessons

**A flag that is silently ignored is worse than a flag that doesn't exist.** C1 is the whole review in one finding. `--ref` was built because the install path had no way to tell you what it installed; `--ref=` puts that ambiguity right back, wearing a green checkmark. The general rule: any CLI that accepts `--flag value` should *reject* `--flag=value` if it doesn't support it, and reject unknown `-`-prefixed tokens outright. Argument parsers that ignore what they don't understand convert user typos into wrong answers, and wrong answers that exit 0 are the expensive kind. Cost of the check: about six lines.

**Allowlists earn their keep in places you didn't write them for.** The `..` rejection in `validateRef` was justified against the tarball URL. It turns out to also be the only thing preventing a user-supplied string from reaching a `path.resolve()` on the local filesystem, three layers down inside a dependency that sanitises the *adjacent* field and not this one. Neither the code nor the comment knows this. When you write a validator, the reasoning you record is what a future editor uses to decide how far they can relax it — so record every job the validator does, not just the one that motivated it. And when you can't enumerate the jobs, that's an argument for the allowlist over the denylist all by itself: an allowlist is safe against threats you haven't thought of, a denylist is safe against the ones you have.

**Trust boundaries move when addressability widens, even if the destination doesn't change.** `--ref` still points at `summon-dev/summon`. It feels like the same trust domain. But the set of *commits reachable in that repo* is much larger than the set of commits *someone with push access put there* — `refs/pull/N/head` is authored by anyone on the internet. When you add a selector to a trusted resource, the question is not "is the resource trusted" but "who can put things in the space the selector ranges over."

**The test that justifies your complexity is the one you're most likely to skip.** `NOT_FOUND` is a two-alternative regex where a substring check would look sufficient, and the suite that surrounds it is genuinely excellent — 57 unit tests, unhappy paths, non-Error throws, percent-encoding cases pinned specifically to catch a future loosening. And the single case that explains why the regex isn't `includes("404")` isn't there. This is a general pattern: coverage tends to cluster around the behaviour you were thinking about, and the anchoring case lives in the gap between "obvious behaviour" and "the reason I wrote it this way." When you find yourself writing a comment explaining why the simple version is wrong, that comment is a test specification.

**A gate is a command that something runs unattended.** #100 correctly diagnosed that "typecheck passes (deterministic)" had no command behind it, restored the command — and stopped one step short of the thing that makes a command a gate. A script in `package.json` that CI never invokes has the same proof grade as no script at all; it just looks better. Whenever you fix a missing check, the fix isn't done until something that isn't a human runs it on every change.

**Tests that avoid I/O by arranging for an earlier failure should also be *unable* to do the I/O.** The pre-occupied-directory trick is fine reasoning and the assertions are properly discriminating. But it depends on an ordering invariant in `main()` that no test states, and if that ordering changes the suite degrades to slow-and-flaky rather than red. When a dependency offers an endpoint override — as giget does with `GIGET_GITHUB_URL` — pointing it at a black hole costs one env var and upgrades "doesn't hit the network" from an observation to a guarantee.

REVIEW-COMPLETE: 12 findings (1 critical, 3 important)
