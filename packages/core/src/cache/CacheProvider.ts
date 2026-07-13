/** Minimal key-value cache abstraction, backed by either memory (tests, local dev) or the Cloudflare Cache API. */
export interface CacheProvider {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
}
