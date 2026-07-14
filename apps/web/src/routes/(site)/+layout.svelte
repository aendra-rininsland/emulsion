<script lang="ts">
	import '../../app.css';
	import { getTheme } from '$lib/theme/registry.js';
	import type { LayoutProps } from './$types.js';

	let { data, children }: LayoutProps = $props();
	const theme = $derived(getTheme(data.theme));
	const Layout = $derived(theme.Layout);
</script>

<Layout profile={data.profile}>
	{@render children()}
</Layout>
