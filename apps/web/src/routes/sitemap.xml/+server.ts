import { applyCuration, getCurationSettings } from "@emulsion/core";
import { createGrainClient, createPdsClient } from "$lib/server/grain.js";
import type { RequestHandler } from "./$types.js";

function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const GET: RequestHandler = async ({ platform, url }) => {
  const did = platform?.env.EMULSION_DID;
  if (!did) {
    return new Response("EMULSION_DID is not set", { status: 500 });
  }

  const ttlSeconds = Number(platform?.env.EMULSION_CACHE_TTL_SECONDS ?? "300");
  const cacheOpts = { cache: platform?.caches.default, ttlSeconds };
  const [client, pdsClient] = await Promise.all([createGrainClient(did, cacheOpts), createPdsClient(did, cacheOpts)]);
  const [all, settings] = await Promise.all([client.listAllGalleries(), getCurationSettings(pdsClient, did)]);
  const galleries = applyCuration(all, settings);
  const origin = url.origin;

  const tags = new Set<string>();
  for (const gallery of galleries) {
    for (const tag of gallery.hashtags) tags.add(tag);
  }

  const urls = [
    { loc: origin, lastmod: galleries[0]?.updatedAt ?? galleries[0]?.createdAt },
    ...galleries.map((g) => ({ loc: `${origin}/gallery/${g.rkey}`, lastmod: g.updatedAt ?? g.createdAt })),
    ...[...tags].map((tag) => ({ loc: `${origin}/tag/${encodeURIComponent(tag)}`, lastmod: undefined }))
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${xmlEscape(u.loc)}</loc>${u.lastmod ? `<lastmod>${xmlEscape(u.lastmod)}</lastmod>` : ""}</url>`
  )
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: {
      "content-type": "application/xml",
      "cache-control": `max-age=${ttlSeconds}`
    }
  });
};
