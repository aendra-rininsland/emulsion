<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types.js';

	let { data }: PageProps = $props();
	const featured = $derived(new Set(data.settings.featured));
</script>

<svelte:head>
	<title>Emulsion Admin</title>
</svelte:head>

<section class="mb-8 rounded-lg border border-border p-4">
	<h2 class="mb-3 text-sm font-medium text-ink">Visibility</h2>
	<form method="POST" action="?/setMode" use:enhance class="flex flex-col gap-2 text-sm">
		<label class="flex items-center gap-2">
			<input type="radio" name="mode" value="all" checked={data.settings.mode === 'all'} onchange={(e) => e.currentTarget.form?.requestSubmit()} />
			Show everything (default) — every gallery from Grain is public
		</label>
		<label class="flex items-center gap-2">
			<input
				type="radio"
				name="mode"
				value="featured"
				checked={data.settings.mode === 'featured'}
				onchange={(e) => e.currentTarget.form?.requestSubmit()}
			/>
			Show only featured — pick which galleries below are public
		</label>
	</form>
</section>

<section>
	<h2 class="mb-3 text-sm font-medium text-ink">Galleries ({data.galleries.length})</h2>
	{#if data.galleries.length === 0}
		<p class="text-sm text-ink-muted">No galleries found yet.</p>
	{:else}
		<ul class="flex flex-col divide-y divide-border">
			{#each data.galleries as gallery (gallery.uri)}
				{@const isFeatured = featured.has(gallery.uri)}
				<li class="flex items-center gap-4 py-3">
					{#if gallery.photos[0]}
						<img
							src={gallery.photos[0].blobUrl}
							alt=""
							class="h-14 w-14 flex-none rounded object-cover"
							width="56"
							height="56"
						/>
					{:else}
						<div class="h-14 w-14 flex-none rounded bg-canvas-subtle"></div>
					{/if}
					<div class="flex-1 text-sm">
						<div class="font-medium text-ink">{gallery.title}</div>
						<div class="text-ink-muted">{gallery.photos.length} photo{gallery.photos.length === 1 ? '' : 's'}</div>
					</div>
					<form method="POST" action="?/toggleFeatured" use:enhance>
						<input type="hidden" name="galleryUri" value={gallery.uri} />
						<button
							type="submit"
							class="rounded-full border px-4 py-1.5 text-sm transition {isFeatured
								? 'border-ink bg-ink text-canvas'
								: 'border-border text-ink-muted hover:border-ink hover:text-ink'}"
						>
							{isFeatured ? 'Featured' : 'Feature'}
						</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
</section>
