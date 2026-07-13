import { describe, it, expect, vi } from "vitest";
import { resolvePds, resolveHandle, resolveDidDocument, EmulsionError } from "../src/atproto/didResolver.js";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

describe("resolvePds", () => {
  it("resolves a did:plc by fetching its DID document from plc.directory", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe("https://plc.directory/did:plc:bcgltzqazw5tb6k2g3ttenbj");
      return jsonResponse({
        id: "did:plc:bcgltzqazw5tb6k2g3ttenbj",
        service: [
          {
            id: "#atproto_pds",
            type: "AtprotoPersonalDataServer",
            serviceEndpoint: "https://pds.example.com"
          }
        ]
      });
    });

    const pds = await resolvePds("did:plc:bcgltzqazw5tb6k2g3ttenbj", { fetch: fetchMock as typeof fetch });
    expect(pds).toBe("https://pds.example.com");
  });

  it("resolves a did:web by fetching its well-known DID document", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe("https://example.com/.well-known/did.json");
      return jsonResponse({
        id: "did:web:example.com",
        service: [
          { id: "#atproto_pds", type: "AtprotoPersonalDataServer", serviceEndpoint: "https://pds.example.com" }
        ]
      });
    });

    const pds = await resolvePds("did:web:example.com", { fetch: fetchMock as typeof fetch });
    expect(pds).toBe("https://pds.example.com");
  });

  it("throws EmulsionError for an unsupported DID method", async () => {
    await expect(resolvePds("did:key:zFoo", { fetch: vi.fn() as unknown as typeof fetch })).rejects.toThrow(
      EmulsionError
    );
  });

  it("throws EmulsionError when the DID document has no PDS service entry", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ id: "did:plc:abc", service: [] }));
    await expect(
      resolvePds("did:plc:abc", { fetch: fetchMock as unknown as typeof fetch })
    ).rejects.toThrow(/PDS/);
  });

  it("throws EmulsionError when the directory lookup fails", async () => {
    const fetchMock = vi.fn(async () => new Response("not found", { status: 404 }));
    await expect(
      resolvePds("did:plc:missing", { fetch: fetchMock as unknown as typeof fetch })
    ).rejects.toThrow(EmulsionError);
  });
});

describe("resolveDidDocument", () => {
  it("returns both the PDS endpoint and handle from alsoKnownAs", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        id: "did:plc:bcgltzqazw5tb6k2g3ttenbj",
        alsoKnownAs: ["at://chad.grain.social"],
        service: [
          { id: "#atproto_pds", type: "AtprotoPersonalDataServer", serviceEndpoint: "https://pds.example.com" }
        ]
      })
    );

    const doc = await resolveDidDocument("did:plc:bcgltzqazw5tb6k2g3ttenbj", { fetch: fetchMock as typeof fetch });
    expect(doc).toEqual({ pdsEndpoint: "https://pds.example.com", handle: "chad.grain.social" });
  });

  it("omits handle when alsoKnownAs has no at:// entry", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        id: "did:plc:abc",
        alsoKnownAs: ["https://example.com/not-a-handle"],
        service: [{ id: "#atproto_pds", type: "AtprotoPersonalDataServer", serviceEndpoint: "https://pds.example.com" }]
      })
    );

    const doc = await resolveDidDocument("did:plc:abc", { fetch: fetchMock as typeof fetch });
    expect(doc.handle).toBeUndefined();
  });

  it("omits handle when alsoKnownAs is absent entirely", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        id: "did:plc:abc",
        service: [{ id: "#atproto_pds", type: "AtprotoPersonalDataServer", serviceEndpoint: "https://pds.example.com" }]
      })
    );

    const doc = await resolveDidDocument("did:plc:abc", { fetch: fetchMock as typeof fetch });
    expect(doc.handle).toBeUndefined();
  });
});

describe("resolveHandle", () => {
  it("resolves a handle to a DID via com.atproto.identity.resolveHandle on the public API", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe(
        "https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=chad.grain.social"
      );
      return jsonResponse({ did: "did:plc:bcgltzqazw5tb6k2g3ttenbj" });
    });

    const did = await resolveHandle("chad.grain.social", { fetch: fetchMock as typeof fetch });
    expect(did).toBe("did:plc:bcgltzqazw5tb6k2g3ttenbj");
  });
});
