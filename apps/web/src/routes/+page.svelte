<script lang="ts">
	import { page } from '$app/state';
	import { getTheme } from '$lib/theme/registry.js';
	import Seo from '$lib/Seo.svelte';
	import type { PageProps } from './$types.js';

	let { data }: PageProps = $props();
	const theme = $derived(getTheme(data.theme));
	const GalleryGrid = $derived(theme.GalleryGrid);
	const title = $derived(data.profile.displayName ?? 'Emulsion');
	const coverImage = $derived(data.galleries[0]?.photos[0]?.blobUrl ?? data.profile.avatarUrl);
</script>

<Seo {title} description={data.profile.description} image={coverImage} url={page.url.href} />

<GalleryGrid galleries={data.galleries} nextHref={data.nextHref} />
