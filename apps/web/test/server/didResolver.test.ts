import { describe, it, expect, vi } from "vitest";
import { EmulsionDidResolver } from "../../src/lib/server/oauth/didResolver.js";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("EmulsionDidResolver", () => {
  it("resolves a did:plc via plc.directory with a Workers-safe redirect mode", async () => {
    const doc = { id: "did:plc:abc", service: [] };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("https://plc.directory/did:plc:abc");
      expect(init?.redirect).toBe("manual");
      return jsonResponse(doc);
    });

    const resolver = new EmulsionDidResolver(fetchMock as unknown as typeof fetch);
    expect(await resolver.resolve("did:plc:abc" as never)).toEqual(doc);
  });

  it("resolves a did:web via its well-known document", async () => {
    const doc = { id: "did:web:example.com", service: [] };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe("https://example.com/.well-known/did.json");
      return jsonResponse(doc);
    });

    const resolver = new EmulsionDidResolver(fetchMock as unknown as typeof fetch);
    expect(await resolver.resolve("did:web:example.com" as never)).toEqual(doc);
  });

  it("throws when the response is not ok (including redirects, which return non-2xx in manual mode)", async () => {
    const fetchMock = vi.fn(async () => new Response("nope", { status: 404 }));
    const resolver = new EmulsionDidResolver(fetchMock as unknown as typeof fetch);
    await expect(resolver.resolve("did:plc:abc" as never)).rejects.toThrow();
  });

  it("throws for an unsupported DID method", async () => {
    const resolver = new EmulsionDidResolver(vi.fn() as unknown as typeof fetch);
    await expect(resolver.resolve("did:key:abc" as never)).rejects.toThrow(/method/i);
  });
});
