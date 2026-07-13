<script lang="ts">
	import { getTheme } from '$lib/theme/registry.js';
	import type { PageProps } from './$types.js';

	let { data }: PageProps = $props();
	const theme = $derived(getTheme(data.theme));
	const GalleryGrid = $derived(theme.GalleryGrid);
</script>

<svelte:head>
	<title>#{data.tag} — {data.profile.displayName ?? 'Emulsion'}</title>
</svelte:head>

<GalleryGrid galleries={data.galleries} heading="#{data.tag}" />
