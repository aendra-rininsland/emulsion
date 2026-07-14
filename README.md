# Emulsion

An ATProto-based photo portfolio/blog framework. Point it at a [Grain.social](https://grain.social)
DID and it builds you a fast, cacheable, themeable portfolio site — reading your
`social.grain.*` records straight from your own PDS, no dependency on Grain's servers
staying up.

## How it works

- **No hardcoded accounts.** The whole site is driven by one environment variable:
  `EMULSION_DID`. Point it at any Grain user's DID and the site rebuilds around their
  galleries, photos, EXIF data, and hashtags.
- **PDS-native.** Emulsion resolves your DID to your PDS (via `plc.directory` or
  `did:web`) and reads `social.grain.gallery`, `social.grain.gallery.item`,
  `social.grain.photo`, `social.grain.photo.exif`, and `social.grain.actor.profile`
  records directly with `com.atproto.repo.listRecords`/`getRecord`. It never talks to
  Grain's own AppView, so it keeps working even if grain.social is down or changes
  its (currently unspecced) API.
- **Edge-cached.** All PDS/DID-resolution requests are wrapped in a caching `fetch`
  backed by the Cloudflare Workers Cache API in production (in-memory locally), so a
  burst of visitors doesn't hammer your PDS.
- **Optional curation.** If your Grain stream mixes casual snapshots with
  portfolio-worthy work, `/admin` (gated by real ATProto OAuth — you sign in with your
  own account) lets you choose which galleries are actually public, without touching
  Grain itself. See [`apps/web/ADMIN.md`](apps/web/ADMIN.md). Off by default — every
  gallery is public until you turn it on.

## Packages

| Package | What it is |
| --- | --- |
| [`packages/core`](packages/core) | Framework-agnostic TypeScript: DID resolution, PDS client, Grain record types, hashtag/richtext parsing, gallery/photo aggregation, cache abstraction. Fully unit tested (Vitest). |
| [`apps/web`](apps/web) | SvelteKit app deployed as a Cloudflare Worker. Tailwind-based theming, masonry listings, gallery/post pages. |

## Running locally

```bash
pnpm install
cp apps/web/.dev.vars.example apps/web/.dev.vars
# edit apps/web/.dev.vars and set EMULSION_DID to your own DID
pnpm dev
```

Opens at `http://localhost:5173`. The dev server runs through `wrangler`/`vite`, so
`platform.env` and the Cache API bindings work the same as they will in production.

To try it against a real account before you have your own Grain posts, `apps/web/.dev.vars.example`
ships with Chad's DID (`did:plc:bcgltzqazw5tb6k2g3ttenbj`, from grain.social) as a
placeholder — swap it for your own DID once you're ready.

## Testing

```bash
pnpm test        # runs every package's Vitest suite
pnpm typecheck    # tsc --noEmit / svelte-check across the workspace
```

## Deploying to Cloudflare

```bash
cd apps/web
pnpm exec wrangler secret bulk .dev.vars   # or set vars in the dashboard / wrangler.jsonc
pnpm deploy
```

Set `EMULSION_DID` (required), `EMULSION_THEME` (optional, defaults to `default`), and
`EMULSION_CACHE_TTL_SECONDS` (optional, defaults to `300`) as Worker variables. For the
optional admin/curation panel, see [`apps/web/ADMIN.md`](apps/web/ADMIN.md) for the
extra KV namespace setup it needs.

## Theming

See [`apps/web/THEMING.md`](apps/web/THEMING.md) — themes live entirely under
`src/themes/<name>/` and are selected at runtime via `EMULSION_THEME` (or a `?theme=`
query param, handy for previewing a theme without redeploying), with no changes to any
other file required.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the architecture decisions worth knowing
before you send a PR, plus where things live. CI runs `pnpm test` and `pnpm typecheck`
on every push and pull request.

## License

[MIT](LICENSE) — matching Grain's own license.

## Status

This is pass one of a two-pass rebuild of an existing photography portfolio. It covers
the data layer, caching, theming framework, and a minimalist default theme (light/dark,
masonry listings, big images, EXIF + hashtag display). Pass two covers custom
theme/design polish on top of this framework.
