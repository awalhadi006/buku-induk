<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		desc,
		children
	}: { title: string; desc?: string; children?: Snippet } = $props();
</script>

<div class="card card-dash card-border bg-base-200/40 p-8 text-center empty-state animate-in" role="status">
	<h2 class="font-display text-base font-semibold">{title}</h2>
	{#if desc}
		<p class="mx-auto mt-1 max-w-[52ch] text-sm text-base-content/60">{desc}</p>
	{/if}
	{#if children}
		<div class="mt-5 flex flex-wrap justify-center gap-3">{@render children()}</div>
	{/if}
</div>
