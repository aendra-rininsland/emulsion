import type { OAuthClientMetadataInput } from "@atproto/oauth-client-node";

/**
 * Builds this deployment's ATProto OAuth client metadata document. Served at
 * /oauth/client-metadata.json — that URL *is* the client_id, per the "client ID
 * metadata document" pattern, so it's derived from the request's own origin rather
 * than hardcoded, and works whether deployed to a workers.dev preview or a custom domain.
 *
 * Uses a public client (no client secret / signing key to manage) — security relies on
 * PKCE + DPoP, which the OAuth client library handles automatically.
 */
export function buildClientMetadata(origin: string): OAuthClientMetadataInput {
  const base = origin.replace(/\/$/, "");
  return {
    client_id: `${base}/oauth/client-metadata.json`,
    client_name: "Emulsion Admin",
    client_uri: base,
    redirect_uris: [`${base}/admin/oauth/callback`],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    scope: "atproto transition:generic",
    application_type: "web",
    token_endpoint_auth_method: "none",
    dpop_bound_access_tokens: true
  };
}
