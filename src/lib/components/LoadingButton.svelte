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

<style>
	/* Cross-fade transition for loading state */
	.loading-btn {
		position: relative;
		min-width: max-content;
	}

	.btn-text {
		display: inline-block;
		transition: opacity var(--duration-fast) var(--ease-out);
		opacity: 1;
	}

	.btn-spinner {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		transition: opacity var(--duration-fast) var(--ease-out);
		opacity: 0;
		pointer-events: none;
	}

	.loading-btn.loading .btn-text {
		opacity: 0;
	}

	.loading-btn.loading .btn-spinner {
		opacity: 1;
	}

	@media (prefers-reduced-motion: reduce) {
		.btn-text,
		.btn-spinner {
			transition-duration: var(--motion-duration);
			transition-timing-function: var(--motion-easing);
		}
	}
</style>

<button
	type={type}
	class="btn btn-{variant} btn-{size} loading-btn {loading ? 'loading' : ''} {className}"
	disabled={disabled || loading}
	aria-label={ariaLabel}
	aria-busy={loading}
	onclick={onclick}>
	<span class="btn-text">{@render children()}</span>
	<span class="btn-spinner" aria-hidden="true">
		<svg class="loading loading-spinner loading-sm"><circle /><circle /></svg>
	</span>
</button>
