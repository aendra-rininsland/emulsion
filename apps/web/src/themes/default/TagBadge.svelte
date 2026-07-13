<script lang="ts">
	import type { TagBadgeProps } from '$lib/theme/types.js';

	let { tag }: TagBadgeProps = $props();
</script>

<a
	href="/tag/{encodeURIComponent(tag)}"
	class="inline-flex items-center rounded-full border border-border px-3 py-1 text-sm text-ink-muted transition hover:border-ink hover:text-ink"
>
	#{tag}
</a>
