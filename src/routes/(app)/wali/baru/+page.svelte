<script lang="ts">
	import WaliForm from '$lib/components/WaliForm.svelte';
</script>

<svelte:head>
	<title>Tambah Wali Santri | Buku Induk</title>
</svelte:head>

<header class="flex items-center gap-3">
	<a class="btn btn-ghost btn-sm" href="/wali" aria-label="Kembali ke daftar wali santri">
		&larr;
	</a>
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Tambah Wali Santri</h1>
		<p class="mt-0.5 text-sm text-base-content/60">
			Isi minimal satu nama. Satu entitas wali bisa menaungi beberapa santri.
		</p>
	</div>
</header>

<div class="mt-6">
	<WaliForm action="?/create" submitLabel="Simpan wali" cancelHref="/wali" />
</div>
