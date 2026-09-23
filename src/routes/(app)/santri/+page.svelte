<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { IconSearch, IconPlus, IconDownload, IconFilter, IconChevronLeft, IconChevronRight, IconEdit, IconTrash, IconEye, IconExternalLink, IconIdBadge } from '@tabler/icons-svelte';
	import { STATUS_SANTRI_OPTIONS, STATUS_KELUARGA_OPTIONS, GENDER_OPTIONS } from '$lib/santri';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import SkeletonTable from '$lib/components/Skeleton.svelte';
	import Collapse from '$lib/components/Collapse.svelte';

let { data } = $props();

const santri = $derived(data.santri ?? []);
const kamarList = $derived(data.kamar ?? []);
const kelasList = $derived(data.kelas ?? []);
const kabupatenList = $derived((data.kabupaten ?? []) as string[]);
const pagination = $derived(data.pagination ?? { page: 1, pageSize: 25, total: 0, totalPages: 0, pageSizeOptions: [10, 25, 50, 100] });
const currentPage = $derived(pagination.page);
const pageSize = $derived(pagination.pageSize);
const total = $derived(pagination.total);
const totalPages = $derived(pagination.totalPages);
const pageSizeOptions = $derived(pagination.pageSizeOptions);

const profile = $derived((page.data.profile as { peran: string } | null) ?? null);
const canCreate = $derived(profile ? ['superadmin', 'admin_tu'].includes(profile.peran) : false);
const canEdit = $derived(profile ? ['superadmin', 'admin_tu', 'wali_kamar', 'wali_kelas'].includes(profile.peran) : false);
const canDelete = $derived(profile ? ['superadmin', 'admin_tu'].includes(profile.peran) : false);

const searchParam = $derived(page.url.searchParams.get('q')?.trim() ?? '');
let query = $state('');

let filterKamar = $state('');
let filterKelas = $state('');
let filterStatus = $state('');
let filterKeluarga = $state('');
let filterGender = $state('');
let filterKabupaten = $state('');
let showFilters = $state(false);

// Sync query with URL when user navigates via browser back/forward or initial load
$effect(() => {
	query = searchParam;
});

const filterIncomplete = $derived(page.url.searchParams.get('incomplete') === 'true');

	const activeFilterCount = $derived(
		[filterKamar, filterKelas, filterStatus, filterKeluarga, filterGender, filterKabupaten, searchParam].filter(Boolean).length + (filterIncomplete ? 1 : 0)
	);

	function resetFilters() {
		filterKamar = '';
		filterKelas = '';
		filterStatus = '';
		filterKeluarga = '';
		filterGender = '';
		filterKabupaten = '';
	}

	function clearSearch() {
		updateSearch('');
	}

	function goToPage(newPage: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(newPage));
		goto(`?${params.toString()}`);
	}

	function changePageSize(newSize: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('limit', String(newSize));
		params.set('page', '1');
		goto(`?${params.toString()}`);
	}

	function updateSearch(newQuery: string) {
		query = newQuery;
		const params = new URLSearchParams(page.url.searchParams);
		if (newQuery.trim()) {
			params.set('q', newQuery.trim());
		} else {
			params.delete('q');
		}
		params.set('page', '1');
		goto(`?${params.toString()}`);
	}

	const filtered = $derived(
		santri.filter((s) => {
			if (filterKamar && String(s.kamar_id) !== filterKamar) return false;
			if (filterKelas && String(s.kelas_id) !== filterKelas) return false;
			if (filterStatus && s.status_santri !== filterStatus) return false;
			if (filterKeluarga && s.status_keluarga !== filterKeluarga) return false;
			if (filterGender && s.jenis_kelamin !== filterGender) return false;
			if (filterKabupaten && (s.kabupaten ?? '') !== filterKabupaten) return false;
			if (filterIncomplete) {
				const incomplete = !s.nik || !s.nisn || !s.tanggal_lahir || !s.tempat_lahir || !s.jenis_kelamin || !s.wali_santri_id;
				if (!incomplete) return false;
			}
			return true;
		})
	);
</script>

<svelte:head>
	<title>Santri | Buku Induk</title>
</svelte:head>

