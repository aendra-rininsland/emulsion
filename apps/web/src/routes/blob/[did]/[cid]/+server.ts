import { error } from "@sveltejs/kit";
import { EmulsionError } from "@emulsion/core";
import { resolvePdsEndpoint } from "$lib/server/grain.js";
import type { RequestHandler } from "./$types.js";

/**
 * Blobs are content-addressed — a given CID is always the same bytes, forever — so
 * this can (and should) be cached far more aggressively than the JSON record cache,
 * which has to account for edits. 30 days is arbitrary but effectively "permanent" for
 * a photo that's already been viewed once; nothing ever invalidates it because nothing
 * ever needs to.
 */
const BLOB_CACHE_SECONDS = 60 * 60 * 24 * 30;

export const GET: RequestHandler = async ({ params, platform }) => {
  const { did, cid } = params;
  const cache = platform?.caches.default;
  // A synthetic https:// key, not the real incoming request URL: the Cache API only
  // caches HTTPS requests, and the real request URL is http://localhost in local dev
  // (always a MISS there otherwise) — same reasoning as CloudflareCacheProvider. Also
  // means one cache entry per blob regardless of which hostname served the request
  // (custom domain vs. *.workers.dev preview), instead of two separate ones.
  const cacheKey = new Request(`https://emulsion.internal/blob/${encodeURIComponent(did)}/${cid}`);

  if (cache) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }

  let pdsEndpoint: string;
  try {
    pdsEndpoint = await resolvePdsEndpoint(did, { cache });
  } catch (err) {
    if (err instanceof EmulsionError) error(404, "Photo not found");
    throw err;
  }

  const blobUrl = new URL(`${pdsEndpoint}/xrpc/com.atproto.sync.getBlob`);
  blobUrl.searchParams.set("did", did);
  blobUrl.searchParams.set("cid", cid);

  const upstream = await fetch(blobUrl);
  if (!upstream.ok) {
    error(upstream.status === 404 ? 404 : 502, "Failed to fetch photo from PDS");
  }

  // Buffered rather than passing upstream.body straight through, so cache.put() below
  // gets a concrete body instead of relying on a live stream's clone() semantics.
  const body = await upstream.arrayBuffer();
  const response = new Response(body, {
    status: 200,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "cache-control": `public, max-age=${BLOB_CACHE_SECONDS}, immutable`
    }
  });

  if (cache) {
    await cache.put(cacheKey, response.clone());
  }

  return response;
};
