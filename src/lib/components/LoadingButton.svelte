<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	type Variant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'ghost';
	type Size = 'xs' | 'sm' | 'md' | 'lg';

	let {
		children,
		loading = false,
		variant = 'primary',
		size = 'md',
		disabled = false,
		type = 'submit',
		ariaLabel,
		class: className = '',
		onclick,
		onClick
	}: {
		children: import('svelte').Snippet;
		loading?: boolean;
		variant?: Variant;
		size?: Size;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		ariaLabel?: string;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		onClick?: (event: MouseEvent) => void;
	} = $props();

	const dispatch = createEventDispatcher<{
		click: MouseEvent;
	}>();

	const handler = onclick ?? onClick;

	function handleClick(event: MouseEvent) {
		if (!disabled && !loading) {
			handler?.(event);
			dispatch('click', event);
		}
	}
</script>

<button
	type={type}
	class="btn btn-{variant} btn-{size} {className}"
	disabled={disabled || loading}
	aria-label={ariaLabel}
	aria-busy={loading}
	onclick={handleClick}>
	{#if loading}
		<svg class="loading loading-spinner loading-sm" aria-hidden="true"><circle /><circle /></svg>
	{:else}
		{@render children()}
	{/if}
</button>