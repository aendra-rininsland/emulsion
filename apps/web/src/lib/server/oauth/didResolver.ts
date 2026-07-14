import type { AtprotoIdentityDidMethods } from "@atproto/did";
import type { Did, DidDocument } from "@atproto/did";
import type { DidResolver, ResolveDidOptions, ResolvedDocument } from "@atproto-labs/did-resolver";

/**
 * A minimal DidResolver for the `plc`/`web` methods, used in place of
 * @atproto-labs/did-resolver's own DidResolverCommon.
 *
 * That default implementation calls `this.fetch(url, { redirect: "error", ... })`
 * through `bindFetch`, which internally does `new Request(url, init)` (via
 * `asRequest` in @atproto-labs/fetch) *before* any injected fetch function ever
 * runs — so wrapping `fetch` can't intercept it. `new Request(url, { redirect:
 * "error" })` throws immediately in Workers ("Invalid redirect value"), no
 * network call involved. There's no way to fix this by injecting a different
 * fetch; the only fix is not going through that code path at all.
 *
 * This resolver does the same two HTTP calls (`packages/core`'s own
 * didResolver.ts does this identically, and works fine) with `redirect:
 * "manual"` from the start. A response to a redirect comes back non-2xx in
 * manual mode, so `res.ok` still correctly rejects it — the anti-SSRF intent
 * of the original "error" behavior is preserved without ever needing to
 * construct an unsupported Request.
 */
export class EmulsionDidResolver implements DidResolver<AtprotoIdentityDidMethods> {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async resolve<D extends Did>(
    did: D,
    options?: ResolveDidOptions
  ): Promise<ResolvedDocument<D, AtprotoIdentityDidMethods>> {
    let url: string;

    if (did.startsWith("did:plc:")) {
      url = `https://plc.directory/${did}`;
    } else if (did.startsWith("did:web:")) {
      const domain = decodeURIComponent(did.slice("did:web:".length));
      url = `https://${domain}/.well-known/did.json`;
    } else {
      throw new Error(`Unsupported DID method for "${did}". Only did:plc and did:web are supported.`);
    }

    const res = await this.fetchImpl(url, {
      redirect: "manual",
      signal: options?.signal,
      headers: { accept: "application/did+ld+json,application/json" }
    });

    if (!res.ok) {
      throw new Error(`Failed to resolve DID document for "${did}" (${res.status} from ${url})`);
    }

    const doc = (await res.json()) as DidDocument;
    return doc as ResolvedDocument<D, AtprotoIdentityDidMethods>;
  }
}
