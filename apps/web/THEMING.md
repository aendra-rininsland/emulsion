# Building an Emulsion theme

A theme is a self-contained directory under `src/themes/<name>/` that exports a
`Theme` object as its `index.ts` default export. Nothing outside your theme's own
directory needs to change — routes, data loading, and every other theme are
untouched. This is what "no hacking core" means in practice.

## The contract

`src/lib/theme/types.ts` defines the `Theme` interface every theme must satisfy:

```ts
export interface Theme {
  name: string;
  Layout: Component<LayoutProps>;         // page chrome: header, footer, <slot>
  GalleryGrid: Component<GalleryGridProps>;  // masonry-style listing (front page, tag index)
  GalleryCard: Component<GalleryCardProps>;  // one gallery's entry within GalleryGrid
  GalleryPost: Component<GalleryPostProps>;  // single gallery/post detail page
  TagBadge: Component<TagBadgeProps>;        // a clickable hashtag pill
  ExifPanel: Component<ExifPanelProps>;      // camera/lens/exposure display for a photo
  ProfileHeader: Component<ProfileHeaderProps>; // avatar + display name + bio
  ThemeToggle: Component<ThemeToggleProps>;  // light/dark switch
}
```

Every prop type (`LayoutProps`, `GalleryGridProps`, etc.) is defined in the same file
and built on the view types exported by `@emulsion/core` (`GalleryView`, `PhotoView`,
`PhotoExifView`, `ProfileView`) — the same objects the routes load from your PDS.

## Creating a theme

1. Copy `src/themes/default/` to `src/themes/<your-theme-name>/`.
2. Edit the `.svelte` files freely — anything goes as long as each component accepts
   the props declared in `types.ts` for its slot.
3. Set `EMULSION_THEME=<your-theme-name>` in `.dev.vars` (locally) or as a Worker
   variable (in production).

Themes are discovered automatically via `import.meta.glob('/src/themes/*/index.ts')`
in `src/lib/theme/registry.ts` — no registration step, no editing a themes list. If
`EMULSION_THEME` doesn't match an installed theme, Emulsion falls back to `default`.

## What you get for free

- All data fetching, caching, and PDS/DID resolution happens before your theme ever
  renders — themes are pure presentation.
- Richtext segments (`GalleryView.segments`) are pre-split into `text`/`tag`/`link`/
  `mention` pieces with byte offsets already resolved, so you can render inline
  hashtags/links without touching facet math.
- EXIF values (`PhotoView.exif`) are already unscaled from Grain's `*1_000_000`
  integer encoding into real numbers — format them however your theme wants
  (`$lib/format.ts` in the default theme has aperture/exposure/focal-length/ISO
  formatters you're welcome to reuse or fork).
