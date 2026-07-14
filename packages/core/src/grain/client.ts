import { resolveDidDocument } from "../atproto/didResolver.js";
import { PdsClient } from "../atproto/pdsClient.js";
import { EmulsionError } from "../errors.js";
import { assembleGalleries } from "./aggregate.js";
import { paginate } from "./paginate.js";
import type { PaginateOptions, PaginatedResult } from "./paginate.js";
import { blobRefCid } from "./types.js";
import type { ActorProfileRecord, GalleryItemRecord, GalleryRecord, PhotoExifRecord, PhotoRecord } from "./types.js";
import type { GalleryView, ProfileView } from "./views.js";

const GALLERY_COLLECTION = "social.grain.gallery";
const GALLERY_ITEM_COLLECTION = "social.grain.gallery.item";
const PHOTO_COLLECTION = "social.grain.photo";
const PHOTO_EXIF_COLLECTION = "social.grain.photo.exif";
const PROFILE_COLLECTION = "social.grain.actor.profile";
const PROFILE_RKEY = "self";

export interface GrainClientOptions {
  fetch?: typeof fetch;
  /**
   * Override how photo/avatar blob URLs are built. Defaults to the raw PDS
   * com.atproto.sync.getBlob URL. A deployment that wants to proxy/cache blobs
   * through its own edge (e.g. Cloudflare) instead of serving directly from the PDS
   * can pass a builder pointing at its own route — see apps/web's use of this.
   */
  blobUrlBuilder?: (did: string, cid: string) => string;
}

/**
 * High-level read API for a single Grain (social.grain.*) repo, resolved straight from the
 * owner's PDS — no dependency on Grain's own AppView servers staying online or API-compatible.
 */
export class GrainClient {
  private readonly pdsClient: PdsClient;

  constructor(
    private readonly did: string,
    pdsEndpoint: string,
    private readonly opts: GrainClientOptions = {},
    private readonly handle?: string
  ) {
    this.pdsClient = new PdsClient(pdsEndpoint, { fetch: opts.fetch });
  }

  /** Resolve `did`'s PDS endpoint (and handle, if published) and construct a client for it. */
  static async forDid(did: string, opts: GrainClientOptions = {}): Promise<GrainClient> {
    const { pdsEndpoint, handle } = await resolveDidDocument(did, { fetch: opts.fetch });
    return new GrainClient(did, pdsEndpoint, opts, handle);
  }

  private blobUrl(cid: string): string {
    if (this.opts.blobUrlBuilder) return this.opts.blobUrlBuilder(this.did, cid);
    return this.pdsClient.getBlobUrl(this.did, cid);
  }

  private async fetchAllGalleries(): Promise<GalleryView[]> {
    const [galleries, items, photos, exifs] = await Promise.all([
      this.pdsClient.listRecords<GalleryRecord>(this.did, GALLERY_COLLECTION),
      this.pdsClient.listRecords<GalleryItemRecord>(this.did, GALLERY_ITEM_COLLECTION),
      this.pdsClient.listRecords<PhotoRecord>(this.did, PHOTO_COLLECTION),
      this.pdsClient.listRecords<PhotoExifRecord>(this.did, PHOTO_EXIF_COLLECTION)
    ]);

    return assembleGalleries({
      did: this.did,
      galleries,
      items,
      photos,
      exifs,
      blobUrl: (cid) => this.blobUrl(cid)
    });
  }

  /** List galleries newest first, with photos and EXIF joined in, one page at a time. */
  async listGalleries(opts: PaginateOptions = {}): Promise<PaginatedResult<GalleryView>> {
    const all = await this.fetchAllGalleries();
    return paginate(all, opts);
  }

  /**
   * Fetch every gallery, unpaginated. Intended for callers that need to filter or search
   * across the whole repo (e.g. a tag index) before paginating the filtered result themselves.
   */
  async listAllGalleries(): Promise<GalleryView[]> {
    return this.fetchAllGalleries();
  }

  /** Fetch a single gallery by rkey, or null if it doesn't exist in this repo. */
  async getGallery(rkey: string): Promise<GalleryView | null> {
    const galleries = await this.fetchAllGalleries();
    return galleries.find((g) => g.rkey === rkey) ?? null;
  }

  /** Fetch the repo owner's social.grain.actor.profile record. */
  async getProfile(): Promise<ProfileView> {
    const record = await this.pdsClient.getRecord<ActorProfileRecord>(this.did, PROFILE_COLLECTION, PROFILE_RKEY);
    if (!record) {
      throw new EmulsionError(`No social.grain.actor.profile record found for ${this.did}`);
    }
    return {
      did: this.did,
      handle: this.handle,
      displayName: record.value.displayName,
      description: record.value.description,
      avatarUrl: record.value.avatar ? this.blobUrl(blobRefCid(record.value.avatar)) : undefined,
      createdAt: record.value.createdAt
    };
  }
}
