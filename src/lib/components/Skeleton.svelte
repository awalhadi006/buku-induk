<script lang="ts">
	type Variant = 'text' | 'card' | 'table' | 'stat';

	let {
		variant = 'text',
		rows = 1,
		cols = 3,
		count = 1,
		class: className = '',
		ariaLabel = 'Memuat konten...'
	}: {
		variant?: Variant;
		rows?: number;
		cols?: number;
		count?: number;
		class?: string;
		ariaLabel?: string;
	} = $props();
</script>

<div
	role="status"
	aria-busy="true"
	aria-label={ariaLabel}
	class="space-y-3 {className}">
	{#each Array(count) as _, i (i)}
		{#if variant === 'text'}
			<div class="space-y-2">
				{#each Array(rows) as _, r (r)}
					<div class="skeleton skeleton-text h-4 w-full"></div>
				{/each}
			</div>
		{:else if variant === 'card'}
			<div class="skeleton h-32 w-full rounded-lg"></div>
		{:else if variant === 'table'}
			<div class="space-y-2">
				{#each Array(rows) as _, r (r)}
					<div class="grid gap-4" style="grid-template-columns: repeat({cols}, 1fr);">
						{#each Array(cols) as _, c (c)}
							<div class="skeleton h-10 w-full"></div>
						{/each}
					</div>
				{/each}
			</div>
		{:else if variant === 'stat'}
			<div class="skeleton h-16 w-full rounded-lg"></div>
		{/if}
	{/each}
</div>