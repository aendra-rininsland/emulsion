<script lang="ts">
	import type { GalleryCardProps } from '$lib/theme/types.js';

	let { gallery }: GalleryCardProps = $props();
	const cover = $derived(gallery.photos[0]);
</script>

<a href="/gallery/{gallery.rkey}" class="group mb-4 block break-inside-avoid overflow-hidden rounded-lg bg-canvas-subtle">
	{#if cover}
		<img
			src={cover.blobUrl}
			alt={cover.alt ?? gallery.title}
			width={cover.aspectRatio.width}
			height={cover.aspectRatio.height}
			style="aspect-ratio: {cover.aspectRatio.width} / {cover.aspectRatio.height}"
			loading="lazy"
			class="w-full object-cover transition duration-300 group-hover:scale-[1.02]"
		/>
	{/if}
	<div class="px-1 py-3">
		<h2 class="text-base font-medium text-ink">{gallery.title}</h2>
		{#if gallery.hashtags.length > 0}
			<p class="mt-1 text-sm text-ink-muted">{gallery.hashtags.map((t) => `#${t}`).join(' ')}</p>
		{/if}
	</div>
</a>
