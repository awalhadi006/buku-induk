<script lang="ts">
	import { IconSchool } from '@tabler/icons-svelte';
	import { STATUS_SANTRI_LABEL } from '$lib/santri';

	let { data } = $props();
	const k = $derived(data.kelas as { tingkat: string; rombel: string; tahun_ajaran: string | null; aktif: boolean });
	const santri = $derived(data.santri as {
		id: string;
		nama_lengkap: string;
		nisn: string | null;
		status_santri: string;
		jenis_kelamin: string;
		kamar: string | null;
	}[]);
	const r = $derived(data.rekap as { total: number; laki: number; perempuan: number });
	const title = `${k.tingkat} ${k.rombel}${k.tahun_ajaran ? ` (${k.tahun_ajaran})` : ''}`;
</script>

<svelte:head>
	<title>{title} | Buku Induk</title>
</svelte:head>

<header class="flex items-center gap-3">
	<a class="btn btn-ghost btn-sm" href="/kelas" aria-label="Kembali ke daftar kelas">
		&larr;
	</a>
	<span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
		<IconSchool class="size-5" stroke-width={1.75} />
	</span>
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">{title}</h1>
		<p class="mt-0.5 text-base-content/70">
			{k.tahun_ajaran ?? 'Tanpa tahun ajaran'}
			· {k.aktif ? 'Aktif' : 'Nonaktif'}
		</p>
	</div>
</header>

<section class="mt-8 grid gap-4 sm:grid-cols-3">
	<div class="rounded-2xl border border-base-300 bg-base-100 p-5">
		<span class="text-sm text-base-content/70">Total santri</span>
		<span class="mt-2 block font-mono text-3xl">{r.total}</span>
	</div>
	<div class="rounded-2xl border border-base-300 bg-base-100 p-5">
		<span class="text-sm text-base-content/70">Laki-laki</span>
		<span class="mt-2 block font-mono text-3xl">{r.laki}</span>
	</div>
	<div class="rounded-2xl border border-base-300 bg-base-100 p-5">
		<span class="text-sm text-base-content/70">Perempuan</span>
		<span class="mt-2 block font-mono text-3xl">{r.perempuan}</span>
	</div>
</section>

<div class="mt-6 overflow-x-auto rounded-2xl border border-base-300 bg-base-100">
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
