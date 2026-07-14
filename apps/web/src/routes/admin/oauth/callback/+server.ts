import { error, redirect } from "@sveltejs/kit";
import { AdminSessionStore } from "$lib/server/oauth/adminSessionStore.js";
import { ADMIN_SESSION_COOKIE } from "$lib/server/oauth/constants.js";
import { createOAuthClient } from "$lib/server/oauth/client.js";
import type { RequestHandler } from "./$types.js";

export const GET: RequestHandler = async ({ platform, url, cookies }) => {
  const expectedDid = platform?.env.EMULSION_DID;
  if (!expectedDid || !platform) {
    error(500, "EMULSION_DID is not set, or Cloudflare bindings are unavailable in this environment.");
  }

  const client = createOAuthClient(url.origin, platform.env);

  const { session } = await client.callback(url.searchParams).catch((err: unknown) => {
    error(400, `OAuth callback failed: ${err instanceof Error ? err.message : String(err)}`);
  });

  if (session.did !== expectedDid) {
    await session.signOut().catch(() => undefined);
    error(
      403,
      `Signed in as ${session.did}, but this site's admin is ${expectedDid}. Only the site owner's own ATProto account can access /admin.`
    );
  }

  const sessions = new AdminSessionStore(platform.env.ADMIN_SESSIONS);
  const token = await sessions.create(session.did);

  cookies.set(ADMIN_SESSION_COOKIE, token, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30
  });

  redirect(302, "/admin");
};
