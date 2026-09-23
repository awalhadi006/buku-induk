<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		desc,
		backHref,
		actions
	}: { title: string; desc?: string; backHref?: string; actions?: Snippet } = $props();
</script>

<div class="card card-border sm:card-side">
	<div class="card-body">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex min-w-0 items-start gap-2">
				{#if backHref}
					<a class="btn btn-ghost btn-square btn-sm shrink-0" href={backHref} aria-label="Kembali">
						<svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
						</svg>
					</a>
				{/if}
				<div class="min-w-0">
					<h1 class="text-2xl leading-tight font-semibold tracking-tight">{title}</h1>
					{#if desc}
						<p class="mt-1 max-w-[65ch] text-sm text-base-content/70">{desc}</p>
					{/if}
				</div>
			</div>
			{#if actions}
				<div class="flex flex-wrap items-center gap-3 sm:justify-end">
					{@render actions()}
				</div>
			{/if}
		</div>
	</div>
</div>
