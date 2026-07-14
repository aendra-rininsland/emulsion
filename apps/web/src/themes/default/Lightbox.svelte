<script lang="ts">
	import type { PhotoView } from '@emulsion/core';
	import ExifPanel from './ExifPanel.svelte';

	let {
		photo,
		title,
		hasMultiple,
		onclose,
		onnext,
		onprev
	}: {
		photo: PhotoView;
		title: string;
		hasMultiple: boolean;
		onclose: () => void;
		onnext: () => void;
		onprev: () => void;
	} = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
		else if (hasMultiple && e.key === 'ArrowRight') onnext();
		else if (hasMultiple && e.key === 'ArrowLeft') onprev();
	}

	function stop(e: MouseEvent) {
		e.stopPropagation();
	}

	// Focus the dialog on mount so its own onkeydown (not a separate window listener,
	// which would double-fire alongside this one) picks up Escape/arrow keys immediately.
	let dialogEl: HTMLDivElement | undefined = $state();
	$effect(() => {
		dialogEl?.focus();
	});
</script>

<div
	bind:this={dialogEl}
	tabindex="-1"
	class="fixed inset-0 z-50 flex items-center justify-center bg-black p-4 outline-none sm:p-8"
	role="dialog"
	aria-modal="true"
	aria-label={photo.alt ?? title}
	onclick={onclose}
	onkeydown={handleKeydown}
>
	<button
		type="button"
		onclick={onclose}
		aria-label="Close"
		class="absolute right-4 top-4 rounded-full p-2 text-white/70 transition hover:text-white"
	>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-6 w-6">
			<path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M18 6L6 18" />
		</svg>
	</button>

	{#if hasMultiple}
		<button
			type="button"
			onclick={(e) => {
				stop(e);
				onprev();
			}}
			aria-label="Previous photo"
			class="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/70 transition hover:text-white sm:left-4"
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-8 w-8">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6" />
			</svg>
		</button>
		<button
			type="button"
			onclick={(e) => {
				stop(e);
				onnext();
			}}
			aria-label="Next photo"
			class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/70 transition hover:text-white sm:right-4"
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-8 w-8">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 6l6 6-6 6" />
			</svg>
		</button>
	{/if}

	<div class="flex max-h-full max-w-full flex-col items-center gap-3" role="presentation" onclick={stop}>
		<img
			src={photo.blobUrl}
			alt={photo.alt ?? title}
			class="max-h-[80vh] max-w-full rounded object-contain"
		/>
		{#if photo.alt || photo.exif}
			<div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center">
				{#if photo.alt}
					<span class="text-sm text-white/80">{photo.alt}</span>
				{/if}
				{#if photo.exif}
					<!-- ExifPanel hardcodes text-ink-muted (theme-dependent), which can be
					     unreadable against this always-black backdrop regardless of site
					     light/dark mode — force it white here specifically. -->
					<div class="[&_dl]:text-white/70">
						<ExifPanel exif={photo.exif} />
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
