import type { PdsClient } from "../atproto/pdsClient.js";
import { CURATION_COLLECTION, CURATION_RKEY, DEFAULT_CURATION_SETTINGS } from "./types.js";
import type { CurationMode, CurationSettingsRecord } from "./types.js";

/** Read the curation-settings record, defaulting to "all" mode if none has been written yet. */
export async function getCurationSettings(pdsClient: PdsClient, did: string): Promise<CurationSettingsRecord> {
  const record = await pdsClient.getRecord<CurationSettingsRecord>(did, CURATION_COLLECTION, CURATION_RKEY);
  return record?.value ?? DEFAULT_CURATION_SETTINGS;
}

/** Overwrite the curation-settings record. Requires an authenticated PdsClient. */
export async function setCurationSettings(
  pdsClient: PdsClient,
  did: string,
  settings: { mode: CurationMode; featured: string[] }
): Promise<void> {
  const record: CurationSettingsRecord = { ...settings, updatedAt: new Date().toISOString() };
  await pdsClient.putRecord(did, CURATION_COLLECTION, CURATION_RKEY, record);
}

/**
 * Add or remove a single gallery from the featured list, leaving mode untouched.
 * Returns the resulting settings. Requires an authenticated PdsClient.
 */
export async function toggleFeaturedGallery(
  pdsClient: PdsClient,
  did: string,
  galleryUri: string
): Promise<CurationSettingsRecord> {
  const current = await getCurationSettings(pdsClient, did);
  const isFeatured = current.featured.includes(galleryUri);
  const featured = isFeatured
    ? current.featured.filter((uri) => uri !== galleryUri)
    : [...current.featured, galleryUri];

  const next: CurationSettingsRecord = { mode: current.mode, featured, updatedAt: new Date().toISOString() };
  await pdsClient.putRecord(did, CURATION_COLLECTION, CURATION_RKEY, next);
  return next;
}
