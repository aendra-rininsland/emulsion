import { describe, it, expect } from "vitest";
import { buildSeoMeta } from "../src/lib/seo.js";

describe("buildSeoMeta", () => {
  it("builds OpenGraph and Twitter card tags for a basic page", () => {
    const meta = buildSeoMeta({
      title: "Kyoto",
      description: "A trip to Kyoto.",
      url: "https://example.com/gallery/g1"
    });

    expect(meta).toContainEqual({ property: "og:title", content: "Kyoto" });
    expect(meta).toContainEqual({ property: "og:description", content: "A trip to Kyoto." });
    expect(meta).toContainEqual({ property: "og:url", content: "https://example.com/gallery/g1" });
    expect(meta).toContainEqual({ property: "og:type", content: "website" });
    expect(meta).toContainEqual({ name: "twitter:card", content: "summary" });
    expect(meta).toContainEqual({ name: "twitter:title", content: "Kyoto" });
    expect(meta).toContainEqual({ name: "description", content: "A trip to Kyoto." });
  });

  it("adds an image tag and switches the twitter card to large-image when an image is given", () => {
    const meta = buildSeoMeta({
      title: "Kyoto",
      url: "https://example.com/gallery/g1",
      image: "https://pds.example.com/blob/abc"
    });

    expect(meta).toContainEqual({ property: "og:image", content: "https://pds.example.com/blob/abc" });
    expect(meta).toContainEqual({ name: "twitter:card", content: "summary_large_image" });
    expect(meta).toContainEqual({ name: "twitter:image", content: "https://pds.example.com/blob/abc" });
  });

  it("omits description tags entirely when no description is given", () => {
    const meta = buildSeoMeta({ title: "Kyoto", url: "https://example.com/gallery/g1" });

    expect(meta.some((m) => "property" in m && m.property === "og:description")).toBe(false);
    expect(meta.some((m) => "name" in m && m.name === "description")).toBe(false);
  });

  it("respects an explicit type of article", () => {
    const meta = buildSeoMeta({ title: "Kyoto", url: "https://example.com/gallery/g1", type: "article" });
    expect(meta).toContainEqual({ property: "og:type", content: "article" });
  });
});
