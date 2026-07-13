import type { CacheProvider } from "./CacheProvider.js";

/**
 * Adapts the Cloudflare Workers Cache API (https://developers.cloudflare.com/workers/runtime-apis/cache/)
 * to the CacheProvider interface. Keys are synthetic request URLs under `keyBaseUrl` so entries can
 * be namespaced per environment/DID and inspected with normal Cache semantics.
 */
export class CloudflareCacheProvider implements CacheProvider {
  constructor(
    private readonly cache: Cache,
    private readonly keyBaseUrl = "https://emulsion.internal/cache/"
  ) {}

  private keyToRequest(key: string): Request {
    return new Request(this.keyBaseUrl + encodeURIComponent(key));
  }

  async get<T>(key: string): Promise<T | undefined> {
    const match = await this.cache.match(this.keyToRequest(key));
    if (!match) return undefined;
    return (await match.json()) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const res = new Response(JSON.stringify(value), {
      headers: {
        "content-type": "application/json",
        "cache-control": `max-age=${ttlSeconds}`
      }
    });
    await this.cache.put(this.keyToRequest(key), res);
  }
}
