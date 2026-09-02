<script lang="ts">
	let {
		open = false,
		duration = 250,
		children
	}: {
		open?: boolean;
		duration?: number;
		children: import('svelte').Snippet;
	} = $props();

	function slideDown(node: HTMLElement, { duration: d = 250 } = {}) {
		const height = node.scrollHeight;
		return {
			duration: d,
			easing: (t: number) => 1 - Math.pow(1 - t, 3),
			css: (t: number) => `
				max-height: ${t * height}px;
				opacity: ${t};
				overflow: hidden;
			`
		};
	}

	function slideUp(node: HTMLElement, { duration: d = 250 } = {}) {
		const height = node.scrollHeight;
		return {
			duration: d,
			easing: (t: number) => 1 - Math.pow(1 - t, 3),
			css: (t: number) => `
				max-height: ${(1 - t) * height}px;
				opacity: ${1 - t};
				overflow: hidden;
			`
		};
	}
</script>

{#if open}
	<div transition:slideDown|slideUp={{ duration }}>{@render children()}</div>
{/if}