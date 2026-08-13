<script lang="ts">
	import { page } from '$app/state';
	import { IconUsers, IconSearch, IconPlus, IconDownload, IconFilter, IconX } from '@tabler/icons-svelte';
	import { STATUS_SANTRI_OPTIONS, STATUS_KELUARGA_OPTIONS, GENDER_OPTIONS } from '$lib/santri';

	let { data } = $props();

	const santri = $derived(data.santri ?? []);
	const kamarList = $derived(data.kamar ?? []);
	const kelasList = $derived(data.kelas ?? []);

	const profile = $derived((page.data.profile as { peran: string } | null) ?? null);
	const canCreate = $derived(profile ? ['superadmin', 'admin_tu'].includes(profile.peran) : false);

	let query = $state('');
	let filterKamar = $state('');
	let filterKelas = $state('');
	let filterStatus = $state('');
	let filterKeluarga = $state('');
	let filterGender = $state('');
	let showFilters = $state(false);

	const activeFilterCount = $derived(
		[filterKamar, filterKelas, filterStatus, filterKeluarga, filterGender].filter(Boolean).length
	);

	function resetFilters() {
		filterKamar = '';
		filterKelas = '';
		filterStatus = '';
		filterKeluarga = '';
		filterGender = '';
	}

	const filtered = $derived(
		santri.filter((s) => {
			const q = query.toLowerCase().trim();
			if (q && !s.nama_lengkap.toLowerCase().includes(q) && !(s.nisn ?? '').toLowerCase().includes(q)) {
				return false;
			}
			if (filterKamar && String(s.kamar_id) !== filterKamar) return false;
			if (filterKelas && String(s.kelas_id) !== filterKelas) return false;
			if (filterStatus && s.status_santri !== filterStatus) return false;
			if (filterKeluarga && s.status_keluarga !== filterKeluarga) return false;
			if (filterGender && s.jenis_kelamin !== filterGender) return false;
			return true;
		})
	);
</script>

<svelte:head>
	<title>Santri | Buku Induk</title>
</svelte:head>

<header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Santri</h1>
		<p class="mt-1 max-w-[65ch] text-base-content/70">
			Daftar santri pesantren. Menampilkan <span class="font-mono">{filtered.length}</span> dari
			<span class="font-mono">{santri.length}</span> santri total.
		</p>
	</div>
	<div class="flex flex-wrap items-center gap-3">
		<label class="relative flex-1 sm:w-72 sm:flex-none">
			<span class="sr-only">Cari santri</span>
			<IconSearch class="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-base-content/50" />
			<input
				type="search"
				bind:value={query}
				class="input input-bordered w-full pl-9"
				placeholder="Cari nama atau NISN" />
		</label>

		<button
			class="btn btn-outline btn-sm {activeFilterCount > 0 ? 'btn-primary' : ''}"
			onclick={() => (showFilters = !showFilters)}>
			<IconFilter class="size-4" stroke-width={1.75} />
			Filter
			{#if activeFilterCount > 0}
				<span class="badge badge-primary badge-sm ml-1">{activeFilterCount}</span>
			{/if}
		</button>

		{#if canCreate}
			<form method="POST" action="?/exportExcel">
				<button class="btn btn-outline btn-sm" type="submit" title="Ekspor semua data santri ke Excel">
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

<!-- PANEL FILTER LANJUTAN -->
{#if showFilters}
	<div class="mt-4 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
		<div class="flex items-center justify-between pb-3 border-b border-base-200">
			<h2 class="text-sm font-semibold flex items-center gap-2">
				<IconFilter class="size-4 text-primary" />
				Filter Lanjutan
			</h2>
			{#if activeFilterCount > 0}
				<button class="btn btn-ghost btn-xs text-error" onclick={resetFilters}>
					Reset filter
				</button>
			{/if}
		</div>

		<div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
			<label class="block">
				<span class="mb-1 block text-xs font-medium text-base-content/70">Kamar</span>
				<select class="select select-bordered select-sm w-full" bind:value={filterKamar}>
					<option value="">Semua kamar</option>
					{#each kamarList as k (k.id)}
						<option value={String(k.id)}>Kamar {k.nomor}</option>
					{/each}
				</select>
			</label>

			<label class="block">
				<span class="mb-1 block text-xs font-medium text-base-content/70">Kelas</span>
				<select class="select select-bordered select-sm w-full" bind:value={filterKelas}>
					<option value="">Semua kelas</option>
					{#each kelasList as k (k.id)}
						<option value={String(k.id)}>{k.tingkat} {k.rombel}</option>
					{/each}
				</select>
			</label>

			<label class="block">
				<span class="mb-1 block text-xs font-medium text-base-content/70">Status Santri</span>
				<select class="select select-bordered select-sm w-full" bind:value={filterStatus}>
					<option value="">Semua status</option>
					{#each STATUS_SANTRI_OPTIONS as o (o.value)}
						<option value={o.value}>{o.label}</option>
					{/each}
				</select>
			</label>

			<label class="block">
				<span class="mb-1 block text-xs font-medium text-base-content/70">Status Keluarga</span>
				<select class="select select-bordered select-sm w-full" bind:value={filterKeluarga}>
					<option value="">Semua status keluarga</option>
					{#each STATUS_KELUARGA_OPTIONS as o (o.value)}
						<option value={o.value}>{o.label}</option>
					{/each}
				</select>
			</label>

			<label class="block">
				<span class="mb-1 block text-xs font-medium text-base-content/70">Jenis Kelamin</span>
				<select class="select select-bordered select-sm w-full" bind:value={filterGender}>
					<option value="">Semua JK</option>
					{#each GENDER_OPTIONS as o (o.value)}
						<option value={o.value}>{o.label}</option>
					{/each}
				</select>
			</label>
		</div>
	</div>
{/if}

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
		<p class="text-base-content/60">Tidak ada santri yang cocok dengan pencarian atau filter.</p>
		<button class="btn btn-ghost btn-sm mt-3" onclick={resetFilters}>Reset filter</button>
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
						<td>{STATUS_SANTRI_OPTIONS.find((o) => o.value === s.status_santri)?.label ?? s.status_santri}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
