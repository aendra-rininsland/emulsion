export interface SeoInput {
  title: string;
  description?: string;
  image?: string;
  url: string;
  type?: "website" | "article";
}

export type SeoMetaTag = { property: string; content: string } | { name: string; content: string };

/** Build OpenGraph + Twitter card + a plain description meta tag for a page. Pure, so it's easy to unit test. */
export function buildSeoMeta(input: SeoInput): SeoMetaTag[] {
  const tags: SeoMetaTag[] = [
    { property: "og:title", content: input.title },
    { property: "og:type", content: input.type ?? "website" },
    { property: "og:url", content: input.url },
    { name: "twitter:title", content: input.title },
    { name: "twitter:card", content: input.image ? "summary_large_image" : "summary" }
  ];

  if (input.description) {
    tags.push({ name: "description", content: input.description });
    tags.push({ property: "og:description", content: input.description });
    tags.push({ name: "twitter:description", content: input.description });
  }

  if (input.image) {
    tags.push({ property: "og:image", content: input.image });
    tags.push({ name: "twitter:image", content: input.image });
  }

  return tags;
}
