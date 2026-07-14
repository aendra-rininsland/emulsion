<script lang="ts">
	import type { GalleryPostProps } from '$lib/theme/types.js';
	import ExifPanel from './ExifPanel.svelte';
	import Lightbox from './Lightbox.svelte';
	import TagBadge from './TagBadge.svelte';

	let { gallery }: GalleryPostProps = $props();

	const dateLabel = $derived(
		new Date(gallery.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
	);

	let lightboxIndex: number | null = $state(null);
	const hasMultiple = $derived(gallery.photos.length > 1);

	function openLightbox(index: number) {
		lightboxIndex = index;
	}
	function closeLightbox() {
		lightboxIndex = null;
	}
	function nextPhoto() {
		if (lightboxIndex !== null) lightboxIndex = (lightboxIndex + 1) % gallery.photos.length;
	}
	function prevPhoto() {
		if (lightboxIndex !== null) lightboxIndex = (lightboxIndex - 1 + gallery.photos.length) % gallery.photos.length;
	}
</script>

<article class="mx-auto max-w-3xl">
	<header class="mb-10">
		<h1 class="text-3xl font-semibold text-ink">{gallery.title}</h1>
		<p class="mt-2 text-sm text-ink-muted">{dateLabel}</p>

		{#if gallery.segments.length > 0}
			<p class="mt-4 whitespace-pre-wrap text-ink">
				{#each gallery.segments as segment, i (i)}
					{#if segment.type === 'tag'}<a href="/tag/{encodeURIComponent(segment.tag)}" class="text-accent underline decoration-border underline-offset-4 hover:decoration-ink">{segment.text}</a
						>{:else if segment.type === 'link'}<a href={segment.uri} class="text-accent underline decoration-border underline-offset-4 hover:decoration-ink" rel="noopener noreferrer" target="_blank">{segment.text}</a
						>{:else}{segment.text}{/if}
				{/each}
			</p>
		{/if}

		{#if gallery.hashtags.length > 0}
			<div class="mt-4 flex flex-wrap gap-2">
				{#each gallery.hashtags as tag (tag)}
					<TagBadge {tag} />
				{/each}
			</div>
		{/if}
	</header>

	{#if gallery.photos.length === 0}
		<div class="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-24 text-center">
			<p class="text-ink-muted">This gallery doesn't have any photos yet.</p>
		</div>
	{:else}
		<div class="flex flex-col gap-12">
			{#each gallery.photos as photo, index (photo.uri)}
				<figure>
					<button
						type="button"
						onclick={() => openLightbox(index)}
						aria-label="View {photo.alt ?? gallery.title} full size"
						class="block w-full cursor-zoom-in"
					>
						<img
							src={photo.blobUrl}
							alt={photo.alt ?? gallery.title}
							width={photo.aspectRatio.width}
							height={photo.aspectRatio.height}
							style="aspect-ratio: {photo.aspectRatio.width} / {photo.aspectRatio.height}"
							loading="lazy"
							class="w-full rounded-lg object-cover"
						/>
					</button>
					<figcaption class="mt-3 flex flex-wrap items-center justify-between gap-2">
						{#if photo.alt}
							<span class="text-sm text-ink-muted">{photo.alt}</span>
						{:else}
							<span></span>
						{/if}
						{#if photo.exif}
							<ExifPanel exif={photo.exif} />
						{/if}
					</figcaption>
				</figure>
			{/each}
		</div>
	{/if}

	{#if lightboxIndex !== null}
		{@const currentPhoto = gallery.photos[lightboxIndex]}
		{#if currentPhoto}
			<Lightbox
				photo={currentPhoto}
				title={gallery.title}
				{hasMultiple}
				onclose={closeLightbox}
				onnext={nextPhoto}
				onprev={prevPhoto}
			/>
		{/if}
	{/if}
</article>
