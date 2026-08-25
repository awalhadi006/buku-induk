<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		desc,
		backHref,
		actions
	}: { title: string; desc?: string; backHref?: string; actions?: Snippet } = $props();
</script>

<header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
	<div class="flex min-w-0 items-start gap-2">
		{#if backHref}
			<a class="btn btn-ghost btn-square btn-sm mt-0.5 shrink-0" href={backHref} aria-label="Kembali">
				&larr;
			</a>
		{/if}
		<div class="min-w-0">
			<h1 class="text-2xl leading-tight font-semibold tracking-tight">{title}</h1>
			{#if desc}
				<p class="mt-1 max-w-[65ch] text-sm text-base-content/70">{desc}</p>
			{/if}
		</div>
	</div>
	{#if actions}
		<div class="flex flex-wrap items-center gap-3 sm:justify-end">
			{@render actions()}
		</div>
	{/if}
</header>
