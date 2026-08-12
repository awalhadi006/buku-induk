<script lang="ts">
	import { page } from '$app/state';
	import { supabase } from '$lib/supabase';
	import { uploadSantriPdf } from '$lib/storage';
	import { IconDownload, IconTrash, IconPrinter, IconIdBadge } from '@tabler/icons-svelte';
	import SantriForm from '$lib/components/SantriForm.svelte';
	import {
		GENDER_LABEL,
		JENIS_DOKUMEN_LABEL,
		JENIS_DOKUMEN_OPTIONS,
		STATUS_KELUARGA_LABEL,
		STATUS_SANTRI_LABEL
	} from '$lib/santri';

	type Doc = { id: string; jenis: string; nama_file: string | null; file_url: string };

	let { data } = $props();

	let editing = $state(false);
	// svelte-ignore state_referenced_locally (nilai awal dokumen dari loader)
	let docs = $state<Doc[]>(data.documents as Doc[]);
	let upFile = $state<File>();
	let upJenis = $state('kk');
	let upBusy = $state(false);
	let upError = $state('');
	let fileInput = $state<HTMLInputElement>();

	const s = $derived(data.santri as Record<string, any>);
	const profile = $derived((page.data.profile as { peran: string } | null) ?? null);
	const canDelete = $derived(profile ? ['superadmin', 'admin_tu'].includes(profile.peran) : false);

	const kamar = $derived(data.kamar as { id: number; nomor: number }[]);
	const kelas = $derived(data.kelas as { id: number; tingkat: string; rombel: string }[]);
	const wali = $derived(data.wali as { id: string; label: string }[]);

	const kamarNomor = $derived(kamar.find((k) => k.id === s.kamar_id)?.nomor ?? null);
	const kelasLabel = $derived(kelas.find((k) => k.id === s.kelas_id) ?? null);
	const waliLabel = $derived(wali.find((w) => w.id === s.wali_santri_id)?.label ?? null);

	const d = (v: string | null) => {
		if (!v) return null;
		const date = new Date(`${v}T00:00:00`);
		return Number.isNaN(date.getTime()) ? v : date.toLocaleDateString('id-ID');
	};

	function toEdit(): Record<string, string> {
		const out: Record<string, string> = {};
		for (const k of Object.keys(s)) out[k] = s[k] == null ? '' : String(s[k]);
		return out;
	}

	async function downloadDoc(d: Doc) {
		const { data: urlData, error } = await supabase.storage
			.from('santri')
			.createSignedUrl(d.file_url, 60);
		if (error || !urlData?.signedUrl) return;
		const a = document.createElement('a');
		a.href = urlData.signedUrl;
		a.target = '_blank';
		a.rel = 'noopener';
		document.body.appendChild(a);
		a.click();
		a.remove();
	}

	async function deleteDoc(d: Doc) {
		if (!confirm(`Hapus dokumen ${d.nama_file ?? 'ini'}?`)) return;
		await supabase.storage.from('santri').remove([d.file_url]);
		const { error } = await supabase.from('santri_documents').delete().eq('id', d.id);
		if (error) {
			upError = error.message;
		} else {
			docs = docs.filter((x) => x.id !== d.id);
		}
	}

	async function uploadDoc() {
		if (!upFile) {
			upError = 'Pilih file PDF dulu.';
			return;
		}
		if (upFile.type !== 'application/pdf' && !upFile.name.toLowerCase().endsWith('.pdf')) {
			upError = 'Hanya file PDF yang bisa di-upload.';
			return;
		}
		upBusy = true;
		upError = '';
		try {
			const path = await uploadSantriPdf(s.id, upFile);

			const { data: row, error: insErr } = await supabase
				.from('santri_documents')
				.insert({ santri_id: s.id, jenis: upJenis, nama_file: upFile.name, file_url: path })
				.select('id,jenis,nama_file,file_url')
				.single();
			if (insErr) throw new Error(insErr.message);

			docs = [row as Doc, ...docs];
			upFile = undefined;
			if (fileInput) fileInput.value = '';
		} catch (e) {
			upError = e instanceof Error ? e.message : 'Gagal meng-upload dokumen.';
		} finally {
			upBusy = false;
		}
	}

	const detailSections = $derived([
		{
			label: 'Identitas',
			rows: [
				['Nama lengkap', s.nama_lengkap],
				['Nama panggilan', s.nama_panggilan],
				['NISN', s.nisn],
				['NIK', s.nik],
				['NIS', s.nis],
				['NIPD', s.nipd],
				[
					'Tempat, tanggal lahir',
					[s.tempat_lahir, d(s.tanggal_lahir)].filter(Boolean).join(', ') || null
				],
				['Jenis kelamin', GENDER_LABEL[s.jenis_kelamin] ?? s.jenis_kelamin],
				['Agama', s.agama],
				['Kewarganegaraan', s.kewarganegaraan]
			] as [string, string | null][]
		},
		{
			label: 'Alamat & kontak',
			rows: [
				['Alamat', s.alamat],
				['RT/RW', [s.rt, s.rw].filter(Boolean).join(' / ') || null],
				['Desa/kelurahan', s.desa],
				['Kecamatan', s.kecamatan],
				['Kabupaten', s.kabupaten],
				['No. HP', s.no_hp],
				['Tempat tinggal', s.tempat_tinggal],
				['Transportasi', s.transportasi],
				['Anak ke', s.anak_ke != null ? String(s.anak_ke) : null]
			] as [string, string | null][]
		},
		{
			label: 'Status & keaktifan',
			rows: [
				['Status santri', STATUS_SANTRI_LABEL[s.status_santri] ?? s.status_santri],
				['Status keluarga', STATUS_KELUARGA_LABEL[s.status_keluarga] ?? s.status_keluarga],
				['Tanggal masuk', d(s.tanggal_masuk)],
				['Asal sekolah', s.asal_sekolah],
				['Jalur masuk', s.jalur_masuk],
				['Penerima bantuan (KIP/PIP/KPS/PKH)', s.bantuan_kip]
			] as [string, string | null][]
		},
		{
			label: 'Penempatan',
			rows: [
				['Kamar', kamarNomor != null ? `Kamar ${kamarNomor}` : null],
				['Kelas', kelasLabel ? `${kelasLabel.tingkat} ${kelasLabel.rombel}` : null],
				['Wali santri', waliLabel],
				['Foto', s.foto_url]
			] as [string, string | null][]
		}
	]);
