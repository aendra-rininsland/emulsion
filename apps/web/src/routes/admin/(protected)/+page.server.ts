import { fail } from "@sveltejs/kit";
import { PdsClient, getCurationSettings, resolvePds, setCurationSettings, toggleFeaturedGallery } from "@emulsion/core";
import { createGrainClient, createPdsClient } from "$lib/server/grain.js";
import { createOAuthClient } from "$lib/server/oauth/client.js";
import { sessionToFetch } from "$lib/server/oauth/sessionFetch.js";
import type { Actions, PageServerLoad } from "./$types.js";

async function authedPdsClient(did: string, origin: string, env: Parameters<typeof createOAuthClient>[1]) {
  const client = createOAuthClient(origin, env);
  const session = await client.restore(did);
  const pdsEndpoint = await resolvePds(did);
  return new PdsClient(pdsEndpoint, { fetch: sessionToFetch(session) });
}

export const load: PageServerLoad = async ({ platform }) => {
  const did = platform!.env.EMULSION_DID;
  const ttlSeconds = Number(platform?.env.EMULSION_CACHE_TTL_SECONDS ?? "300");
  const cacheOpts = { cache: platform?.caches.default, ttlSeconds };

  const [grainClient, pdsClient] = await Promise.all([createGrainClient(did, cacheOpts), createPdsClient(did, cacheOpts)]);
  const [galleries, settings] = await Promise.all([grainClient.listAllGalleries(), getCurationSettings(pdsClient, did)]);

  return { galleries, settings };
};

export const actions: Actions = {
  toggleFeatured: async ({ request, platform, url }) => {
    const did = platform!.env.EMULSION_DID;
    const formData = await request.formData();
    const galleryUri = formData.get("galleryUri");
    if (typeof galleryUri !== "string" || !galleryUri) {
      return fail(400, { message: "Missing galleryUri" });
    }

    try {
      const pdsClient = await authedPdsClient(did, url.origin, platform!.env);
      await toggleFeaturedGallery(pdsClient, did, galleryUri);
    } catch (err) {
      return fail(401, { message: `Not signed in, or write failed: ${err instanceof Error ? err.message : err}` });
    }

    return { success: true };
  },

  setMode: async ({ request, platform, url }) => {
    const did = platform!.env.EMULSION_DID;
    const formData = await request.formData();
    const mode = formData.get("mode");
    if (mode !== "all" && mode !== "featured") {
      return fail(400, { message: "Invalid mode" });
    }

    try {
      // Read-modify-write against the authenticated (uncached) client, not the
      // edge-cached read path — a stale cached read here could clobber a
      // toggleFeatured write from moments ago.
      const pdsClient = await authedPdsClient(did, url.origin, platform!.env);
      const current = await getCurationSettings(pdsClient, did);
      await setCurationSettings(pdsClient, did, { mode, featured: current.featured });
    } catch (err) {
      return fail(401, { message: `Not signed in, or write failed: ${err instanceof Error ? err.message : err}` });
    }

    return { success: true };
  }
};
