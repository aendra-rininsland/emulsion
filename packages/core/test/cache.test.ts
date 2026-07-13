import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryCacheProvider } from "../src/cache/memoryCacheProvider.js";
import { createCachingFetch } from "../src/cache/cachingFetch.js";

describe("MemoryCacheProvider", () => {
  it("returns undefined for a missing key", async () => {
    const cache = new MemoryCacheProvider();
    expect(await cache.get("missing")).toBeUndefined();
  });

  it("stores and retrieves a value", async () => {
    const cache = new MemoryCacheProvider();
    await cache.set("key", { hello: "world" }, 60);
    expect(await cache.get("key")).toEqual({ hello: "world" });
  });

  it("expires a value after its TTL", async () => {
    vi.useFakeTimers();
    const cache = new MemoryCacheProvider();
    await cache.set("key", "value", 10);
    vi.advanceTimersByTime(11_000);
    expect(await cache.get("key")).toBeUndefined();
    vi.useRealTimers();
  });
});

describe("createCachingFetch", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("serves a second identical GET request from cache without hitting the network", async () => {
    const cache = new MemoryCacheProvider();
    let networkCalls = 0;
    const upstreamFetch = vi.fn(async () => {
      networkCalls++;
      return new Response(JSON.stringify({ n: networkCalls }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    });

    const cachingFetch = createCachingFetch({ cache, ttlSeconds: 60, fetch: upstreamFetch as unknown as typeof fetch });

    const first = await (await cachingFetch("https://example.com/data")).json();
    const second = await (await cachingFetch("https://example.com/data")).json();

    expect(first).toEqual({ n: 1 });
    expect(second).toEqual({ n: 1 });
    expect(networkCalls).toBe(1);
  });

  it("re-fetches once the cache entry expires", async () => {
    const cache = new MemoryCacheProvider();
    let networkCalls = 0;
    const upstreamFetch = vi.fn(async () => {
      networkCalls++;
      return new Response(JSON.stringify({ n: networkCalls }), { status: 200 });
    });

    const cachingFetch = createCachingFetch({ cache, ttlSeconds: 10, fetch: upstreamFetch as unknown as typeof fetch });

    await cachingFetch("https://example.com/data");
    vi.advanceTimersByTime(11_000);
    await cachingFetch("https://example.com/data");

    expect(networkCalls).toBe(2);
  });

  it("does not cache non-ok responses", async () => {
    const cache = new MemoryCacheProvider();
    let networkCalls = 0;
    const upstreamFetch = vi.fn(async () => {
      networkCalls++;
      return new Response("nope", { status: 500 });
    });

    const cachingFetch = createCachingFetch({ cache, ttlSeconds: 60, fetch: upstreamFetch as unknown as typeof fetch });

    await cachingFetch("https://example.com/data");
    await cachingFetch("https://example.com/data");

    expect(networkCalls).toBe(2);
  });

  it("does not cache non-GET requests", async () => {
    const cache = new MemoryCacheProvider();
    let networkCalls = 0;
    const upstreamFetch = vi.fn(async () => {
      networkCalls++;
      return new Response("ok", { status: 200 });
    });

    const cachingFetch = createCachingFetch({ cache, ttlSeconds: 60, fetch: upstreamFetch as unknown as typeof fetch });

    await cachingFetch("https://example.com/data", { method: "POST" });
    await cachingFetch("https://example.com/data", { method: "POST" });

    expect(networkCalls).toBe(2);
  });
});
