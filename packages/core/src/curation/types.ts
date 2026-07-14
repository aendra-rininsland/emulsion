/** Collection NSID for Emulsion's own curation-settings record, written to the site owner's PDS. */
export const CURATION_COLLECTION = "app.emulsion.curation.settings";
export const CURATION_RKEY = "self";

export type CurationMode = "all" | "featured";

/**
 * A single record (key: "self") holding which galleries should be publicly visible.
 * In "all" mode, `featured` is ignored and every gallery is shown (the default for a
 * fresh install, so a site never goes blank before anyone has curated anything).
 */
export interface CurationSettingsRecord {
  mode: CurationMode;
  /** AT-URIs of galleries to show when mode is "featured". */
  featured: string[];
  updatedAt: string;
}

export const DEFAULT_CURATION_SETTINGS: CurationSettingsRecord = {
  mode: "all",
  featured: [],
  updatedAt: new Date(0).toISOString()
};
