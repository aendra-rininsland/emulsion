import { error } from "@sveltejs/kit";
import { EmulsionError, getCurationSettings, isGalleryVisible } from "@emulsion/core";
import { createGrainClient, createPdsClient } from "$lib/server/grain.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ platform, parent, params }) => {
  const { did } = await parent();
  const ttlSeconds = Number(platform?.env.EMULSION_CACHE_TTL_SECONDS ?? "300");
  const cacheOpts = { cache: platform?.caches.default, ttlSeconds };

  try {
    const [client, pdsClient] = await Promise.all([createGrainClient(did, cacheOpts), createPdsClient(did, cacheOpts)]);
    const gallery = await client.getGallery(params.rkey);

    if (!gallery) {
      error(404, "Gallery not found");
    }

    const settings = await getCurationSettings(pdsClient, did);
    if (!isGalleryVisible(gallery, settings)) {
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
