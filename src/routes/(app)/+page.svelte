<script lang="ts">
	import { page } from '$app/state';
	import { IconAward } from '@tabler/icons-svelte';
	import BarList from '$lib/components/BarList.svelte';
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

<!-- Skip link: first focusable element -->
<a
	href="#main-content"
	class="btn btn-primary btn-sm fixed left-4 top-4 z-50 -translate-y-20 focus-visible:translate-y-0 motion-reduce:transition-none">
	Lewati ke konten utama
</a>

<header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

<main id="main-content" class="mt-6">

{#if rekap}
	{#if rekap.total === 0}
		<div class="mt-6" role="status">
			<div class="alert alert-soft alert-info">
				<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
				<div>
					<h2 class="font-bold">Belum ada data santri</h2>
					<div class="text-xs">Rekapitulasi muncul setelah data santri diimpor atau ditambahkan.</div>
				</div>
				<div class="flex flex-wrap gap-2 mt-4">
					{#if canImport}
						<a class="btn btn-primary btn-sm" href="/import">Import Excel</a>
					{/if}
					<a class="btn btn-outline btn-sm" href="/santri">Lihat santri</a>
				</div>
			</div>
		</div>
	{:else}
		{#if enabledMetrics.includes('total')}
			<section class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Angka utama">
				<div class="card card-border bg-base-100 p-5 lg:col-span-2">
					<div class="text-sm text-base-content/70">Total santri</div>
					<div class="mt-2 font-mono text-5xl" data-visual-test-mask>{rekap.total}</div>
				</div>
				{#if rekap.tidak_lengkap != null && rekap.tidak_lengkap > 0}
					<a
						href="/santri?incomplete=true"
						class="card card-border bg-warning/10 border-warning/40 p-5 hover:border-warning hover:bg-warning/20 transition-colors">
						<div class="text-sm font-medium text-warning-content">Data belum lengkap</div>
						<div class="mt-2 flex items-baseline justify-between">
							<div class="font-mono text-3xl font-bold text-warning-content" data-visual-test-mask>{rekap.tidak_lengkap}</div>
							<span class="text-xs text-warning-content/80 underline">Lengkapi &rarr;</span>
						</div>
					</a>
				{/if}
				<div class="card card-border bg-base-100 p-5">
					<div class="text-sm text-base-content/70">Laki-laki</div>
					<div class="mt-2 font-mono text-3xl" data-visual-test-mask>{laki}</div>
				</div>
				<div class="card card-border bg-base-100 p-5">
					<div class="text-sm text-base-content/70">Perempuan</div>
					<div class="mt-2 font-mono text-3xl" data-visual-test-mask>{perempuan}</div>
				</div>
			</section>
		{/if}

		{#if enabledMetrics.includes('status') || enabledMetrics.includes('gender')}
			<section class="mt-4 grid gap-4 lg:grid-cols-2" aria-label="Perbandingan">
				{#if enabledMetrics.includes('status')}
					<div class="card card-border bg-base-100 p-5">
						<h2 class="text-sm font-semibold">Status santri</h2>
						<div class="mt-2">
							<BarList rows={statusRows} max={rekap.total} />
						</div>
					</div>
				{/if}
				{#if enabledMetrics.includes('gender')}
					<div class="card card-border bg-base-100 p-5">
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
					<div class="card card-border bg-base-100 p-5">
						<h2 class="text-sm font-semibold">Per kamar</h2>
						<div class="mt-2">
							<BarList rows={kamarRows} max={Math.max(0, ...kamarRows.map((r) => r.value))} />
						</div>
					</div>
				{/if}
				{#if enabledMetrics.includes('kelas')}
					<div class="card card-border bg-base-100 p-5">
						<h2 class="text-sm font-semibold">Per kelas</h2>
						<div class="mt-2">
							<BarList rows={kelasRows} max={Math.max(0, ...kelasRows.map((r) => r.value))} />
						</div>
					</div>
				{/if}
			</section>
		{/if}

		{#if enabledMetrics.includes('daerah')}
			<section class="mt-4 card card-border bg-base-100 p-5" aria-label="Asal daerah">
				<h2 class="text-sm font-semibold">Per daerah asal</h2>
				<div class="mt-2">
					<BarList rows={daerahRows} max={Math.max(0, ...daerahRows.map((r) => r.value))} />
				</div>
			</section>
		{/if}

		{#if enabledMetrics.includes('alumni') && alumniRows.length > 0}
			<section class="mt-4 card card-border bg-base-100 p-5" aria-label="Statistik alumni">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<IconAward class="size-4 text-primary" stroke-width={1.75} />
						<h2 class="text-sm font-semibold">Statistik Alumni</h2>
					</div>
					<a href="/santri/alumni" class="text-xs text-primary hover:underline">Lihat semua &rarr;</a>
				</div>
				<p class="mt-1 text-xs text-base-content/60">Total <span data-visual-test-mask>{totalAlumni}</span> alumni tercatat.</p>
				<div class="mt-3">
					<BarList rows={alumniRows} max={Math.max(0, ...alumniRows.map((r) => r.value))} />
				</div>
			</section>
		{/if}
	{/if}
{:else}
		<div class="mt-6" role="alert">
			<div class="alert alert-soft alert-error">
				<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
				<div>
					<h3 class="font-bold">Rekapitulasi tidak tersedia</h3>
					{#if rekapError}
						<div class="text-xs mt-1">Penyebab teknis: {rekapError}</div>
					{:else}
						<div class="text-xs mt-1 max-w-[65ch]">
							Pastikan peran Anda memiliki izin <span class="font-medium">Dashboard rekap</span> (Rekapitulasi hanya bisa
							dilihat oleh Superadmin, Admin TU, atau Asatidz). Jika Anda Superadmin/Admin, periksa pada
							Pengaturan → Peran & Izin bahwa kemampuan <em>Dashboard rekap</em> aktif.
						</div>
						<a href="/pengaturan?tab=permissions" class="btn btn-outline btn-sm mt-4">Buka Peran & Izin</a>
					{/if}
</div>
		</div>
	</div>
	{/if}

</main>