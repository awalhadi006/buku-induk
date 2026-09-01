<script lang="ts">
	import { IconPrinter } from '@tabler/icons-svelte';
	import { STATUS_SANTRI_LABEL } from '$lib/santri';
	import Skeleton from '$lib/components/Skeleton.svelte';

	let { data } = $props();
	const k = $derived(data.kelas as { id: string; tingkat: string; rombel: string; tahun_ajaran: string | null; aktif: boolean });
	const santri = $derived(data.santri as {
		id: string;
		nama_lengkap: string;
		nisn: string | null;
		status_santri: string;
		jenis_kelamin: string;
		kamar: string | null;
	}[]);
	const r = $derived(data.rekap as { total: number; laki: number; perempuan: number });
	const title = $derived(`${k.tingkat} ${k.rombel}${k.tahun_ajaran ? ` (${k.tahun_ajaran})` : ''}`);
</script>

<svelte:head>
	<title>{title} | Buku Induk</title>
</svelte:head>

<header class="flex items-center gap-3">
	<a class="btn btn-ghost btn-square btn-sm" href="/kelas" aria-label="Kembali ke daftar kelas">
		&larr;
	</a>
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">{title}</h1>
		<p class="mt-0.5 text-base-content/70">
			{k.tahun_ajaran ?? 'Tanpa tahun ajaran'}
			· {k.aktif ? 'Aktif' : 'Nonaktif'}
		</p>
	</div>
</header>

{#if data.kelas === undefined || data.santri === undefined || data.rekap === undefined}
	<div class="mt-6" role="status" aria-busy="true" aria-live="polite">
		<div class="grid grid-cols-3 gap-4 mb-6">
			<Skeleton variant="stat" ariaLabel="Memuat statistik kelas..." />
			<Skeleton variant="stat" ariaLabel="Memuat statistik kelas..." />
			<Skeleton variant="stat" ariaLabel="Memuat statistik kelas..." />
		</div>
		<Skeleton variant="table" rows={5} cols={4} ariaLabel="Memuat daftar santri kelas..." />
	</div>
{:else}

<div class="mt-4 flex gap-2">
	<a class="btn btn-outline btn-sm" href="/kelas/{k.id}/kartu-massal" target="_blank" rel="noopener">
		<IconPrinter class="size-4" stroke-width={1.75} />
		Cetak Kartu Massal
	</a>
</div>

<section class="mt-8 grid grid-cols-3 divide-x divide-base-300 rounded-lg border border-base-300 bg-base-100" aria-label="Rekap kelas">
	<div class="p-4 sm:p-5">
		<span class="text-xs text-base-content/60">Total santri</span>
		<span class="mt-1 block font-mono text-3xl">{r.total}</span>
	</div>
	<div class="p-4 sm:p-5">
		<span class="text-xs text-base-content/60">Laki-laki</span>
		<span class="mt-1 block font-mono text-3xl">{r.laki}</span>
	</div>
	<div class="p-4 sm:p-5">
		<span class="text-xs text-base-content/60">Perempuan</span>
		<span class="mt-1 block font-mono text-3xl">{r.perempuan}</span>
	</div>
</section>

<div class="mt-6 overflow-x-auto rounded-lg border border-base-300 bg-base-100">
	<table class="table">
		<thead>
			<tr class="text-xs uppercase tracking-wider text-base-content/60">
				<th>Santri</th>
				<th>NISN</th>
				<th>Kamar</th>
				<th>Status</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-base-200">
			{#each santri as s (s.id)}
				<tr class="hover:bg-base-200/50">
					<td class="font-medium">
						<a href="/santri/{s.id}" class="text-primary hover:underline">{s.nama_lengkap}</a>
					</td>
					<td class="font-mono text-xs">{s.nisn ?? '-'}</td>
					<td>{s.kamar ?? '-'}</td>
					<td>{STATUS_SANTRI_LABEL[s.status_santri] ?? s.status_santri}</td>
				</tr>
			{:else}
				<tr>
					<td colspan="4" class="text-center text-base-content/60 py-8">Belum ada santri.</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
{/if}