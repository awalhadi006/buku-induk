<script lang="ts">
	import { IconFileDownload, IconFileUpload, IconFileImport, IconAlertTriangle, IconFilter, IconTable } from '@tabler/icons-svelte';

	type ImportError = { row: number; nama: string; reason: string; kategori: string };

	let { form } = $props();

	const actionError = $derived((form as { error?: string } | null)?.error ?? null);
	const result = $derived(
		form && typeof (form as { berhasil?: number }).berhasil === 'number'
			? (form as { total: number; berhasil: number; gagal: number; errors: ImportError[] })
			: null
	);

	let filterKategori = $state('semua');

	const KATEGORI_LABEL: Record<string, string> = {
		semua: 'Semua',
		wajib: 'Wajib diisi',
		format: 'Format salah',
		referensi: 'Data referensi tidak ditemukan',
		database: 'Database gagal'
	};

	const kategoriCounts = $derived.by(() => {
		const counts: Record<string, number> = { semua: result?.errors.length ?? 0 };
		if (!result) return counts;
		for (const e of result.errors) {
			counts[e.kategori] = (counts[e.kategori] ?? 0) + 1;
		}
		return counts;
	});

	const filteredErrors = $derived.by(() => {
		if (!result) return [];
		if (filterKategori === 'semua') return result.errors;
		return result.errors.filter((e) => e.kategori === filterKategori);
	});

	function downloadCsv() {
		if (!result) return;
		const header = 'Baris;Nama;Alasan;Kategori\n';
		const rows = result.errors.map((e) => `${e.row};"${(e.nama ?? '').replace(/"/g, '""')}";"${e.reason.replace(/"/g, '""')}";"${KATEGORI_LABEL[e.kategori] ?? e.kategori}"`).join('\n');
		const csv = header + rows;
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `laporan-import-${new Date().toISOString().slice(0,10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
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
		<h2 class="flex items-center gap-2 text-sm font-semibold">
			<IconTable class="size-4" stroke-width={1.75} />
			Hasil import
		</h2>

		<div class="mt-4 grid gap-4 sm:grid-cols-3">
			<div class="rounded-xl border border-base-300 p-4">
				<span class="text-xs text-base-content/60">Total baris</span>
				<span class="mt-1 block font-mono text-2xl">{result.total}</span>
			</div>
			<div class="rounded-xl border border-success/40 bg-success/5 p-4">
				<span class="text-xs text-success">Berhasil</span>
				<span class="mt-1 block font-mono text-2xl text-success">{result.berhasil}</span>
			</div>
			<div class="rounded-xl border border-error/40 bg-error/5 p-4">
				<span class="text-xs text-error">Gagal</span>
				<span class="mt-1 block font-mono text-2xl text-error">{result.gagal}</span>
			</div>
		</div>

		{#if result.errors.length > 0}
			<div class="mt-4 flex flex-wrap items-center gap-2">
				<IconFilter class="size-4 text-base-content/50" />
				{#each Object.entries(KATEGORI_LABEL) as [key, label] (key)}
					{#if kategoriCounts[key] > 0}
						<button
							class="btn btn-xs {filterKategori === key ? 'btn-primary' : 'btn-outline'}"
							onclick={() => (filterKategori = key)}>
							{label} ({kategoriCounts[key]})
						</button>
					{/if}
				{/each}

				<button class="btn btn-outline btn-xs ml-auto gap-1" onclick={downloadCsv}>
					<IconFileDownload class="size-3.5" />
					Unduh laporan CSV
				</button>
			</div>

			<div class="mt-3 max-h-[400px] overflow-y-auto rounded-xl border border-base-300">
				<table class="table table-sm">
					<thead class="sticky top-0 bg-base-200">
						<tr class="text-xs uppercase tracking-wide text-base-content/60">
							<th>Baris</th>
							<th>Nama</th>
							<th>Kategori</th>
							<th>Alasan</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredErrors as e (e.row + e.reason + e.kategori)}
							<tr class="hover:bg-base-200/50">
								<td class="font-mono text-xs">{e.row}</td>
								<td class="text-sm">{e.nama || '—'}</td>
								<td><span class="badge badge-ghost badge-xs">{KATEGORI_LABEL[e.kategori] ?? e.kategori}</span></td>
								<td class="text-sm text-error">{e.reason}</td>
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
