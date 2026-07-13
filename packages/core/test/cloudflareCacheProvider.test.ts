import { describe, it, expect, vi } from "vitest";
import { CloudflareCacheProvider } from "../src/cache/cloudflareCacheProvider.js";

function fakeCache() {
  const store = new Map<string, Response>();
  return {
    match: vi.fn(async (req: Request) => store.get(req.url)),
    put: vi.fn(async (req: Request, res: Response) => {
      store.set(req.url, res);
    }),
    store
  };
}

describe("CloudflareCacheProvider", () => {
  it("returns undefined on a cache miss", async () => {
    const cache = fakeCache();
    const provider = new CloudflareCacheProvider(cache as unknown as Cache, "https://emulsion.internal/cache/");
    expect(await provider.get("foo")).toBeUndefined();
  });

  it("round-trips a JSON-serializable value through cache.put/match", async () => {
    const cache = fakeCache();
    const provider = new CloudflareCacheProvider(cache as unknown as Cache, "https://emulsion.internal/cache/");

    await provider.set("gallery:abc", { title: "Kyoto" }, 120);
    const value = await provider.get<{ title: string }>("gallery:abc");

    expect(value).toEqual({ title: "Kyoto" });
    expect(cache.put).toHaveBeenCalledOnce();
    const [req, res] = cache.put.mock.calls[0]!;
    expect(req.url).toBe("https://emulsion.internal/cache/gallery%3Aabc");
    expect(res.headers.get("cache-control")).toContain("max-age=120");
  });
});
