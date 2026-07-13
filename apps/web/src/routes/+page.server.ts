import { error } from "@sveltejs/kit";
import { EmulsionError } from "@emulsion/core";
import { createGrainClient } from "$lib/server/grain.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ platform, parent, url }) => {
  const { did } = await parent();
  const ttlSeconds = Number(platform?.env.EMULSION_CACHE_TTL_SECONDS ?? "300");

  try {
    const client = await createGrainClient(did, { cache: platform?.caches.default, ttlSeconds });
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const { items: galleries, cursor: nextCursor } = await client.listGalleries({ cursor });

    const nextHref = nextCursor ? `/?cursor=${encodeURIComponent(nextCursor)}` : undefined;

    return { galleries, nextHref };
  } catch (err) {
    if (err instanceof EmulsionError) {
      error(502, err.message);
    }
    throw err;
  }
};
