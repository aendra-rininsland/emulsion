import type { PdsRecord } from "../atproto/pdsClient.js";
import { extractHashtags, richtextToSegments } from "./facets.js";
import { blobRefCid } from "./types.js";
import type { GalleryItemRecord, GalleryRecord, PhotoExifRecord, PhotoRecord } from "./types.js";
import type { GalleryView, PhotoExifView, PhotoView } from "./views.js";

const EXIF_SCALE = 1_000_000;

function rkeyOf(uri: string): string {
  return uri.slice(uri.lastIndexOf("/") + 1);
}

function assembleExif(exif: PdsRecord<PhotoExifRecord> | undefined): PhotoExifView | undefined {
  if (!exif) return undefined;
  const v = exif.value;
  return {
    dateTimeOriginal: v.dateTimeOriginal,
    exposureTime: v.exposureTime === undefined ? undefined : v.exposureTime / EXIF_SCALE,
    fNumber: v.fNumber === undefined ? undefined : v.fNumber / EXIF_SCALE,
    flash: v.flash,
    focalLengthIn35mmFormat: v.focalLengthIn35mmFormat === undefined ? undefined : v.focalLengthIn35mmFormat / EXIF_SCALE,
    iso: v.iSO,
    lensMake: v.lensMake,
    lensModel: v.lensModel,
    make: v.make,
    model: v.model
  };
}

/** Assemble a single photo view, given its record, optional EXIF record, and a resolved blob URL. */
export function assemblePhoto(
  did: string,
  photo: PdsRecord<PhotoRecord>,
  exif: PdsRecord<PhotoExifRecord> | undefined,
  blobUrl: string,
  position = 0
): PhotoView {
  return {
    uri: photo.uri,
    rkey: rkeyOf(photo.uri),
    blobUrl,
    alt: photo.value.alt,
    aspectRatio: photo.value.aspectRatio,
    position,
    createdAt: photo.value.createdAt,
    exif: assembleExif(exif)
  };
}

export interface AssembleGalleriesInput {
  did: string;
  galleries: PdsRecord<GalleryRecord>[];
  items: PdsRecord<GalleryItemRecord>[];
  photos: PdsRecord<PhotoRecord>[];
  exifs: PdsRecord<PhotoExifRecord>[];
  blobUrl: (cid: string) => string;
}

/** Join gallery, gallery.item, photo, and photo.exif records into full GalleryView objects. */
export function assembleGalleries(input: AssembleGalleriesInput): GalleryView[] {
  const { did, galleries, items, photos, exifs, blobUrl } = input;

  const photosByUri = new Map(photos.map((p) => [p.uri, p]));
  const exifByPhotoUri = new Map(exifs.map((e) => [e.value.photo, e]));
  const itemsByGallery = new Map<string, PdsRecord<GalleryItemRecord>[]>();

  for (const item of items) {
    const list = itemsByGallery.get(item.value.gallery) ?? [];
    list.push(item);
    itemsByGallery.set(item.value.gallery, list);
  }

  const views = galleries.map((gallery): GalleryView => {
    const galleryItems = (itemsByGallery.get(gallery.uri) ?? [])
      .slice()
      .sort((a, b) => (a.value.position ?? 0) - (b.value.position ?? 0));

    const photoViews: PhotoView[] = [];
    for (const item of galleryItems) {
      const photo = photosByUri.get(item.value.item);
      if (!photo) continue;
      const cid = blobRefCid(photo.value.photo);
      photoViews.push(assemblePhoto(did, photo, exifByPhotoUri.get(photo.uri), blobUrl(cid), item.value.position ?? 0));
    }

    return {
      uri: gallery.uri,
      rkey: rkeyOf(gallery.uri),
      title: gallery.value.title,
      description: gallery.value.description,
      segments: richtextToSegments(gallery.value.description ?? "", gallery.value.facets),
      hashtags: extractHashtags(gallery.value.facets),
      location: gallery.value.location,
      createdAt: gallery.value.createdAt,
      updatedAt: gallery.value.updatedAt,
      photos: photoViews
    };
  });

  return views.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.uri.localeCompare(a.uri));
}
