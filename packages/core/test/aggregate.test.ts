import { describe, it, expect } from "vitest";
import { assembleGalleries, assemblePhoto } from "../src/grain/aggregate.js";
import type { PdsRecord } from "../src/atproto/pdsClient.js";
import type { GalleryItemRecord, GalleryRecord, PhotoExifRecord, PhotoRecord } from "../src/grain/types.js";

const DID = "did:plc:bcgltzqazw5tb6k2g3ttenbj";

function galleryRecord(rkey: string, overrides: Partial<GalleryRecord> = {}): PdsRecord<GalleryRecord> {
  return {
    uri: `at://${DID}/social.grain.gallery/${rkey}`,
    cid: `cid-gallery-${rkey}`,
    value: { title: `Gallery ${rkey}`, createdAt: "2026-01-01T00:00:00.000Z", ...overrides }
  };
}

function itemRecord(rkey: string, galleryUri: string, photoUri: string, position: number): PdsRecord<GalleryItemRecord> {
  return {
    uri: `at://${DID}/social.grain.gallery.item/${rkey}`,
    cid: `cid-item-${rkey}`,
    value: { createdAt: "2026-01-01T00:00:00.000Z", gallery: galleryUri, item: photoUri, position }
  };
}

function photoRecord(rkey: string, overrides: Partial<PhotoRecord> = {}): PdsRecord<PhotoRecord> {
  return {
    uri: `at://${DID}/social.grain.photo/${rkey}`,
    cid: `cid-photo-${rkey}`,
    value: {
      photo: { $type: "blob", ref: { $link: `bafy-${rkey}` }, mimeType: "image/jpeg", size: 12345 },
      aspectRatio: { width: 4, height: 3 },
      createdAt: "2026-01-01T00:00:00.000Z",
      ...overrides
    }
  };
}

function exifRecord(rkey: string, photoUri: string, overrides: Partial<PhotoExifRecord> = {}): PdsRecord<PhotoExifRecord> {
  return {
    uri: `at://${DID}/social.grain.photo.exif/${rkey}`,
    cid: `cid-exif-${rkey}`,
    value: { photo: photoUri, createdAt: "2026-01-01T00:00:00.000Z", ...overrides }
  };
}

describe("assemblePhoto", () => {
  it("builds a photo view with a blob URL and scaled EXIF values", () => {
    const photo = photoRecord("p1");
    const exif = exifRecord("e1", photo.uri, {
      make: "FUJIFILM",
      model: "X100V",
      fNumber: 2_000_000,
      exposureTime: 500,
      iSO: 200_000_000,
      focalLengthIn35mmFormat: 23_000_000
    });

    const view = assemblePhoto(DID, photo, exif, "https://pds.example.com/xrpc/com.atproto.sync.getBlob?did=x&cid=bafy-p1");

    expect(view.blobUrl).toBe("https://pds.example.com/xrpc/com.atproto.sync.getBlob?did=x&cid=bafy-p1");
    expect(view.aspectRatio).toEqual({ width: 4, height: 3 });
    expect(view.exif).toEqual({
      make: "FUJIFILM",
      model: "X100V",
      lensMake: undefined,
      lensModel: undefined,
      flash: undefined,
      dateTimeOriginal: undefined,
      fNumber: 2,
      exposureTime: 0.0005,
      iso: 200,
      focalLengthIn35mmFormat: 23
    });
  });

  it("omits exif when none is provided", () => {
    const photo = photoRecord("p1");
    const view = assemblePhoto(DID, photo, undefined, "https://example.com/blob");
    expect(view.exif).toBeUndefined();
  });
});

describe("assembleGalleries", () => {
  it("joins galleries with their items in position order, attaching photos and exif", () => {
    const desc = "Trip to Kyoto #travel";
    const tagStart = Buffer.byteLength("Trip to Kyoto ", "utf8");
    const tagEnd = tagStart + Buffer.byteLength("#travel", "utf8");
    const g1 = galleryRecord("g1", {
      description: desc,
      facets: [
        {
          index: { byteStart: tagStart, byteEnd: tagEnd },
          features: [{ $type: "app.bsky.richtext.facet#tag", tag: "travel" }]
        }
      ]
    });
    const p1 = photoRecord("p1");
    const p2 = photoRecord("p2");
    const items = [itemRecord("i2", g1.uri, p2.uri, 1), itemRecord("i1", g1.uri, p1.uri, 0)];
    const exifs = [exifRecord("e1", p1.uri, { make: "Canon" })];

    const galleries = assembleGalleries({
      did: DID,
      galleries: [g1],
      items,
      photos: [p1, p2],
      exifs,
      blobUrl: (cid) => `https://cdn.example.com/${cid}`
    });

    expect(galleries).toHaveLength(1);
    const gallery = galleries[0]!;
    expect(gallery.title).toBe("Gallery g1");
    expect(gallery.hashtags).toEqual(["travel"]);
    expect(gallery.photos.map((p) => p.uri)).toEqual([p1.uri, p2.uri]);
    expect(gallery.photos[0]?.exif?.make).toBe("Canon");
    expect(gallery.photos[1]?.exif).toBeUndefined();
  });

  it("sorts galleries newest first by createdAt", () => {
    const older = galleryRecord("old", { createdAt: "2025-01-01T00:00:00.000Z" });
    const newer = galleryRecord("new", { createdAt: "2026-01-01T00:00:00.000Z" });

    const galleries = assembleGalleries({
      did: DID,
      galleries: [older, newer],
      items: [],
      photos: [],
      exifs: [],
      blobUrl: (cid) => cid
    });

    expect(galleries.map((g) => g.rkey)).toEqual(["new", "old"]);
  });

  it("ignores gallery items that reference a photo which no longer exists", () => {
    const g1 = galleryRecord("g1");
    const items = [itemRecord("i1", g1.uri, "at://missing/social.grain.photo/x", 0)];

    const galleries = assembleGalleries({
      did: DID,
      galleries: [g1],
      items,
      photos: [],
      exifs: [],
      blobUrl: (cid) => cid
    });

    expect(galleries[0]?.photos).toEqual([]);
  });
});
