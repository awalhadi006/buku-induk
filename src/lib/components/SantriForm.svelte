<script lang="ts">
	import { page } from '$app/state';
	import { GENDER_OPTIONS, STATUS_KELUARGA_OPTIONS, STATUS_SANTRI_OPTIONS } from '$lib/santri';

	type Field = {
		key: string;
		label: string;
		type?: 'select' | 'textarea' | 'date' | 'number';
		options?: { value: string; label: string }[];
		required?: boolean;
		placeholder?: string;
	};

	type Group = { label: string; fields: Field[] };

	let {
		values,
		kamar,
		kelas,
		wali,
		action,
		submitLabel,
		cancelHref
	}: {
		values: Record<string, string>;
		kamar: { id: number; nomor: number }[];
		kelas: { id: number; tingkat: string; rombel: string }[];
		wali: { id: string; label: string }[];
		action: string;
		submitLabel: string;
		cancelHref: string;
	} = $props();

	let v = $state({ ...values });

	const form = $derived(page.form as { error?: string } | null);

	const groups = $derived<Group[]>([
		{
			label: 'Identitas',
			fields: [
				{ key: 'nama_lengkap', label: 'Nama lengkap', required: true },
				{ key: 'nama_panggilan', label: 'Nama panggilan' },
				{ key: 'nisn', label: 'NISN' },
				{ key: 'nik', label: 'NIK' },
				{ key: 'nis', label: 'NIS' },
				{ key: 'nipd', label: 'NIPD' },
				{ key: 'tempat_lahir', label: 'Tempat lahir' },
				{ key: 'tanggal_lahir', label: 'Tanggal lahir', type: 'date' },
				{ key: 'jenis_kelamin', label: 'Jenis kelamin', type: 'select', options: GENDER_OPTIONS },
				{ key: 'agama', label: 'Agama' },
				{ key: 'kewarganegaraan', label: 'Kewarganegaraan' }
			]
		},
		{
			label: 'Alamat & kontak',
			fields: [
				{ key: 'alamat', label: 'Alamat', type: 'textarea' },
				{ key: 'rt', label: 'RT' },
				{ key: 'rw', label: 'RW' },
				{ key: 'desa', label: 'Desa/kelurahan' },
				{ key: 'kecamatan', label: 'Kecamatan' },
				{ key: 'kabupaten', label: 'Kabupaten' },
				{ key: 'no_hp', label: 'No. HP' },
				{ key: 'tempat_tinggal', label: 'Tempat tinggal' },
				{ key: 'transportasi', label: 'Transportasi ke sekolah' },
				{ key: 'anak_ke', label: 'Anak ke', type: 'number' }
			]
		},
		{
			label: 'Status & keaktifan',
			fields: [
				{
					key: 'status_santri',
					label: 'Status santri',
					type: 'select',
					options: STATUS_SANTRI_OPTIONS,
					required: true
				},
				{
					key: 'status_keluarga',
					label: 'Status keluarga',
					type: 'select',
					options: STATUS_KELUARGA_OPTIONS
				},
				{ key: 'tanggal_masuk', label: 'Tanggal masuk', type: 'date' },
				{ key: 'asal_sekolah', label: 'Asal sekolah' },
				{ key: 'jalur_masuk', label: 'Jalur masuk' },
				{ key: 'bantuan_kip', label: 'Penerima bantuan (KIP/PIP/KPS/PKH)' }
			]
		},
		{
			label: 'Penempatan',
			fields: [
				{
					key: 'kamar_id',
					label: 'Kamar',
					type: 'select',
					options: kamar.map((k) => ({ value: String(k.id), label: `Kamar ${k.nomor}` }))
				},
				{
					key: 'kelas_id',
					label: 'Kelas',
					type: 'select',
					options: kelas.map((k) => ({ value: String(k.id), label: `${k.tingkat} ${k.rombel}` }))
				},
				{
					key: 'wali_santri_id',
					label: 'Wali santri',
					type: 'select',
					options: wali.map((w) => ({ value: w.id, label: w.label }))
				},
				{ key: 'foto_url', label: 'Foto (URL)' }
			]
		},
		{
			label: 'Kelengkapan dokumen',
			fields: [
				{ key: 'no_akta', label: 'Nomor akta' },
				{ key: 'no_kk', label: 'Nomor KK' }
			]
		}
	]);
</script>

{#if form?.error}
	<div class="alert alert-error mb-6" role="alert">
		<span>{form.error}</span>
	</div>
{/if}

<form method="POST" action={action} class="space-y-6">
	{#each groups as g (g.label)}
		<fieldset class="rounded-2xl border border-base-300 bg-base-100 p-5">
			<legend class="px-2 text-sm font-semibold">{g.label}</legend>
			<div class="grid gap-4 sm:grid-cols-2">
				{#each g.fields as f (f.key)}
					<label class="block">
						<span class="mb-1.5 block text-sm font-medium">
							{f.label}{f.required ? ' *' : ''}
						</span>
						{#if f.type === 'select'}
							<select class="select select-bordered w-full" name={f.key} bind:value={v[f.key]}>
								<option value="">— Pilih —</option>
								{#each f.options ?? [] as o (o.value)}
									<option value={o.value}>{o.label}</option>
								{/each}
							</select>
						{:else if f.type === 'textarea'}
							<textarea
								class="textarea textarea-bordered w-full"
								name={f.key}
								rows="3"
								bind:value={v[f.key]}></textarea>
						{:else if f.type === 'date'}
							<input
								class="input input-bordered w-full"
								type="date"
								name={f.key}
								bind:value={v[f.key]} />
						{:else if f.type === 'number'}
							<input
								class="input input-bordered w-full"
								type="number"
								name={f.key}
								bind:value={v[f.key]} />
						{:else}
							<input
								class="input input-bordered w-full"
								type="text"
								name={f.key}
								bind:value={v[f.key]}
								placeholder={f.placeholder} />
						{/if}
					</label>
				{/each}
			</div>
		</fieldset>
	{/each}

	<div class="flex items-center gap-3">
		<button type="submit" class="btn btn-primary">{submitLabel}</button>
		<a class="btn btn-ghost" href={cancelHref}>Batal</a>
	</div>
</form>
