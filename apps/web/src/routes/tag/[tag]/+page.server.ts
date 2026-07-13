import { error } from "@sveltejs/kit";
import { EmulsionError, paginate } from "@emulsion/core";
import { createGrainClient } from "$lib/server/grain.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ platform, parent, params, url }) => {
  const { did } = await parent();
  const ttlSeconds = Number(platform?.env.EMULSION_CACHE_TTL_SECONDS ?? "300");
  const tag = decodeURIComponent(params.tag);

  try {
    const client = await createGrainClient(did, { cache: platform?.caches.default, ttlSeconds });
    const all = await client.listAllGalleries();
    const matching = all.filter((g) => g.hashtags.some((t) => t.toLowerCase() === tag.toLowerCase()));

    const cursor = url.searchParams.get("cursor") ?? undefined;
    const { items: galleries, cursor: nextCursor } = paginate(matching, { cursor });

    const nextHref = nextCursor
      ? `/tag/${encodeURIComponent(tag)}?cursor=${encodeURIComponent(nextCursor)}`
      : undefined;

    return { tag, galleries, nextHref };
  } catch (err) {
    if (err instanceof EmulsionError) {
      error(502, err.message);
    }
    throw err;
  }
};
