import type { CacheProvider } from "./CacheProvider.js";

interface CachedResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export interface CachingFetchOptions {
  cache: CacheProvider;
  ttlSeconds: number;
  fetch?: typeof fetch;
  /** Prefix applied to cache keys, useful for namespacing multiple sites/DIDs sharing one cache. */
  keyPrefix?: string;
}

/** Wraps `fetch` so that successful GET responses are served from `cache` until their TTL expires. */
export function createCachingFetch(opts: CachingFetchOptions): typeof fetch {
  const upstream = opts.fetch ?? fetch;
  const prefix = opts.keyPrefix ?? "";

  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = (init?.method ?? "GET").toUpperCase();
    if (method !== "GET") {
      return upstream(input, init);
    }

    const key = `${prefix}${String(input)}`;
    const cached = await opts.cache.get<CachedResponse>(key);
    if (cached) {
      return new Response(cached.body, { status: cached.status, headers: cached.headers });
    }

    const res = await upstream(input, init);
    if (res.ok) {
      const body = await res.clone().text();
      const headers: Record<string, string> = {};
      res.headers.forEach((value, name) => {
        headers[name] = value;
      });
      await opts.cache.set<CachedResponse>(key, { status: res.status, headers, body }, opts.ttlSeconds);
    }
    return res;
  }) as typeof fetch;
}
