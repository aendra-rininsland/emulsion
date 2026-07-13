import { createGrainClient } from "$lib/server/grain.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ platform, parent, params }) => {
  const { did } = await parent();
  const ttlSeconds = Number(platform?.env.EMULSION_CACHE_TTL_SECONDS ?? "300");
  const client = await createGrainClient(did, { cache: platform?.caches.default, ttlSeconds });
  const tag = decodeURIComponent(params.tag);

  const all = await client.listGalleries();
  const galleries = all.filter((g) => g.hashtags.some((t) => t.toLowerCase() === tag.toLowerCase()));

  return { tag, galleries };
};
