# Contributing to Emulsion

## Architecture decisions worth knowing before you dive in

**Emulsion reads directly from a user's PDS — it does not call Grain's AppView API.**
Grain.social's server exposes convenience endpoints (`social.grain.unspecced.getGallery`,
`getActorProfile`, etc.), but those are explicitly "unspecced": not a stable public
contract, and a dependency on `grain.social` staying online. `@emulsion/core` instead
resolves a DID straight to its PDS (via `plc.directory` / `did:web`) and reads
`social.grain.*` records with the generic `com.atproto.repo.listRecords`/`getRecord`
calls every PDS supports. This is slower per-request (we join galleries, items,
photos, and EXIF ourselves) but means a portfolio built on Emulsion keeps working even
if Grain's own servers are down, rate-limiting, or change their API. **Please don't
reintroduce a Grain AppView dependency** without discussing it first — if you need
data Emulsion can't currently get from the PDS alone, that's worth raising as an
issue.

**No caching in `@emulsion/core` beyond the `CacheProvider` abstraction.** Actual
caching (the Cloudflare Workers Cache API, or an in-memory fallback for local dev)
lives in `apps/web/src/lib/server/grain.ts`. Core stays a plain, cache-agnostic data
layer so it can be reused outside a Cloudflare Worker if someone wants to.

**Themes never touch anything outside `src/themes/<name>/`.** See
[`apps/web/THEMING.md`](apps/web/THEMING.md). If you're adding a feature that requires
a theme to reach into routing, data loading, or another theme's files, that's a sign
the `Theme` contract in `src/lib/theme/types.ts` needs a new prop instead.

## Development workflow

```bash
pnpm install
cp apps/web/.dev.vars.example apps/web/.dev.vars   # set your own EMULSION_DID
pnpm dev
```

This project uses TDD: when changing `@emulsion/core` logic, add or update a failing
test in `packages/core/test/` first, watch it fail, then make it pass. Vitest is
configured for both packages (`pnpm test` from the repo root runs everything).

Before opening a PR:

```bash
pnpm test
pnpm typecheck
```

Both also run in CI (`.github/workflows/ci.yml`) on every push and PR.

## Where things live

| Path | What |
| --- | --- |
| `packages/core/src/atproto/` | DID resolution, generic PDS client |
| `packages/core/src/grain/` | Grain lexicon types, record aggregation, pagination, hashtag/richtext parsing |
| `packages/core/src/cache/` | Cache-provider abstraction (no Cloudflare-specific code outside `cloudflareCacheProvider.ts`) |
| `apps/web/src/routes/` | SvelteKit routes/loaders — the only place that talks to `@emulsion/core` directly |
| `apps/web/src/themes/default/` | The built-in theme; also the reference implementation for the `Theme` contract |
| `apps/web/src/lib/theme/` | The theme contract (`types.ts`) and runtime theme registry |
