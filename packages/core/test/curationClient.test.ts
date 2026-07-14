import { describe, it, expect, vi } from "vitest";
import { getCurationSettings, setCurationSettings, toggleFeaturedGallery } from "../src/curation/client.js";
import { PdsClient } from "../src/atproto/pdsClient.js";
import { DEFAULT_CURATION_SETTINGS } from "../src/curation/types.js";

const DID = "did:plc:abc";
const PDS = "https://pds.example.com";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("getCurationSettings", () => {
  it("returns the stored settings record", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        uri: `at://${DID}/app.emulsion.curation.settings/self`,
        cid: "c1",
        value: { mode: "featured", featured: ["at://x/y/1"], updatedAt: "2026-01-01T00:00:00.000Z" }
      })
    );
    const client = new PdsClient(PDS, { fetch: fetchMock as unknown as typeof fetch });

    const settings = await getCurationSettings(client, DID);
    expect(settings).toEqual({ mode: "featured", featured: ["at://x/y/1"], updatedAt: "2026-01-01T00:00:00.000Z" });
  });

  it("returns default (mode: all, empty featured) when no record exists yet", async () => {
    const fetchMock = vi.fn(async () => new Response("not found", { status: 400 }));
    const client = new PdsClient(PDS, { fetch: fetchMock as unknown as typeof fetch });

    const settings = await getCurationSettings(client, DID);
    expect(settings).toEqual(DEFAULT_CURATION_SETTINGS);
  });
});

describe("setCurationSettings", () => {
  it("writes the settings record via putRecord", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      expect(url.pathname).toBe("/xrpc/com.atproto.repo.putRecord");
      const body = JSON.parse(String(init?.body));
      expect(body.collection).toBe("app.emulsion.curation.settings");
      expect(body.rkey).toBe("self");
      expect(body.record.mode).toBe("featured");
      return jsonResponse({ uri: "at://x", cid: "c1" });
    });
    const client = new PdsClient(PDS, { fetch: fetchMock as unknown as typeof fetch });

    await setCurationSettings(client, DID, { mode: "featured", featured: ["at://x/y/1"] });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

describe("toggleFeaturedGallery", () => {
  it("adds a gallery URI to the featured list when not already present", async () => {
    const existing = { mode: "featured" as const, featured: ["at://x/y/1"], updatedAt: "2026-01-01T00:00:00.000Z" };
    let written: unknown;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      if (url.pathname === "/xrpc/com.atproto.repo.getRecord") {
        return jsonResponse({ uri: "at://x", cid: "c1", value: existing });
      }
      written = JSON.parse(String(init?.body)).record;
      return jsonResponse({ uri: "at://x", cid: "c2" });
    });
    const client = new PdsClient(PDS, { fetch: fetchMock as unknown as typeof fetch });

    const result = await toggleFeaturedGallery(client, DID, "at://x/y/2");

    expect(result.featured.sort()).toEqual(["at://x/y/1", "at://x/y/2"]);
    expect((written as { featured: string[] }).featured.sort()).toEqual(["at://x/y/1", "at://x/y/2"]);
  });

  it("removes a gallery URI from the featured list when already present", async () => {
    const existing = { mode: "featured" as const, featured: ["at://x/y/1", "at://x/y/2"], updatedAt: "" };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      if (url.pathname === "/xrpc/com.atproto.repo.getRecord") {
        return jsonResponse({ uri: "at://x", cid: "c1", value: existing });
      }
      const body = JSON.parse(String(init?.body));
      return jsonResponse({ uri: "at://x", cid: "c2", record: body.record });
    });
    const client = new PdsClient(PDS, { fetch: fetchMock as unknown as typeof fetch });

    const result = await toggleFeaturedGallery(client, DID, "at://x/y/1");
    expect(result.featured).toEqual(["at://x/y/2"]);
  });
});
