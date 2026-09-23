<script lang="ts">
	type SkeletonConfig =
		| { variant: 'text'; rows?: number; cols?: number; count?: number }
		| { variant: 'card'; count?: number }
		| { variant: 'table'; rows?: number; cols?: number }
		| { variant: 'stat'; count?: number };

	let {
		data,
		skeleton: skeletonConfig,
		empty,
		children
	}: {
		data: Promise<unknown> | unknown;
		skeleton?: SkeletonConfig;
		empty?: import('svelte').Snippet<[]>;
		children: import('svelte').Snippet<[unknown]>;
	} = $props();
</script>

{#await data}
	{:then result}
		{#if result === null || result === undefined || (Array.isArray(result) && result.length === 0)}
			{#if empty}
				{@render empty()}
			{/if}
		{:else}
			{@render children(result)}
		{/if}
	{:catch error}
		<div class="alert alert-error" role="alert">
			<span>Gagal memuat: {error?.message ?? 'Error tidak diketahui'}</span>
		</div>
{/await}

{#if data instanceof Promise}
	{#if skeletonConfig}
		<div role="status" aria-busy="true" class="space-y-3">
			{#if skeletonConfig.variant === 'text'}
				{#each Array(skeletonConfig.count ?? 1) as _, i (i)}
					<div class="space-y-2">
						{#each Array(skeletonConfig.rows ?? 1) as _, r (r)}
							<div class="skeleton skeleton-text h-4 w-full"></div>
						{/each}
					</div>
				{/each}
			{:else if skeletonConfig.variant === 'card'}
				{#each Array(skeletonConfig.count ?? 1) as _, i (i)}
					<div class="skeleton h-32 w-full rounded-lg"></div>
				{/each}
			{:else if skeletonConfig.variant === 'table'}
				{#each Array(skeletonConfig.rows ?? 1) as _, r (r)}
					<div class="grid gap-4" style="grid-template-columns: repeat({skeletonConfig.cols ?? 3}, 1fr);">
						{#each Array(skeletonConfig.cols ?? 3) as _, c (c)}
							<div class="skeleton h-10 w-full"></div>
						{/each}
					</div>
				{/each}
			{:else if skeletonConfig.variant === 'stat'}
				{#each Array(skeletonConfig.count ?? 1) as _, i (i)}
					<div class="skeleton h-16 w-full rounded-lg"></div>
				{/each}
			{/if}
		</div>
	{/if}
{/if}