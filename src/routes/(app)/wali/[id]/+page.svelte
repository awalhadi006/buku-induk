<script lang="ts">
	import { page } from '$app/state';
	import { IconUserHeart } from '@tabler/icons-svelte';
	import WaliForm from '$lib/components/WaliForm.svelte';
	import { waliLabel } from '$lib/wali';

	const STATUS_LABEL: Record<string, string> = {
		aktif: 'Aktif',
		khusus: 'Khusus',
		mutasi_keluar: 'Mutasi Keluar',
		lulus: 'Lulus',
		wafat: 'Wafat',
		drop_out: 'Drop Out'
	};

	let { data } = $props();

	const w = $derived(data.wali as Record<string, any>);
	const santri = $derived(data.santri ?? []);
	const profile = $derived((page.data.profile as { peran: string } | null) ?? null);
	const canDelete = $derived(profile ? ['superadmin', 'admin_tu'].includes(profile.peran) : false);

	let editing = $state(false);

	function toEdit(): Record<string, string> {
		const out: Record<string, string> = {};
		for (const k of ['nama_ayah', 'nama_ibu', 'nama_wali', 'pekerjaan_ayah', 'pekerjaan_ibu', 'penghasilan', 'alamat', 'no_hp']) {
			out[k] = w[k] == null ? '' : String(w[k]);
		}
		return out;
	}

	const sections = $derived([
		{
			label: 'Data ayah',
			rows: [
				['Nama ayah', w.nama_ayah],
				['Pekerjaan ayah', w.pekerjaan_ayah]
			] as [string, string | null][]
		},
		{
			label: 'Data ibu',
			rows: [
				['Nama ibu', w.nama_ibu],
				['Pekerjaan ibu', w.pekerjaan_ibu]
			] as [string, string | null][]
		},
		{
			label: 'Wali & kontak',
			rows: [
				['Nama wali', w.nama_wali],
				['Penghasilan keluarga', w.penghasilan],
				['No. HP', w.no_hp],
				['Alamat', w.alamat]
			] as [string, string | null][]
		}
	]);
</script>

<svelte:head>
	<title>{waliLabel(w)} | Buku Induk</title>
</svelte:head>

<header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
	<div class="flex items-center gap-3">
		<a class="btn btn-ghost btn-sm" href="/wali" aria-label="Kembali ke daftar wali santri">
			&larr;
		</a>
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">{waliLabel(w)}</h1>
			<p class="mt-0.5 font-mono text-sm text-base-content/60">{w.no_hp || '—'}</p>
		</div>
	</div>

	{#if !editing}
		<div class="flex gap-2">
			<button class="btn btn-outline btn-sm" onclick={() => (editing = true)}>Edit</button>
			{#if canDelete}
				<form
					method="POST"
					action="?/delete"
					onsubmit={() => confirm('Yakin menghapus wali santri ini? Santri yang terkait tidak ikut terhapus.')}>
					<button class="btn btn-error btn-outline btn-sm" type="submit">Hapus</button>
				</form>
			{/if}
		</div>
	{/if}
</header>

{#if editing}
	<div class="mt-6">
		<WaliForm
			values={toEdit()}
			action="?/update"
			submitLabel="Simpan perubahan"
			cancelHref="/wali/{w.id}" />
	</div>
{:else}
	<div class="mt-6 space-y-4">
		{#each sections as sec (sec.label)}
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
			<h2 class="text-sm font-semibold">Santri di bawah wali ini</h2>
			<p class="mt-1 text-xs text-base-content/60">
				Data santri dengan wali yang sama (mis. kakak-beradik).
			</p>

			{#if santri.length === 0}
				<p class="mt-3 text-sm text-base-content/60">
					Belum ada santri yang memakai wali ini.
				</p>
			{:else}
				<ul class="mt-2 divide-y divide-base-200">
					{#each santri as s}
						<li class="flex items-center gap-3 py-2">
							<span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
								<IconUserHeart class="size-4" stroke-width={1.75} />
							</span>
							<div class="min-w-0 flex-1">
								<a class="link link-hover truncate text-sm font-medium" href="/santri/{s.id}">
									{s.nama_lengkap}
								</a>
								<p class="truncate text-xs text-base-content/60">
									{s.nisn ?? '—'}
									{s.kamar ? ` · Kamar ${s.kamar.nomor}` : ''}
									{s.kelas ? ` · ${s.kelas.tingkat} ${s.kelas.rombel}` : ''}
								</p>
							</div>
							<span class="badge badge-ghost badge-sm">
								{STATUS_LABEL[s.status_santri] ?? s.status_santri}
							</span>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
{/if}
