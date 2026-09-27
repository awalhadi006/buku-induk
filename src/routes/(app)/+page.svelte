<script lang="ts">
	import { page } from '$app/state';
	import { IconAward, IconInbox, IconAlertCircle } from '@tabler/icons-svelte';
	import BarList from '$lib/components/BarList.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { PageSkeleton } from '$lib/components/Skeleton.svelte';
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

	// Computed stat cards for the stats grid
	const statCards = $derived([
		{
			title: 'Total santri',
			value: rekap?.total ?? 0,
			desc: 'Seluruh santri tercatat',
			icon: IconAward,
			colSpan: 2
		},
		...(rekap?.tidak_lengkap != null && rekap.tidak_lengkap > 0
			? [
					{
						title: 'Data belum lengkap',
						value: rekap.tidak_lengkap,
						desc: 'Klik untuk melengkapi',
						icon: null,
						colSpan: 1,
						isWarning: true,
						href: '/santri?incomplete=true'
					}
				]
			: []),
		{
			title: 'Laki-laki',
			value: laki,
			desc: 'Santri putra',
			icon: null,
			colSpan: 1
		},
		{
			title: 'Perempuan',
			value: perempuan,
			desc: 'Santri putri',
			icon: null,
			colSpan: 1
		}
	]);
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

<PageHeader title="Rekapitulasi" desc="Ringkasan data santri untuk akun {peranDisp}.">
	{#snippet actions()}
		{#if data.tahunAjaranAktif}
			<span
				class="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
				title="Tahun ajaran aktif">
				<span class="size-1.5 rounded-full bg-primary" aria-hidden="true"></span>
				T.A. {data.tahunAjaranAktif}
			</span>
		{/if}
	{/snippet}
</PageHeader>

<main id="main-content" class="mt-6">

{#if rekap}
	{#if rekap.total === 0}
		<div class="mt-6" role="status">
			<EmptyState
				title="Belum ada data santri"
				desc="Rekapitulasi muncul setelah data santri diimpor atau ditambahkan."
				Icon={IconInbox}
				action={{ label: 'Import Excel', variant: 'primary', onclick: () => (window.location.href = '/import') }}
			/>
		</div>
	{:else}
		{#if enabledMetrics.includes('total')}
			<!-- Stats Grid using daisyUI stats component -->
			<section class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Angka utama">
				{#each statCards as card (card.title)}
					<div
						class="stat bg-base-100 shadow-sm p-5 {card.colSpan === 2 ? 'lg:col-span-2' : ''} {card.isWarning ? 'bg-warning/10 border-warning/40' : ''}"
						style="background: var(--color-card-elevated);">
						<div class="stat-figure">
							{#if card.icon}
								<card.icon class="size-6 text-primary" stroke-width={1.75} />
							{/if}
						</div>
						<div class="stat-title text-base-content/70">{card.title}</div>
						<div class="stat-value text-3xl font-bold text-primary" data-visual-test-mask>{card.value}</div>
						<div class="stat-desc text-sm text-base-content/60">{card.desc}</div>
						{#if card.href}
							<a href={card.href} class="stat-figure text-xs text-primary hover:underline">Lengkapi &rarr;</a>
						{/if}
					</div>
				{/each}
			</section>
		{/if}

		{#if enabledMetrics.includes('status') || enabledMetrics.includes('gender')}
			<section class="mt-4 grid gap-4 lg:grid-cols-2" aria-label="Perbandingan">
				{#if enabledMetrics.includes('status')}
					<div class="card card-border bg-chart-surface p-5" style="background: var(--color-chart-surface);">
						<h2 class="text-sm font-semibold">Status santri</h2>
						<div class="mt-2">
							<BarList rows={statusRows} max={rekap.total} />
						</div>
					</div>
				{/if}
				{#if enabledMetrics.includes('gender')}
					<div class="card card-border bg-chart-surface p-5" style="background: var(--color-chart-surface);">
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
					<div class="card card-border bg-chart-surface p-5" style="background: var(--color-chart-surface);">
						<h2 class="text-sm font-semibold">Per kamar</h2>
						<div class="mt-2">
							<BarList rows={kamarRows} max={Math.max(0, ...kamarRows.map((r) => r.value))} />
						</div>
					</div>
				{/if}
				{#if enabledMetrics.includes('kelas')}
					<div class="card card-border bg-chart-surface p-5" style="background: var(--color-chart-surface);">
						<h2 class="text-sm font-semibold">Per kelas</h2>
						<div class="mt-2">
							<BarList rows={kelasRows} max={Math.max(0, ...kelasRows.map((r) => r.value))} />
						</div>
					</div>
				{/if}
			</section>
		{/if}

		{#if enabledMetrics.includes('daerah')}
			<section class="mt-4 card card-border bg-chart-surface p-5" aria-label="Asal daerah" style="background: var(--color-chart-surface);">
				<h2 class="text-sm font-semibold">Per daerah asal</h2>
				<div class="mt-2">
					<BarList rows={daerahRows} max={Math.max(0, ...daerahRows.map((r) => r.value))} />
				</div>
			</section>
		{/if}

		{#if enabledMetrics.includes('alumni') && alumniRows.length > 0}
			<section class="mt-4 card card-border bg-chart-surface p-5" aria-label="Statistik alumni" style="background: var(--color-chart-surface);">
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
		<EmptyState
			title="Rekapitulasi tidak tersedia"
			desc={rekapError
				? `Penyebab teknis: ${rekapError}`
				: 'Pastikan peran Anda memiliki izin <span class="font-medium">Dashboard rekap</span> (Rekapitulasi hanya bisa dilihat oleh Superadmin, Admin TU, atau Asatidz). Jika Anda Superadmin/Admin, periksa pada Pengaturan → Peran & Izin bahwa kemampuan <em>Dashboard rekap</em> aktif.'}
			Icon={IconAlertCircle}
			action={!rekapError ? { label: 'Buka Peran & Izin', variant: 'outline', onclick: () => (window.location.href = '/pengaturan?tab=permissions') } : undefined}
		/>
	</div>
{/if}

{#if !rekap && !rekapError}
	<!-- Loading state using PageSkeleton -->
	<PageSkeleton />
{/if}

</main>