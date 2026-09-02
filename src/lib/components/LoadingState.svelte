<script lang="ts">
	import Skeleton from '$lib/components/Skeleton.svelte';

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
		<div role="status" aria-busy="true">
			<Skeleton {...skeletonConfig} />
		</div>
	{/if}
{/if}