<script lang="ts">
	import { IconSparkles } from '@tabler/icons-svelte';
	import { changelog } from '$lib/changelog';
</script>

<svelte:head>
	<title>Apa yang Baru | Buku Induk</title>
</svelte:head>

<header class="flex items-center gap-3">
	<span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
		<IconSparkles class="size-5" stroke-width={1.75} />
	</span>
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Apa yang Baru?</h1>
		<p class="mt-0.5 text-base-content/70">
			Catatan pembaruan dan fitur-fitur baru di aplikasi Buku Induk Santri.
		</p>
	</div>
</header>

<div class="mt-8 space-y-6">
	{#each changelog as commit (commit.short)}
		<article class="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
			<div class="flex items-center justify-between border-b border-base-200 pb-3">
				<h2 class="text-lg font-semibold text-primary">{commit.label}</h2>
				<span class="badge badge-outline badge-sm">{commit.date}</span>
			</div>
			<p class="mt-4 text-sm text-base-content/80">Pembaruan terkait: {commit.subject}</p>
		</article>
	{/each}
</div>
