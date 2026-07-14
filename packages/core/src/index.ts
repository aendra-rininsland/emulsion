export { EmulsionError } from "./errors.js";

export { resolvePds, resolveHandle, resolveDidDocument } from "./atproto/didResolver.js";
export type { ResolveOptions, DidDocumentInfo } from "./atproto/didResolver.js";

export { PdsClient } from "./atproto/pdsClient.js";
export type { PdsRecord, PdsClientOptions } from "./atproto/pdsClient.js";

export { getCurationSettings, setCurationSettings, toggleFeaturedGallery } from "./curation/client.js";
export { applyCuration, isGalleryVisible } from "./curation/filter.js";
export { CURATION_COLLECTION, CURATION_RKEY, DEFAULT_CURATION_SETTINGS } from "./curation/types.js";
export type { CurationMode, CurationSettingsRecord } from "./curation/types.js";

export { GrainClient } from "./grain/client.js";
export type { GrainClientOptions } from "./grain/client.js";

export { extractHashtags, extractLinks, extractMentions, richtextToSegments } from "./grain/facets.js";
export type { RichtextSegment } from "./grain/facets.js";

export { assembleGalleries, assemblePhoto } from "./grain/aggregate.js";

export { paginate, DEFAULT_PAGE_SIZE } from "./grain/paginate.js";
export type { PaginateOptions, PaginatedResult } from "./grain/paginate.js";

export type {
  AspectRatio,
  RichtextFacet,
  RichtextFacetFeature,
  RichtextFacetIndex,
  GeoLocation,
  Address,
  GalleryRecord,
  GalleryItemRecord,
  PhotoRecord,
  PhotoExifRecord,
  ActorProfileRecord,
  BlobRef
} from "./grain/types.js";
export { blobRefCid } from "./grain/types.js";

export type { GalleryView, PhotoView, PhotoExifView, ProfileView } from "./grain/views.js";

export type { CacheProvider } from "./cache/CacheProvider.js";
export { MemoryCacheProvider } from "./cache/memoryCacheProvider.js";
export { CloudflareCacheProvider } from "./cache/cloudflareCacheProvider.js";
export { createCachingFetch } from "./cache/cachingFetch.js";
export type { CachingFetchOptions } from "./cache/cachingFetch.js";
