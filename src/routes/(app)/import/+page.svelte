<script lang="ts">
	import { IconFileDownload, IconFileUpload, IconFileImport } from '@tabler/icons-svelte';
	import * as XLSX from 'xlsx';
	import { IMPORT_COLUMNS } from '$lib/excel';

	type ImportError = { row: number; nama: string; reason: string };

	let { form } = $props();

	const actionError = $derived((form as { error?: string } | null)?.error ?? null);
	const result = $derived(
		form && typeof (form as { berhasil?: number }).berhasil === 'number'
			? (form as { berhasil: number; gagal: number; errors: ImportError[] })
			: null
	);
	let fileName = $state('');
	let busyTemplate = $state(false);
	let busyUpload = $state(false);

	function downloadTemplate() {
		busyTemplate = true;
		try {
			const ws = XLSX.utils.aoa_to_sheet([IMPORT_COLUMNS.map((c) => c.header)]);
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, 'santri');
			XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
				['Panduan', 'Kolom wajib: Nama lengkap'],
				['L/P untuk jenis kelamin'],
				['aktif/khusus/mutasi_keluar/lulus/wafat/drop_out'],
				['Contoh: Ahmad, 0012345678, L, aktif, 3, 7A, Haji Salim']
			]), 'Panduan');
			XLSX.writeFile(wb, 'template-import-santri.xlsx');
		} finally {
			busyTemplate = false;
		}
	}

	async function uploadFile(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		if (!/\.(xlsx|xls)$/i.test(file.name)) {
			form = { error: 'Hanya file .xlsx atau .xls yang didukung.' };
			return;
		}
		busyUpload = true;
		try {
			const buf = await file.arrayBuffer();
			const wb = XLSX.read(new Uint8Array(buf), { type: 'array', cellDates: true });
			const ws = wb.Sheets[wb.SheetNames[0]];
			if (!ws) throw new Error('Sheet tidak ditemukan.');
			const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, string>[];
			if (rows.length === 0) throw new Error('File kosong.');
			const fd = new FormData();
			fd.append('rows', JSON.stringify(rows));
			const response = await fetch('/import?/upload', {
				method: 'POST',
				body: fd
			});
			if (!response.ok) {
				let err: { error?: string } | { error: string } = { error: 'Gagal upload' };
				try {
					err = await response.json();
				} catch {
					// ignore, keep default error
				}
				form = { error: err.error || 'Gagal upload.' };
			} else {
				form = await response.json();
			}
		} catch (err: unknown) {
			form = { error: err instanceof Error ? err.message : 'Gagal membaca file.' };
		} finally {
			busyUpload = false;
			input.value = '';
		}
	}
</script>

<svelte:head>
	<title>Import Excel | Buku Induk</title>
</svelte:head>

<header>
	<h1 class="text-2xl font-semibold tracking-tight">Import Excel</h1>
	<p class="mt-1 max-w-[65ch] text-base-content/70">
		Unduh template, isi data santri (dan wali), lalu unggah hasilnya. Setiap import tercatat di
		audit log.
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
	<div class="rounded-2xl border border-base-300 bg-base-100 p-5">
		<span class="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
			<IconFileDownload class="size-5" stroke-width={1.75} />
		</span>
		<h2 class="mt-3 text-sm font-semibold">1. Unduh template</h2>
		<p class="mt-1 text-sm text-base-content/60">
			Template berisi sheet "santri" (kolom data) dan sheet "Panduan" (contoh & aturan pengisian).
		</p>
		<button type="button" class="btn btn-outline btn-sm mt-4" onclick={downloadTemplate} disabled={busyTemplate}>
			{#if busyTemplate}
				<span class="loading loading-spinner loading-sm"></span>
			{/if}
			Unduh template (.xlsx)
		</button>
	</div>

	<div class="rounded-2xl border border-base-300 bg-base-100 p-5">
		<span class="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
			<IconFileUpload class="size-5" stroke-width={1.75} />
		</span>
		<h2 class="mt-3 text-sm font-semibold">2. Unggah file terisi</h2>
		<p class="mt-1 text-sm text-base-content/60">
			File .xlsx atau .xls. Nama ayah/ibu/wali yang diisi otomatis mencatat wali santri.
		</p>
		<label class="mt-4 block">
			<span class="mb-1.5 block text-sm font-medium">File Excel</span>
			<input
				class="file-input file-input-bordered w-full"
				type="file"
				accept=".xlsx,.xls"
				required
				onchange={uploadFile} />
		</label>
		<button type="button" class="btn btn-primary btn-sm mt-4" onclick={uploadFile} disabled={busyUpload}>
			{#if busyUpload}
				<span class="loading loading-spinner loading-sm"></span>
			{/if}
			Import
		</button>
	</div>
</div>
