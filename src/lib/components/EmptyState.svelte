<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		desc,
		children
	}: { title: string; desc?: string; children?: Snippet } = $props();
</script>

<div class="rounded-lg border border-dashed border-base-300 bg-base-200/40 px-6 py-12 text-center">
	<h2 class="font-display text-base font-semibold">{title}</h2>
	{#if desc}
		<p class="mx-auto mt-1 max-w-[52ch] text-sm text-base-content/60">{desc}</p>
	{/if}
	{#if children}
		<div class="mt-5 flex flex-wrap justify-center gap-3">{@render children()}</div>
	{/if}
</div>
