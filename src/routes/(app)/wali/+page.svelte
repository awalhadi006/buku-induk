<script lang="ts">
	import { IconUserHeart, IconSearch, IconPlus } from '@tabler/icons-svelte';
	import { waliLabel } from '$lib/wali';

	let { data } = $props();

	const wali = $derived(data.wali ?? []);

	let query = $state('');

	const filtered = $derived(
		query.trim()
			? wali.filter((w) =>
					(waliLabel(w) + ' ' + (w.no_hp ?? ''))
						.toLowerCase()
						.includes(query.toLowerCase().trim())
				)
			: wali
	);
</script>

<svelte:head>
	<title>Wali Santri | Buku Induk</title>
</svelte:head>

<header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Wali Santri</h1>
		<p class="mt-1 max-w-[65ch] text-base-content/70">
			Orang tua atau wali yang menaungi satu atau lebih santri. Satu entitas dipakai bersama
			untuk kakak-beradik, jadi satu kali edit berlaku untuk semua anaknya.
		</p>
	</div>
	<div class="flex items-center gap-3">
		<label class="relative flex-1 sm:w-72 sm:flex-none">
			<span class="sr-only">Cari wali</span>
			<IconSearch class="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-base-content/50" />
			<input
				type="search"
				bind:value={query}
				class="input input-bordered w-full pl-9"
				placeholder="Cari nama wali" />
		</label>
		<a class="btn btn-primary btn-sm" href="/wali/baru">
			<IconPlus class="size-4" stroke-width={2} />
			Tambah
		</a>
	</div>
</header>

{#if wali.length === 0}
	<div class="mt-8 rounded-2xl border border-dashed border-base-300 bg-base-100 p-10 text-center">
		<IconUserHeart class="mx-auto size-10 text-base-content/40" stroke-width={1.5} />
		<h2 class="mt-4 text-lg font-semibold">Belum ada data wali santri</h2>
		<p class="mx-auto mt-1 max-w-[55ch] text-sm text-base-content/60">
			Tambahkan wali santri secara manual, atau isi lewat import Excel dari halaman Import.
		</p>
		<div class="mt-5">
			<a class="btn btn-primary btn-sm" href="/wali/baru">Tambah wali</a>
			<a class="btn btn-outline btn-sm" href="/import">Import Excel</a>
		</div>
	</div>
{:else if filtered.length === 0}
	<div class="mt-8 rounded-2xl border border-dashed border-base-300 bg-base-100 p-10 text-center">
		<p class="text-base-content/60">Tidak ada wali santri yang cocok dengan pencarian.</p>
	</div>
{:else}
	<div class="mt-8 overflow-x-auto rounded-2xl border border-base-300 bg-base-100">
		<table class="table">
			<thead>
				<tr class="text-xs uppercase tracking-wide text-base-content/60">
					<th>Nama</th>
					<th>No. HP</th>
					<th class="hidden sm:table-cell">Alamat</th>
					<th>Santri</th>
				</tr>
			</thead>
			<tbody>
				{#each filtered as w}
					<tr class="hover:bg-base-200/50">
						<td class="font-medium">
							<a class="link link-hover" href="/wali/{w.id}">{waliLabel(w)}</a>
						</td>
						<td class="font-mono">{w.no_hp ?? '-'}</td>
						<td class="hidden max-w-[28ch] truncate sm:table-cell" title={w.alamat ?? undefined}>
							{w.alamat ?? '-'}
						</td>
						<td>
							<span class="badge badge-ghost badge-sm">{w.jumlah_santri}</span>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
