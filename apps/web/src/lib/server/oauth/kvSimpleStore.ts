import type { SimpleStore } from "@atproto-labs/simple-store";

/** Generic JSON-serializing SimpleStore backed by a Cloudflare KV namespace. */
export class KVSimpleStore<V extends NonNullable<unknown>> implements SimpleStore<string, V> {
  constructor(private readonly namespace: KVNamespace) {}

  async get(key: string): Promise<V | undefined> {
    const value = await this.namespace.get(key);
    return value === null ? undefined : (JSON.parse(value) as V);
  }

  async set(key: string, value: V): Promise<void> {
    await this.namespace.put(key, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.namespace.delete(key);
  }
}
