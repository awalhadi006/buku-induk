<script lang="ts">
	import SantriForm from '$lib/components/SantriForm.svelte';
	import { EMPTY_SANTRI } from '$lib/santri';

	let { data } = $props();
</script>

<svelte:head>
	<title>Tambah Santri | Buku Induk</title>
</svelte:head>

<header class="flex items-center gap-3">
	<a class="btn btn-ghost btn-sm" href="/santri" aria-label="Kembali ke daftar santri">
		&larr;
	</a>
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Tambah Santri</h1>
		<p class="mt-1 text-base-content/70">Isi identitas santri sesuai buku induk.</p>
	</div>
</header>

<div class="mt-6">
	<SantriForm
		values={EMPTY_SANTRI}
		kamar={data.kamar}
		kelas={data.kelas}
		wali={data.wali}
		action="?/create"
		submitLabel="Simpan santri"
		cancelHref="/santri" />
</div>
