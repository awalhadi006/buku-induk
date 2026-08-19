<script lang="ts">
	import { IconUserHeart, IconPhone, IconMapPin, IconUsers, IconTrash } from '@tabler/icons-svelte';

	let { data, form } = $props();
	const w = $derived(data.wali as {
		nama_ayah: string | null;
		nama_ibu: string | null;
		nama_wali: string | null;
		pekerjaan_ayah: string | null;
		pekerjaan_ibu: string | null;
		penghasilan: string | null;
		alamat: string | null;
		no_hp: string | null;
	});
	const santri = $derived(data.santri as {
		id: string;
		nama_lengkap: string;
		nisn: string | null;
		kamar: string;
		kelas: string;
	}[]);

	const label = $derived(w.nama_wali || w.nama_ayah || w.nama_ibu || 'Wali Santri');
	const actionError = $derived((form as { error?: string } | null)?.error ?? null);
</script>

<svelte:head>
	<title>{label} | Buku Induk</title>
</svelte:head>

<header class="flex items-center gap-3">
	<a class="btn btn-ghost btn-sm" href="/wali" aria-label="Kembali ke daftar wali">&larr;</a>
	<span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
		<IconUserHeart class="size-5" stroke-width={1.75} />
	</span>
	<div class="min-w-0 flex-1">
		<h1 class="text-2xl font-semibold tracking-tight">{label}</h1>
		<p class="mt-0.5 text-base-content/70">Profil wali dan daftar anak (santri) yang dinaungi.</p>
	</div>
	{#if data.isAdmin}
		<form method="POST" action="?/delete" onsubmit={() => confirm('Yakin ingin menghapus wali ini? Data yang sudah terhapus tidak dapat dikembalikan.')}>
			<button type="submit" class="btn btn-error btn-sm gap-1">
				<IconTrash class="size-4" stroke-width={1.75} />
				Hapus
			</button>
		</form>
	{/if}
</header>

{#if actionError}
	<div class="alert alert-error mt-6" role="alert">
		<span>{actionError}</span>
	</div>
{/if}

<div class="mt-8 grid gap-6 lg:grid-cols-3">
	<!-- Info Wali -->
	<div class="space-y-4 rounded-2xl border border-base-300 bg-base-100 p-5 lg:col-span-1">
		<h2 class="text-sm font-semibold">Informasi Kontak & Keluarga</h2>
		<dl class="space-y-3 text-sm">
			<div>
				<dt class="text-xs text-base-content/60">Nama Ayah / Ibu / Wali</dt>
				<dd class="font-medium">
					{[w.nama_ayah, w.nama_ibu, w.nama_wali].filter(Boolean).join(' / ') || '—'}
				</dd>
			</div>
			<div>
				<dt class="text-xs text-base-content/60">Pekerjaan</dt>
				<dd class="font-medium">
					Ayah: {w.pekerjaan_ayah || '—'} <br />
					Ibu: {w.pekerjaan_ibu || '—'}
				</dd>
			</div>
			<div>
				<dt class="text-xs text-base-content/60">Penghasilan</dt>
				<dd class="font-medium">{w.penghasilan || '—'}</dd>
			</div>
			<div>
				<dt class="text-xs text-base-content/60">No. HP</dt>
				<dd class="flex items-center gap-1.5 font-medium">
					<IconPhone class="size-4 text-base-content/50" />
					{w.no_hp || '—'}
				</dd>
			</div>
			<div>
				<dt class="text-xs text-base-content/60">Alamat</dt>
				<dd class="flex items-start gap-1.5 font-medium">
					<IconMapPin class="mt-0.5 size-4 shrink-0 text-base-content/50" />
					<span>{w.alamat || '—'}</span>
				</dd>
			</div>
		</dl>
	</div>

	<!-- Daftar Santri Binaan -->
	<div class="rounded-2xl border border-base-300 bg-base-100 p-5 lg:col-span-2">
		<h2 class="flex items-center gap-2 text-sm font-semibold">
			<IconUsers class="size-4 text-primary" />
			Daftar Anak / Santri Asuhan ({santri.length})
		</h2>

		{#if santri.length === 0}
			<div class="mt-4 rounded-xl border border-dashed border-base-300 p-8 text-center">
				<p class="text-sm text-base-content/60">Belum ada santri yang terhubung dengan wali ini.</p>
			</div>
		{:else}
			<div class="mt-4 overflow-x-auto rounded-xl border border-base-200">
				<table class="table">
					<thead>
						<tr class="text-xs uppercase tracking-wider text-base-content/60">
							<th>Nama Santri</th>
							<th>NISN</th>
							<th>Kamar</th>
							<th>Kelas</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-base-200 text-sm">
						{#each santri as s (s.id)}
							<tr class="hover:bg-base-200/50">
								<td class="font-medium">
									<a href="/santri/{s.id}" class="text-primary hover:underline">{s.nama_lengkap}</a>
								</td>
								<td class="font-mono text-xs">{s.nisn ?? '—'}</td>
								<td>{s.kamar}</td>
								<td>{s.kelas}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
