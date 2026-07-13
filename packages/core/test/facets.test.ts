import { describe, it, expect } from "vitest";
import { extractHashtags, extractLinks, extractMentions, richtextToSegments } from "../src/grain/facets.js";
import type { RichtextFacet } from "../src/grain/types.js";

describe("extractHashtags", () => {
  it("returns tag facet values in order", () => {
    const facets: RichtextFacet[] = [
      { index: { byteStart: 0, byteEnd: 5 }, features: [{ $type: "app.bsky.richtext.facet#tag", tag: "sunset" }] },
      { index: { byteStart: 10, byteEnd: 16 }, features: [{ $type: "app.bsky.richtext.facet#tag", tag: "35mm" }] }
    ];
    expect(extractHashtags(facets)).toEqual(["sunset", "35mm"]);
  });

  it("de-duplicates repeated tags case-insensitively", () => {
    const facets: RichtextFacet[] = [
      { index: { byteStart: 0, byteEnd: 5 }, features: [{ $type: "app.bsky.richtext.facet#tag", tag: "Sunset" }] },
      { index: { byteStart: 10, byteEnd: 16 }, features: [{ $type: "app.bsky.richtext.facet#tag", tag: "sunset" }] }
    ];
    expect(extractHashtags(facets)).toEqual(["Sunset"]);
  });

  it("returns an empty array when facets are undefined", () => {
    expect(extractHashtags(undefined)).toEqual([]);
  });

  it("ignores non-tag features", () => {
    const facets: RichtextFacet[] = [
      { index: { byteStart: 0, byteEnd: 5 }, features: [{ $type: "app.bsky.richtext.facet#mention", did: "did:plc:abc" }] }
    ];
    expect(extractHashtags(facets)).toEqual([]);
  });
});

describe("extractLinks", () => {
  it("returns link facet URIs", () => {
    const facets: RichtextFacet[] = [
      { index: { byteStart: 0, byteEnd: 5 }, features: [{ $type: "app.bsky.richtext.facet#link", uri: "https://example.com" }] }
    ];
    expect(extractLinks(facets)).toEqual(["https://example.com"]);
  });
});

describe("extractMentions", () => {
  it("returns mention facet DIDs", () => {
    const facets: RichtextFacet[] = [
      { index: { byteStart: 0, byteEnd: 5 }, features: [{ $type: "app.bsky.richtext.facet#mention", did: "did:plc:abc" }] }
    ];
    expect(extractMentions(facets)).toEqual(["did:plc:abc"]);
  });
});

describe("richtextToSegments", () => {
  it("splits text into plain and tag segments using byte offsets", () => {
    const text = "Golden hour #sunset in the hills";
    const tagStart = Buffer.byteLength("Golden hour ", "utf8");
    const tagEnd = tagStart + Buffer.byteLength("#sunset", "utf8");
    const facets: RichtextFacet[] = [
      {
        index: { byteStart: tagStart, byteEnd: tagEnd },
        features: [{ $type: "app.bsky.richtext.facet#tag", tag: "sunset" }]
      }
    ];

    const segments = richtextToSegments(text, facets);

    expect(segments).toEqual([
      { type: "text", text: "Golden hour " },
      { type: "tag", text: "#sunset", tag: "sunset" },
      { type: "text", text: " in the hills" }
    ]);
  });

  it("handles multi-byte UTF-8 text correctly", () => {
    const text = "café #paris";
    const tagStart = Buffer.byteLength("café ", "utf8");
    const tagEnd = tagStart + Buffer.byteLength("#paris", "utf8");
    const facets: RichtextFacet[] = [
      { index: { byteStart: tagStart, byteEnd: tagEnd }, features: [{ $type: "app.bsky.richtext.facet#tag", tag: "paris" }] }
    ];

    const segments = richtextToSegments(text, facets);
    expect(segments).toEqual([
      { type: "text", text: "café " },
      { type: "tag", text: "#paris", tag: "paris" }
    ]);
  });

  it("returns a single text segment when there are no facets", () => {
    expect(richtextToSegments("just plain text", undefined)).toEqual([{ type: "text", text: "just plain text" }]);
  });
});
