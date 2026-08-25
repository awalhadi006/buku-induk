<script lang="ts">
import { IconAward, IconSearch, IconFilter } from '@tabler/icons-svelte';
import { STATUS_KELUARGA_LABEL, GENDER_LABEL } from '$lib/santri';
import PageHeader from '$lib/components/PageHeader.svelte';
import EmptyState from '$lib/components/EmptyState.svelte';

	type Alumni = {
		id: string;
		nama_lengkap: string;
		nisn: string | null;
		nik: string | null;
		jenis_kelamin: string | null;
		status_keluarga: string | null;
		kabupaten: string | null;
		tanggal_lulus: string;
		kelas: string;
	};

	let { data } = $props();

	const alumni = $derived((data.alumni ?? []) as Alumni[]);
	const tahunOptions = $derived((data.tahunOptions ?? []) as string[]);

	let query = $state('');
	let filterTahun = $state('');
	let filterKelas = $state('');
	let showFilters = $state(false);

	const activeFilterCount = $derived([filterTahun, filterKelas].filter(Boolean).length);

	const filtered = $derived(
		alumni.filter((a) => {
			const q = query.toLowerCase().trim();
			if (q) {
				const matchNama = a.nama_lengkap.toLowerCase().includes(q);
				const matchNisn = (a.nisn ?? '').toLowerCase().includes(q);
				const matchNik = (a.nik ?? '').toLowerCase().includes(q);
				if (!matchNama && !matchNisn && !matchNik) return false;
			}
			if (filterTahun && a.tanggal_lulus.slice(0, 4) !== filterTahun) return false;
			if (filterKelas && a.kelas !== filterKelas) return false;
			return true;
		})
	);

	const kelasOptions = $derived(Array.from(new Set(alumni.map((a) => a.kelas).filter(Boolean))).sort());

	const jumlahPerTahun = $derived(
		tahunOptions.map((t) => ({
			tahun: t,
			jumlah: alumni.filter((a) => a.tanggal_lulus.slice(0, 4) === t).length
		}))
	);

	function resetFilters() {
		query = '';
		filterTahun = '';
		filterKelas = '';
	}

	function formatTanggal(iso: string): string {
		if (!iso) return '-';
		const [y, m, d] = iso.split('-');
		return `${d}-${m}-${y}`;
	}
</script>

<svelte:head>
	<title>Arsip Alumni | Buku Induk</title>
</svelte:head>

<PageHeader title="Arsip Alumni" desc="Riwayat santri yang telah lulus beserta kelas terakhir dan tahun kelulusannya.">
	{#snippet actions()}
		<label class="relative flex-1 sm:w-72 sm:flex-none">
			<span class="sr-only">Cari alumni</span>
			<IconSearch class="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-base-content/50" />
			<input
				type="search"
				bind:value={query}
				class="input input-bordered w-full pl-9"
				placeholder="Cari nama, NISN, NIK" />
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
		<a
			href={`/santri/alumni/export?tahun=${filterTahun}&kelas=${filterKelas}`}
			class="btn btn-outline btn-sm"
			target="_blank"
			rel="noopener noreferrer">
			<IconAward class="size-4" stroke-width={1.75} />
			Export
		</a>
	{/snippet}
</PageHeader>

{#if jumlahPerTahun.length > 0}
	<div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		{#each jumlahPerTahun as j (j.tahun)}
			<button
				type="button"
				onclick={() => (filterTahun = filterTahun === j.tahun ? '' : j.tahun)}
				class="rounded-lg border border-base-300 bg-base-100 p-4 text-left transition-colors
					{filterTahun === j.tahun ? 'border-primary bg-primary/5' : 'hover:bg-base-200/50'}">
				<p class="text-xs font-medium text-base-content/60">Tahun lulus</p>
				<p class="mt-1 text-2xl font-semibold tracking-tight">{j.tahun}</p>
				<p class="mt-0.5 text-xs text-base-content/60">{j.jumlah} alumni</p>
			</button>
		{/each}
	</div>
{/if}

{#if showFilters}
	<div class="mt-4 rounded-lg border border-base-300 bg-base-100 p-5 shadow-sm">
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

		<div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<label class="block">
				<span class="mb-1 block text-xs font-medium text-base-content/70">Tahun Kelulusan</span>
				<select class="select select-bordered select-sm w-full" bind:value={filterTahun}>
					<option value="">Semua tahun</option>
					{#each tahunOptions as t (t)}
						<option value={t}>{t}</option>
					{/each}
				</select>
			</label>

			<label class="block">
				<span class="mb-1 block text-xs font-medium text-base-content/70">Kelas Terakhir</span>
				<select class="select select-bordered select-sm w-full" bind:value={filterKelas}>
					<option value="">Semua kelas</option>
					{#each kelasOptions as k (k)}
						<option value={k}>{k}</option>
					{/each}
				</select>
			</label>
		</div>
	</div>
{/if}

{#if alumni.length === 0}
	<div class="mt-8">
		<EmptyState
			title="Belum ada alumni"
			desc="Santri yang diubah statusnya menjadi Lulus (lewat kelulusan massal atau edit manual) akan muncul di sini.">
			<a class="btn btn-primary btn-sm" href="/kelas/mutasi">Kelulusan Massal</a>
		</EmptyState>
	</div>
{:else if filtered.length === 0}
	<div class="mt-8">
		<EmptyState title="Tidak ada hasil" desc="Tidak ada alumni yang cocok dengan pencarian atau filter.">
			<button class="btn btn-outline btn-sm" onclick={resetFilters}>Reset filter</button>
		</EmptyState>
	</div>
{:else}
	<div class="mt-8 overflow-x-auto rounded-lg border border-base-300 bg-base-100">
		<table class="table">
			<thead>
				<tr class="text-xs uppercase tracking-wide text-base-content/60">
					<th>Nama</th>
					<th>NISN</th>
					<th class="hidden sm:table-cell">JK</th>
					<th>Kelas Terakhir</th>
					<th class="hidden md:table-cell">Status Keluarga</th>
					<th>Tanggal Lulus</th>
				</tr>
			</thead>
			<tbody>
				{#each filtered as a}
					<tr class="hover:bg-base-200/50">
						<td class="font-medium">
							<a class="link link-hover" href="/santri/{a.id}">{a.nama_lengkap}</a>
						</td>
						<td class="font-mono">{a.nisn ?? '-'}</td>
						<td class="hidden sm:table-cell">{GENDER_LABEL[a.jenis_kelamin ?? ''] ?? a.jenis_kelamin ?? '-'}</td>
						<td>{a.kelas || '-'}</td>
						<td class="hidden md:table-cell">
							{STATUS_KELUARGA_LABEL[a.status_keluarga ?? ''] ?? a.status_keluarga ?? '-'}
						</td>
						<td>{formatTanggal(a.tanggal_lulus)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
