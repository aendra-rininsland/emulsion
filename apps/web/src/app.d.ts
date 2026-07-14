// See https://svelte.dev/docs/kit/types#app.d.ts

declare global {
  namespace App {
    interface Platform {
      env: {
        EMULSION_DID: string;
        EMULSION_THEME?: string;
        EMULSION_CACHE_TTL_SECONDS?: string;
        OAUTH_STATE_STORE: KVNamespace;
        OAUTH_SESSION_STORE: KVNamespace;
        ADMIN_SESSIONS: KVNamespace;
      };
      caches: CacheStorage & { default: Cache };
      context: {
        waitUntil(promise: Promise<unknown>): void;
      };
    }
  }
}

export {};
