import type { OAuthSession } from "@atproto/oauth-client-node";

/**
 * Adapts an authenticated OAuthSession into a `typeof fetch`, so it can be passed to
 * PdsClient like any other fetch. `session.fetchHandler` takes a path (it already knows
 * its own PDS and attaches the DPoP-bound access token), so this just extracts
 * pathname+search from whatever full URL PdsClient built and discards the origin.
 */
export function sessionToFetch(session: OAuthSession): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? new URL(input.url) : new URL(String(input));
    return session.fetchHandler(url.pathname + url.search, init);
  }) as typeof fetch;
}
