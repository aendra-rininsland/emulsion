import { describe, it, expect, vi } from "vitest";
import { sessionToFetch } from "../../src/lib/server/oauth/sessionFetch.js";

describe("sessionToFetch", () => {
  it("calls session.fetchHandler with the path+search, ignoring the origin used to build the URL", async () => {
    const fetchHandler = vi.fn(async () => new Response("ok"));
    const session = { fetchHandler } as unknown as { fetchHandler: typeof fetchHandler };

    const fetchFn = sessionToFetch(session as never);
    await fetchFn("https://pds.example.com/xrpc/com.atproto.repo.putRecord?foo=bar", { method: "POST" });

    expect(fetchHandler).toHaveBeenCalledWith("/xrpc/com.atproto.repo.putRecord?foo=bar", { method: "POST" });
  });

  it("accepts a URL object as input", async () => {
    const fetchHandler = vi.fn(async () => new Response("ok"));
    const session = { fetchHandler } as unknown as { fetchHandler: typeof fetchHandler };

    const fetchFn = sessionToFetch(session as never);
    await fetchFn(new URL("https://pds.example.com/xrpc/com.atproto.repo.getRecord"));

    expect(fetchHandler).toHaveBeenCalledWith("/xrpc/com.atproto.repo.getRecord", undefined);
  });
});
