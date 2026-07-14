import { describe, it, expect, vi } from "vitest";
import { PdsClient } from "../src/atproto/pdsClient.js";
import { EmulsionError } from "../src/errors.js";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

describe("PdsClient.listRecords", () => {
  it("fetches all records for a collection, following the cursor until exhausted", async () => {
    const calls: string[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      calls.push(url.search);
      if (!url.searchParams.get("cursor")) {
        return jsonResponse({
          records: [{ uri: "at://did:plc:abc/social.grain.gallery/1", cid: "cid1", value: { title: "One" } }],
          cursor: "page2"
        });
      }
      return jsonResponse({
        records: [{ uri: "at://did:plc:abc/social.grain.gallery/2", cid: "cid2", value: { title: "Two" } }]
      });
    });

    const client = new PdsClient("https://pds.example.com", { fetch: fetchMock as typeof fetch });
    const records = await client.listRecords("did:plc:abc", "social.grain.gallery");

    expect(records).toHaveLength(2);
    expect(records[0]?.value).toEqual({ title: "One" });
    expect(records[1]?.value).toEqual({ title: "Two" });
    expect(calls[1]).toContain("cursor=page2");
  });

  it("throws EmulsionError on a non-ok response", async () => {
    const fetchMock = vi.fn(async () => new Response("boom", { status: 500 }));
    const client = new PdsClient("https://pds.example.com", { fetch: fetchMock as typeof fetch });
    await expect(client.listRecords("did:plc:abc", "social.grain.gallery")).rejects.toThrow(EmulsionError);
  });
});

describe("PdsClient.getRecord", () => {
  it("fetches a single record by collection and rkey", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      expect(url.pathname).toBe("/xrpc/com.atproto.repo.getRecord");
      expect(url.searchParams.get("repo")).toBe("did:plc:abc");
      expect(url.searchParams.get("collection")).toBe("social.grain.actor.profile");
      expect(url.searchParams.get("rkey")).toBe("self");
      return jsonResponse({ uri: "at://did:plc:abc/social.grain.actor.profile/self", cid: "cid1", value: { displayName: "Chad" } });
    });

    const client = new PdsClient("https://pds.example.com", { fetch: fetchMock as typeof fetch });
    const record = await client.getRecord("did:plc:abc", "social.grain.actor.profile", "self");
    expect(record?.value).toEqual({ displayName: "Chad" });
  });

  it("returns null when the record does not exist (404)", async () => {
    const fetchMock = vi.fn(async () => new Response("not found", { status: 400 }));
    const client = new PdsClient("https://pds.example.com", { fetch: fetchMock as typeof fetch });
    const record = await client.getRecord("did:plc:abc", "social.grain.actor.profile", "self");
    expect(record).toBeNull();
  });
});

describe("PdsClient.putRecord", () => {
  it("PUTs the record to com.atproto.repo.putRecord with repo/collection/rkey/record", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      expect(url.pathname).toBe("/xrpc/com.atproto.repo.putRecord");
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual({
        repo: "did:plc:abc",
        collection: "app.emulsion.curation.settings",
        rkey: "self",
        record: { mode: "all", featured: [], updatedAt: "2026-01-01T00:00:00.000Z" }
      });
      return jsonResponse({ uri: "at://did:plc:abc/app.emulsion.curation.settings/self", cid: "cid1" });
    });

    const client = new PdsClient("https://pds.example.com", { fetch: fetchMock as typeof fetch });
    await client.putRecord("did:plc:abc", "app.emulsion.curation.settings", "self", {
      mode: "all",
      featured: [],
      updatedAt: "2026-01-01T00:00:00.000Z"
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("throws EmulsionError on a non-ok response", async () => {
    const fetchMock = vi.fn(async () => new Response("unauthorized", { status: 401 }));
    const client = new PdsClient("https://pds.example.com", { fetch: fetchMock as typeof fetch });
    await expect(client.putRecord("did:plc:abc", "coll", "self", {})).rejects.toThrow(EmulsionError);
  });
});

describe("PdsClient.getBlobUrl", () => {
  it("builds a com.atproto.sync.getBlob URL for a blob ref", () => {
    const client = new PdsClient("https://pds.example.com");
    const url = client.getBlobUrl("did:plc:abc", "bafyReiExample");
    expect(url).toBe(
      "https://pds.example.com/xrpc/com.atproto.sync.getBlob?did=did%3Aplc%3Aabc&cid=bafyReiExample"
    );
  });
});
