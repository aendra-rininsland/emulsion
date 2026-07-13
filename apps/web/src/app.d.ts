// See https://svelte.dev/docs/kit/types#app.d.ts

declare global {
  namespace App {
    interface Platform {
      env: {
        EMULSION_DID: string;
        EMULSION_THEME?: string;
        EMULSION_CACHE_TTL_SECONDS?: string;
      };
      caches: CacheStorage & { default: Cache };
      context: {
        waitUntil(promise: Promise<unknown>): void;
      };
    }
  }
}

export {};
