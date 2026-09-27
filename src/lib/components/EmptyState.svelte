<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import { IconInbox } from '@tabler/icons-svelte';

	interface Action {
		label: string;
		onclick: () => void;
		variant?: 'primary' | 'outline';
	}

	let {
		Icon = IconInbox,
		title,
		desc,
		action,
		children
	}: {
		Icon?: Component;
		title: string;
		desc?: string;
		action?: Action;
		children?: Snippet;
	} = $props();
</script>

<div class="card card-border bg-base-100 p-8 text-center empty-state animate-in" role="status">
	<div class="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
		<Icon class="size-8 text-primary" stroke-width={1.75} />
	</div>
	<h3 class="text-lg font-semibold text-base-content">{title}</h3>
	{#if desc}
		<p class="mt-2 text-base-content/70 mb-4">{desc}</p>
	{/if}
	{#if action}
		<button
			class="btn {action.variant === 'outline' ? 'btn-outline' : 'btn-primary'}"
			onclick={action.onclick}
			type="button">
			{action.label}
		</button>
	{:else if children}
		<div class="mt-4 flex flex-wrap justify-center gap-2">
			{@render children()}
		</div>
	{/if}
</div>