<script lang="ts">
	import { page } from '$app/state';
	import {
		GENDER_LABEL,
		JENIS_DOKUMEN_LABEL,
		STATUS_KELUARGA_LABEL,
		STATUS_SANTRI_LABEL
	} from '$lib/santri';
	import { photoUrl } from '$lib/gdrive-url';

	let { data } = $props();

	const s = $derived(data.santri as Record<string, any>);
	const kamar = $derived(data.kamar as { id: number; nomor: number }[]);
	const kelas = $derived(data.kelas as { id: number; tingkat: string; rombel: string }[]);
	const wali = $derived(data.wali as { id: string; label: string }[]);

	const kamarNomor = $derived(kamar.find((k) => k.id === s.kamar_id)?.nomor ?? null);
	const kelasLabel = $derived(kelas.find((k) => k.id === s.kelas_id) ?? null);
	const waliLabel = $derived(wali.find((w) => w.id === s.wali_santri_id)?.label ?? null);
	const foto = $derived(photoUrl(s.foto_url));

	const d = (v: string | null) => {
		if (!v) return null;
		const date = new Date(`${v}T00:00:00`);
		return Number.isNaN(date.getTime()) ? v : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
	};

	const sections = $derived([
		{
			label: 'I. KETERANGAN PRIBADI SANTRI',
			rows: [
				['1. Nama Lengkap', s.nama_lengkap],
				['2. Nama Panggilan', s.nama_panggilan],
				['3. NISN / NIK', [s.nisn, s.nik].filter(Boolean).join(' / ') || null],
				['4. NIS', s.nis || null],
				['5. Tempat, Tanggal Lahir', [s.tempat_lahir, d(s.tanggal_lahir)].filter(Boolean).join(', ') || null],
				['6. Jenis Kelamin', GENDER_LABEL[s.jenis_kelamin] ?? s.jenis_kelamin],
				['7. Agama', s.agama],
				['8. Kewarganegaraan', s.kewarganegaraan],
				['9. Anak ke-', s.anak_ke != null ? String(s.anak_ke) : null],
				['10. Status Keluarga', STATUS_KELUARGA_LABEL[s.status_keluarga] ?? s.status_keluarga]
			] as [string, string | null][]
		},
		{
			label: 'II. KETERANGAN TEMPAT TINGGAL & KONTAK',
			rows: [
				['11. Alamat', s.alamat],
				['12. RT / RW', [s.rt, s.rw].filter(Boolean).join(' / ') || null],
				['13. Desa / Kelurahan', s.desa],
				['14. Kecamatan', s.kecamatan],
				['15. Kabupaten / Kota', s.kabupaten],
				['16. Nomor HP', s.no_hp],
				['17. Tempat Tinggal', s.tempat_tinggal],
				['18. Transportasi', s.transportasi]
			] as [string, string | null][]
		},
		{
			label: 'III. KETERANGAN PENDIDIKAN & PENEMPATAN',
			rows: [
				['19. Status Santri', STATUS_SANTRI_LABEL[s.status_santri] ?? s.status_santri],
				['20. Tanggal Masuk', d(s.tanggal_masuk)],
				['21. Asal Sekolah', s.asal_sekolah],
				['22. Jalur Masuk', s.jalur_masuk],
				['23. Penerima Bantuan (KIP/PIP)', s.bantuan_kip],
				['24. Kamar Asrama', kamarNomor != null ? `Kamar ${kamarNomor}` : null],
				['25. Kelas Madin / Formal', kelasLabel ? `${kelasLabel.tingkat} ${kelasLabel.rombel}` : null]
			] as [string, string | null][]
		},
		{
			label: 'IV. KETERANGAN WALI SANTRI',
			rows: [
				['26. Orang Tua / Wali', waliLabel]
			] as [string, string | null][]
		}
	]);
</script>

<svelte:head>
	<title>Kutipan Buku Induk - {s.nama_lengkap} | Buku Induk</title>
</svelte:head>

<div class="mx-auto max-w-[210mm] bg-white p-8 text-black shadow-sm print:shadow-none print:p-0">
	<!-- KOP SURAT -->
	<div class="border-b-2 border-black pb-4 text-center">
		<h1 class="text-xl font-bold uppercase tracking-wider">Kutipan Buku Induk Santri</h1>
		<h2 class="text-lg font-semibold">PONDOK PESANTREN</h2>
		<p class="text-xs text-gray-600">Arsip Resmi Data Santri Pesantren</p>
	</div>

	<!-- FOTO & INFO UTAMA -->
	<div class="mt-6 flex items-start justify-between gap-6">
		<div class="space-y-1 text-sm">
			<p><span class="font-semibold w-36 inline-block">Nama Lengkap:</span> {s.nama_lengkap}</p>
			<p><span class="font-semibold w-36 inline-block">Nomor Induk (NIS):</span> {s.nis || '-'}</p>
			<p><span class="font-semibold w-36 inline-block">NISN:</span> {s.nisn || '-'}</p>
			<p><span class="font-semibold w-36 inline-block">Status Aktif:</span> {STATUS_SANTRI_LABEL[s.status_santri] ?? s.status_santri}</p>
		</div>
		<div class="size-28 shrink-0 overflow-hidden rounded border border-gray-400 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
			{#if foto}
				<img src={foto} alt="Foto santri" class="h-full w-full object-cover" />
			{:else}
				Foto 3x4
			{/if}
		</div>
	</div>

	<!-- TABEL DETAIL -->
	<div class="mt-6 space-y-6 text-sm">
		{#each sections as sec (sec.label)}
			<div>
				<h3 class="font-bold bg-gray-100 px-2 py-1 border border-gray-300">{sec.label}</h3>
				<table class="w-full border-collapse border border-gray-300 mt-1">
					<tbody>
						{#each sec.rows as [label, value] (label)}
							<tr>
								<td class="w-1/3 border border-gray-300 px-2 py-1 font-medium text-gray-700">{label}</td>
								<td class="w-2/3 border border-gray-300 px-2 py-1">{value ?? '—'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/each}
	</div>

	<!-- TANDA TANGAN -->
	<div class="mt-10 flex justify-between text-sm">
		<div></div>
		<div class="text-center">
			<p>Pesantren, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
			<p class="font-semibold mt-1">Pengurus Administrasi / TU</p>
			<div class="h-16"></div>
			<p class="font-semibold underline">( . . . . . . . . . . . . . . . . . . . . . . )</p>
		</div>
	</div>
</div>

<div class="mt-6 text-center print:hidden">
	<button class="btn btn-primary btn-sm" onclick={() => window.print()}>Cetak / Simpan PDF</button>
	<a class="btn btn-ghost btn-sm ml-2" href="/santri/{s.id}">Kembali</a>
</div>

<style>
	@media print {
		body {
			background: white !important;
			color: black !important;
		}
	}
</style>
