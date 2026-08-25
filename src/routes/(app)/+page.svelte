<script lang="ts">
	import { page } from '$app/state';
	import { IconAward } from '@tabler/icons-svelte';
	import BarList from '$lib/components/BarList.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { PERAN_LABEL, type Profile, type Rekap, ALL_METRIC_KEYS } from '$lib/types';

	let { data } = $props();

	const rekap = $derived((data.rekap as Rekap | null) ?? null);
	const profile = $derived((page.data.profile as Profile | null) ?? null);
	const rekapError = $derived((data.rekapError as string | null) ?? null);
	const enabledMetrics = $derived(
		Array.isArray(data.enabledMetrics) && data.enabledMetrics.length
			? (data.enabledMetrics as string[])
			: ALL_METRIC_KEYS
	);

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

	const alumniPerTahun = $derived(data.alumniPerTahun as Record<string, number>);
	const alumniRows = $derived(
		Object.entries(alumniPerTahun)
			.map(([k, v]) => ({ label: k, value: v }))
			.sort((a, b) => b.label.localeCompare(a.label))
	);
	const totalAlumni = $derived(alumniRows.reduce((sum, r) => sum + r.value, 0));
</script>

<svelte:head>
	<title>Rekapitulasi | Buku Induk</title>
</svelte:head>

