import { createGrainClient } from "$lib/server/grain.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ platform, parent }) => {
  const { did } = await parent();
  const ttlSeconds = Number(platform?.env.EMULSION_CACHE_TTL_SECONDS ?? "300");
  const client = await createGrainClient(did, { cache: platform?.caches.default, ttlSeconds });
  const galleries = await client.listGalleries();
  return { galleries };
};
