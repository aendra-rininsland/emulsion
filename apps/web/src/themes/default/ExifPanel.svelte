<script lang="ts">
	import type { ExifPanelProps } from '$lib/theme/types.js';
	import { formatAperture, formatExposureTime, formatFocalLength, formatIso } from '$lib/format.js';

	let { exif }: ExifPanelProps = $props();

	const camera = $derived([exif.make, exif.model].filter(Boolean).join(' '));
	const lens = $derived([exif.lensMake, exif.lensModel].filter(Boolean).join(' '));

	const stats = $derived(
		[
			formatFocalLength(exif.focalLengthIn35mmFormat),
			formatAperture(exif.fNumber),
			formatExposureTime(exif.exposureTime),
			formatIso(exif.iso)
		].filter(Boolean)
	);
</script>

{#if camera || lens || stats.length > 0}
	<dl class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
		{#if camera}
			<div>{camera}</div>
		{/if}
		{#if lens}
			<div>{lens}</div>
		{/if}
		{#each stats as stat (stat)}
			<div>{stat}</div>
		{/each}
	</dl>
{/if}
