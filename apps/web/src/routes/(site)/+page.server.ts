import { error } from "@sveltejs/kit";
import { EmulsionError, applyCuration, getCurationSettings, paginate } from "@emulsion/core";
import { createGrainClient, createPdsClient } from "$lib/server/grain.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ platform, parent, url }) => {
  const { did } = await parent();
  const ttlSeconds = Number(platform?.env.EMULSION_CACHE_TTL_SECONDS ?? "300");
  const cacheOpts = { cache: platform?.caches.default, ttlSeconds };

  try {
    const [client, pdsClient] = await Promise.all([createGrainClient(did, cacheOpts), createPdsClient(did, cacheOpts)]);
    const [all, settings] = await Promise.all([client.listAllGalleries(), getCurationSettings(pdsClient, did)]);

    const visible = applyCuration(all, settings);
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const { items: galleries, cursor: nextCursor } = paginate(visible, { cursor });

    const nextHref = nextCursor ? `/?cursor=${encodeURIComponent(nextCursor)}` : undefined;

    return { galleries, nextHref };
  } catch (err) {
    if (err instanceof EmulsionError) {
      error(502, err.message);
    }
    throw err;
  }
};
