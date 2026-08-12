<script lang="ts">
	import { IconFileDownload, IconFileUpload, IconFileImport } from '@tabler/icons-svelte';

	type ImportError = { row: number; nama: string; reason: string };

	let { form } = $props();

	const actionError = $derived((form as { error?: string } | null)?.error ?? null);
	const result = $derived(
		form && typeof (form as { berhasil?: number }).berhasil === 'number'
			? (form as { berhasil: number; gagal: number; errors: ImportError[] })
			: null
	);
</script>

<svelte:head>
	<title>Import Excel | Buku Induk</title>
</svelte:head>

<header>
	<h1 class="text-2xl font-semibold tracking-tight">Import Excel</h1>
	<p class="mt-1 max-w-[65ch] text-base-content/70">
		Download template Excel yang sudah berisi 38 kolom data santri. Isi data di sheet "santri", lalu upload file.
		Sheet "Panduan" berisi contoh pengisian. Data wali (nama ayah/ibu/wali) otomatis tercatat.
	</p>
</header>

{#if actionError}
	<div class="alert alert-error mt-6" role="alert">
		<span>{actionError}</span>
	</div>
{/if}

{#if result}
	<div class="mt-6 rounded-2xl border border-base-300 bg-base-100 p-5">
		<h2 class="text-sm font-semibold">Hasil import</h2>
		<div class="mt-3 flex gap-6">
			<p class="text-sm">
				<span class="font-semibold text-success">{result.berhasil}</span> baris berhasil
			</p>
			<p class="text-sm">
				<span class="font-semibold text-error">{result.gagal}</span> baris gagal
			</p>
		</div>
		{#if result.errors.length > 0}
			<div class="mt-4 overflow-x-auto rounded-xl border border-base-300">
				<table class="table table-sm">
					<thead>
						<tr class="text-xs uppercase tracking-wide text-base-content/60">
							<th>Baris</th>
							<th>Nama</th>
							<th>Alasan</th>
						</tr>
					</thead>
					<tbody>
						{#each result.errors as e (e.row + e.nama + e.reason)}
							<tr>
								<td class="font-mono">{e.row}</td>
								<td>{e.nama || '—'}</td>
								<td class="text-error">{e.reason}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
{/if}

<div class="mt-6 grid gap-4 lg:grid-cols-2">
	<a
		href="/template-import-santri.xlsx?v=2"
		download="template-import-santri.xlsx"
		class="rounded-2xl border border-base-300 bg-base-100 p-5">
		<span class="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
			<IconFileDownload class="size-5" stroke-width={1.75} />
		</span>
		<h2 class="mt-3 text-sm font-semibold">1. Download template</h2>
		<p class="mt-1 text-sm text-base-content/60">
			Template Excel siap isi (38 kolom). Unduh, isi, lalu upload kembali.
		</p>
	</a>

	<form
		method="POST"
		action="?/upload"
		enctype="multipart/form-data"
		class="rounded-2xl border border-base-300 bg-base-100 p-5">
		<span class="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
			<IconFileUpload class="size-5" stroke-width={1.75} />
		</span>
		<h2 class="mt-3 text-sm font-semibold">2. Upload file terisi</h2>
		<p class="mt-1 text-sm text-base-content/60">
			File Excel (.xlsx atau .xls) yang sudah diisi.
		</p>
		<label class="mt-4 block">
			<span class="mb-1.5 block text-sm font-medium">File Excel</span>
			<input
				class="file-input file-input-bordered w-full"
				type="file"
				name="file"
				accept=".xlsx,.xls"
				required />
		</label>
		<button type="submit" class="btn btn-primary btn-sm mt-4">
			<IconFileImport class="size-4" stroke-width={2} />
			Import
		</button>
	</form>
</div>
