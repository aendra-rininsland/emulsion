import { describe, it, expect } from "vitest";
import { KVSimpleStore } from "../../src/lib/server/oauth/kvSimpleStore.js";

function fakeKv(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => {
      store.set(key, value);
    },
    delete: async (key: string) => {
      store.delete(key);
    }
  } as unknown as KVNamespace;
}

describe("KVSimpleStore", () => {
  it("returns undefined for a missing key", async () => {
    const store = new KVSimpleStore(fakeKv());
    expect(await store.get("missing")).toBeUndefined();
  });

  it("round-trips a JSON-serializable value", async () => {
    const store = new KVSimpleStore<{ a: number }>(fakeKv());
    await store.set("key", { a: 1 });
    expect(await store.get("key")).toEqual({ a: 1 });
  });

  it("deletes a value", async () => {
    const store = new KVSimpleStore<{ a: number }>(fakeKv());
    await store.set("key", { a: 1 });
    await store.del("key");
    expect(await store.get("key")).toBeUndefined();
  });
});
