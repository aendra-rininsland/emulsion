<script lang="ts">
	import { getTheme } from '$lib/theme/registry.js';
	import type { PageProps } from './$types.js';

	let { data }: PageProps = $props();
	const theme = $derived(getTheme(data.theme));
	const GalleryPost = $derived(theme.GalleryPost);
</script>

<svelte:head>
	<title>{data.gallery.title} — {data.profile.displayName ?? 'Emulsion'}</title>
</svelte:head>

<GalleryPost gallery={data.gallery} />
