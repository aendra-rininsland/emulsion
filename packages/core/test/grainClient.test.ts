import { describe, it, expect, vi } from "vitest";
import { GrainClient } from "../src/grain/client.js";

const DID = "did:plc:bcgltzqazw5tb6k2g3ttenbj";
const PDS = "https://pds.example.com";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function makeFetch() {
  const records: Record<string, unknown[]> = {
    "social.grain.gallery": [
      { uri: `at://${DID}/social.grain.gallery/g1`, cid: "cg1", value: { title: "Kyoto", createdAt: "2026-01-01T00:00:00.000Z" } }
    ],
    "social.grain.gallery.item": [
      {
        uri: `at://${DID}/social.grain.gallery.item/i1`,
        cid: "ci1",
        value: { createdAt: "2026-01-01T00:00:00.000Z", gallery: `at://${DID}/social.grain.gallery/g1`, item: `at://${DID}/social.grain.photo/p1`, position: 0 }
      }
    ],
    "social.grain.photo": [
      {
        uri: `at://${DID}/social.grain.photo/p1`,
        cid: "cp1",
        value: {
          photo: { $type: "blob", ref: { $link: "bafyphoto1" }, mimeType: "image/jpeg", size: 100 },
          aspectRatio: { width: 3, height: 2 },
          createdAt: "2026-01-01T00:00:00.000Z"
        }
      }
    ],
    "social.grain.photo.exif": []
  };

  return vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input));

    if (url.pathname === "/.well-known/did.json" || url.hostname === "plc.directory") {
      return jsonResponse({
        id: DID,
        alsoKnownAs: ["at://chad.grain.social"],
        service: [{ id: "#atproto_pds", type: "AtprotoPersonalDataServer", serviceEndpoint: PDS }]
      });
    }

    if (url.pathname === "/xrpc/com.atproto.repo.listRecords") {
      const collection = url.searchParams.get("collection")!;
      return jsonResponse({ records: records[collection] ?? [] });
    }

    if (url.pathname === "/xrpc/com.atproto.repo.getRecord") {
      const collection = url.searchParams.get("collection");
      if (collection === "social.grain.actor.profile") {
        return jsonResponse({
          uri: `at://${DID}/social.grain.actor.profile/self`,
          cid: "cprofile",
          value: { displayName: "Chad", description: "Photos.", createdAt: "2025-01-01T00:00:00.000Z" }
        });
      }
      return new Response("not found", { status: 400 });
    }

    return new Response("unhandled: " + url.toString(), { status: 500 });
  });
}

describe("GrainClient", () => {
  it("resolves the DID's PDS and lists galleries with joined photos", async () => {
    const fetchMock = makeFetch();
    const client = await GrainClient.forDid(DID, { fetch: fetchMock as unknown as typeof fetch });

    const { items: galleries, cursor } = await client.listGalleries();

    expect(galleries).toHaveLength(1);
    expect(cursor).toBeUndefined();
    expect(galleries[0]?.title).toBe("Kyoto");
    expect(galleries[0]?.photos).toHaveLength(1);
    expect(galleries[0]?.photos[0]?.blobUrl).toContain("com.atproto.sync.getBlob");
    expect(galleries[0]?.photos[0]?.blobUrl).toContain("bafyphoto1");
  });

  it("paginates galleries with a limit and cursor", async () => {
    const fetchMock = makeFetch();
    const client = await GrainClient.forDid(DID, { fetch: fetchMock as unknown as typeof fetch });

    const page = await client.listGalleries({ limit: 1 });
    expect(page.items).toHaveLength(1);
    expect(page.cursor).toBeUndefined();
  });

  it("fetches a single gallery by rkey", async () => {
    const fetchMock = makeFetch();
    const client = await GrainClient.forDid(DID, { fetch: fetchMock as unknown as typeof fetch });

    const gallery = await client.getGallery("g1");
    expect(gallery?.rkey).toBe("g1");

    const missing = await client.getGallery("nope");
    expect(missing).toBeNull();
  });

  it("fetches the actor profile", async () => {
    const fetchMock = makeFetch();
    const client = await GrainClient.forDid(DID, { fetch: fetchMock as unknown as typeof fetch });

    const profile = await client.getProfile();
    expect(profile.did).toBe(DID);
    expect(profile.displayName).toBe("Chad");
    expect(profile.handle).toBe("chad.grain.social");
  });
});
