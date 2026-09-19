<script lang="ts">
	import { IconFileDownload, IconFileImport, IconAlertTriangle, IconFilter, IconTable, IconLoader2, IconCheck, IconX, IconPlayerPause, IconPlayerPlay, IconUpload, IconArrowLoopLeft } from '@tabler/icons-svelte';
	import { onMount } from 'svelte';
	import { importStore, type ImportSession, type ImportChunk } from '$lib/stores/import-store';
	import { parseExcelFile, chunkRows, toBulkInsertPayload, type ParsedRow, type ParseResult } from '$lib/import/client-parser';

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

	let currentSessionId = $state<string | null>(null);
	let error = $state<string | null>(null);
	let filterKategori = $state('semua');
	let selectedFile = $state<File | null>(null);
	let isParsing = $state(false);
	let isUploading = $state(false);
	let uploadProgress = $state(0);
	let uploadAnimationFrame: number | null = null;

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

	const completedChunks = $derived(sessionChunks.filter((c) => c.status === 'completed').length);
	const totalChunks = $derived(sessionChunks.length);

	// Smooth progress animation
	function startProgressAnimation() {
		uploadProgress = 0;
		isUploading = true;
		animateProgress();
	}

	function animateProgress() {
		if (!isUploading) return;
		
		// Smooth animation: ease towards 95% (leave 5% for completion)
		uploadProgress += (95 - uploadProgress) * 0.15;
		
		if (uploadProgress < 95 && isUploading) {
			uploadAnimationFrame = requestAnimationFrame(animateProgress);
		}
	}

	function completeProgressAnimation() {
		isUploading = false;
		if (uploadAnimationFrame) {
			cancelAnimationFrame(uploadAnimationFrame);
			uploadAnimationFrame = null;
		}
		// Animate to 100%
		const finishAnimation = () => {
			uploadProgress += (100 - uploadProgress) * 0.3;
			if (uploadProgress < 99.5) {
				requestAnimationFrame(finishAnimation);
			} else {
				uploadProgress = 100;
				// Keep at 100% - don't auto reset, let user decide
			}
		};
		requestAnimationFrame(finishAnimation);
	}

	function resetImportState() {
		// Clear upload state but keep session for results display
		currentSessionId = null;
		selectedFile = null;
		error = null;
		isUploading = false;
		uploadProgress = 0;
		if (uploadAnimationFrame) {
			cancelAnimationFrame(uploadAnimationFrame);
			uploadAnimationFrame = null;
		}
		// Reset file input
		const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
		if (fileInput) fileInput.value = '';
	}

	async function fetchKamarKelas() {
		// Data already loaded via page server load
	}

	async function processImport() {
		console.log('[Import] processImport called', { currentSessionId });
		if (!currentSessionId) return;

		const session = importStore.getSession(currentSessionId);
		console.log('[Import] Session from store:', session);
		if (!session) return;

		const abortController = new AbortController();
		importStore.startSession(currentSessionId, abortController);

		// Start smooth progress animation
		startProgressAnimation();

		try {
			// Send chunks sequentially
			for (let i = 0; i < session.chunks.length; i++) {
				if (abortController.signal.aborted) break;

				const chunk = session.chunks[i];
				console.log(`[Import] Processing chunk ${i + 1}/${session.chunks.length}`, { rows: chunk.data.length });

				const payload = toBulkInsertPayload(
					chunk.data,
					kamarIdByNomor,
					kelasIdByKey
				);
				console.log('[Import] Payload prepared', { payloadLength: payload.length });

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

				console.log('[Import] Response received', { status: response.status, ok: response.ok });

				if (!response.ok) {
					const errData = await response.json().catch(() => ({ error: 'Unknown error' }));
					throw new Error(errData.error || `HTTP ${response.status}`);
				}

				const result = await response.json();
				console.log('[Import] Chunk result', result);

				importStore.updateChunkStatus(currentSessionId, i, 'completed');
				importStore.addErrors(currentSessionId, result.errors || []);
				importStore.addWarnings(currentSessionId, result.warnings || []);
			}

			if (!abortController.signal.aborted) {
				importStore.completeSession(currentSessionId);
				// Trigger smooth completion animation
				completeProgressAnimation();
			}
		} catch (e) {
			console.error('[Import] Error in processImport:', e);
			isUploading = false;
			if (uploadAnimationFrame) {
				cancelAnimationFrame(uploadAnimationFrame);
				uploadAnimationFrame = null;
			}
			uploadProgress = 0;
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
		if (!file) {
			selectedFile = null;
			return;
		}
		selectedFile = file;
		error = null;
	}

	async function startImport() {
		console.log('[Import] startImport called', { selectedFile: selectedFile?.name, isParsing, currentSessionId });
		if (!selectedFile || isParsing) return;

		isParsing = true;
		error = null;
		currentSessionId = null;

		try {
			console.log('[Import] Parsing Excel file...');
			const parseResult: ParseResult = await parseExcelFile(selectedFile);
			console.log('[Import] Parse result', { rows: parseResult.rows.length, errors: parseResult.errors.length, warnings: parseResult.warnings.length });

			if (parseResult.rows.length === 0 && parseResult.errors.length === 0) {
				error = 'File tidak berisi data yang valid.';
				isParsing = false;
				return;
			}

			const sessionId = importStore.createSession(selectedFile.name, parseResult.rows.length).id;
			currentSessionId = sessionId;
			console.log('[Import] Session created', { sessionId });

			const chunks = chunkRows(parseResult.rows, 100);

			const importChunks = chunks.map((chunk, idx) => ({
				index: idx,
				startRow: idx * 100,
				endRow: Math.min((idx + 1) * 100, parseResult.rows.length),
				data: chunk,
				status: 'pending' as const
			}));

			importStore.setSessionData(sessionId, importChunks);

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

			console.log('[Import] Starting processImport...');
			await processImport();
			console.log('[Import] processImport completed');
		} catch (e) {
			console.error('[Import] Error in startImport:', e);
			error = e instanceof Error ? e.message : 'Gagal memproses file';
		} finally {
			isParsing = false;
		}
	}

	function pauseImport() {
		if (currentSessionId) {
			importStore.abortSession(currentSessionId);
			isUploading = false;
			if (uploadAnimationFrame) {
				cancelAnimationFrame(uploadAnimationFrame);
				uploadAnimationFrame = null;
			}
			uploadProgress = 0;
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
			resetImportState();
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
		<div class="mb-4">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm font-medium">
					{#if sessionStatus === 'parsing'}
						Memparsing file...
					{:else if sessionStatus === 'uploading'}
						Mengunggah data... ({completedChunks}/{totalChunks} chunk)
					{:else if sessionStatus === 'completed'}
						Import selesai!
					{:else if sessionStatus === 'error'}
						Import gagal
					{:else}
						Menunggu...
					{/if}
				</span>
				<span class="text-xs text-base-content/60">{Math.round(uploadProgress)}%</span>
			</div>
			<div class="progress w-full h-3">
				<div class="progress-bar bg-primary progress-bar-striped progress-bar-animated" style="width: {uploadProgress}%"></div>
			</div>
			<p class="mt-1 text-xs text-base-content/60">
				{completedChunks} / {totalChunks} chunk &nbsp;•&nbsp;
				{sessionErrors.length} error &nbsp;•&nbsp;
				{sessionWarnings.length} peringatan
			</p>
		</div>

		<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
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
		
		<div class="mt-4 flex flex-col gap-3">
			<label class="w-full">
				<span class="mb-1.5 block text-sm font-medium">File Excel</span>
				<input
					class="file-input file-input-bordered w-full"
					type="file"
					accept=".xlsx,.xls"
					onchange={handleFileSelect} />
			</label>
			<button
				type="button"
				class="btn btn-primary gap-2 w-full justify-center"
				onclick={startImport}
				disabled={isParsing || isUploading || !selectedFile || currentSessionId}>
				{#if isParsing}
					<span class="loading loading-spinner loading-sm"></span>
					Memparsing...
				{:else if isUploading}
					<IconLoader2 class="size-4 animate-spin" />
					Mengunggah...
				{:else if currentSessionId}
					<IconArrowLoopLeft class="size-4" />
					Import Lagi
				{:else}
					<IconUpload class="size-4" />
					Import
				{/if}
			</button>
		</div>
	</div>
</div>