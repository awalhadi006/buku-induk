<script lang="ts">
	let { rows, max }: { rows: { label: string; value: number }[]; max: number } = $props();
</script>

<style>
	.bar-grow {
		transform-origin: left center;
		transform: scaleX(1);
		opacity: 1;
		transition:
			transform var(--duration-panel) var(--ease-out),
			opacity var(--duration-panel) var(--ease-out);
	}

	@starting-style {
		.bar-grow {
			transform: scaleX(0.95);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.bar-grow {
			transition-duration: 0.01ms !important;
		}
	}
</style>

{#each rows as r}
	<div class="flex items-center gap-3 py-1.5">
		<span class="w-32 truncate text-sm">{r.label}</span>
		<div class="h-2 flex-1 overflow-hidden rounded-full bg-base-200" aria-hidden="true">
			<div
				class="bar-grow h-full rounded-full bg-primary"
				style="width:{max > 0 ? Math.round((r.value / max) * 100) : 0}%"></div>
		</div>
		<span class="w-10 text-right font-mono text-sm">{r.value}</span>
	</div>
{/each}

{#if rows.length === 0}
	<p class="text-sm text-base-content/50">Belum ada data.</p>
{/if}