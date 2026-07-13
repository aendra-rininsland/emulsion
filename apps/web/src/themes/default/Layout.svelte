<script lang="ts">
	import type { LayoutProps } from '$lib/theme/types.js';
	import ProfileHeader from './ProfileHeader.svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	let { profile, children }: LayoutProps = $props();
</script>

<div class="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 sm:px-8">
	<header class="mb-10 flex items-center justify-between">
		<ProfileHeader {profile} />
		<ThemeToggle />
	</header>

	<main class="flex-1">
		{@render children?.()}
	</main>

	<footer class="mt-16 border-t border-border pt-6 text-sm text-ink-muted">
		<p>Built with <a href="https://github.com" class="underline decoration-border hover:decoration-ink">Emulsion</a>, from Grain.social posts.</p>
	</footer>
</div>