<header class="flex items-center justify-between">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Rekapitulasi</h1>
		<p class="mt-1 max-w-[65ch] text-base-content/70">
			Ringkasan data santri untuk akun <span class="font-medium">{peranDisp}</span>.
		</p>
	</div>
	{#if data.tahunAjaranAktif}
		<div class="self-start sm:self-auto">
			<span
				class="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
				title="Tahun ajaran aktif">
				<span class="size-1.5 rounded-full bg-primary" aria-hidden="true"></span>
				T.A. {data.tahunAjaranAktif}
			</span>
		</div>
	{/if}
</header>

{#if rekap}
	{#if rekap.total === 0}
		<div class="mt-6">
			<EmptyState
				title="Belum ada data santri"
				desc="Rekapitulasi muncul setelah data santri diimpor atau ditambahkan.">
				{#if canImport}
					<a class="btn btn-primary btn-sm" href="/import">Import Excel</a>
				{/if}
				<a class="btn btn-outline btn-sm" href="/santri">Lihat santri</a>
			</EmptyState>
		</div>
	{:else}
		{#if enabledMetrics.includes('total')}
			<section class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Angka utama">
				<div class="flex flex-col justify-between rounded-2xl border border-base-300 bg-base-100 p-5 lg:col-span-2">
					<span class="text-sm text-base-content/70">Total santri</span>
					<span class="mt-2 font-mono text-5xl">{rekap.total}</span>
				</div>
				{#if rekap.tidak_lengkap != null && rekap.tidak_lengkap > 0}
					<a
						href="/santri?incomplete=true"
						class="group flex flex-col justify-between rounded-2xl border border-warning/40 bg-warning/10 p-5 transition-colors hover:border-warning hover:bg-warning/20">
						<span class="text-sm font-medium text-warning-content">Data belum lengkap</span>
						<div class="mt-2 flex items-baseline justify-between">
							<span class="font-mono text-3xl font-bold text-warning-content">{rekap.tidak_lengkap}</span>
							<span class="text-xs text-warning-content/80 group-hover:underline">Lengkapi &rarr;</span>
						</div>
					</a>
				{/if}
				<div class="rounded-2xl border border-base-300 bg-base-100 p-5">
					<span class="text-sm text-base-content/70">Laki-laki</span>
					<span class="mt-2 block font-mono text-3xl">{laki}</span>
				</div>
				<div class="rounded-2xl border border-base-300 bg-base-100 p-5">
					<span class="text-sm text-base-content/70">Perempuan</span>
					<span class="mt-2 block font-mono text-3xl">{perempuan}</span>
				</div>
			</section>
		{/if}

		{#if enabledMetrics.includes('status') || enabledMetrics.includes('gender')}
			<section class="mt-4 grid gap-4 lg:grid-cols-2" aria-label="Perbandingan">
				{#if enabledMetrics.includes('status')}
					<div class="rounded-2xl border border-base-300 bg-base-100 p-5">
						<h2 class="text-sm font-semibold">Status santri</h2>
						<div class="mt-2">
							<BarList rows={statusRows} max={rekap.total} />
						</div>
					</div>
				{/if}
				{#if enabledMetrics.includes('gender')}
					<div class="rounded-2xl border border-base-300 bg-base-100 p-5">
						<h2 class="text-sm font-semibold">Jenis kelamin</h2>
						<div class="mt-2">
							<BarList rows={genderRows} max={genderMax} />
						</div>
					</div>
				{/if}
			</section>
		{/if}

		{#if enabledMetrics.includes('kamar') || enabledMetrics.includes('kelas')}
			<section class="mt-4 grid gap-4 lg:grid-cols-2" aria-label="Kelompok">
				{#if enabledMetrics.includes('kamar')}
					<div class="rounded-2xl border border-base-300 bg-base-100 p-5">
						<h2 class="text-sm font-semibold">Per kamar</h2>
						<div class="mt-2">
							<BarList rows={kamarRows} max={Math.max(0, ...kamarRows.map((r) => r.value))} />
						</div>
					</div>
				{/if}
				{#if enabledMetrics.includes('kelas')}
					<div class="rounded-2xl border border-base-300 bg-base-100 p-5">
						<h2 class="text-sm font-semibold">Per kelas</h2>
						<div class="mt-2">
							<BarList rows={kelasRows} max={Math.max(0, ...kelasRows.map((r) => r.value))} />
						</div>
					</div>
				{/if}
			</section>
		{/if}

		{#if enabledMetrics.includes('daerah')}
			<section class="mt-4 rounded-2xl border border-base-300 bg-base-100 p-5" aria-label="Asal daerah">
				<h2 class="text-sm font-semibold">Per daerah asal</h2>
				<div class="mt-2">
					<BarList rows={daerahRows} max={Math.max(0, ...daerahRows.map((r) => r.value))} />
				</div>
			</section>
		{/if}

		{#if enabledMetrics.includes('alumni') && alumniRows.length > 0}
			<section class="mt-4 rounded-2xl border border-base-300 bg-base-100 p-5" aria-label="Statistik alumni">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<IconAward class="size-4 text-primary" stroke-width={1.75} />
						<h2 class="text-sm font-semibold">Statistik Alumni</h2>
					</div>
					<a href="/santri/alumni" class="text-xs text-primary hover:underline">Lihat semua &rarr;</a>
				</div>
				<p class="mt-1 text-xs text-base-content/60">Total {totalAlumni} alumni tercatat.</p>
				<div class="mt-3">
					<BarList rows={alumniRows} max={Math.max(0, ...alumniRows.map((r) => r.value))} />
				</div>
			</section>
		{/if}
	{/if}
{:else}
		<div class="mt-6 rounded-lg border border-base-300 bg-base-100 p-6">
			<p class="text-base-content/70">
				Rekapitulasi tidak dapat ditampilkan untuk akun ini.
			</p>
			{#if rekapError}
				<p class="mt-2 text-sm text-error" role="alert">Penyebab teknis: {rekapError}</p>
			{:else}
				<p class="mt-2 max-w-[65ch] text-sm text-base-content/60">
					Pastikan peran Anda memiliki izin <span class="font-medium">Dashboard rekap</span> (Rekapitulasi hanya bisa
					dilihat oleh Superadmin, Admin TU, atau Asatidz). Jika Anda Superadmin/Admin, periksa pada
					Pengaturan → Peran & Izin bahwa kemampuan <em>Dashboard rekap</em> aktif.
				</p>
				<a href="/pengaturan?tab=permissions" class="btn btn-outline btn-sm mt-4">Buka Peran & Izin</a>
			{/if}
		</div>
	{/if}