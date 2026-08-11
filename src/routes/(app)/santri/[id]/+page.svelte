<script lang="ts">
	import { page } from '$app/state';
	import SantriForm from '$lib/components/SantriForm.svelte';
	import { GENDER_LABEL, STATUS_KELUARGA_LABEL, STATUS_SANTRI_LABEL } from '$lib/santri';

	let { data } = $props();

	let editing = $state(false);

	const s = $derived(data.santri as Record<string, any>);
	const profile = $derived((page.data.profile as { peran: string } | null) ?? null);
	const canDelete = $derived(profile ? ['superadmin', 'admin_tu'].includes(profile.peran) : false);

	const kamar = $derived(data.kamar as { id: number; nomor: number }[]);
	const kelas = $derived(data.kelas as { id: number; tingkat: string; rombel: string }[]);
	const wali = $derived(data.wali as { id: string; label: string }[]);

	const kamarNomor = $derived(kamar.find((k) => k.id === s.kamar_id)?.nomor ?? null);
	const kelasLabel = $derived(kelas.find((k) => k.id === s.kelas_id) ?? null);
	const waliLabel = $derived(wali.find((w) => w.id === s.wali_santri_id)?.label ?? null);

	const d = (v: string | null) => {
		if (!v) return null;
		const date = new Date(`${v}T00:00:00`);
		return Number.isNaN(date.getTime()) ? v : date.toLocaleDateString('id-ID');
	};

	function toEdit(): Record<string, string> {
		const out: Record<string, string> = {};
		for (const k of Object.keys(s)) out[k] = s[k] == null ? '' : String(s[k]);
		return out;
	}

	const detailSections = $derived([
		{
			label: 'Identitas',
			rows: [
				['Nama lengkap', s.nama_lengkap],
				['Nama panggilan', s.nama_panggilan],
				['NISN', s.nisn],
				['NIK', s.nik],
				['NIS', s.nis],
				['NIPD', s.nipd],
				[
					'Tempat, tanggal lahir',
					[s.tempat_lahir, d(s.tanggal_lahir)].filter(Boolean).join(', ') || null
				],
				['Jenis kelamin', GENDER_LABEL[s.jenis_kelamin] ?? s.jenis_kelamin],
				['Agama', s.agama],
				['Kewarganegaraan', s.kewarganegaraan]
			] as [string, string | null][]
		},
		{
			label: 'Alamat & kontak',
			rows: [
				['Alamat', s.alamat],
				['RT/RW', [s.rt, s.rw].filter(Boolean).join(' / ') || null],
				['Desa/kelurahan', s.desa],
				['Kecamatan', s.kecamatan],
				['Kabupaten', s.kabupaten],
				['No. HP', s.no_hp],
				['Tempat tinggal', s.tempat_tinggal],
				['Transportasi', s.transportasi],
				['Anak ke', s.anak_ke != null ? String(s.anak_ke) : null]
			] as [string, string | null][]
		},
		{
			label: 'Status & keaktifan',
			rows: [
				['Status santri', STATUS_SANTRI_LABEL[s.status_santri] ?? s.status_santri],
				['Status keluarga', STATUS_KELUARGA_LABEL[s.status_keluarga] ?? s.status_keluarga],
				['Tanggal masuk', d(s.tanggal_masuk)],
				['Asal sekolah', s.asal_sekolah],
				['Jalur masuk', s.jalur_masuk],
				['Penerima bantuan (KIP/PIP/KPS/PKH)', s.bantuan_kip]
			] as [string, string | null][]
		},
		{
			label: 'Penempatan',
			rows: [
				['Kamar', kamarNomor != null ? `Kamar ${kamarNomor}` : null],
				['Kelas', kelasLabel ? `${kelasLabel.tingkat} ${kelasLabel.rombel}` : null],
				['Wali santri', waliLabel],
				['Foto', s.foto_url]
			] as [string, string | null][]
		},
		{
			label: 'Kelengkapan dokumen',
			rows: [
				['Nomor akta', s.no_akta],
				['Nomor KK', s.no_kk]
			] as [string, string | null][]
		}
	]);
</script>

<svelte:head>
	<title>{s.nama_lengkap} | Buku Induk</title>
</svelte:head>

<header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
	<div class="flex items-center gap-3">
		<a class="btn btn-ghost btn-sm" href="/santri" aria-label="Kembali ke daftar santri">
			&larr;
		</a>
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">{s.nama_lengkap}</h1>
			<p class="mt-0.5 font-mono text-sm text-base-content/60">{s.nisn || s.nis || s.nik || '—'}</p>
		</div>
	</div>

	{#if !editing}
		<div class="flex gap-2">
			<button class="btn btn-outline btn-sm" onclick={() => (editing = true)}>Edit</button>
			{#if canDelete}
				<form
					method="POST"
					action="?/delete"
					onsubmit={() => confirm('Yakin menghapus santri ini? Tindakan ini permanen.')}>
					<button class="btn btn-error btn-outline btn-sm" type="submit">Hapus</button>
				</form>
			{/if}
		</div>
	{/if}
</header>

{#if editing}
	<div class="mt-6">
		<SantriForm
			values={toEdit()}
			kamar={kamar}
			kelas={kelas}
			wali={wali}
			action="?/update"
			submitLabel="Simpan perubahan"
			cancelHref="/santri/{s.id}" />
	</div>
{:else}
	<div class="mt-6 space-y-4">
		{#each detailSections as sec (sec.label)}
			<section class="rounded-2xl border border-base-300 bg-base-100 p-5">
				<h2 class="text-sm font-semibold">{sec.label}</h2>
				<dl class="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
					{#each sec.rows as [label, value] (label)}
						<div class="min-w-0">
							<dt class="text-xs text-base-content/60">{label}</dt>
							<dd class="truncate text-sm font-medium" title={value ?? undefined}>
								{value ?? '—'}
							</dd>
						</div>
					{/each}
				</dl>
			</section>
		{/each}
	</div>
{/if}
