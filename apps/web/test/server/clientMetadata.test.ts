import { describe, it, expect } from "vitest";
import { buildClientMetadata } from "../../src/lib/server/oauth/clientMetadata.js";

describe("buildClientMetadata", () => {
  it("builds a public-client metadata document rooted at the given origin", () => {
    const meta = buildClientMetadata("https://aendra.photos");

    expect(meta.client_id).toBe("https://aendra.photos/oauth/client-metadata.json");
    expect(meta.client_uri).toBe("https://aendra.photos");
    expect(meta.redirect_uris).toEqual(["https://aendra.photos/admin/oauth/callback"]);
    expect(meta.token_endpoint_auth_method).toBe("none");
    expect(meta.dpop_bound_access_tokens).toBe(true);
    expect(meta.grant_types).toContain("authorization_code");
    expect(meta.grant_types).toContain("refresh_token");
    expect(meta.scope).toContain("atproto");
    expect(meta.scope).toContain("transition:generic");
  });

  it("strips a trailing slash from the origin", () => {
    const meta = buildClientMetadata("https://aendra.photos/");
    expect(meta.client_id).toBe("https://aendra.photos/oauth/client-metadata.json");
  });
});
