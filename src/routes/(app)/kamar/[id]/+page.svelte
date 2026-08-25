<script lang="ts">
	import { STATUS_SANTRI_LABEL } from '$lib/santri';

	let { data } = $props();
	const k = $derived(data.kamar as { nomor: number; asrama: string | null; kapasitas: number | null; aktif: boolean });
	const santri = $derived(data.santri as {
		id: string;
		nama_lengkap: string;
		nisn: string | null;
		status_santri: string;
		jenis_kelamin: string;
		kelas: string | null;
	}[]);
	const r = $derived(data.rekap as { total: number; laki: number; perempuan: number });
</script>

<svelte:head>
	<title>Kamar {k.nomor} | Buku Induk</title>
</svelte:head>

<header class="flex items-center gap-3">
	<a class="btn btn-ghost btn-square btn-sm" href="/kamar" aria-label="Kembali ke daftar kamar">
		&larr;
	</a>
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Kamar {k.nomor}</h1>
		<p class="mt-0.5 text-base-content/70">
			{k.asrama ?? 'Tanpa asrama'}
			{k.kapasitas != null ? ` · kapasitas ${k.kapasitas}` : ''}
			· {k.aktif ? 'Aktif' : 'Nonaktif'}
		</p>
	</div>
</header>

<section class="mt-8 grid grid-cols-3 divide-x divide-base-300 rounded-lg border border-base-300 bg-base-100" aria-label="Rekap kamar">
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
				<th>Kelas</th>
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
					<td>{s.kelas ?? '-'}</td>
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
