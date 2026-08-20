// agent-notes: { ctx: "unit tests for --ref validation, spec building, failure messages", deps: ["src/template-ref.ts"], state: active, last: "tara@2026-08-08" }

import { describe, it, expect } from "vitest";
import { validateRef, buildTemplateSpec, describeDownloadFailure } from "../src/template-ref";

const TEMPLATE = "github:summon-dev/summon";

describe("validateRef", () => {
  describe("accepts refs that git and GitHub consider valid", () => {
    const valid = [
      ["a bare branch name", "main"],
      ["a branch with a slash segment", "feat/comms-slice-1"],
      ["a semver-ish tag with a prerelease suffix", "v0.1.0-pre-registers"],
      ["a release branch with a dot in it", "release/2.0"],
      ["a full 40-character commit SHA", "0123456789abcdef0123456789abcdef01234567"],
      ["a single-character ref", "a"],
    ] as const;

    for (const [description, ref] of valid) {
      it(`accepts ${description}`, () => {
        expect(validateRef(ref)).toEqual({ ok: true });
      });
    }
  });

  describe("rejects refs that would escape the intended repository", () => {
    it("rejects a ref containing a path traversal sequence", () => {
      const result = validateRef("../../etc");
      expect(result.ok).toBe(false);
    });

    it("rejects path traversal even when it is buried mid-ref", () => {
      expect(validateRef("feat/../../other-org/other-repo").ok).toBe(false);
    });

    it("rejects a bare double-dot", () => {
      expect(validateRef("..").ok).toBe(false);
    });

    it("rejects a git range expression, which contains a double-dot", () => {
      expect(validateRef("main..feat/x").ok).toBe(false);
    });

    // An allowlist has no `%`, so percent-encoded traversal is unrepresentable and
    // these pass for free today. They are here to pin that property: a later change
    // that loosens the ref rules (or swaps the allowlist for a denylist) would
    // reopen a traversal path through decoding, and these are what catch it.
    it("rejects percent-encoded path traversal", () => {
      expect(validateRef("%2e%2e%2f").ok).toBe(false);
    });

    it("rejects percent-encoded path traversal in upper case", () => {
      expect(validateRef("%2E%2E%2F").ok).toBe(false);
    });

    it("rejects percent-encoded traversal appended to a real branch name", () => {
      expect(validateRef("main%2e%2e%2fother").ok).toBe(false);
    });
  });

  describe("rejects fully-qualified refs, which reach beyond the pushable branches", () => {
    // GitHub serves /tarball/refs/pull/N/head with a 200, and a PR head can come
    // from any fork by anyone — where a branch or tag requires push access. The
    // payload here is agent instruction files and scripts/*.mjs, so that gap is
    // the difference between "a maintainer chose this" and "a stranger did".
    // Branches, tags and SHAs never need the refs/ prefix, so nothing legitimate
    // is lost by refusing it.
    it("rejects a pull request head ref", () => {
      expect(validateRef("refs/pull/95/head").ok).toBe(false);
    });

    it("rejects a pull request merge ref", () => {
      expect(validateRef("refs/pull/95/merge").ok).toBe(false);
    });

    it("rejects a fully-qualified branch ref", () => {
      expect(validateRef("refs/heads/main").ok).toBe(false);
    });

    it("rejects a fully-qualified tag ref", () => {
      expect(validateRef("refs/tags/v1.0.0").ok).toBe(false);
    });

    // The rejection must key on the refs/ path segment, not the letters "refs".
    // These are ordinary branch names a user is entitled to install.
    it("accepts a branch whose name merely starts with those letters", () => {
      expect(validateRef("refs-cleanup")).toEqual({ ok: true });
    });

    it("accepts a branch with a refs/ segment that is not the first", () => {
      expect(validateRef("my-refs/experiment")).toEqual({ ok: true });
    });
  });

  describe("rejects refs that are empty or blank", () => {
    it("rejects an empty string", () => {
      expect(validateRef("").ok).toBe(false);
    });

    it("rejects a whitespace-only ref", () => {
      expect(validateRef("   ").ok).toBe(false);
    });
  });

  describe("rejects refs that would confuse the shell, git, or a URL", () => {
    const invalid: ReadonlyArray<readonly [string, string]> = [
      ["a ref containing a space", "feat/my branch"],
      ["a ref containing a tab", "feat/my\tbranch"],
      ["a ref starting with a dash, which reads as a flag", "--ref"],
      ["a single leading dash", "-main"],
      ["a leading slash", "/main"],
      ["a trailing slash", "main/"],
      ["a tilde", "main~1"],
      ["a caret", "main^"],
      ["a colon", "origin:main"],
      ["a question mark", "main?"],
      ["an asterisk", "feat/*"],
      ["an open bracket", "feat/[x]"],
      ["a backslash", "feat\\x"],
      ["an at-brace reflog sequence", "main@{yesterday}"],
      ["a newline control character", "main\nother"],
      ["a carriage return control character", "main\rother"],
      ["a hash, which is giget's own ref delimiter", "main#feat/x"],
      ["a leading hash", "#main"],
    ];

    for (const [description, ref] of invalid) {
      it(`rejects ${description}`, () => {
        expect(validateRef(ref).ok).toBe(false);
      });
    }
  });

  it("explains why a rejected ref was rejected", () => {
    const result = validateRef("../../etc");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(typeof result.reason).toBe("string");
    expect(result.reason.trim().length).toBeGreaterThan(0);
  });

  it("gives a non-empty reason for every rejected ref", () => {
    const rejected = ["", "   ", "..", "-main", "/main", "main/", "main^", "main#x", "main\nx"];
    for (const ref of rejected) {
      const result = validateRef(ref);
      expect(result.ok).toBe(false);
      if (result.ok) continue;
      expect(result.reason.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("buildTemplateSpec", () => {
  it("leaves the template untouched when no ref is supplied", () => {
    expect(buildTemplateSpec(TEMPLATE, undefined)).toBe("github:summon-dev/summon");
  });

  it("leaves the template untouched when the ref argument is omitted entirely", () => {
    expect(buildTemplateSpec(TEMPLATE)).toBe("github:summon-dev/summon");
  });

  it("treats an empty-string ref as no ref at all", () => {
    expect(buildTemplateSpec(TEMPLATE, "")).toBe("github:summon-dev/summon");
  });

  it("appends the ref after a hash delimiter", () => {
    expect(buildTemplateSpec(TEMPLATE, "feat/x")).toBe("github:summon-dev/summon#feat/x");
  });

  it("appends a tag ref verbatim without rewriting it", () => {
    expect(buildTemplateSpec(TEMPLATE, "v0.1.0-pre-registers")).toBe(
      "github:summon-dev/summon#v0.1.0-pre-registers",
    );
  });

  it("appends a commit SHA verbatim", () => {
    const sha = "0123456789abcdef0123456789abcdef01234567";
    expect(buildTemplateSpec(TEMPLATE, sha)).toBe(`github:summon-dev/summon#${sha}`);
  });

  it("works for a template string other than the summon default", () => {
    expect(buildTemplateSpec("github:other-org/other-repo", "main")).toBe(
      "github:other-org/other-repo#main",
    );
  });
});

describe("describeDownloadFailure", () => {
  const notFound = () =>
    new Error(
      "Failed to download https://api.github.com/repos/summon-dev/summon/tarball/no-such-branch-xyz: 404 Not Found",
    );

  describe("when the download 404s and the user supplied a ref", () => {
    it("names the ref the user asked for", () => {
      const message = describeDownloadFailure(notFound(), "no-such-branch-xyz");
      expect(message).toContain("no-such-branch-xyz");
    });

    it("says the ref could not be found", () => {
      const message = describeDownloadFailure(notFound(), "no-such-branch-xyz").toLowerCase();
      expect(message).toMatch(/not found|could ?n[o']?t (be )?find|does not exist|doesn't exist/);
    });

    it("does not blame the network", () => {
      const message = describeDownloadFailure(notFound(), "no-such-branch-xyz").toLowerCase();
      expect(message).not.toContain("network");
      expect(message).not.toContain("connection");
    });

    it("still surfaces the underlying error text for debugging", () => {
      const message = describeDownloadFailure(notFound(), "no-such-branch-xyz");
      expect(message).toContain("404");
    });
  });

  describe("when the download 404s and no ref was supplied", () => {
    it("does not blame the network", () => {
      const message = describeDownloadFailure(notFound(), undefined).toLowerCase();
      expect(message).not.toContain("network");
      expect(message).not.toContain("connection");
    });

    it("returns a non-empty explanation", () => {
      expect(describeDownloadFailure(notFound(), undefined).trim().length).toBeGreaterThan(0);
    });

    it("still surfaces the underlying error text for debugging", () => {
      expect(describeDownloadFailure(notFound(), undefined)).toContain("404");
    });
  });

  describe("when the ref name itself contains a status code", () => {
    // giget embeds the user's ref in the message, so "does the message contain
    // 404" and "did the server answer 404" are different questions. A ref named
    // v404-hotfix makes them disagree — which is the case that discriminates a
    // position-anchored status match from a bare substring search.
    const refWith404 = "v404-hotfix";

    it("does not call the ref missing when the server returned a 500", () => {
      const err = new Error(
        "Failed to download https://api.github.com/repos/summon-dev/summon/tarball/v404-hotfix: 500 Internal Server Error",
      );
      const message = describeDownloadFailure(err, refWith404).toLowerCase();
      expect(message).not.toMatch(/not found|does not exist|doesn't exist/);
    });

    it("still calls the ref missing when the server really returned a 404", () => {
      const err = new Error(
        "Failed to download https://api.github.com/repos/summon-dev/summon/tarball/v404-hotfix: 404 Not Found",
      );
      const message = describeDownloadFailure(err, refWith404).toLowerCase();
      expect(message).toMatch(/not found|does not exist|doesn't exist/);
      expect(message).toContain(refWith404);
    });
  });

  describe("when the failure is a genuine network problem", () => {
    it("mentions the network for a bare fetch failure", () => {
      const message = describeDownloadFailure(new Error("fetch failed"), undefined).toLowerCase();
      expect(message).toMatch(/network|connection/);
    });

    it("mentions the network for a DNS lookup failure", () => {
      const err = Object.assign(new Error("getaddrinfo ENOTFOUND api.github.com"), {
        code: "ENOTFOUND",
      });
      expect(describeDownloadFailure(err, undefined).toLowerCase()).toMatch(/network|connection/);
    });

    it("mentions the network for a timeout", () => {
      const err = Object.assign(new Error("connect ETIMEDOUT"), { code: "ETIMEDOUT" });
      expect(describeDownloadFailure(err, undefined).toLowerCase()).toMatch(/network|connection/);
    });

    it("mentions the network even when a ref was supplied, because the ref is not the cause", () => {
      const err = Object.assign(new Error("getaddrinfo ENOTFOUND api.github.com"), {
        code: "ENOTFOUND",
      });
      expect(describeDownloadFailure(err, "feat/x").toLowerCase()).toMatch(/network|connection/);
    });
  });

  describe("when the thrown value is not an Error", () => {
    it("returns a non-empty message for a thrown string", () => {
      expect(describeDownloadFailure("something blew up", "feat/x").trim().length).toBeGreaterThan(
        0,
      );
    });

    it("returns a non-empty message for undefined", () => {
      expect(describeDownloadFailure(undefined, undefined).trim().length).toBeGreaterThan(0);
    });

    it("returns a non-empty message for null", () => {
      expect(describeDownloadFailure(null, "feat/x").trim().length).toBeGreaterThan(0);
    });

    it("returns a non-empty message for a plain object", () => {
      expect(describeDownloadFailure({ nope: true }, undefined).trim().length).toBeGreaterThan(0);
    });
  });
});
