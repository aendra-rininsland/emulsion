<script lang="ts">
	function toggle() {
		const root = document.documentElement;
		const next = root.dataset.mode === 'dark' ? 'light' : 'dark';
		root.dataset.mode = next;
		localStorage.setItem('emulsion-theme-mode', next);
	}
</script>

<button
	type="button"
	onclick={toggle}
	aria-label="Toggle light and dark mode"
	class="rounded-full border border-border p-2 text-ink-muted transition hover:text-ink"
>
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-4 w-4 dark:hidden">
		<circle cx="12" cy="12" r="4" />
		<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
	</svg>
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="hidden h-4 w-4 dark:block">
		<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
	</svg>
</button>
