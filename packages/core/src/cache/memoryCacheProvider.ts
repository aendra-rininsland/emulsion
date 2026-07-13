import type { CacheProvider } from "./CacheProvider.js";

interface Entry {
  value: unknown;
  expiresAt: number;
}

/** In-process cache with TTL expiry. Used in unit tests and as a local-dev fallback. */
export class MemoryCacheProvider implements CacheProvider {
  private readonly store = new Map<string, Entry>();

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
}
