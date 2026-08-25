<script lang="ts">
	import { IconSparkles } from '@tabler/icons-svelte';

	type Commit = { short: string; date: string; subject: string; label: string };
	let { data } = $props();
	const commits = $derived(data.commits as Commit[]);
	const commitsError = $derived(Boolean(data.commitsError));
</script>

<svelte:head>
	<title>Apa yang Baru | Buku Induk</title>
</svelte:head>

<header class="sticky top-16 lg:top-0 z-10 flex items-center gap-3 bg-base-100/95 backdrop-blur pb-4 pt-4 border-b border-base-200">
	<span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
		<IconSparkles class="size-5" stroke-width={1.75} />
	</span>
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Apa yang Baru?</h1>
		<p class="mt-0.5 text-base-content/70">
			Catatan pembaruan dan fitur-fitur baru di aplikasi Buku Induk Santri (diambil otomatis dari riwayat commit).
		</p>
	</div>
</header>

<div class="mt-4 space-y-6">
	{#if commits.length === 0}
		<div class="rounded-lg border border-dashed border-base-300 bg-base-200/40 p-10 text-center">
			<p class="text-sm text-base-content/60">
				{commitsError
					? 'Catatan pembaruan sementara tidak dapat dimuat dari GitHub. Coba muat ulang halaman nanti.'
					: 'Belum ada catatan pembaruan yang bisa dimuat.'}
			</p>
		</div>
	{:else}
		{#each commits as commit (commit.short)}
			<article class="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
				<div class="flex items-center justify-between border-b border-base-200 pb-3">
					<h2 class="text-lg font-semibold text-primary">{commit.label}</h2>
					<span class="badge badge-outline badge-sm">{commit.date}</span>
				</div>
				<p class="mt-3 text-xs font-mono text-base-content/50">{commit.short}</p>
			</article>
		{/each}
	{/if}
</div>
