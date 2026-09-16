<script lang="ts">
	import { IconFileDownload, IconFileImport, IconAlertTriangle, IconFilter, IconTable, IconLoader2, IconCheck, IconX, IconPlayerPause, IconPlayerPlay } from '@tabler/icons-svelte';
	import { onMount } from 'svelte';
	import { importStore, type ImportSession, type ImportChunk } from '$lib/stores/import-store';
	import { parseExcelFile, chunkRows, toBulkInsertPayload, type ParsedRow, type ParseResult } from '$lib/import/client-parser';
	import { getSupabaseAdmin } from '$lib/supabase-admin';

	type ImportError = { row: number; nama: string; reason: string; kategori: string };
	type Warning = { row: number; nama: string; warnings: string[] };

	const KATEGORI_LABEL: Record<string, string> = {
		semua: 'Semua',
		wajib: 'Wajib diisi',
		format: 'Format salah',
		referensi: 'Data referensi tidak ditemukan',
		database: 'Database gagal',
		sistem: 'Sistem'
	};

	let { data } = $props();

	const kamarList = $derived(data?.kamar ?? []);
	const kelasList = $derived(data?.kelas ?? []);

	const kamarIdByNomor = $derived(
		new Map<number, string>((kamarList as { id: string; nomor: number }[]).map((k) => [k.nomor, k.id]))
	);
	const kelasIdByKey = $derived(
		new Map<string, string>(
			(kelasList as { id: string; tingkat: string; rombel: string }[]).map((k) => [
				`${k.tingkat}${k.rombel}`.replace(/\s+/g, '').toUpperCase(),
				k.id
			])
		)
	);

	let currentSessionId: string | null = null;
	let error = $state<string | null>(null);
	let filterKategori = $state('semua');

	// Derived from store
	const currentSession = $derived.by(() => {
		if (!currentSessionId) return null;
		let session: ImportSession | null = null;
		importStore.subscribe((sessions) => {
			session = sessions.get(currentSessionId!) ?? null;
		})();
		return session;
	});

	const sessionChunks = $derived(currentSession?.chunks ?? []);
	const sessionProgress = $derived(currentSession?.progress ?? 0);
	const sessionStatus = $derived(currentSession?.status ?? 'idle');
	const sessionErrors = $derived(currentSession?.errors ?? []);
	const sessionWarnings = $derived(currentSession?.warnings ?? []);
	const sessionTotalRows = $derived(currentSession?.totalRows ?? 0);
	const sessionFileName = $derived(currentSession?.fileName ?? '');

	const kategoriCounts = $derived.by(() => {
		const counts: Record<string, number> = { semua: sessionErrors.length };
		for (const e of sessionErrors) {
			counts[e.kategori] = (counts[e.kategori] ?? 0) + 1;
		}
		return counts;
	});

	const filteredErrors = $derived.by(() => {
		if (filterKategori === 'semua') return sessionErrors;
		return sessionErrors.filter((e) => e.kategori === filterKategori);
	});

	async function fetchKamarKelas() {
		// Data already loaded via page server load
	}

	async function processImport() {
		if (!currentSessionId) return;

		const session = importStore.getSession(currentSessionId);
		if (!session) return;

		const abortController = new AbortController();
		importStore.startSession(currentSessionId, abortController);

		try {
			// Send chunks sequentially
			for (let i = 0; i < session.chunks.length; i++) {
				if (abortController.signal.aborted) break;

				const chunk = session.chunks[i];
				importStore.updateChunkStatus(currentSessionId, i, 'uploading');

				const payload = toBulkInsertPayload(
					chunk.data,
					kamarIdByNomor,
					kelasIdByKey
				);

				const response = await fetch('/api/import/bulk', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						rows: payload,
						kamarIdByNomor: Object.fromEntries(kamarIdByNomor),
						kelasIdByKey: Object.fromEntries(kelasIdByKey)
					}),
					signal: abortController.signal
				});

				if (!response.ok) {
					const errData = await response.json().catch(() => ({ error: 'Unknown error' }));
					throw new Error(errData.error || `HTTP ${response.status}`);
				}

				const result = await response.json();

				importStore.updateChunkStatus(currentSessionId, i, 'completed');
				importStore.addErrors(currentSessionId, result.errors || []);
				importStore.addWarnings(currentSessionId, result.warnings || []);
			}

			if (!abortController.signal.aborted) {
				importStore.completeSession(currentSessionId);
			}
		} catch (e) {
			if (!abortController.signal.aborted) {
				const msg = e instanceof Error ? e.message : 'Terjadi kesalahan';
				importStore.failSession(currentSessionId, msg);
				error = msg;
			}
		}
	}

	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		error = null;
		currentSessionId = null;

		// Reset file input
		input.value = '';

		try {
			// Parse Excel in browser
			const parseResult: ParseResult = await parseExcelFile(file);

			if (parseResult.rows.length === 0 && parseResult.errors.length === 0) {
				error = 'File tidak berisi data yang valid.';
				return;
			}

			// Create session in store
			const sessionId = importStore.createSession(file.name, parseResult.rows.length).id;
			currentSessionId = sessionId;

			// Chunk the parsed rows
			const chunks = chunkRows(parseResult.rows, 100);

			// Store chunk data
			const importChunks = chunks.map((chunk, idx) => ({
				index: idx,
				startRow: idx * 100,
				endRow: Math.min((idx + 1) * 100, parseResult.rows.length),
				data: chunk,
				status: 'pending' as const
			}));

			importStore.setSessionData(sessionId, importChunks);

			// Add parse warnings as warnings
			if (parseResult.warnings.length > 0) {
				importStore.addWarnings(
					sessionId,
					parseResult.warnings.map((w) => ({
						row: w.row,
						nama: '',
						warnings: w.warnings
					}))
				);
			}

			// Add parse errors as errors
			if (parseResult.errors.length > 0) {
				importStore.addErrors(
					sessionId,
					parseResult.errors.map((e) => ({
						row: e.row,
						nama: '',
						reason: e.reason,
						kategori: 'format'
					}))
				);
			}

			// Start processing
			await processImport();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Gagal memproses file';
		}
	}

	function pauseImport() {
		if (currentSessionId) {
			importStore.abortSession(currentSessionId);
		}
	}

	function retryImport() {
		if (currentSessionId) {
			error = null;
			processImport();
		}
	}

	function removeSession() {
		if (currentSessionId) {
			importStore.removeSession(currentSessionId);
			currentSessionId = null;
			error = null;
		}
	}

	function downloadCsv() {
		if (sessionErrors.length === 0) return;
		const header = 'Baris;Nama;Alasan;Kategori\n';
		const rows = sessionErrors
			.map(
				(e) =>
					`${e.row};"${(e.nama ?? '').replace(/"/g, '""')}";"${e.reason.replace(/"/g, '""')}";"${KATEGORI_LABEL[e.kategori] ?? e.kategori}"`
			)
			.join('\n');
		const csv = header + rows;
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `laporan-import-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	onMount(() => {
		fetchKamarKelas();
	});
</script>

<svelte:head>
	<title>Import Excel | Buku Induk</title>
</svelte:head>

<header>
	<h1 class="text-2xl font-semibold tracking-tight">Import Excel</h1>
	<p class="mt-1 max-w-[65ch] text-base-content/70">
		Download template Excel yang sudah berisi kolom data santri. Isi data di sheet "data wajib" dan "data opsional", lalu upload file.
		Data diproses di browser dan dikirim ke server per 100 baris (chunk) untuk menghindari timeout.
	</p>
</header>

{#if error}
	<div class="alert alert-error mt-6 animate-in" role="alert">
		<span>{error}</span>
	</div>
{/if}

{#if currentSession}
	<div class="mt-6 rounded-lg border border-base-300 bg-base-100 p-5">
		<div class="mb-4 flex flex-wrap items-center gap-3">
			<div class="flex-1">
				<div class="flex items-center justify-between mb-1">
					<span class="text-sm font-medium">
						{#if sessionStatus === 'parsing'}
							Memparsing file...
						{:else if sessionStatus === 'uploading'}
							Mengunggah data...
						{:else if sessionStatus === 'completed'}
							Import selesai!
						{:else if sessionStatus === 'error'}
							Import gagal
						{:else}
							Menunggu...
						{/if}
					</span>
					<span class="text-xs text-base-content/60">{sessionProgress}%</span>
				</div>
				<div class="progress w-full h-3">
					<div class="progress-bar" style="width: {sessionProgress}%"></div>
				</div>
				<p class="mt-1 text-xs text-base-content/60">
					{sessionChunks.filter((c) => c.status === 'completed').length} / {sessionChunks.length} chunk &nbsp;•&nbsp;
					{sessionErrors.length} error &nbsp;•&nbsp;
					{sessionWarnings.length} peringatan
				</p>
			</div>
			<div class="flex items-center gap-2">
				{#if sessionStatus === 'uploading'}
					<button class="btn btn-ghost btn-sm" onclick={pauseImport}>
						<IconPlayerPause class="size-4" />
						Pause
					</button>
				{:else if sessionStatus === 'error'}
					<button class="btn btn-primary btn-sm" onclick={retryImport}>
						<IconPlayerPlay class="size-4" />
						Coba Lagi
					</button>
				{/if}
				<button class="btn btn-ghost btn-sm" onclick={removeSession}>
					<IconX class="size-4" />
					Tutup
				</button>
			</div>
		</div>

		<h2 class="flex items-center gap-2 text-sm font-semibold">
			<IconTable class="size-4" stroke-width={1.75} />
			Hasil import
		</h2>

		<div class="mt-4 grid grid-cols-3 divide-x divide-base-300 overflow-hidden rounded-lg border border-base-300 bg-base-100">
			<div class="p-4">
				<span class="text-xs text-base-content/60">Total baris</span>
				<span class="mt-1 block font-mono text-2xl">{sessionTotalRows}</span>
			</div>
			<div class="border-l border-success/40 bg-success/5 p-4">
				<span class="text-xs text-success">Berhasil</span>
				<span class="mt-1 block font-mono text-2xl text-success">
					{sessionChunks.reduce((sum, c) => sum + (c.data?.length ?? 0), 0) - sessionErrors.length}
				</span>
			</div>
			<div class="border-l border-error/40 bg-error/5 p-4">
				<span class="text-xs text-error">Gagal</span>
				<span class="mt-1 block font-mono text-2xl text-error">{sessionErrors.length}</span>
			</div>
		</div>

		{#if sessionErrors.length > 0}
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

		{#if sessionWarnings.length > 0}
			<div class="mt-4 rounded-xl border border-warning/40 bg-warning/5 p-4">
				<h3 class="flex items-center gap-2 text-sm font-semibold text-warning">
					<IconAlertTriangle class="size-4" stroke-width={1.75} />
					Peringatan ({sessionWarnings.length} baris)
				</h3>
				<p class="mt-1 text-xs text-base-content/60">
					Data berhasil disimpan, tetapi ada field yang belum lengkap atau tidak valid.
				</p>
				<ul class="mt-3 max-h-[300px] divide-y divide-warning/20 overflow-y-auto">
					{#each sessionWarnings as w}
						<li class="py-2 text-sm">
							<span class="font-medium">Baris {w.row} — {w.nama || '—'}</span>
							<ul class="mt-1 list-inside list-disc text-xs text-base-content/60">
								{#each w.warnings as warn}
									<li>{warn}</li>
								{/each}
							</ul>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
{/if}

<div class="mt-6 grid gap-4 lg:grid-cols-2">
	<a
		href="/template-import-santri.xlsx?v=3"
		download="template-import-santri.xlsx"
		class="rounded-lg border border-base-300 bg-base-100 p-5 transition-colors hover:bg-base-200/50">
		<h2 class="text-sm font-semibold">1. Download template</h2>
		<p class="mt-1 text-sm text-base-content/60">
			Template Excel siap isi (sheet data wajib, data opsional, panduan). Unduh, isi, lalu upload kembali.
		</p>
	</a>

	<div class="rounded-lg border border-base-300 bg-base-100 p-5">
		<h2 class="text-sm font-semibold">2. Upload file terisi</h2>
		<p class="mt-1 text-sm text-base-content/60">
			File Excel (.xlsx atau .xls) yang sudah diisi. Minimal kolom Nama Lengkap wajib diisi.
			Proses parsing dilakukan di browser, file tidak diunggah ke server.
		</p>
		<label class="mt-4 block">
			<span class="mb-1.5 block text-sm font-medium">File Excel</span>
			<input
				class="file-input file-input-bordered w-full"
				type="file"
				accept=".xlsx,.xls"
				onchange={handleFileSelect} />
		</label>
	</div>
</div>