<script lang="ts">
	import { page } from '$app/state';
	import { IconUsers } from '@tabler/icons-svelte';
	import BarList from '$lib/components/BarList.svelte';
	import { PERAN_LABEL, type Profile, type Rekap } from '$lib/types';

	let { data } = $props();

	const rekap = $derived((data.rekap as Rekap | null) ?? null);
	const profile = $derived((page.data.profile as Profile | null) ?? null);

	const STATUS_LABEL: Record<string, string> = {
		aktif: 'Aktif',
		khusus: 'Khusus',
		mutasi_keluar: 'Mutasi Keluar',
		lulus: 'Lulus',
		wafat: 'Wafat',
		drop_out: 'Drop Out'
	};
	const GENDER_LABEL: Record<string, string> = { L: 'Laki-laki', P: 'Perempuan' };

	const statusRows = $derived(
		Object.entries(rekap?.per_status ?? {})
			.map(([k, v]) => ({ label: STATUS_LABEL[k] ?? k, value: v }))
			.sort((a, b) => b.value - a.value)
	);
	const genderRows = $derived(
		Object.entries(rekap?.per_gender ?? {})
			.map(([k, v]) => ({ label: GENDER_LABEL[k] ?? k, value: v }))
			.sort((a, b) => b.value - a.value)
	);
	const daerahRows = $derived(
		Object.entries(rekap?.per_daerah ?? {})
			.map(([k, v]) => ({ label: k === '-' ? 'Belum diisi' : k, value: v }))
			.sort((a, b) => b.value - a.value)
	);
	const kamarRows = $derived(
		(rekap?.per_kamar ?? [])
			.map((k) => ({ label: k.nomor != null ? `Kamar ${k.nomor}` : 'Tanpa kamar', value: k.jumlah }))
			.sort((a, b) => b.value - a.value)
	);
	const kelasRows = $derived(
		(rekap?.per_kelas ?? [])
			.map((k) => ({ label: k.kelas ?? 'Tanpa kelas', value: k.jumlah }))
			.sort((a, b) => b.value - a.value)
	);

	const genderMax = $derived(Math.max(0, ...genderRows.map((r) => r.value)));
	const laki = $derived(rekap?.per_gender?.['L'] ?? 0);
	const perempuan = $derived(rekap?.per_gender?.['P'] ?? 0);
	const canImport = $derived(profile ? ['superadmin', 'admin_tu'].includes(profile.peran) : false);
	const peranDisp = $derived(profile ? PERAN_LABEL[profile.peran] ?? profile.peran : '');
</script>

<svelte:head>
	<title>Rekapitulasi | Buku Induk</title>
</svelte:head>

<header>
	<h1 class="text-2xl font-semibold tracking-tight">Rekapitulasi</h1>
	<p class="mt-1 max-w-[65ch] text-base-content/70">
		Ringkasan data santri untuk akun <span class="font-medium">{peranDisp}</span>.
	</p>
</header>

{#if rekap}
	{#if rekap.total === 0}
		<div class="mt-8 rounded-2xl border border-dashed border-base-300 bg-base-100 p-10 text-center">
			<IconUsers class="mx-auto size-10 text-base-content/40" stroke-width={1.5} />
			<h2 class="mt-4 text-lg font-semibold">Belum ada data santri</h2>
			<p class="mx-auto mt-1 max-w-[55ch] text-sm text-base-content/60">
				Rekapitulasi muncul setelah data santri diimpor atau ditambahkan.
			</p>
			<div class="mt-5 flex justify-center gap-3">
				{#if canImport}
					<a class="btn btn-primary btn-sm" href="/import">Import Excel</a>
				{/if}
				<a class="btn btn-outline btn-sm" href="/santri">Lihat santri</a>
			</div>
		</div>
	{:else}
		<section class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Angka utama">
			<div class="flex flex-col justify-between rounded-2xl border border-base-300 bg-base-100 p-5 lg:col-span-2">
				<span class="text-sm text-base-content/70">Total santri</span>
				<span class="mt-2 font-mono text-5xl">{rekap.total}</span>
			</div>
			<div class="rounded-2xl border border-base-300 bg-base-100 p-5">
				<span class="text-sm text-base-content/70">Laki-laki</span>
				<span class="mt-2 block font-mono text-3xl">{laki}</span>
			</div>
			<div class="rounded-2xl border border-base-300 bg-base-100 p-5">
				<span class="text-sm text-base-content/70">Perempuan</span>
				<span class="mt-2 block font-mono text-3xl">{perempuan}</span>
			</div>
		</section>

		<section class="mt-4 grid gap-4 lg:grid-cols-2" aria-label="Perbandingan">
			<div class="rounded-2xl border border-base-300 bg-base-100 p-5">
				<h2 class="text-sm font-semibold">Status santri</h2>
				<div class="mt-2">
					<BarList rows={statusRows} max={rekap.total} />
				</div>
			</div>
			<div class="rounded-2xl border border-base-300 bg-base-100 p-5">
				<h2 class="text-sm font-semibold">Jenis kelamin</h2>
				<div class="mt-2">
					<BarList rows={genderRows} max={genderMax} />
				</div>
			</div>
		</section>

		<section class="mt-4 grid gap-4 lg:grid-cols-2" aria-label="Kelompok">
			<div class="rounded-2xl border border-base-300 bg-base-100 p-5">
				<h2 class="text-sm font-semibold">Per kamar</h2>
				<div class="mt-2">
					<BarList rows={kamarRows} max={Math.max(0, ...kamarRows.map((r) => r.value))} />
				</div>
			</div>
			<div class="rounded-2xl border border-base-300 bg-base-100 p-5">
				<h2 class="text-sm font-semibold">Per kelas</h2>
				<div class="mt-2">
					<BarList rows={kelasRows} max={Math.max(0, ...kelasRows.map((r) => r.value))} />
				</div>
			</div>
		</section>

		<section class="mt-4 rounded-2xl border border-base-300 bg-base-100 p-5" aria-label="Asal daerah">
			<h2 class="text-sm font-semibold">Per daerah asal</h2>
			<div class="mt-2">
				<BarList rows={daerahRows} max={Math.max(0, ...daerahRows.map((r) => r.value))} />
			</div>
		</section>
	{/if}
{:else}
	<div class="mt-8 rounded-2xl border border-base-300 bg-base-100 p-10 text-center">
		<p class="text-base-content/60">Data belum dapat dimuat.</p>
	</div>
{/if}