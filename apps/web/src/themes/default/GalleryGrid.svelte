<script lang="ts">
	import type { GalleryGridProps } from '$lib/theme/types.js';
	import GalleryCard from './GalleryCard.svelte';

	let { galleries, heading, nextHref }: GalleryGridProps = $props();
</script>

{#if heading}
	<h1 class="mb-8 text-2xl font-semibold text-ink">{heading}</h1>
{/if}

{#if galleries.length === 0}
	<div class="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-24 text-center">
		<p class="text-ink-muted">No galleries here yet.</p>
	</div>
{:else}
	<div class="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
		{#each galleries as gallery (gallery.uri)}
			<GalleryCard {gallery} />
		{/each}
	</div>

	{#if nextHref}
		<div class="mt-8 flex justify-center">
			<a
				href={nextHref}
				class="rounded-full border border-border px-5 py-2 text-sm text-ink-muted transition hover:border-ink hover:text-ink"
			>
				Load more
			</a>
		</div>
	{/if}
{/if}
