<script lang="ts">
	import { buildSeoMeta, type SeoInput } from './seo.js';

	let props: SeoInput = $props();
	const tags = $derived(buildSeoMeta(props));
</script>

<svelte:head>
	<title>{props.title}</title>
	{#each tags as tag (('property' in tag ? tag.property : tag.name) + tag.content)}
		{#if 'property' in tag}
			<meta property={tag.property} content={tag.content} />
		{:else}
			<meta name={tag.name} content={tag.content} />
		{/if}
	{/each}
</svelte:head>
