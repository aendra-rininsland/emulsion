# AGENTS.md

This document is for coding agents (and humans) picking up this codebase. It covers
*why* the code looks the way it does — architecture decisions, the trade-offs behind
them, and technical gotchas discovered the hard way. For user-facing setup, see
[README.md](README.md); for the short contributor-facing version of some of this, see
[CONTRIBUTING.md](CONTRIBUTING.md) and [apps/web/ADMIN.md](apps/web/ADMIN.md). This
file goes deeper and includes the reasoning, not just the rules.

Emulsion is an ATProto-based photo portfolio framework: point it at a Grain.social DID
via `EMULSION_DID` and it builds a site from that account's `social.grain.*` records.
It's a pnpm workspace: `packages/core` (framework-agnostic data layer) and `apps/web`
(SvelteKit app deployed to Cloudflare Workers).

---

## 1. Data access: PDS-native, not Grain's AppView

**Decision:** `@emulsion/core` resolves a DID to its PDS and reads `social.grain.*`
records directly via `com.atproto.repo.listRecords`/`getRecord` — the generic ATProto
repo API every PDS implements. It never calls Grain's own AppView server
(`social.grain.unspecced.*` endpoints like `getGallery`, `getActorProfile`).

**Why:** Grain's AppView endpoints are explicitly namespaced `unspecced` — not a stable
public contract, and a hard dependency on `grain.social` staying online, unthrottled,
and API-compatible. Reading raw records means Emulsion keeps working even if Grain's
servers are down or change their API, at the cost of doing the gallery/item/photo/EXIF
joins ourselves (`packages/core/src/grain/aggregate.ts`) instead of getting a
pre-assembled `galleryView` for free.

**Technical consequence:** there is no way to filter `listRecords` server-side by an
arbitrary field (e.g. "items belonging to gallery X"). To join gallery → item → photo →
EXIF, `GrainClient.listAllGalleries()` fetches *entire* collections for the repo and
joins in memory. This is fine at personal-portfolio scale (tens to low hundreds of
galleries) but doesn't scale indefinitely — if that ever becomes a problem, the fix is
almost certainly a cache layer in front of the join (already partially there via
`CacheProvider`), not a different read strategy, since the underlying PDS API genuinely
doesn't support server-side filtering.

**Don't reintroduce a Grain AppView dependency** without discussing it — if PDS-only
reads can't get some piece of data, that's worth raising as a design question, not
silently working around by calling Grain's server.

## 2. Stack: Cloudflare Workers + SvelteKit + Tailwind v4 + Svelte 5

Chosen for one deploy target (Workers) with edge caching as a first-class primitive
(the Cache API), SvelteKit's file-based routing making the `(site)`/`admin` route-group
split (§6) natural, and Tailwind v4's CSS-first config keeping the default theme's
styling colocated with markup. Svelte 5 runes (`$props()`, `$derived`, `$state`) are
used throughout — no legacy Svelte 4 patterns (`export let`, reactive `$:` statements).

## 3. Caching: `CacheProvider` abstraction, not Cloudflare-specific code in core

**Decision:** `packages/core/src/cache/CacheProvider.ts` defines a minimal
`get`/`set` interface. `MemoryCacheProvider` (in-process, TTL-aware) is the only
implementation in core; `CloudflareCacheProvider` (wraps the Workers Cache API) lives
in `apps/web`. `createCachingFetch()` wraps a plain `fetch` with either provider,
caching successful GET responses by URL.

**Why:** keeps `@emulsion/core` deployable outside a Cloudflare Worker if someone wants
to (a Node script, a different edge platform) — core has zero Cloudflare-specific
imports. The cost is a small amount of indirection (`apps/web/src/lib/server/grain.ts`
wires `CloudflareCacheProvider` + TTL into every `GrainClient`/`PdsClient`
construction) that a Cloudflare-only implementation wouldn't need.

**Gotcha discovered in production:** caching is per-URL, with no invalidation hook on
writes. This is *correct* for the public read path (a stale-for-up-to-5-minutes
front page is a fine trade-off for avoiding hammering the PDS) but was *wrong* for the
admin panel's own reads — see §8.2 for the bug this caused and why admin reads
deliberately skip the cache entirely.

## 4. Theming: a TypeScript contract, not a plugin API

