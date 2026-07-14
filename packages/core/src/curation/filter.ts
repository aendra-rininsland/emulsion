import type { GalleryView } from "../grain/views.js";
import type { CurationSettingsRecord } from "./types.js";

/** Whether `gallery` should be publicly visible under the given curation settings. */
export function isGalleryVisible(gallery: GalleryView, settings: CurationSettingsRecord | undefined): boolean {
  if (!settings || settings.mode === "all") return true;
  return settings.featured.includes(gallery.uri);
}

/** Filter a list of galleries down to what should be publicly visible, preserving order. */
export function applyCuration(
  galleries: GalleryView[],
  settings: CurationSettingsRecord | undefined
): GalleryView[] {
  if (!settings || settings.mode === "all") return galleries;
  const featured = new Set(settings.featured);
  return galleries.filter((g) => featured.has(g.uri));
}
