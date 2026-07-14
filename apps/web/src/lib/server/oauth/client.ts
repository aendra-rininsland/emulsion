import { NodeOAuthClient } from "@atproto/oauth-client-node";
import type { NodeSavedSession, NodeSavedState } from "@atproto/oauth-client-node";
import { buildClientMetadata } from "./clientMetadata.js";
import { KVSimpleStore } from "./kvSimpleStore.js";
import { noHandleResolver } from "./noHandleResolver.js";
import { createWorkersCompatFetch } from "./workersCompatFetch.js";

export interface OAuthClientEnv {
  OAUTH_STATE_STORE: KVNamespace;
  OAUTH_SESSION_STORE: KVNamespace;
}

/**
 * Build a NodeOAuthClient rooted at `origin`. Uses the official, unmodified
 * @atproto/oauth-client-node — the only Workers-specific code is the fetch wrapper
 * (see workersCompatFetch.ts) and the KV-backed stores, both ours.
 *
 * Not cached/singleton: cheap to construct, and `origin` varies per-request (custom
 * domain vs. workers.dev preview), so each request builds its own.
 */
export function createOAuthClient(origin: string, env: OAuthClientEnv): NodeOAuthClient {
  return new NodeOAuthClient({
    clientMetadata: buildClientMetadata(origin),
    fetch: createWorkersCompatFetch(fetch),
    handleResolver: noHandleResolver,
    stateStore: new KVSimpleStore<NodeSavedState>(env.OAUTH_STATE_STORE),
    sessionStore: new KVSimpleStore<NodeSavedSession>(env.OAUTH_SESSION_STORE)
  });
}
