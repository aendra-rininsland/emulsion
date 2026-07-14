import { json } from "@sveltejs/kit";
import { buildClientMetadata } from "$lib/server/oauth/clientMetadata.js";
import type { RequestHandler } from "./$types.js";

export const GET: RequestHandler = async ({ url }) => {
  return json(buildClientMetadata(url.origin));
};
