# Admin: curating what's public

If your Grain stream is a general photo dump (street photography, snapshots, whatever)
rather than a curated portfolio, `/admin` lets you choose which galleries actually show
up on your Emulsion site — without touching Grain itself.

## How it works

- **Curation state lives in your own PDS**, as a record you own
  (`app.emulsion.curation.settings`) — not in a database somewhere, not in Grain. It
  holds a `mode` (`"all"` or `"featured"`) and the list of featured gallery AT-URIs.
- **`/admin` is gated by real ATProto OAuth** — you sign in exactly like signing into
  Bluesky, via your own PDS. Emulsion never sees your password, and only the DID set as
  `EMULSION_DID` is allowed in; signing in as anyone else is rejected.
- **Two independent sessions, on purpose.** One is the OAuth token session (lets the
  *server* make authenticated writes to your PDS on your behalf; server-side only,
  stored in KV). The other is a browser session cookie (opaque token, gates *who* can
  use `/admin` at all). They're separate because the OAuth session alone doesn't
  identify a browser — without the cookie, anyone who found your `/admin` URL after
  your first login would have standing access forever.
- **Public routes are unaffected until you use it.** Default mode is `"all"` — every
  gallery from Grain is public, exactly like before this feature existed. Nothing
  changes until you sign in and either feature specific galleries or switch to
  "featured only" mode.

## Setup

`/admin` needs three Cloudflare KV namespaces. They're deliberately *not* declared in
`wrangler.jsonc` by default — an empty placeholder `id` fails Wrangler's config
validation and breaks `pnpm dev`/`pnpm build` for everyone, including people not using
this feature at all.

```bash
cd apps/web
pnpm exec wrangler kv namespace create OAUTH_STATE_STORE
pnpm exec wrangler kv namespace create OAUTH_SESSION_STORE
pnpm exec wrangler kv namespace create ADMIN_SESSIONS
```

Each command prints an `id`. Add all three to `wrangler.jsonc`:

```jsonc
"kv_namespaces": [
  { "binding": "OAUTH_STATE_STORE", "id": "<id from the first command>" },
  { "binding": "OAUTH_SESSION_STORE", "id": "<id from the second command>" },
  { "binding": "ADMIN_SESSIONS", "id": "<id from the third command>" }
],
```

Then deploy (`pnpm deploy`) and visit `https://<your-domain>/admin`.

**OAuth login only works against a real deployed HTTPS domain** — the client metadata
document (`/oauth/client-metadata.json`) has to be fetchable by your PDS at a stable
public URL, which `localhost` isn't. `pnpm dev` is fine for everything else; test the
admin panel on your actual deployment.

## Architecture notes for contributors

`@atproto/oauth-client-node` (the official, unmodified Bluesky package) doesn't run as-is
on Cloudflare Workers: it uses `redirect: "error"` internally for DID/handle
resolution, which Workers doesn't support (throws at `Request` construction). Rather
than vendoring patched copies of Bluesky's code, `src/lib/server/oauth/workersCompatFetch.ts`
wraps `fetch` to rewrite `redirect: "error"` to Workers' recommended `"manual"`, then
manually rejects if a redirect actually occurred — preserving the original anti-SSRF
intent instead of just disabling it. This works because every call site that matters
for us (DID resolution via PLC/`did:web`, XRPC handle resolution) takes an *injectable*
`fetch`, not a directly-constructed `Request` — confirmed by reading the actual
`@atproto/oauth-client`/`@atproto-labs/did-resolver` source, not assumed.

Handle resolution (`noHandleResolver.ts`) is stubbed out entirely: admin login always
authorizes by the known `EMULSION_DID` directly, so the Node handle resolver — which
pulls in `node:dns`, unevenly supported in Workers — is never needed.

No distributed lock is configured for the OAuth client's token-refresh path
(`requestLock`), which the library warns about on construction. A real fix needs a
Durable Object; for a single-owner admin panel with rare concurrent access, the
console warning is an accepted trade-off rather than a bug.
