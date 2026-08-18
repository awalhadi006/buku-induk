<script lang="ts">
	import { STATUS_SANTRI_LABEL } from '$lib/santri';
	import { photoUrl } from '$lib/gdrive-url';

	type SantriForCard = {
		id: string;
		nama_lengkap: string;
		nis: string | null;
		nisn: string | null;
		tempat_lahir: string | null;
		tanggal_lahir: string | null;
		status_santri: string;
		foto_url: string | null;
		kamar_id: number | null;
		wali_santri_id: string | null;
		alamat: string | null;
		kamar_nomor: number | null;
		wali: { label: string; no_hp: string; alamat: string } | null;
	};

	type Kelas = { tingkat: string; rombel: string; tahun_ajaran: string | null };

	let { data } = $props();

	const kelas = $derived(data.kelas as Kelas);
	const santriList = $derived(data.santri as SantriForCard[]);

	const title = `Kartu Santri ${kelas.tingkat} ${kelas.rombel}${kelas.tahun_ajaran ? ` (${kelas.tahun_ajaran})` : ''}`;

	function getKelasLabel(k: Kelas) {
		return `${k.tingkat}${k.rombel}`;
	}
</script>

<svelte:head>
	<title>{title} | Buku Induk</title>
</svelte:head>

<div class="flex flex-col items-center justify-center gap-8 py-8 print:py-0">
	<div class="flex flex-wrap items-center justify-center gap-6 print:gap-4">
		{#each santriList as s (s.id)}
			<!-- KARTU SANTRI CONTAINER -->
			<div class="flex flex-col gap-6 sm:flex-row print:flex-row print:gap-4 print:mb-4">
				<!-- SISI DEPAN (FRONT) -->
				<div
					class="relative flex h-[54mm] w-[85.6mm] flex-col justify-between overflow-hidden rounded-xl border border-gray-300 bg-gradient-to-br from-primary/10 via-base-100 to-primary/5 p-3.5 shadow-md print:shadow-none print:border-black">
					<!-- HEADER -->
					<div class="flex items-center gap-2 border-b border-primary/20 pb-2">
						<span class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-content">
							BI
						</span>
						<div class="min-w-0 flex-1">
							<h1 class="truncate text-[10px] font-bold uppercase tracking-wider text-primary">Kartu Tanda Santri</h1>
							<p class="truncate text-[8px] font-semibold text-base-content/70">Pondok Pesantren Buku Induk</p>
						</div>
					</div>

					<!-- BODY (FOTO & DATA) -->
					<div class="my-auto flex gap-3 pt-1">
						<!-- FOTO SANTRI -->
						<div class="size-[22mm] shrink-0 overflow-hidden rounded-lg border border-base-300 bg-base-200 shadow-inner flex items-center justify-center text-[8px] text-base-content/40">
							{#if s.foto_url}
								<img src={photoUrl(s.foto_url)} alt="Foto" class="h-full w-full object-cover" />
							{:else}
									Foto 3x4
							{/if}
						</div>

						<!-- DATA SINGKAT -->
						<div class="min-w-0 flex-1 space-y-0.5 text-[8.5px]">
							<p class="truncate font-bold text-base-content leading-tight text-[9.5px]">{s.nama_lengkap}</p>
							<p class="text-base-content/70"><span class="font-semibold">NIS:</span> {s.nis || '-'}</p>
							<p class="text-base-content/70"><span class="font-semibold">NISN:</span> {s.nisn || '-'}</p>
							<p class="text-base-content/70">
								<span class="font-semibold">Kelas / Kamar:</span>
								{getKelasLabel(kelas)} / {s.kamar_nomor ? `K.${s.kamar_nomor}` : '-'}
							</p>
							<p class="text-base-content/70">
								<span class="font-semibold">TTL:</span> {s.tempat_lahir || '-'}, {s.tanggal_lahir || '-'}
							</p>
						</div>
					</div>

					<!-- FOOTER DEPAN -->
					<div class="flex items-center justify-between border-t border-primary/20 pt-1 text-[7px] text-base-content/60">
						<span>Status: <strong class="text-primary">{STATUS_SANTRI_LABEL[s.status_santri] ?? s.status_santri}</strong></span>
						<span>Berlaku selama menjadi santri</span>
					</div>
				</div>

				<!-- SISI BELAKANG (BACK) -->
				<div
					class="relative flex h-[54mm] w-[85.6mm] flex-col justify-between overflow-hidden rounded-xl border border-gray-300 bg-base-100 p-3.5 shadow-md print:shadow-none print:border-black">
					<div class="space-y-1 text-[8px] text-base-content/80">
						<h2 class="font-bold text-center text-[9px] uppercase border-b border-base-200 pb-1">Ketentuan & Kontak Wali</h2>
						<ol class="list-decimal pl-3 space-y-0.5 text-[7.5px]">
							<li>Kartu ini adalah bukti identitas sah santri Pondok Pesantren.</li>
							<li>Harap dibawa dan ditunjukkan saat kegiatan/perizinan pesantren.</li>
							<li>Jika menemukan kartu ini, mohon kembalikan ke sekretariat pesantren.</li>
						</ol>
					</div>

					<!-- DATA WALI / KONTAK -->
					<div class="rounded-lg bg-base-200/60 p-1.5 text-[7.5px]">
						<p class="font-semibold truncate">Wali: {s.wali?.label ?? '-'}</p>
						<p class="truncate text-base-content/70">HP Wali: {s.wali?.no_hp ?? '-'}</p>
						<p class="truncate text-base-content/70">Alamat: {s.alamat || s.wali?.alamat || '-'}</p>
					</div>

					<!-- TTD / STEMPEL Pesantren -->
					<div class="flex items-end justify-between text-[7px]">
						<div>
							<p class="text-base-content/50">Diterbitkan oleh:</p>
							<p class="font-semibold">Sekretariat Pengurus</p>
						</div>
						<div class="text-center">
							<p class="text-base-content/60">Pengurus Pesantren,</p>
							<div class="h-4"></div>
							<p class="font-bold underline">( TTD & Stempel )</p>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- TOMBOL AKSI CETAK -->
	<div class="text-center print:hidden">
		<button class="btn btn-primary btn-sm" onclick={() => window.print()}>Cetak Semua Kartu</button>
		<a class="btn btn-ghost btn-sm ml-2" href="/kelas/{kelas.tingkat}-{kelas.rombel}">Kembali</a>
	</div>
</div>

<style>
	@media print {
		body {
			background: white !important;
		}
		/* Page breaks between cards */
		.flex-wrap > .flex-col:not(:last-child) {
			page-break-after: always;
		}
	}
</style>
