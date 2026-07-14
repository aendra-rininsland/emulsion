import { describe, it, expect } from "vitest";
import { createOAuthClient } from "../../src/lib/server/oauth/client.js";

function fakeKv(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => {
      store.set(key, value);
    },
    delete: async (key: string) => {
      store.delete(key);
    }
  } as unknown as KVNamespace;
}

describe("createOAuthClient", () => {
  it("constructs without throwing, validating our client metadata against the library's own schema", () => {
    expect(() =>
      createOAuthClient("https://aendra.photos", {
        OAUTH_STATE_STORE: fakeKv(),
        OAUTH_SESSION_STORE: fakeKv()
      })
    ).not.toThrow();
  });
});
