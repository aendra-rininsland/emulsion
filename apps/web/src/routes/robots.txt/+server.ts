import type { RequestHandler } from "./$types.js";

export const GET: RequestHandler = async ({ url }) => {
  const body = `User-agent: *
Allow: /

Sitemap: ${url.origin}/sitemap.xml
`;

  return new Response(body, {
    headers: { "content-type": "text/plain", "cache-control": "max-age=3600" }
  });
};
