<script lang="ts">
	import { EXPORT_FIELDS } from '$lib/export-fields';
	import { IconDownload, IconCheck, IconX } from '@tabler/icons-svelte';

	let format = $state('xlsx');
	let selectedFields = $state<string[]>(EXPORT_FIELDS.map((f) => f.key));

	function toggleAll(checked: boolean) {
		if (checked) {
			selectedFields = EXPORT_FIELDS.map((f) => f.key);
		} else {
			selectedFields = [];
		}
	}

	const allSelected = $derived(selectedFields.length === EXPORT_FIELDS.length);

	function buildDownloadUrl() {
		const params = new URLSearchParams();
		params.set('format', format);
		if (selectedFields.length > 0 && selectedFields.length < EXPORT_FIELDS.length) {
			params.set('fields', selectedFields.join(','));
		}
		return `/santri/export/file?${params.toString()}`;
	}
</script>

<svelte:head>
	<title>Ekspor Data Santri | Buku Induk</title>
</svelte:head>

<header class="flex items-center gap-3">
	<a href="/santri" class="btn btn-ghost btn-sm" aria-label="Kembali ke daftar santri">&larr;</a>
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Ekspor Data Santri</h1>
		<p class="mt-1 text-base-content/70">Pilih format file dan kolom data yang ingin diunduh.</p>
	</div>
</header>

<div class="mt-6 max-w-2xl space-y-6">
	<!-- Format Selection -->
	<section class="rounded-2xl border border-base-300 bg-base-100 p-5">
		<h2 class="text-sm font-semibold">Format File</h2>
		<div class="mt-3 flex gap-4">
			<label class="flex items-center gap-2 cursor-pointer text-sm font-medium">
				<input type="radio" name="format" value="xlsx" bind:group={format} class="radio radio-primary radio-sm" />
				Excel (.xlsx)
			</label>
			<label class="flex items-center gap-2 cursor-pointer text-sm font-medium">
				<input type="radio" name="format" value="csv" bind:group={format} class="radio radio-primary radio-sm" />
				CSV (.csv)
			</label>
		</div>
	</section>

	<!-- Field Selection -->
	<section class="rounded-2xl border border-base-300 bg-base-100 p-5">
		<div class="flex items-center justify-between border-b border-base-200 pb-3">
			<h2 class="text-sm font-semibold">
				Pilih Kolom ({selectedFields.length}/{EXPORT_FIELDS.length})
			</h2>
			<div class="flex gap-2">
				<button type="button" class="btn btn-ghost btn-xs" onclick={() => toggleAll(true)}>Pilih Semua</button>
				<button type="button" class="btn btn-ghost btn-xs text-error" onclick={() => toggleAll(false)}>Hapus Semua</button>
			</div>
		</div>

		<div class="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
			{#each EXPORT_FIELDS as field (field.key)}
				<label class="flex items-center gap-2 text-xs cursor-pointer select-none">
					<input
						type="checkbox"
						value={field.key}
						bind:group={selectedFields}
						class="checkbox checkbox-primary checkbox-xs" />
					<span class="truncate">{field.label}</span>
				</label>
			{/each}
		</div>
	</section>

	<!-- Action -->
	<div class="flex justify-end gap-3">
		<a href="/santri" class="btn btn-ghost btn-sm">Batal</a>
		<a
			href={buildDownloadUrl()}
			download
			class="btn btn-primary btn-sm gap-2 {selectedFields.length === 0 ? 'btn-disabled' : ''}">
			<IconDownload class="size-4" stroke-width={2} />
			Unduh File
		</a>
	</div>
</div>
