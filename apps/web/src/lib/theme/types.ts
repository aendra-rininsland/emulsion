import type { Component, Snippet } from "svelte";
import type { GalleryView, PhotoExifView, ProfileView } from "@emulsion/core";

export interface LayoutProps {
  profile: ProfileView;
  children?: Snippet;
}

export interface GalleryGridProps {
  galleries: GalleryView[];
  heading?: string;
}

export interface GalleryCardProps {
  gallery: GalleryView;
}

export interface GalleryPostProps {
  gallery: GalleryView;
}

export interface TagBadgeProps {
  tag: string;
}

export interface ExifPanelProps {
  exif: PhotoExifView;
}

export interface ProfileHeaderProps {
  profile: ProfileView;
}

export type ThemeToggleProps = Record<string, never>;

/**
 * The contract every Emulsion theme must implement. A theme is a directory under
 * `src/themes/<name>/` exporting one of these as its default export from `index.ts` —
 * see THEMING.md. Core rendering code (routes) only ever talks to this interface,
 * so a theme never needs to touch anything outside its own directory.
 */
export interface Theme {
  name: string;
  Layout: Component<LayoutProps>;
  GalleryGrid: Component<GalleryGridProps>;
  GalleryCard: Component<GalleryCardProps>;
  GalleryPost: Component<GalleryPostProps>;
  TagBadge: Component<TagBadgeProps>;
  ExifPanel: Component<ExifPanelProps>;
  ProfileHeader: Component<ProfileHeaderProps>;
  ThemeToggle: Component<ThemeToggleProps>;
}
