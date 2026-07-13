// Mirrors the social.grain.* lexicons published at
// https://github.com/grainsocial/grain/tree/main/lexicons/social/grain

export interface AspectRatio {
  width: number;
  height: number;
}

export interface RichtextFacetIndex {
  byteStart: number;
  byteEnd: number;
}

export type RichtextFacetFeature =
  | { $type: "app.bsky.richtext.facet#tag"; tag: string }
  | { $type: "app.bsky.richtext.facet#mention"; did: string }
  | { $type: "app.bsky.richtext.facet#link"; uri: string }
  | { $type: string; [key: string]: unknown };

export interface RichtextFacet {
  index: RichtextFacetIndex;
  features: RichtextFacetFeature[];
}

export interface GeoLocation {
  latitude: string;
  longitude: string;
}

export interface Address {
  country?: string;
  postalCode?: string;
  region?: string;
  locality?: string;
  street?: string;
  name?: string;
}

/** social.grain.gallery record (`type: record`) */
export interface GalleryRecord {
  title: string;
  description?: string;
  facets?: RichtextFacet[];
  location?: GeoLocation;
  address?: Address;
  createdAt: string;
  updatedAt?: string;
}

/** social.grain.gallery.item record */
export interface GalleryItemRecord {
  createdAt: string;
  gallery: string;
  item: string;
  position?: number;
}

export interface BlobRef {
  $type: "blob";
  ref: { $link: string } | string;
  mimeType: string;
  size: number;
}

/** social.grain.photo record */
export interface PhotoRecord {
  photo: BlobRef;
  alt?: string;
  aspectRatio: AspectRatio;
  createdAt: string;
}

/** social.grain.photo.exif record */
export interface PhotoExifRecord {
  photo: string;
  createdAt: string;
  dateTimeOriginal?: string;
  exposureTime?: number;
  fNumber?: number;
  flash?: string;
  focalLengthIn35mmFormat?: number;
  iSO?: number;
  lensMake?: string;
  lensModel?: string;
  make?: string;
  model?: string;
}

/** social.grain.actor.profile record */
export interface ActorProfileRecord {
  displayName?: string;
  description?: string;
  avatar?: BlobRef;
  createdAt?: string;
}

/** Extracted CID string helper for a blob ref's `ref` field. */
export function blobRefCid(blob: BlobRef): string {
  if (typeof blob.ref === "string") return blob.ref;
  return blob.ref.$link;
}
