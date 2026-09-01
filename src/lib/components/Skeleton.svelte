<script lang="ts">
	type Variant = 'text' | 'card' | 'table' | 'stat' | 'avatar' | 'list';

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

	function getSkeletonClass() {
		const base = 'skeleton skeleton-wave';
		const variantClasses: Record<Variant, string> = {
			text: 'h-4 w-full',
			card: 'h-32 w-full rounded-lg',
			table: 'h-10 w-full',
			stat: 'h-16 w-full rounded-lg',
			avatar: 'h-12 w-12 rounded-full',
			list: 'h-16 w-full rounded-lg'
		};
		return `${base} ${variantClasses[variant]} ${className}`;
	}

	function getContainerClass() {
		const base = 'space-y-3';
		return `${base} ${className}`;
	}
</script>

<div
	role="status"
	aria-busy="true"
	aria-live="polite"
	aria-label={ariaLabel}
	class={getContainerClass()}>
	{#each Array(count) as _, i (i)}
		{#if variant === 'text'}
			<div class="space-y-2">
				{#each Array(rows) as _, r (r)}
					<div class={getSkeletonClass()} />
				{/each}
			</div>
		{:else if variant === 'table'}
			<div class="space-y-2">
				{#each Array(rows) as _, r (r)}
					<div class="grid gap-4" style="grid-template-columns: repeat({cols}, 1fr);">
						{#each Array(cols) as _, c (c)}
							<div class={getSkeletonClass()} />
						{/each}
					</div>
				{/each}
			</div>
		{:else}
			<div class={getSkeletonClass()} />
		{/if}
	{/each}
</div>