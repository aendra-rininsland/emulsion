import { EmulsionError } from "../errors.js";

export interface PdsRecord<T = unknown> {
  uri: string;
  cid: string;
  value: T;
}

export interface PdsClientOptions {
  fetch?: typeof fetch;
}

const LIST_RECORDS_PAGE_SIZE = 100;

/** Thin client over an ATProto PDS's com.atproto.repo.* XRPC surface. */
export class PdsClient {
  private readonly fetch: typeof fetch;

  constructor(
    private readonly pdsEndpoint: string,
    opts: PdsClientOptions = {}
  ) {
    this.fetch = opts.fetch ?? fetch;
  }

  /** List every record in a collection for a repo, transparently paging through cursors. */
  async listRecords<T = unknown>(did: string, collection: string): Promise<PdsRecord<T>[]> {
    const out: PdsRecord<T>[] = [];
    let cursor: string | undefined;

    do {
      const url = new URL(`${this.pdsEndpoint}/xrpc/com.atproto.repo.listRecords`);
      url.searchParams.set("repo", did);
      url.searchParams.set("collection", collection);
      url.searchParams.set("limit", String(LIST_RECORDS_PAGE_SIZE));
      if (cursor) url.searchParams.set("cursor", cursor);

      const res = await this.fetch(url);
      if (!res.ok) {
        throw new EmulsionError(
          `Failed to list records for ${collection} on ${did} (${res.status} from ${this.pdsEndpoint})`
        );
      }
      const body = (await res.json()) as { records: PdsRecord<T>[]; cursor?: string };
      out.push(...body.records);
      cursor = body.cursor;
    } while (cursor);

    return out;
  }

  /** Fetch a single record by rkey, or null if it does not exist. */
  async getRecord<T = unknown>(did: string, collection: string, rkey: string): Promise<PdsRecord<T> | null> {
    const url = new URL(`${this.pdsEndpoint}/xrpc/com.atproto.repo.getRecord`);
    url.searchParams.set("repo", did);
    url.searchParams.set("collection", collection);
    url.searchParams.set("rkey", rkey);

    const res = await this.fetch(url);
    if (res.status === 400 || res.status === 404) return null;
    if (!res.ok) {
      throw new EmulsionError(
        `Failed to get record ${collection}/${rkey} on ${did} (${res.status} from ${this.pdsEndpoint})`
      );
    }
    return (await res.json()) as PdsRecord<T>;
  }

  /**
   * Create or overwrite a record by rkey. Requires an authenticated `fetch` (e.g. an
   * ATProto OAuth session's DPoP-bound fetch) — the caller is responsible for auth.
   */
  async putRecord<T = unknown>(did: string, collection: string, rkey: string, record: T): Promise<void> {
    const url = new URL(`${this.pdsEndpoint}/xrpc/com.atproto.repo.putRecord`);
    const res = await this.fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ repo: did, collection, rkey, record })
    });
    if (!res.ok) {
      throw new EmulsionError(
        `Failed to put record ${collection}/${rkey} on ${did} (${res.status} from ${this.pdsEndpoint})`
      );
    }
  }

  /** Build the com.atproto.sync.getBlob URL for fetching a blob by CID. */
  getBlobUrl(did: string, cid: string): string {
    const url = new URL(`${this.pdsEndpoint}/xrpc/com.atproto.sync.getBlob`);
    url.searchParams.set("did", did);
    url.searchParams.set("cid", cid);
    return url.toString();
  }
}
