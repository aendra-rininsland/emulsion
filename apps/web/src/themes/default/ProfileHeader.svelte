<script lang="ts">
	import type { ProfileHeaderProps } from '$lib/theme/types.js';

	let { profile }: ProfileHeaderProps = $props();
</script>

<div class="flex items-center gap-3">
	{#if profile.avatarUrl}
		<img src={profile.avatarUrl} alt={profile.displayName ?? profile.did} class="h-9 w-9 rounded-full object-cover" />
	{/if}
	<div>
		<a href="/" class="font-medium text-ink">{profile.displayName ?? profile.did}</a>
		{#if profile.description}
			<p class="text-sm text-ink-muted">{profile.description}</p>
		{/if}
	</div>
</div>
