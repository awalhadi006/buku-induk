<script lang="ts">
	import { IconSparkles } from '@tabler/icons-svelte';
</script>

<svelte:head>
	<title>Apa yang Baru | Buku Induk</title>
</svelte:head>

<header class="flex items-center gap-3">
	<span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
		<IconSparkles class="size-5" stroke-width={1.75} />
	</span>
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Apa yang Baru?</h1>
		<p class="mt-0.5 text-base-content/70">
			Catatan pembaruan dan fitur-fitur baru di aplikasi Buku Induk Santri.
		</p>
	</div>
</header>

<div class="mt-8 space-y-6">
	<article class="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
		<div class="flex items-center justify-between border-b border-base-200 pb-3">
			<h2 class="text-lg font-semibold text-primary">Pembaruan 13 Agustus 2026</h2>
			<span class="badge badge-primary badge-sm">Terbaru</span>
		</div>
		<ul class="mt-4 space-y-3 text-sm text-base-content/80">
			<li class="flex items-start gap-2">
				<span class="font-bold text-primary">&bull;</span>
				<div>
					<strong>Filter Lanjutan Santri:</strong> Memudahkan pencarian santri berdasarkan Kamar, Kelas, Status Santri, Status Keluarga, dan Jenis Kelamin.
				</div>
			</li>
			<li class="flex items-start gap-2">
				<span class="font-bold text-primary">&bull;</span>
				<div>
					<strong>Rekap per Kamar & Kelas:</strong> Halaman khusus rekapitulasi data jumlah santri dalam bentuk tabel yang rapi dan siap dicetak.
				</div>
			</li>
			<li class="flex items-start gap-2">
				<span class="font-bold text-primary">&bull;</span>
				<div>
					<strong>Histori Perpindahan:</strong> Catatan otomatis riwayat perpindahan kamar, kelas, dan perubahan status santri di halaman detail santri.
				</div>
			</li>
			<li class="flex items-start gap-2">
				<span class="font-bold text-primary">&bull;</span>
				<div>
					<strong>Ekspor CSV:</strong> Kemudahan mengunduh seluruh data santri ke dalam format CSV yang ringan dan dapat dibuka di Microsoft Excel.
				</div>
			</li>
		</ul>
	</article>
</div>
