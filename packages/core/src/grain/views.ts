import type { RichtextSegment } from "./facets.js";

export interface PhotoExifView {
  dateTimeOriginal?: string;
  exposureTime?: number;
  fNumber?: number;
  flash?: string;
  focalLengthIn35mmFormat?: number;
  iso?: number;
  lensMake?: string;
  lensModel?: string;
  make?: string;
  model?: string;
}

export interface PhotoView {
  uri: string;
  rkey: string;
  blobUrl: string;
  alt?: string;
  aspectRatio: { width: number; height: number };
  position: number;
  createdAt: string;
  exif?: PhotoExifView;
}

export interface GalleryView {
  uri: string;
  rkey: string;
  title: string;
  description?: string;
  segments: RichtextSegment[];
  hashtags: string[];
  location?: { latitude: string; longitude: string };
  createdAt: string;
  updatedAt?: string;
  photos: PhotoView[];
}

export interface ProfileView {
  did: string;
  handle?: string;
  displayName?: string;
  description?: string;
  avatarUrl?: string;
  createdAt?: string;
}
