import { error } from "@sveltejs/kit";
import { EmulsionError } from "@emulsion/core";
import { createGrainClient } from "$lib/server/grain.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ platform, parent, params }) => {
  const { did } = await parent();
  const ttlSeconds = Number(platform?.env.EMULSION_CACHE_TTL_SECONDS ?? "300");

  try {
    const client = await createGrainClient(did, { cache: platform?.caches.default, ttlSeconds });
    const gallery = await client.getGallery(params.rkey);

    if (!gallery) {
      error(404, "Gallery not found");
    }

    return { gallery };
  } catch (err) {
    if (err instanceof EmulsionError) {
      error(502, err.message);
    }
    throw err;
  }
};
