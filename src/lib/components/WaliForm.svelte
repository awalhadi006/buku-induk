<script lang="ts">
	import FormShell from './FormShell.svelte';

	type Field = {
		key: string;
		label: string;
		type?: 'textarea';
	};

	type Group = { label: string; fields: Field[] };

	let {
		values = {},
		action,
		submitLabel,
		cancelHref,
		onSubmit,
		error,
		submitting,
		extra
	}: {
		values?: Record<string, string>;
		action?: string;
		submitLabel: string;
		cancelHref: string;
		onSubmit?: (el: HTMLFormElement) => void;
		error?: string | null;
		submitting?: boolean;
		extra?: import('svelte').Snippet;
	} = $props();

	// svelte-ignore state_referenced_locally (nilai awal sengaja: form selalu di-mount ulang)
	let v = $state({ ...values });

	const groups = $derived<Group[]>([
		{
			label: 'Data ayah',
			fields: [
				{ key: 'nama_ayah', label: 'Nama ayah' },
				{ key: 'pekerjaan_ayah', label: 'Pekerjaan ayah' }
			]
		},
		{
			label: 'Data ibu',
			fields: [
				{ key: 'nama_ibu', label: 'Nama ibu' },
				{ key: 'pekerjaan_ibu', label: 'Pekerjaan ibu' }
			]
		},
		{
			label: 'Wali & kontak',
			fields: [
				{ key: 'nama_wali', label: 'Nama wali' },
				{ key: 'penghasilan', label: 'Penghasilan keluarga' },
				{ key: 'no_hp', label: 'No. HP' },
				{ key: 'alamat', label: 'Alamat', type: 'textarea' }
			]
		}
	]);
</script>

<FormShell {error} {submitting} {submitLabel} {cancelHref} {action} {onSubmit} {extra}>
	{#each groups as g (g.label)}
		<fieldset class="fieldset">
			<legend class="fieldset-legend">{g.label}</legend>
			<div class="grid gap-4 sm:grid-cols-2">
				{#each g.fields as f (f.key)}
					<label class="label">
						<span class="label-text">{f.label}</span>
						{#if f.type === 'textarea'}
							<textarea
								class="textarea textarea-bordered w-full"
								name={f.key}
								rows="3"
								bind:value={v[f.key]}></textarea>
						{:else}
							<input
								class="input input-bordered w-full"
								type="text"
								name={f.key}
								bind:value={v[f.key]} />
						{/if}
					</label>
				{/each}
			</div>
		</fieldset>
	{/each}
</FormShell>
