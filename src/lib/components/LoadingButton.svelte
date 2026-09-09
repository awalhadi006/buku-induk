<script lang="ts">
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
		onclick
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
	} = $props();
</script>

<button
	type={type}
	class="btn btn-{variant} btn-{size} {className}"
	disabled={disabled}
	aria-label={ariaLabel}
	aria-busy={loading}
	onclick={onclick}>
	{#if loading}
		<svg class="loading loading-spinner loading-sm" aria-hidden="true"><circle /><circle /></svg>
	{:else}
		{@render children()}
	{/if}
</button>
