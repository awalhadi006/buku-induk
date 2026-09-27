<script lang="ts">
	let { rows, max }: { rows: { label: string; value: number }[]; max: number } = $props();
</script>

<style>
	.bar-row {
		opacity: 1;
		transform: translateY(0);
		transition:
			opacity var(--duration-fast) var(--ease-out),
			transform var(--duration-fast) var(--ease-out);
		transition-delay: calc(var(--index) * var(--animate-stagger));
	}

	@starting-style {
		.bar-row {
			opacity: 0;
			transform: translateY(4px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.bar-row {
			transition-duration: 0.01ms !important;
			transition-delay: 0ms !important;
		}
	}

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
			transform: scaleX(0);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.bar-grow {
			transition-duration: 0.01ms !important;
		}
	}
</style>

{#each rows as r, i}
	<div class="bar-row flex items-center gap-3 py-1.5 relative" style="--index: {i};">
		<span class="w-32 truncate text-sm">{r.label}</span>
		<div class="h-3 flex-1 overflow-hidden rounded-full bg-base-200 relative" aria-hidden="true">
			<div
				class="bar-grow h-full rounded-full"
				style="
					width: {max > 0 ? Math.round((r.value / max) * 100) : 0}%;
					background: linear-gradient(to right, var(--color-primary), var(--color-accent));
				"
			></div>
			<span class="absolute right-0 top-0 -translate-y-full text-xs font-mono text-base-content/70" data-visual-test-mask>
				{r.value}
			</span>
			<span class="absolute left-3 top-1/2 -translate-y-full text-sm font-medium text-base-content/90">
				{r.label}
			</span>
		</div>
	</div>
{/each}

{#if rows.length === 0}
	<p class="text-sm text-base-content/50">Belum ada data.</p>
{/if}