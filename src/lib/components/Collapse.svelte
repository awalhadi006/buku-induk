<script lang="ts">
	let {
		open = $bindable(false),
		duration = 250,
		children
	}: {
		open?: boolean;
		duration?: number;
		children: import('svelte').Snippet;
	} = $props();
</script>

<div class="collapse collapse-arrow">
	<input type="checkbox" bind:checked={open} />
	<div class="collapse-content">{@render children()}</div>
</div>