import type { Theme } from "$lib/theme/types.js";
import ExifPanel from "./ExifPanel.svelte";
import GalleryCard from "./GalleryCard.svelte";
import GalleryGrid from "./GalleryGrid.svelte";
import GalleryPost from "./GalleryPost.svelte";
import Layout from "./Layout.svelte";
import ProfileHeader from "./ProfileHeader.svelte";
import TagBadge from "./TagBadge.svelte";
import ThemeToggle from "./ThemeToggle.svelte";

const theme: Theme = {
  name: "default",
  Layout,
  GalleryGrid,
  GalleryCard,
  GalleryPost,
  TagBadge,
  ExifPanel,
  ProfileHeader,
  ThemeToggle
};

export default theme;
