<script lang="ts">
	import type { GalleryGridProps } from '$lib/theme/types.js';
	import GalleryCard from './GalleryCard.svelte';

	let { galleries, heading }: GalleryGridProps = $props();
</script>

{#if heading}
	<h1 class="mb-8 text-2xl font-semibold text-ink">{heading}</h1>
{/if}

{#if galleries.length === 0}
	<p class="text-ink-muted">No galleries yet.</p>
{:else}
	<div class="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
		{#each galleries as gallery (gallery.uri)}
			<GalleryCard {gallery} />
		{/each}
	</div>
{/if}
