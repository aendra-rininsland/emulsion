import { CloudflareCacheProvider, GrainClient, MemoryCacheProvider, createCachingFetch } from "@emulsion/core";
import type { CacheProvider } from "@emulsion/core";

const DEFAULT_CACHE_TTL_SECONDS = 300;

/**
 * Build a GrainClient for `did`, with an edge-cached fetch in front of every PDS request.
 * On Cloudflare, `cache` is the platform's Cache API (`platform.caches.default`); locally it
 * falls back to an in-memory cache so `pnpm dev` still avoids hammering the PDS on every reload.
 */
export async function createGrainClient(
  did: string,
  opts: { cache?: Cache; ttlSeconds?: number } = {}
): Promise<GrainClient> {
  const provider: CacheProvider = opts.cache
    ? new CloudflareCacheProvider(opts.cache, `https://emulsion.internal/cache/${did}/`)
    : new MemoryCacheProvider();

  const cachingFetch = createCachingFetch({
    cache: provider,
    ttlSeconds: opts.ttlSeconds ?? DEFAULT_CACHE_TTL_SECONDS
  });

  return GrainClient.forDid(did, { fetch: cachingFetch });
}
