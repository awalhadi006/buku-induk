<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	type Tab = {
		value: string;
		label: string;
		icon?: import('svelte').Snippet;
		content?: import('svelte').Snippet;
		disabled?: boolean;
	};

	let {
		tabs,
		value,
		param = 'tab',
		variant = 'lifted',
		onChange
	}: {
		tabs: Tab[];
		value: string;
		param?: string;
		variant?: 'lifted' | 'boxed' | 'bordered';
		onChange?: (value: string) => void;
	} = $props();

	let activeTab = $state(value);

	// Sync with URL on mount and when value prop changes
	$effect(() => {
		activeTab = value;
	});

	function handleTabClick(tabValue: string) {
		if (activeTab === tabValue) return;
		activeTab = tabValue;
		onChange?.(tabValue);
		const url = new URL(page.url);
		url.searchParams.set(param, tabValue);
		goto(url.toString(), { replaceState: true });
	}

	const variantClasses: Record<string, string> = {
		lifted: 'tabs-lift',
		boxed: 'tabs-boxed',
		bordered: 'tabs-bordered'
	};
</script>

<div class="tabs {variantClasses[variant]}" role="tablist" aria-label="Tab panel">
	<ul class="flex gap-1" role="presentation">
		{#each tabs as tab (tab.value)}
			<li role="presentation">
				<button
					class="tab {activeTab === tab.value ? 'tab-active' : ''} {tab.disabled ? 'opacity-50 pointer-events-none' : ''}"
					role="tab"
					aria-selected={activeTab === tab.value}
					aria-controls={`panel-${tab.value}`}
					id={`tab-${tab.value}`}
					disabled={tab.disabled}
					onclick={() => handleTabClick(tab.value)}>
					{#if tab.icon}
						{@render tab.icon()}
					{/if}
					{tab.label}
				</button>
			</li>
		{/each}
	</ul>
</div>

<div class="mt-4" role="tabpanel">
	{#each tabs as tab (tab.value)}
		{#if activeTab === tab.value}
			<div
				id={`panel-${tab.value}`}
				role="tabpanel"
				aria-labelledby={`tab-${tab.value}`}
				class="animate-fade-in">
				{@render tab.content?.()}
			</div>
		{/if}
	{/each}
</div>

<style>
	@keyframes fade-in {
		from { opacity: 0; transform: translateY(4px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.animate-fade-in {
		animation: fade-in 150ms ease-out;
	}
</style>