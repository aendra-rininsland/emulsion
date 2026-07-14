import type { HandleResolver } from "@atproto-labs/handle-resolver";

/**
 * Emulsion's admin login always authorizes by the site's known DID directly — it never
 * needs to resolve a human-typed handle. The Node handle resolver that would otherwise
 * be used pulls in `node:dns`, which Workers only partially/unreliably supports; this
 * stub avoids depending on it at all rather than hoping it works.
 */
export const noHandleResolver: HandleResolver = {
  async resolve(): Promise<null> {
    return null;
  }
};
