import type { RichtextFacet } from "./types.js";

function featuresOfType(facets: RichtextFacet[] | undefined, type: string) {
  return (facets ?? []).flatMap((f) => f.features.filter((feat) => feat.$type === type));
}

/** Ordered, case-insensitive-deduplicated hashtags from a facet list (first-seen casing wins). */
export function extractHashtags(facets: RichtextFacet[] | undefined): string[] {
  const seen = new Map<string, string>();
  for (const feat of featuresOfType(facets, "app.bsky.richtext.facet#tag")) {
    const tag = (feat as { tag: string }).tag;
    const key = tag.toLowerCase();
    if (!seen.has(key)) seen.set(key, tag);
  }
  return [...seen.values()];
}

export function extractLinks(facets: RichtextFacet[] | undefined): string[] {
  return featuresOfType(facets, "app.bsky.richtext.facet#link").map((f) => (f as { uri: string }).uri);
}

export function extractMentions(facets: RichtextFacet[] | undefined): string[] {
  return featuresOfType(facets, "app.bsky.richtext.facet#mention").map((f) => (f as { did: string }).did);
}

export type RichtextSegment =
  | { type: "text"; text: string }
  | { type: "tag"; text: string; tag: string }
  | { type: "link"; text: string; uri: string }
  | { type: "mention"; text: string; did: string };

/** Splits richtext into ordered segments by resolving UTF-8 byte offsets against the string. */
export function richtextToSegments(text: string, facets: RichtextFacet[] | undefined): RichtextSegment[] {
  if (!facets || facets.length === 0) {
    return text ? [{ type: "text", text }] : [];
  }

  const bytes = new TextEncoder().encode(text);
  const decoder = new TextDecoder();
  const sorted = [...facets].sort((a, b) => a.index.byteStart - b.index.byteStart);

  const segments: RichtextSegment[] = [];
  let cursor = 0;

  for (const facet of sorted) {
    const { byteStart, byteEnd } = facet.index;
    if (byteStart > cursor) {
      segments.push({ type: "text", text: decoder.decode(bytes.slice(cursor, byteStart)) });
    }
    const slice = decoder.decode(bytes.slice(byteStart, byteEnd));
    const feature = facet.features[0];

    if (feature?.$type === "app.bsky.richtext.facet#tag") {
      segments.push({ type: "tag", text: slice, tag: (feature as { tag: string }).tag });
    } else if (feature?.$type === "app.bsky.richtext.facet#link") {
      segments.push({ type: "link", text: slice, uri: (feature as { uri: string }).uri });
    } else if (feature?.$type === "app.bsky.richtext.facet#mention") {
      segments.push({ type: "mention", text: slice, did: (feature as { did: string }).did });
    } else {
      segments.push({ type: "text", text: slice });
    }
    cursor = byteEnd;
  }

  if (cursor < bytes.length) {
    segments.push({ type: "text", text: decoder.decode(bytes.slice(cursor)) });
  }

  return segments;
}
