<script lang="ts">
	import type { Snippet } from 'svelte';

	interface BreadcrumbItem {
		label: string;
		href?: string;
	}

	let {
		title,
		desc,
		backHref,
		actions,
		breadcrumb
	}: {
		title: string;
		desc?: string;
		backHref?: string;
		actions?: Snippet;
		breadcrumb?: BreadcrumbItem[];
	} = $props();

	// Map backHref to breadcrumb for backward compatibility
	const breadcrumbItems = $derived(
		backHref && !breadcrumb
			? [{ label: 'Kembali', href: backHref }]
			: (breadcrumb ?? [])
	);
</script>

<header class="mb-6">
	{#if breadcrumbItems.length > 0}
		<nav class="flex items-center gap-1 text-sm text-base-content/60 mb-2" aria-label="Breadcrumb">
			<ol class="flex items-center gap-1">
				{#each breadcrumbItems as item, i (item.label)}
					<li class="flex items-center gap-1">
						{#if i > 0}
							<div class="divider divider-horizontal"></div>
						{/if}
						{#if item.href}
							<a href={item.href} class="hover:text-base-content transition-colors">{item.label}</a>
						{:else}
							<span aria-current="page">{item.label}</span>
						{/if}
					</li>
				{/each}
			</ol>
		</nav>
	{/if}

	<div class="flex items-start justify-between gap-4">
		<div class="min-w-0">
			<h1 class="text-2xl font-semibold text-base-content">{title}</h1>
			{#if desc}
				<p class="mt-1 max-w-[65ch] text-base-content/70">{desc}</p>
			{/if}
		</div>
		{#if actions}
			<div class="flex flex-wrap items-center gap-3 shrink-0">
				{@render actions()}
			</div>
		{/if}
	</div>
</header>