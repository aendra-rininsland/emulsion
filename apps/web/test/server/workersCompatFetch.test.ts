import { describe, it, expect, vi } from "vitest";
import { createWorkersCompatFetch } from "../../src/lib/server/oauth/workersCompatFetch.js";

function response(init: ResponseInit = {}) {
  return new Response("ok", { status: 200, ...init });
}

describe("createWorkersCompatFetch", () => {
  it("passes through requests that don't request redirect: 'error'", async () => {
    const base = vi.fn(async () => response());
    const fetch = createWorkersCompatFetch(base);

    await fetch("https://example.com", { redirect: "follow" });

    expect(base).toHaveBeenCalledWith("https://example.com", { redirect: "follow" });
  });

  it("rewrites redirect: 'error' to 'manual' (Workers doesn't support 'error')", async () => {
    const base = vi.fn(async () => response());
    const fetch = createWorkersCompatFetch(base);

    await fetch("https://example.com", { redirect: "error", headers: { accept: "application/json" } });

    expect(base).toHaveBeenCalledWith("https://example.com", {
      redirect: "manual",
      headers: { accept: "application/json" }
    });
  });

  it("rejects when the server actually redirects, preserving redirect:'error' semantics", async () => {
    const base = vi.fn(async () => response({ status: 302, headers: { location: "https://evil.example.com" } }));
    const fetch = createWorkersCompatFetch(base);

    await expect(fetch("https://example.com", { redirect: "error" })).rejects.toThrow(/redirect/i);
  });

  it("rejects on an opaque redirect response (type: 'opaqueredirect')", async () => {
    const opaque = response();
    Object.defineProperty(opaque, "type", { value: "opaqueredirect" });
    const base = vi.fn(async () => opaque);
    const fetch = createWorkersCompatFetch(base);

    await expect(fetch("https://example.com", { redirect: "error" })).rejects.toThrow(/redirect/i);
  });

  it("does not touch requests with no init object at all", async () => {
    const base = vi.fn(async () => response());
    const fetch = createWorkersCompatFetch(base);

    await fetch("https://example.com");

    expect(base).toHaveBeenCalledWith("https://example.com", undefined);
  });

  it("returns the response unchanged when redirect was 'manual' from the start", async () => {
    const res = response();
    const base = vi.fn(async () => res);
    const fetch = createWorkersCompatFetch(base);

    const result = await fetch("https://example.com", { redirect: "manual" });
    expect(result).toBe(res);
  });
});
