import { describe, it, expect } from "vitest";
import { applyCuration } from "../src/curation/filter.js";
import type { CurationSettingsRecord } from "../src/curation/types.js";
import type { GalleryView } from "../src/grain/views.js";

function gallery(uri: string): GalleryView {
  return {
    uri,
    rkey: uri.slice(uri.lastIndexOf("/") + 1),
    title: uri,
    segments: [],
    hashtags: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    photos: []
  };
}

const g1 = gallery("at://did:plc:abc/social.grain.gallery/g1");
const g2 = gallery("at://did:plc:abc/social.grain.gallery/g2");
const g3 = gallery("at://did:plc:abc/social.grain.gallery/g3");

describe("applyCuration", () => {
  it("returns every gallery unfiltered in 'all' mode", () => {
    const settings: CurationSettingsRecord = { mode: "all", featured: [g1.uri], updatedAt: "" };
    expect(applyCuration([g1, g2, g3], settings)).toEqual([g1, g2, g3]);
  });

  it("returns only featured galleries in 'featured' mode, preserving input order", () => {
    const settings: CurationSettingsRecord = { mode: "featured", featured: [g3.uri, g1.uri], updatedAt: "" };
    expect(applyCuration([g1, g2, g3], settings)).toEqual([g1, g3]);
  });

  it("returns an empty list in 'featured' mode when nothing is featured yet", () => {
    const settings: CurationSettingsRecord = { mode: "featured", featured: [], updatedAt: "" };
    expect(applyCuration([g1, g2, g3], settings)).toEqual([]);
  });

  it("treats undefined settings as 'all' mode (fresh install default)", () => {
    expect(applyCuration([g1, g2, g3], undefined)).toEqual([g1, g2, g3]);
  });
});

describe("isGalleryVisible", () => {
  it("is re-exported and matches applyCuration's membership logic", async () => {
    const { isGalleryVisible } = await import("../src/curation/filter.js");
    const settings: CurationSettingsRecord = { mode: "featured", featured: [g1.uri], updatedAt: "" };
    expect(isGalleryVisible(g1, settings)).toBe(true);
    expect(isGalleryVisible(g2, settings)).toBe(false);
    expect(isGalleryVisible(g2, { mode: "all", featured: [], updatedAt: "" })).toBe(true);
  });
});
