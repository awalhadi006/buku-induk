<script lang="ts">
	let { rows, max }: { rows: { label: string; value: number }[]; max: number } = $props();
</script>

<style>
	.bar-grow {
		transform-origin: left center;
		transform: scaleX(1);
		transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1);
	}

	@starting-style {
		.bar-grow {
			transform: scaleX(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.bar-grow {
			transition: none;
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