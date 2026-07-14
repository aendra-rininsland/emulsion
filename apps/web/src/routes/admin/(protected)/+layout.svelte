<script lang="ts">
	import '../../../app.css';

	let { children }: { children: import('svelte').Snippet } = $props();
</script>

<div class="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-8">
	<header class="mb-8 flex items-center justify-between border-b border-border pb-4">
		<h1 class="text-lg font-semibold text-ink">Emulsion Admin</h1>
		<div class="flex items-center gap-4 text-sm">
			<a href="/" class="text-ink-muted underline decoration-border hover:decoration-ink">View site</a>
			<form method="POST" action="/admin/logout">
				<button type="submit" class="text-ink-muted underline decoration-border hover:decoration-ink"> Sign out </button>
			</form>
		</div>
	</header>

	{@render children()}
</div>
