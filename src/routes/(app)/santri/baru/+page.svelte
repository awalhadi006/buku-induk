<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { uploadSantriPdf } from '$lib/storage';
	import SantriForm from '$lib/components/SantriForm.svelte';
	import { EMPTY_SANTRI, JENIS_DOKUMEN_OPTIONS, parseSantriForm } from '$lib/santri';

	let { data } = $props();

	let docs = $state<{ file: File; jenis: string }[]>([]);
	let error = $state('');
	let submitting = $state(false);

	function onFiles(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const files = Array.from(input.files ?? []).filter(
			(f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
		);
		if (files.length < (input.files?.length ?? 0))
			error = 'Hanya file PDF yang diterima; file lain dilewati.';
		else error = '';
		for (const f of files) docs = [...docs, { file: f, jenis: 'kk' }];
		input.value = '';
	}

	function removeDoc(i: number) {
		docs = docs.filter((_, idx) => idx !== i);
	}

	async function create(el: HTMLFormElement) {
		if (submitting) return;
		const payload = parseSantriForm(new FormData(el));
		if (!payload.nama_lengkap) {
			error = 'Nama lengkap wajib diisi.';
			return;
		}
		submitting = true;
		error = '';
		try {
			const { data: row, error: insErr } = await supabase
				.from('santri')
				.insert(payload)
				.select('id')
				.single();
			if (insErr) throw new Error(insErr.message);

			const fd = new FormData(el);
			const fotoFile = fd.get('foto_file') as File | null;
			if (fotoFile && fotoFile.size > 0) {
				const up = new FormData();
				up.append('file', fotoFile);
				up.append('name', (payload.nama_lengkap as string) ?? 'Santri');
				const res = await fetch('/api/upload-photo', { method: 'POST', body: up });
				if (res.ok) {
					const { url } = (await res.json()) as { url: string };
					await supabase.from('santri').update({ foto_url: url }).eq('id', row.id);
				}
			}

			for (const d of docs) {
				let fileUrl: string;
				if (data.gdrive) {
					const up = new FormData();
					up.append('file', d.file);
					up.append('name', (payload.nama_lengkap as string) ?? 'Santri');
					const res = await fetch('/api/upload-doc', { method: 'POST', body: up });
					if (!res.ok) throw new Error('Gagal mengunggah dokumen ke Google Drive.');
					const json = (await res.json()) as { url: string };
					fileUrl = json.url;
				} else {
					fileUrl = await uploadSantriPdf(row.id, d.file);
				}

				const { error: docErr } = await supabase.from('santri_documents').insert({
					santri_id: row.id,
					jenis: d.jenis,
					nama_file: d.file.name,
					file_url: fileUrl
				});
				if (docErr) throw new Error(docErr.message);
			}

			goto(`/santri/${row.id}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Gagal menyimpan santri.';
			submitting = false;
		}
	}
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
		gdrive={data.gdrive}
		submitLabel="Simpan santri"
		cancelHref="/santri"
		onSubmit={create}
		error={error}
		submitting={submitting}>
		{#snippet extra()}
			<fieldset class="rounded-2xl border border-base-300 bg-base-100 p-5">
				<legend class="px-2 text-sm font-semibold">Dokumen santri (PDF)</legend>
				<p class="mb-3 text-sm text-base-content/60">
					Upload berkas asli (KK, akta, ijazah, SKL, dsb.). Hanya file PDF.
				</p>
				<input
					class="file-input file-input-bordered w-full"
					type="file"
					accept=".pdf,application/pdf"
					multiple
					onchange={onFiles} />
				{#if docs.length > 0}
					<ul class="mt-3 divide-y divide-base-200">
						{#each docs as d, i (i)}
							<li class="flex items-center gap-3 py-2">
								<span class="min-w-0 flex-1 truncate text-sm">{d.file.name}</span>
								<select class="select select-bordered select-sm" bind:value={docs[i].jenis}>
									{#each JENIS_DOKUMEN_OPTIONS as o (o.value)}
										<option value={o.value}>{o.label}</option>
									{/each}
								</select>
								<button
									type="button"
									class="btn btn-ghost btn-square btn-sm text-error"
									aria-label="Hapus berkas"
									onclick={() => removeDoc(i)}>
									&times;
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</fieldset>
		{/snippet}
	</SantriForm>
</div>
