import { error, redirect } from "@sveltejs/kit";
import { createOAuthClient } from "$lib/server/oauth/client.js";
import type { RequestHandler } from "./$types.js";

export const GET: RequestHandler = async ({ platform, url }) => {
  const did = platform?.env.EMULSION_DID;
  if (!did || !platform) {
    error(500, "EMULSION_DID is not set, or Cloudflare bindings are unavailable in this environment.");
  }

  const client = createOAuthClient(url.origin, platform.env);
  const authUrl = await client.authorize(did);
  redirect(302, authUrl.toString());
};
