import {
  CloudflareCacheProvider,
  GrainClient,
  MemoryCacheProvider,
  PdsClient,
  createCachingFetch,
  resolvePds
} from "@emulsion/core";
import type { CacheProvider } from "@emulsion/core";

const DEFAULT_CACHE_TTL_SECONDS = 300;

function buildCachingFetch(did: string, opts: { cache?: Cache; ttlSeconds?: number }): typeof fetch {
  const provider: CacheProvider = opts.cache
    ? new CloudflareCacheProvider(opts.cache, `https://emulsion.internal/cache/${did}/`)
    : new MemoryCacheProvider();

  return createCachingFetch({ cache: provider, ttlSeconds: opts.ttlSeconds ?? DEFAULT_CACHE_TTL_SECONDS });
}

/**
 * Photo/avatar blobs are routed through our own /blob/[did]/[cid] proxy instead of
 * pointing directly at the PDS — see src/routes/blob/[did]/[cid]/+server.ts. Blobs are
 * content-addressed (a CID is always the same bytes), so that route can cache them at
 * the edge far more aggressively than the JSON record cache.
 */
function buildBlobUrl(did: string, cid: string): string {
  return `/blob/${encodeURIComponent(did)}/${cid}`;
}

/**
 * Build a GrainClient for `did`, with an edge-cached fetch in front of every PDS request.
 * On Cloudflare, `cache` is the platform's Cache API (`platform.caches.default`); locally it
 * falls back to an in-memory cache so `pnpm dev` still avoids hammering the PDS on every reload.
 */
export async function createGrainClient(
  did: string,
  opts: { cache?: Cache; ttlSeconds?: number } = {}
): Promise<GrainClient> {
  return GrainClient.forDid(did, { fetch: buildCachingFetch(did, opts), blobUrlBuilder: buildBlobUrl });
}

/**
 * Build a read-only PdsClient for `did`, sharing the same edge-cached fetch as
 * createGrainClient. Used for reading Emulsion's own records (e.g. curation settings)
 * that live in the same repo but aren't part of the Grain lexicon.
 */
export async function createPdsClient(did: string, opts: { cache?: Cache; ttlSeconds?: number } = {}): Promise<PdsClient> {
  const cachingFetch = buildCachingFetch(did, opts);
  const pdsEndpoint = await resolvePds(did, { fetch: cachingFetch });
  return new PdsClient(pdsEndpoint, { fetch: cachingFetch });
}

/** Resolve a DID's PDS endpoint through the same edge-cached fetch as everything else. */
export async function resolvePdsEndpoint(did: string, opts: { cache?: Cache; ttlSeconds?: number } = {}): Promise<string> {
  return resolvePds(did, { fetch: buildCachingFetch(did, opts) });
}
