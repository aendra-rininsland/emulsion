import { error } from "@sveltejs/kit";
import { EmulsionError } from "@emulsion/core";
import { createGrainClient } from "$lib/server/grain.js";
import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ platform, url }) => {
  const did = platform?.env.EMULSION_DID;
  if (!did) {
    error(
      500,
      "EMULSION_DID is not set. Add it to your environment (see .dev.vars.example) and restart the dev server."
    );
  }

  const ttlSeconds = Number(platform?.env.EMULSION_CACHE_TTL_SECONDS ?? "300");
  const requestedTheme = url.searchParams.get("theme") ?? platform?.env.EMULSION_THEME ?? "default";

  try {
    const client = await createGrainClient(did, { cache: platform?.caches.default, ttlSeconds });
    const profile = await client.getProfile();
    return { did, theme: requestedTheme, profile };
  } catch (err) {
    if (err instanceof EmulsionError) {
      error(404, err.message);
    }
    throw err;
  }
};
