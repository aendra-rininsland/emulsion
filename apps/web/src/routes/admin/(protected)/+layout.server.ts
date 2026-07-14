import { redirect } from "@sveltejs/kit";
import { AdminSessionStore } from "$lib/server/oauth/adminSessionStore.js";
import { ADMIN_SESSION_COOKIE } from "$lib/server/oauth/constants.js";
import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ platform, cookies }) => {
  const token = cookies.get(ADMIN_SESSION_COOKIE);
  const did = token && platform ? await new AdminSessionStore(platform.env.ADMIN_SESSIONS).verify(token) : null;

  if (!did) {
    redirect(302, "/admin/login");
  }

  return { adminDid: did };
};
