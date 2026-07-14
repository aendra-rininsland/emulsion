import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AdminSessionStore } from "../../src/lib/server/oauth/adminSessionStore.js";

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

const DID = "did:plc:abc";

describe("AdminSessionStore", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("creates a token that verifies back to the DID", async () => {
    const store = new AdminSessionStore(fakeKv());
    const token = await store.create(DID);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(10);
    expect(await store.verify(token)).toBe(DID);
  });

  it("returns null for an unknown token", async () => {
    const store = new AdminSessionStore(fakeKv());
    expect(await store.verify("does-not-exist")).toBeNull();
  });

  it("returns null once the session has expired", async () => {
    const store = new AdminSessionStore(fakeKv(), { ttlSeconds: 10 });
    const token = await store.create(DID);
    vi.advanceTimersByTime(11_000);
    expect(await store.verify(token)).toBeNull();
  });

  it("invalidates a token on destroy", async () => {
    const store = new AdminSessionStore(fakeKv());
    const token = await store.create(DID);
    await store.destroy(token);
    expect(await store.verify(token)).toBeNull();
  });

  it("generates distinct tokens on repeated creates", async () => {
    const store = new AdminSessionStore(fakeKv());
    const a = await store.create(DID);
    const b = await store.create(DID);
    expect(a).not.toBe(b);
  });
});
