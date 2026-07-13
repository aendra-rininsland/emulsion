import { EmulsionError } from "../errors.js";

export { EmulsionError };

export interface ResolveOptions {
  fetch?: typeof fetch;
  plcDirectoryUrl?: string;
  bskyApiUrl?: string;
}

interface DidServiceEntry {
  id: string;
  type: string;
  serviceEndpoint: string;
}

interface DidDocument {
  id: string;
  service?: DidServiceEntry[];
}

const DEFAULT_PLC_DIRECTORY = "https://plc.directory";
const DEFAULT_BSKY_API = "https://public.api.bsky.app";
const PDS_SERVICE_TYPE = "AtprotoPersonalDataServer";

async function fetchDidDocument(did: string, opts: ResolveOptions): Promise<DidDocument> {
  const doFetch = opts.fetch ?? fetch;
  let url: string;

  if (did.startsWith("did:plc:")) {
    url = `${opts.plcDirectoryUrl ?? DEFAULT_PLC_DIRECTORY}/${did}`;
  } else if (did.startsWith("did:web:")) {
    const domain = did.slice("did:web:".length);
    url = `https://${decodeURIComponent(domain)}/.well-known/did.json`;
  } else {
    throw new EmulsionError(`Unsupported DID method for "${did}". Only did:plc and did:web are supported.`);
  }

  const res = await doFetch(url);
  if (!res.ok) {
    throw new EmulsionError(`Failed to resolve DID document for "${did}" (${res.status} from ${url})`);
  }
  return (await res.json()) as DidDocument;
}

/** Resolve a DID to its PDS (Personal Data Server) HTTP endpoint. */
export async function resolvePds(did: string, opts: ResolveOptions = {}): Promise<string> {
  const doc = await fetchDidDocument(did, opts);
  const pds = doc.service?.find((s) => s.type === PDS_SERVICE_TYPE);
  if (!pds) {
    throw new EmulsionError(`DID document for "${did}" has no PDS service entry.`);
  }
  return pds.serviceEndpoint;
}

/** Resolve a handle (e.g. "chad.grain.social") to a DID via the public AppView. */
export async function resolveHandle(handle: string, opts: ResolveOptions = {}): Promise<string> {
  const doFetch = opts.fetch ?? fetch;
  const base = opts.bskyApiUrl ?? DEFAULT_BSKY_API;
  const url = `${base}/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`;
  const res = await doFetch(url);
  if (!res.ok) {
    throw new EmulsionError(`Failed to resolve handle "${handle}" (${res.status})`);
  }
  const body = (await res.json()) as { did: string };
  return body.did;
}
