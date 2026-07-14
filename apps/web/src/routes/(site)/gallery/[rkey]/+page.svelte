<script lang="ts">
	import { page } from '$app/state';
	import { getTheme } from '$lib/theme/registry.js';
	import Seo from '$lib/Seo.svelte';
	import type { PageProps } from './$types.js';

	let { data }: PageProps = $props();
	const theme = $derived(getTheme(data.theme));
	const GalleryPost = $derived(theme.GalleryPost);
	const title = $derived(`${data.gallery.title} — ${data.profile.displayName ?? 'Emulsion'}`);
</script>

<Seo
	{title}
	description={data.gallery.description}
	image={data.gallery.photos[0]?.blobUrl}
	url={page.url.href}
	type="article"
/>

<GalleryPost gallery={data.gallery} />
