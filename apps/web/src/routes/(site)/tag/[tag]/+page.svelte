<script lang="ts">
	import { page } from '$app/state';
	import { getTheme } from '$lib/theme/registry.js';
	import Seo from '$lib/Seo.svelte';
	import type { PageProps } from './$types.js';

	let { data }: PageProps = $props();
	const theme = $derived(getTheme(data.theme));
	const GalleryGrid = $derived(theme.GalleryGrid);
	const title = $derived(`#${data.tag} — ${data.profile.displayName ?? 'Emulsion'}`);
	const coverImage = $derived(data.galleries[0]?.photos[0]?.blobUrl);
</script>

<Seo
	{title}
	description="Galleries tagged #{data.tag} by {data.profile.displayName ?? data.did}."
	image={coverImage}
	url={page.url.href}
/>

<GalleryGrid galleries={data.galleries} heading="#{data.tag}" nextHref={data.nextHref} />
