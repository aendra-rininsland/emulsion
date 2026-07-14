import { redirect } from "@sveltejs/kit";
import { AdminSessionStore } from "$lib/server/oauth/adminSessionStore.js";
import { ADMIN_SESSION_COOKIE } from "$lib/server/oauth/constants.js";
import type { RequestHandler } from "./$types.js";

export const POST: RequestHandler = async ({ platform, cookies }) => {
  const token = cookies.get(ADMIN_SESSION_COOKIE);
  if (token && platform) {
    await new AdminSessionStore(platform.env.ADMIN_SESSIONS).destroy(token);
  }
  cookies.delete(ADMIN_SESSION_COOKIE, { path: "/" });
  redirect(302, "/");
};
