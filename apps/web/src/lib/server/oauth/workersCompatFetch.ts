const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

/**
 * Cloudflare Workers doesn't support `redirect: "error"` on fetch/Request (it throws
 * "Invalid redirect value" at construction time) — everywhere else it's supported.
 * `@atproto/oauth-client-node`'s DID and handle resolvers use `redirect: "error"` as an
 * anti-SSRF measure (refuse to silently follow a redirect when resolving an identity).
 *
 * This wraps a base `fetch` so that `redirect: "error"` is rewritten to Workers' own
 * recommended replacement, `"manual"`, and then manually rejects if the response turns
 * out to have been a redirect — preserving the original "never follow a redirect here"
 * behavior instead of silently disabling it.
 */
export function createWorkersCompatFetch(baseFetch: typeof fetch): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    if (!init || init.redirect !== "error") {
      return baseFetch(input, init);
    }

    const res = await baseFetch(input, { ...init, redirect: "manual" });

    if (res.type === "opaqueredirect" || REDIRECT_STATUSES.has(res.status)) {
      throw new TypeError(`Refusing to follow redirect while fetching ${String(input)}`);
    }

    return res;
  }) as typeof fetch;
}