<!-- Skip link: first focusable element -->
<a
	href="#main-content"
	class="btn btn-primary btn-sm fixed left-4 top-4 z-50 -translate-y-20 focus-visible:translate-y-0 motion-reduce:transition-none">
	Lewati ke konten utama
</a>

<PageHeader title="Santri" desc="Daftar santri pesantren. Menampilkan {santri.length} dari {total} santri total (halaman {currentPage} dari {totalPages}){searchParam ? ` · Hasil untuk: "${searchParam}"` : ''}.">
	{#snippet actions()}
		<label class="relative flex-1 sm:w-72 sm:flex-none">
			<span class="sr-only">Cari santri</span>
			<IconSearch class="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-base-content/50" />
			<input
				type="search"
				value={query}
				oninput={(e) => updateSearch(e.currentTarget.value)}
				class="input input-bordered w-full pl-9"
				placeholder="Cari nama atau NISN" />
		</label>

		<button
			class="btn btn-outline btn-sm {activeFilterCount > 0 ? 'btn-primary' : ''}"
			onclick={() => (showFilters = !showFilters)}>
			<IconFilter class="size-4" stroke-width={1.75} />
			Filter
			{#if activeFilterCount > 0}
				<span class="badge badge-primary badge-sm ml-1" data-visual-test-mask>{activeFilterCount}</span>
			{/if}
		</button>

		{#if canCreate}
			<a class="btn btn-outline btn-sm" href="/santri/export" title="Ekspor data santri">
				<IconDownload class="size-4" stroke-width={2} />
				Ekspor
			</a>
			<a class="btn btn-primary btn-sm" href="/santri/baru">
				<IconPlus class="size-4" stroke-width={2} />
				Tambah
			</a>
		{/if}
	{/snippet}
</PageHeader>

<main id="main-content" class="mt-6">

<!-- PANEL FILTER LANJUTAN -->
<Collapse open={showFilters} duration={250}>
	<div class="mt-4 rounded-lg border border-base-300 bg-base-100 p-5 shadow-sm">
		<div class="flex items-center justify-between pb-3 border-b border-base-200">
			<h2 class="text-sm font-semibold flex items-center gap-2">
				<IconFilter class="size-4 text-primary" />
				Filter Lanjutan
			</h2>
			<div class="flex items-center gap-2">
				{#if searchParam}
					<button class="btn btn-ghost btn-xs text-warning" onclick={clearSearch}>
						Hapus pencarian: "{searchParam}"
					</button>
				{/if}
				{#if activeFilterCount > 0}
					<button class="btn btn-ghost btn-xs text-error" onclick={resetFilters}>
						Reset filter
					</button>
				{/if}
			</div>
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

			<label class="block sm:col-span-2 lg:col-span-5">
				<span class="mb-1 block text-xs font-medium text-base-content/70">Asal Daerah</span>
				<select class="select select-bordered select-sm w-full" bind:value={filterKabupaten}>
					<option value="">Semua daerah</option>
					{#each kabupatenList as k (k)}
						<option value={k}>{k}</option>
					{/each}
				</select>
			</label>
		</div>
	</div>
</Collapse>

{#if santri.length === 0 && data.santri !== undefined}
	<div class="mt-6" role="status">
		<div class="alert alert-soft alert-info">
			<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
			<div>
				<h3 class="font-bold">Belum ada data santri</h3>
				<div class="text-xs">Data diisi lewat import Excel dari halaman Import, atau ditambahkan manual.</div>
			</div>
			<div class="flex flex-wrap gap-2 mt-4">
				<a class="btn btn-primary btn-sm" href="/import">Import Excel</a>
				{#if canCreate}
					<a class="btn btn-outline btn-sm" href="/santri/baru">Tambah manual</a>
				{/if}
			</div>
		</div>
	</div>
{:else if data.santri === undefined}
	<div class="mt-6" role="status" aria-busy="true" aria-live="polite">
		<SkeletonTable rows={5} cols={6} ariaLabel="Memuat daftar santri..." />
	</div>
{:else if filtered.length === 0}
	<div class="mt-6" role="status">
		<div class="alert alert-soft alert-info">
			<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
			<div>
				<h3 class="font-bold">Tidak ada hasil</h3>
				<div class="text-xs">Tidak ada santri yang cocok dengan pencarian atau filter.</div>
			</div>
			<div class="mt-4">
				<button class="btn btn-outline btn-sm" onclick={resetFilters}>Reset filter</button>
			</div>
		</div>
	</div>
{:else}
<div class="mt-6 overflow-x-auto rounded-lg border border-base-300 bg-base-100">
			<table class="table table-zebra table-pin-rows">
				<thead>
					<tr class="text-xs uppercase tracking-wide text-base-content/60">
						<th scope="col">Nama</th>
						<th scope="col">NISN</th>
						<th scope="col" class="hidden sm:table-cell">JK</th>
						<th scope="col">Kamar</th>
						<th scope="col" class="hidden md:table-cell">Kelas</th>
						<th scope="col">Status</th>
						<th scope="col" class="w-24 text-right">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each filtered as s, i (s.id)}
						<tr class="hover:bg-base-200/50 santri-row" style="--stagger-index: {i};">
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
							<td class="text-right">
								<div class="dropdown dropdown-end">
									<button class="btn btn-ghost btn-square btn-sm" aria-label="Aksi untuk {s.nama_lengkap}" aria-haspopup="true" aria-expanded="false">
										<svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
									</button>
									<ul class="dropdown-content menu menu-sm p-2 shadow bg-base-100 rounded-box w-40">
										<li><a class="flex items-center gap-2" href="/santri/{s.id}"><IconEye class="size-4" stroke-width={1.75} /> Detail</a></li>
										<li><a class="flex items-center gap-2" href="/santri/{s.id}/cetak" target="_blank" rel="noopener"><IconExternalLink class="size-4" stroke-width={1.75} /> Cetak Buku Induk</a></li>
										<li><a class="flex items-center gap-2" href="/santri/{s.id}/kartu" target="_blank" rel="noopener"><IconIdBadge class="size-4" stroke-width={1.75} /> Cetak Kartu</a></li>
										{#if canEdit}
											<li><a class="flex items-center gap-2" href="/santri/{s.id}?edit=1"><IconEdit class="size-4" stroke-width={1.75} /> Edit</a></li>
										{/if}
										{#if canDelete}
											<li>
												<form method="POST" action="?/delete" onsubmit={() => confirm('Yakin menghapus santri ini? Tindakan ini permanen.')}>
													<button type="submit" class="flex w-full items-center gap-2 text-error"><IconTrash class="size-4" stroke-width={1.75} /> Hapus</button>
												</form>
											</li>
										{/if}
									</ul>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

	{#if totalPages > 1}
		<div class="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
			<div class="flex items-center gap-2 text-sm text-base-content/70">
				<span>Tampilkan</span>
				<select
					class="select select-bordered select-sm"
					value={pageSize}
					onchange={(e) => changePageSize(Number(e.currentTarget.value))}>
					{#each pageSizeOptions as opt (opt)}
						<option value={opt}>{opt} per halaman</option>
					{/each}
				</select>
			</div>

			<div class="join">
				<button
					class="join-item btn btn-outline btn-sm"
					onclick={() => goToPage(currentPage - 1)}
					disabled={currentPage === 1}
					aria-label="Halaman sebelumnya">
					<IconChevronLeft class="size-4" />
				</button>

				{#each Array.from({ length: totalPages }, (_, i) => i + 1) as p}
					{#if p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)}
						<button
							class="join-item btn btn-sm {p === currentPage ? 'btn-primary' : 'btn-outline'}"
							onclick={() => goToPage(p)}
							aria-label="Halaman {p}"
							aria-current={p === currentPage ? 'page' : undefined}>
							{p}
						</button>
					{:else if p === currentPage - 2 || p === currentPage + 2}
						<span class="join-item btn btn-ghost btn-sm px-2 text-base-content/40">…</span>
					{/if}
				{/each}

				<button
					class="join-item btn btn-outline btn-sm"
					onclick={() => goToPage(currentPage + 1)}
					disabled={currentPage === totalPages}
					aria-label="Halaman selanjutnya">
					<IconChevronRight class="size-4" />
				</button>
			</div>

			<div class="text-sm text-base-content/60">
Halaman {currentPage} dari {totalPages} · Total <span data-visual-test-mask>{total}</span> santri
			</div>
		</div>
	{/if}
	{/if}

</main>