</script>

<svelte:head>
	<title>{s.nama_lengkap} | Buku Induk</title>
</svelte:head>

<header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
	<div class="flex items-center gap-3">
		<a class="btn btn-ghost btn-sm" href="/santri" aria-label="Kembali ke daftar santri">
			&larr;
		</a>
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">{s.nama_lengkap}</h1>
			<p class="mt-0.5 font-mono text-sm text-base-content/60">{s.nisn || s.nis || s.nik || '—'}</p>
		</div>
	</div>

	{#if !editing}
		<div class="flex flex-wrap gap-2">
			<a class="btn btn-outline btn-sm" href="/santri/{s.id}/cetak" target="_blank" rel="noopener">
				<IconPrinter class="size-4" stroke-width={1.75} />
				Cetak Buku Induk
			</a>
			<a class="btn btn-outline btn-sm" href="/santri/{s.id}/kartu" target="_blank" rel="noopener">
				<IconIdBadge class="size-4" stroke-width={1.75} />
				Cetak Kartu
			</a>
			<button class="btn btn-outline btn-sm" onclick={() => (editing = true)}>Edit</button>
			{#if canDelete}
				<form
					method="POST"
					action="?/delete"
					onsubmit={() => confirm('Yakin menghapus santri ini? Tindakan ini permanen.')}>
					<button class="btn btn-error btn-outline btn-sm" type="submit">Hapus</button>
				</form>
			{/if}
		</div>
	{/if}
</header>

{#if editing}
	<div class="mt-6">
		<SantriForm
			values={toEdit()}
			kamar={kamar}
			kelas={kelas}
			wali={wali}
			action="?/update"
			submitLabel="Simpan perubahan"
			cancelHref="/santri/{s.id}" />
	</div>
{:else}
	<div class="mt-6 space-y-4">
		{#each detailSections as sec (sec.label)}
			<section class="rounded-2xl border border-base-300 bg-base-100 p-5">
				<h2 class="text-sm font-semibold">{sec.label}</h2>
				<dl class="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
					{#each sec.rows as [label, value] (label)}
						<div class="min-w-0">
							<dt class="text-xs text-base-content/60">{label}</dt>
							<dd class="truncate text-sm font-medium" title={value ?? undefined}>
								{value ?? '—'}
							</dd>
						</div>
					{/each}
				</dl>
			</section>
		{/each}

		<section class="rounded-2xl border border-base-300 bg-base-100 p-5">
			<h2 class="text-sm font-semibold">Dokumen santri</h2>

			{#if docs.length === 0}
				<p class="mt-2 text-sm text-base-content/60">Belum ada dokumen.</p>
			{:else}
				<ul class="mt-2 divide-y divide-base-200">
					{#each docs as d (d.id)}
						<li class="flex items-center gap-3 py-2">
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium">
									{JENIS_DOKUMEN_LABEL[d.jenis] ?? d.jenis}
								</p>
								<p class="truncate text-xs text-base-content/60">{d.nama_file ?? '—'}</p>
							</div>
							<button
								class="btn btn-ghost btn-square btn-sm"
								aria-label="Unduh dokumen"
								title="Unduh"
								onclick={() => downloadDoc(d)}>
								<IconDownload class="size-4" stroke-width={1.75} />
							</button>
							{#if canDelete}
								<button
									class="btn btn-ghost btn-square btn-sm text-error"
									aria-label="Hapus dokumen"
									title="Hapus"
									onclick={() => deleteDoc(d)}>
									<IconTrash class="size-4" stroke-width={1.75} />
								</button>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}

			<form
				class="mt-4 flex flex-col gap-3 border-t border-base-200 pt-4 sm:flex-row sm:items-end"
				onsubmit={(e) => {
					e.preventDefault();
					uploadDoc();
				}}>
				<label class="flex-1">
					<span class="mb-1.5 block text-sm font-medium">Tambah dokumen (PDF)</span>
					<input
						class="file-input file-input-bordered w-full"
						type="file"
						accept=".pdf,application/pdf"
						bind:this={fileInput}
						onchange={(e) => {
							const input = e.currentTarget as HTMLInputElement;
							upFile = input.files?.[0];
						}} />
				</label>
				<label class="sm:w-52">
					<span class="mb-1.5 block text-sm font-medium">Jenis</span>
					<select class="select select-bordered w-full" bind:value={upJenis}>
						{#each JENIS_DOKUMEN_OPTIONS as o (o.value)}
							<option value={o.value}>{o.label}</option>
						{/each}
					</select>
				</label>
				<button type="submit" class="btn btn-outline btn-sm" disabled={upBusy}>
					{#if upBusy}
						<span class="loading loading-spinner loading-sm"></span>
					{/if}
					Unggah
				</button>
			</form>
			{#if upError}
				<p class="mt-2 text-sm text-error">{upError}</p>
			{/if}
		</section>
	</div>
{/if}
