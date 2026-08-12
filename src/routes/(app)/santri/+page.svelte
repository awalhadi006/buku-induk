<script lang="ts">
	import { page } from '$app/state';
	import { IconUsers, IconSearch, IconPlus, IconDownload } from '@tabler/icons-svelte';

	const STATUS_LABEL: Record<string, string> = {
		aktif: 'Aktif',
		khusus: 'Khusus',
		mutasi_keluar: 'Mutasi Keluar',
		lulus: 'Lulus',
		wafat: 'Wafat',
		drop_out: 'Drop Out'
	};

	let { data } = $props();

	const santri = $derived(data.santri ?? []);
	const profile = $derived((page.data.profile as { peran: string } | null) ?? null);
	const canCreate = $derived(profile ? ['superadmin', 'admin_tu'].includes(profile.peran) : false);

	let query = $state('');

	const filtered = $derived(
		query.trim()
			? santri.filter(
					(s) =>
						s.nama_lengkap.toLowerCase().includes(query.toLowerCase().trim()) ||
						(s.nisn ?? '').toLowerCase().includes(query.toLowerCase().trim())
				)
			: santri
	);
</script>

<svelte:head>
	<title>Santri | Buku Induk</title>
</svelte:head>

<header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Santri</h1>
		<p class="mt-1 max-w-[65ch] text-base-content/70">
			Daftar santri yang bisa anda lihat: <span class="font-mono">{filtered.length}</span> dari
			<span class="font-mono">{santri.length}</span> baris pertama.
		</p>
	</div>
	<div class="flex items-center gap-3">
		<label class="relative flex-1 sm:w-72 sm:flex-none">
			<span class="sr-only">Cari santri</span>
			<IconSearch class="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-base-content/50" />
			<input
				type="search"
				bind:value={query}
				class="input input-bordered w-full pl-9"
				placeholder="Cari nama atau NISN" />
		</label>
		{#if canCreate}
			<form method="POST" action="?/exportExcel">
				<button class="btn btn-outline btn-sm" type="submit">
					<IconDownload class="size-4" stroke-width={2} />
					Ekspor
				</button>
			</form>
			<a class="btn btn-primary btn-sm" href="/santri/baru">
				<IconPlus class="size-4" stroke-width={2} />
				Tambah
			</a>
		{/if}
	</div>
</header>

{#if santri.length === 0}
	<div class="mt-8 rounded-2xl border border-dashed border-base-300 bg-base-100 p-10 text-center">
		<IconUsers class="mx-auto size-10 text-base-content/40" stroke-width={1.5} />
		<h2 class="mt-4 text-lg font-semibold">Belum ada data santri</h2>
		<p class="mx-auto mt-1 max-w-[55ch] text-sm text-base-content/60">
			Data diisi lewat import Excel dari halaman Import, atau ditambahkan manual.
		</p>
		<div class="mt-5">
			<a class="btn btn-primary btn-sm" href="/import">Import Excel</a>
			{#if canCreate}
				<a class="btn btn-outline btn-sm" href="/santri/baru">Tambah manual</a>
			{/if}
		</div>
	</div>
{:else if filtered.length === 0}
	<div class="mt-8 rounded-2xl border border-dashed border-base-300 bg-base-100 p-10 text-center">
		<p class="text-base-content/60">Tidak ada santri yang cocok dengan pencarian.</p>
	</div>
{:else}
	<div class="mt-8 overflow-x-auto rounded-2xl border border-base-300 bg-base-100">
		<table class="table">
			<thead>
				<tr class="text-xs uppercase tracking-wide text-base-content/60">
					<th>Nama</th>
					<th>NISN</th>
					<th class="hidden sm:table-cell">JK</th>
					<th>Kamar</th>
					<th class="hidden md:table-cell">Kelas</th>
					<th>Status</th>
				</tr>
			</thead>
			<tbody>
				{#each filtered as s}
					<tr class="hover:bg-base-200/50">
						<td class="font-medium">
							<a class="link link-hover" href="/santri/{s.id}">{s.nama_lengkap}</a>
						</td>
						<td class="font-mono">{s.nisn ?? '-'}</td>
						<td class="hidden sm:table-cell">{s.jenis_kelamin ?? '-'}</td>
						<td>{s.kamar ? `Kamar ${s.kamar.nomor}` : '-'}</td>
						<td class="hidden md:table-cell">
							{s.kelas ? `${s.kelas.tingkat} ${s.kelas.rombel}` : '-'}
						</td>
						<td>{STATUS_LABEL[s.status_santri] ?? s.status_santri}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}