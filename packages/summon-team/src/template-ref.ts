// agent-notes: { ctx: "Validate/format git refs for template download", deps: [], state: active, last: "sato@2026-08-08" }

/** Result of checking a user-supplied git ref. */
export type RefValidation = { ok: true } | { ok: false; reason: string };

/**
 * Characters a ref may contain. This is an allowlist on purpose: giget
 * interpolates the ref into a GitHub tarball URL, so a ref carrying path
 * traversal can retarget the download at a different repository. A denylist
 * loses to percent-encoding (`%2e%2e%2f`); an allowlist without `%` in it
 * cannot be smuggled past.
 */
const ALLOWED_REF_CHARS = /^[A-Za-z0-9._\/-]+$/;

export function validateRef(ref: string): RefValidation {
  if (ref.trim() === "") {
    return { ok: false, reason: "The ref is empty. Pass a branch, tag, or commit SHA after --ref." };
  }

  if (ref.includes("..")) {
    return {
      ok: false,
      reason: `The ref "${ref}" contains "..", which would escape the repository and download a different one.`,
    };
  }

  if (ref.startsWith("-")) {
    return {
      ok: false,
      reason: `The ref "${ref}" starts with "-". If you meant a flag, put it before the ref; ref names cannot start with a dash.`,
    };
  }

  if (ref.startsWith("/")) {
    return { ok: false, reason: `The ref "${ref}" starts with "/". Drop the leading slash.` };
  }

  if (ref.endsWith("/")) {
    return { ok: false, reason: `The ref "${ref}" ends with "/". Drop the trailing slash.` };
  }

  if (!ALLOWED_REF_CHARS.test(ref)) {
    return {
      ok: false,
      reason: `The ref "${ref}" contains characters that are not allowed. Use only letters, digits, ".", "_", "-", and "/".`,
    };
  }

  return { ok: true };
}

/**
 * Append a ref to a giget template spec. With no ref the spec is returned
 * byte-identical, so the default path behaves exactly as it did before --ref
 * existed.
 */
export function buildTemplateSpec(template: string, ref?: string): string {
  if (ref === undefined || ref === "") return template;
  return `${template}#${ref}`;
}

/** Pull a message off an unknown throw without assuming it is an Error. */
function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return String(err);
}

/** True for throws that carry no useful text at all — appending "(null)" helps nobody. */
function hasDetail(err: unknown): boolean {
  return err !== null && err !== undefined;
}

function codeOf(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const c = (err as { code?: unknown }).code;
    if (typeof c === "string") return c;
  }
  return "";
}

/**
 * Turn a download failure into something a person can act on.
 *
 * giget 2.0.0 reports a missing ref as a plain Error whose message contains
 * "404 Not Found" — there is no statusCode property to read, so the message
 * string is the only signal available.
 */
/**
 * Match the status, not the digits. giget's message embeds the whole request
 * URL — which contains the user's ref — so a bare `includes("404")` would read
 * `--ref v404-hotfix` as a missing ref no matter what actually failed. Anchor on
 * the status position instead.
 */
const NOT_FOUND = /(?::\s*404\b)|(?:\b404 Not Found\b)/;

export function describeDownloadFailure(err: unknown, ref?: string): string {
  const message = messageOf(err);
  const code = codeOf(err);
  const detail = message && hasDetail(err) ? ` (${message})` : "";

  if (NOT_FOUND.test(message)) {
    if (ref) {
      // A 404 can also mean a renamed repository or a private repo without
      // auth, so name the likely cause rather than asserting it.
      return (
        `Could not download the template at ref "${ref}". ` +
        `The most likely cause is that "${ref}" does not exist in summon-dev/summon — ` +
        `check the branch, tag, or commit is spelled correctly and has been pushed.${detail}`
      );
    }
    return (
      `Could not download the template: summon-dev/summon returned 404 Not Found. ` +
      `The template repository or its default branch was not there.${detail}`
    );
  }

  const networkCodes = ["ENOTFOUND", "ETIMEDOUT", "ECONNREFUSED", "ECONNRESET", "EAI_AGAIN"];
  const looksNetworky =
    networkCodes.includes(code) ||
    message.includes("fetch failed") ||
    networkCodes.some((c) => message.includes(c));

  if (looksNetworky) {
    return `Could not download the template. Check your network connection.${detail}`;
  }

  return `Could not download the template.${detail}`;
}