**Decision:** `apps/web/src/lib/theme/types.ts` defines a `Theme` interface (`Layout`,
`GalleryGrid`, `GalleryCard`, `GalleryPost`, `TagBadge`, `ExifPanel`, `ProfileHeader`,
`ThemeToggle` — each a typed Svelte 5 `Component<Props>`). A theme is a directory under
`src/themes/<name>/` exporting a `Theme` object as its `index.ts` default export.
`src/lib/theme/registry.ts` discovers themes via `import.meta.glob('/src/themes/*/index.ts', { eager: true })`
— no manual registration step. Selection is `EMULSION_THEME` env var, or `?theme=`
query param at request time (falls back silently to `default` if the name doesn't
match an installed theme).

**Why a typed interface instead of, say, a slot/component-injection system:** routes
never know which theme is active beyond calling `getTheme(name)` and rendering
`theme.GalleryGrid`/etc. — the *data* shape (`GalleryView`, `PhotoView`, `ProfileView`
from `@emulsion/core`) is the real contract between routes and themes. A theme is pure
presentation; it never touches routing, data-loading, or another theme's files. If a
new theme needs something a route doesn't currently pass down, that's a sign the
`Theme` contract needs a new prop — not a reason to reach into `$lib/server/`.

**Admin is NOT themed.** `/admin` has its own layout (`src/routes/admin/(protected)/+layout.svelte`)
with hardcoded Tailwind classes, entirely separate from the `Theme` contract. This was
a deliberate scope decision, not an oversight — admin is a core-framework concern
(same UI regardless of which theme the public site uses), and gating it as `(protected)`
required route-group surgery (§6) that would have been more complex if it also had to
compose with an arbitrary theme's `Layout`.

## 5. Pagination: cursor-based, gallery-level, computed in-process

**Decision:** `packages/core/src/grain/paginate.ts` exports a pure `paginate(items, {limit, cursor})`
function. Items are sorted deterministically (`createdAt` descending, `uri` descending
as a tiebreak — necessary because `createdAt` alone isn't unique enough to guarantee
stable ordering across pages). The cursor is simply the `rkey` of the last item
returned; the next call scans for that `rkey` and continues after it. An unrecognized
cursor (stale link, deleted gallery) returns an empty page rather than guessing.

**Why in-process rather than a real database cursor:** there's no database — data comes
from `listRecords`, fully materialized into memory per request (see §1's consequence).
Given that, "sort the in-memory array and slice" is the correct-complexity solution;
building anything more sophisticated would be solving a problem this app doesn't have.

**Why gallery-level only, not per-photo curation too:** matches Grain's own unit of
publishing (a gallery = a post) and was an explicit scope decision when curation (§8)
was designed — per-photo curation was considered and rejected as unnecessary
complexity for the stated use case (excluding whole off-portfolio posts, not trimming
photos within a kept post).

## 6. Route groups: `(site)` vs `admin`, because the root layout always applies

**Decision:** all public-facing routes (front page, gallery detail, tag index) live
under `src/routes/(site)/`, which owns the theme-rendering root `+layout.svelte`
(fetches profile/DID, renders `theme.Layout`). `src/routes/admin/` is a sibling, not a
child of `(site)`, with its own `(protected)/+layout.svelte`.

**Why this was necessary, not stylistic:** SvelteKit's true filesystem-root layout
(`src/routes/+layout.svelte`, if one existed there) applies to *every* route with no
opt-out — the `+layout@` "reset" syntax only skips *intermediate* layouts between root
and a given route, it cannot skip the root itself. Since the original root layout did
theme-rendering (profile header, footer, `Layout` component expecting `profile`/`theme`
props), `/admin` would otherwise unavoidably render inside that public-site chrome.
Moving the theme-rendering logic into a `(site)` group (which doesn't affect URLs — `/`
still resolves to `(site)/+page.svelte`) freed the true root to have no opinion about
chrome at all, letting `admin/(protected)/+layout.svelte` be independent.

**If you add a new top-level route that shouldn't have theme chrome** (another
core-framework feature, say), it goes as a sibling of `(site)` and `admin/`, following
the same pattern — not inside `(site)`.

## 7. Error handling: two error surfaces, because of a SvelteKit layout limitation

**Decision:** `src/routes/+error.svelte` (a themed-ish Tailwind component, self-contained,
imports `app.css` directly) handles errors from *page*-level loads — a 404 gallery, a
502 from a PDS timeout. `apps/web/src/error.html` (a plain static HTML template with
inline CSS, no Svelte, no Tailwind build step) handles errors from the **root layout's
own load** — e.g. `EMULSION_DID` unset, or DID resolution failing entirely.

