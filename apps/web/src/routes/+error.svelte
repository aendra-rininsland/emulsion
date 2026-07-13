<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
</script>

<div class="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center">
	<p class="text-sm font-medium text-ink-muted">{page.status}</p>
	<h1 class="text-2xl font-semibold text-ink">
		{page.status === 404 ? 'Not found' : 'Something went wrong'}
	</h1>
	<p class="text-ink-muted">{page.error?.message ?? 'An unexpected error occurred.'}</p>
	<a href="/" class="mt-4 rounded-full border border-border px-5 py-2 text-sm text-ink-muted transition hover:border-ink hover:text-ink">
		Back home
	</a>
</div>