**Why two, not one:** discovered by deliberately breaking the DID and watching the
themed `+error.svelte` *not* render — SvelteKit falls back to a generic ugly default
error page in that case, not your custom one. The reason: if the root layout's load
throws, no `+error.svelte` in the tree can render, because every `+error.svelte` is
implicitly a *child* of the layout(s) above it — including the root layout that just
failed. There is no error boundary above the root. SvelteKit's actual mechanism for
this exact case is `src/error.html`, a template substituted with `%sveltekit.status%`/
`%sveltekit.error.message%` at the point where no Svelte rendering is possible at all.
This is genuinely non-obvious and easy to reintroduce if `+error.svelte` is
"simplified" later — don't remove `error.html` on the assumption `+error.svelte` covers
everything.

## 8. Curation / admin panel

This was the most involved addition, added after the base framework was working, in
response to a specific use case: an owner whose Grain stream mixes casual snapshots
with portfolio-worthy work wants to choose what's public without touching Grain.

### 8.1 Data model: a PDS record, not a database

**Decision:** curation state is a single record, `app.emulsion.curation.settings`
(key: `self`), written to the *site owner's own PDS* — `{ mode: "all" | "featured",
featured: string[] (gallery AT-URIs), updatedAt }`. `packages/core/src/curation/`
holds the type, a pure `applyCuration(galleries, settings)` filter, and
`getCurationSettings`/`setCurationSettings`/`toggleFeaturedGallery` read/write helpers
built on the same `PdsClient` used for everything else.

**Why not Cloudflare KV or D1:** consistent with §1's PDS-native philosophy — curation
is *your* editorial metadata about *your* content, and belongs in your own repo like
everything else, portable independent of which host runs the Worker. This was an
explicit user decision (offered as a trade-off against "simpler to build in KV") not a
default assumption.

**Why one record, not one-record-per-gallery:** at expected scale (tens to low hundreds
of galleries), a single small JSON blob is simpler to reason about and requires one
read/write instead of N. Read-modify-write races are handled by always doing the
read+write against the same authenticated, uncached client within one request (see
`toggleFeaturedGallery`) — acceptable for a single-owner admin panel with no realistic
concurrent-write scenario.

**Default is `"all"` (show everything), not `"featured"`.** A fresh install with no
curation record yet must not go blank — `getCurationSettings` falls back to
`DEFAULT_CURATION_SETTINGS` when no record exists. Mode is switchable at runtime from
`/admin`, not an env var, specifically so it doesn't require a redeploy to change.

### 8.2 Auth: real ATProto OAuth, two independent session concepts

**Decision:** `/admin` is gated by signing in via the owner's actual PDS (the same flow
as signing into Bluesky) — not a shared password. Two *separate* session mechanisms
exist, both backed by Cloudflare KV:

1. **OAuth token session** (`OAUTH_SESSION_STORE`) — persists DPoP-bound access/refresh
   tokens, managed entirely by `@atproto/oauth-client-node`, keyed by DID. Lets the
   *server* make authenticated PDS writes on the owner's behalf.
2. **Admin browser session** (`ADMIN_SESSIONS`, `AdminSessionStore`) — an opaque random
   token in an HttpOnly cookie, mapping to a DID with a TTL.

**Why two, not one:** the OAuth session alone answers "can the server currently write
to this DID's PDS" — it says nothing about *which browser* is allowed to trigger that.
Once the owner logs in once, a session for their DID persists in KV indefinitely (until
expiry/revocation); without a separate per-browser gate, anyone who discovered the
`/admin` URL after that first login would have standing admin access, because
`client.restore(EMULSION_DID)` would just succeed for them too. The cookie is the
actual access-control boundary; the OAuth session is a capability, not an identity
check.

**Client type: public, not confidential.** `token_endpoint_auth_method: "none"` in
`clientMetadata.ts` — no client secret or signing keypair to generate, store, or
rotate. Security relies on PKCE + DPoP (both handled automatically by
`@atproto/oauth-client-node`), which is the standard, ecosystem-supported pattern for
this kind of client.

**No handle-based login — always the known `EMULSION_DID` directly.** `/admin/login`
calls `client.authorize(EMULSION_DID)` unconditionally; there's no "enter your handle"
form, because there's only ever one valid identity for a given deployment. This
sidesteps handle resolution entirely (see 8.3) and rejects any other DID at the
callback step (`session.did !== expectedDid` → 403 + sign out).

**No distributed lock** (`requestLock`, which the library warns about on construction
if omitted) is configured for token-refresh races. A correct fix needs a Durable
Object; for a single-owner admin panel with effectively no concurrent access, the
console warning is an accepted trade-off, not a bug to silently fix later without
noticing the trade-off changed.

### 8.3 The Workers/ATProto-OAuth compatibility problem (read this before touching OAuth code)

This is the part most likely to bite a future contributor, because the wrong fix
*looks* like it works until deployed.

**The surface problem:** Cloudflare Workers doesn't support `redirect: "error"` on
`fetch`/`Request` — `new Request(url, { redirect: "error" })` throws immediately
("Invalid redirect value...") at *construction* time, no network call involved.
`@atproto/oauth-client-node`'s dependency tree uses `redirect: "error"` in several
places as a deliberate anti-SSRF measure (refuse to silently follow a redirect when
resolving an identity or fetching metadata).

**The wrong-but-tempting fix:** wrap the `fetch` passed to `NodeOAuthClient` to
intercept `init.redirect === "error"` and rewrite it to `"manual"` before the real
fetch runs, then manually reject if the response turns out to be a redirect (preserving
the original intent). This is `src/lib/server/oauth/workersCompatFetch.ts`, and it
**is correct and necessary** for the call sites it actually reaches (PAR requests,
token exchange, protected-resource/authorization-server metadata — all of which call
`fetch(url, init)` with `init` as a plain object, checked before any `Request` gets
constructed).

**Why it's not sufficient on its own — verified by a real production 500, not by
re-reading the source more carefully:** `@atproto-labs/did-resolver`'s `plc.ts`/`web.ts`
(used to resolve a DID to its PDS during login) call `this.fetch(url, {redirect:
"error", ...})`, where `this.fetch` comes from `bindFetch(options?.fetch)`
(`@atproto-labs/fetch/dist/fetch-wrap.js`). `bindFetch` wraps *any* injected fetch with
`toRequestTransformer`, whose implementation
(`@atproto-labs/fetch/dist/fetch.js`) is:

```js
export function toRequestTransformer(requestTransformer) {
  return function (input, init) {
    return requestTransformer.call(this, asRequest(input, init));
  };
}
export function asRequest(input, init) {
  if (!init && input instanceof Request) return input;
  return new Request(input, init);
}
```

`asRequest` constructs the `Request` — with the invalid `redirect: "error"` — **before**
`requestTransformer` (the callback that eventually calls the injected `fetch`) is ever
invoked. A `fetch` wrapper passed as `options.fetch` sits *inside* `requestTransformer`,
one layer below where the throw happens. There is no way to intercept this by wrapping
`fetch`, for any call site that goes through `bindFetch` — full stop. (The same applies
to `@atproto-labs/handle-resolver`'s `xrpc-handle-resolver.ts`/`well-known-handler-resolver.ts`.)

**The actual fix:** `src/lib/server/oauth/didResolver.ts` (`EmulsionDidResolver`)
replaces `@atproto-labs/did-resolver`'s default resolver *entirely*, passed as the
`didResolver` option to `NodeOAuthClient` (bypassing `bindFetch`/`asRequest` for DID
resolution completely). It does the same two HTTP calls PLC-directory/`did:web`
well-known lookup) that `packages/core`'s own `didResolver.ts` already does
successfully, with `redirect: "manual"` from the start and never `"error"`. A redirect
response comes back non-2xx in manual mode, so `res.ok` still correctly rejects it —
the anti-SSRF property is preserved, just enforced by our own code instead of the
library's.

Handle resolution never hits this problem in practice, because `noHandleResolver.ts`
stubs it out — admin login always authorizes by the known DID directly (§8.2), so the
handle resolver is constructed (satisfying the type) but its `resolve()` is never
meaningfully called. This also sidesteps a second issue: the real handle resolver pulls
in `node:dns`, which is importable under Workers' `nodejs_compat` but not reliably
functional.

**If you're tempted to "simplify" this back down to just the fetch wrapper:** don't,
without first reading `asRequest`/`bindFetch`'s actual source (not a summary of it) and
confirming the specific call site you're touching doesn't go through that path. This
mistake shipped to production once already — unit tests with a mocked base `fetch`
passed, because they tested the wrapper's *logic* in isolation, not the real
`bindFetch`/`asRequest` composition. Prefer integration verification (a real deploy, or
at minimum constructing the real `NodeOAuthClient` and exercising `authorize()`) over
trusting that a wrapper "should" work based on reading call signatures alone.

### 8.4 KV namespace provisioning: deliberately not in the default `wrangler.jsonc`

**Decision:** the three KV bindings admin/OAuth needs (`OAUTH_STATE_STORE`,
`OAUTH_SESSION_STORE`, `ADMIN_SESSIONS`) are *not* declared in the framework's
`wrangler.jsonc` — not even as commented-out placeholders with empty `id` fields.

**Why:** tried exactly that first. An empty-string `id` fails Wrangler's config
validation *at build time* (`vite build`, via `@sveltejs/adapter-cloudflare`'s
`validate_wrangler_config`), not at request time — meaning `pnpm dev`/`pnpm build`
would break for every framework user, including ones who never touch `/admin`.
Instead, `wrangler.jsonc` has a comment block describing the exact snippet to add
(see `apps/web/ADMIN.md`), and the setup step is `wrangler kv namespace create <NAME>`
×3 per deployment. Each Emulsion deployment gets its own KV namespaces — they are not
shared across deployments, by design (the whole point is per-owner curation state).

## 9. Deployment workflow gotchas

- **`vite build` before `wrangler deploy`, always.** `wrangler deploy` ships whatever's
  currently in `.svelte-kit/cloudflare/` — it has no way to know that's stale. Since
  that directory is gitignored, `git pull`ing new source *never* triggers a rebuild by
  itself. Running a bare `wrangler deploy` after a `git pull` silently re-ships old
  code with no warning. `apps/web/package.json`'s `deploy` script
  (`vite build && wrangler deploy`) exists specifically so this can't happen by
  accident — use it, not `wrangler deploy` directly.
- **`workers_dev: true` alongside a custom domain route** is intentional in
  site-specific `wrangler.jsonc` files (not the framework template) — gives a
  `*.workers.dev` URL to test against during DNS propagation/zone setup, independent
  of the custom domain. The `workers.dev` *subdomain* itself (`<account>.workers.dev`)
  is an account-wide Cloudflare setting, unrelated to any specific Worker — don't
  assume it reflects anything about the project.
- **Cloudflare zone (domain) creation cannot be done via `wrangler`** with an OAuth
  login token — it requires either the dashboard or an API token with `zone:write`
  scope, which `wrangler login`'s token doesn't grant. Adding a custom domain route to
  `wrangler.jsonc` before the zone exists and is active fails deploy with "Could not
  find zone"; adding it while existing DNS records (e.g. migrated from another host)
  still occupy the same hostname fails with a 409 conflict — the apex/hostname record
  has to be clear for a Workers Custom Domain to claim it.

## 10. Repo separation convention

The framework (`emulsion`) and a specific deployment (e.g. `aendra.photos`) are
separate git repositories, not branches of one repo. A deployment repo clones from
`emulsion`, renames the clone's `origin` remote to `upstream`, and (once the owner has
a real repo for their site) points `origin` at that. This means:

- Framework changes: commit/push to `emulsion`'s `origin` (`main`).
- Deployment-specific config (DID, domain, KV namespace IDs): lives only in the
  deployment repo, never in `emulsion`.
- Pulling framework updates into a deployment: `git fetch upstream && git merge
  upstream/main` in the deployment repo — expect occasional conflicts in
  `wrangler.jsonc` specifically (deployment-specific fields like `routes`/`kv_namespaces`
  vs. framework changes to the same file), resolved by keeping both sides' intent, not
  by preferring one wholesale.

## 11. Testing philosophy

TDD (red-green) for everything in `packages/core` and for pure/testable logic in
`apps/web` (the `curation`/`grain` modules, the OAuth Workers-compat pieces in
isolation). Watch a new test fail before writing the implementation — this caught at
least one real bug during development (a test fixture with an empty `facets: []`
array that silently made a hashtag-extraction assertion vacuously true instead of
testing what it claimed to). For anything touching a real external system (ATProto
OAuth's actual token exchange, DNS/redirect behavior in the Workers runtime), treat
passing unit tests as necessary but *not* sufficient — see §8.3 for what happens when
that's forgotten. Verify integration points against the real thing (a deployed Worker,
`wrangler dev` against real bindings) before considering a fix complete.
