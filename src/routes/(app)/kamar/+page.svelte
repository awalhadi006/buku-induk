<script lang="ts">
	import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import SkeletonCard from '$lib/components/Skeleton.svelte';

	type Kamar = {
		id: number;
		nomor: number;
		asrama: string | null;
		jumlah_santri: number;
		aktif: boolean;
	};

	let { data, form } = $props();

	const kamar = $derived(data.kamar as Kamar[]);
	const isAdmin = $derived(!!data.isAdmin);
	const actionError = $derived((form as { error?: string } | null)?.error ?? null);

	let editingId = $state<number | null>(null);
	let editForm = $state({ nomor: '1', asrama: '', aktif: true });

	function startEdit(k: Kamar) {
		editingId = k.id;
		editForm = {
			nomor: String(k.nomor),
			asrama: k.asrama ?? '',
			aktif: k.aktif
		};
	}
</script>

<svelte:head>
	<title>Kamar | Buku Induk</title>
</svelte:head>

<header>
	<h1 class="text-2xl font-semibold tracking-tight">Kamar</h1>
	<p class="mt-1 max-w-[65ch] text-base-content/70">
		Daftar kamar santri, asrama, dan jumlah santri. Nomor kamar dinamis, tidak terpaku angka tertentu.
	</p>
</header>

{#if actionError}
	<div class="alert alert-error mt-6" role="alert">
		<span>{actionError}</span>
	</div>
{/if}

{#if isAdmin}
	<form
		method="POST"
		action="?/add"
		class="mt-6 rounded-lg border border-base-300 bg-base-100 p-5">
		<h2 class="text-sm font-semibold">Tambah kamar</h2>
		<div class="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
			<label class="block">
				<span class="mb-1.5 block text-sm font-medium">Nomor *</span>
				<input name="nomor" type="number" min="1" required class="input input-bordered w-full" />
			</label>
			<label class="block">
				<span class="mb-1.5 block text-sm font-medium">Asrama</span>
				<input name="asrama" type="text" class="input input-bordered w-full" placeholder="Ikhwan/Akhwat" />
			</label>
			<label class="flex items-end gap-2 pb-1.5">
				<input name="aktif" type="checkbox" checked class="toggle toggle-primary" />
				<span class="text-sm font-medium">Aktif</span>
			</label>
		</div>
		<button type="submit" class="btn btn-primary btn-sm mt-4">
			<IconPlus class="size-4" stroke-width={2} />
			Tambah
		</button>
	</form>
{/if}

<ul class="mt-6 space-y-3">
	{#each kamar as k (k.id)}
		<li class="rounded-lg border border-base-300 bg-base-100 p-4">
			{#if editingId === k.id}
				<form method="POST" action="?/update" class="flex flex-wrap items-end gap-3">
					<input type="hidden" name="id" value={k.id} />
					<label class="block">
						<span class="mb-1.5 block text-sm font-medium">Nomor *</span>
						<input
							name="nomor"
							type="number"
							min="1"
							required
							class="input input-bordered w-28"
							bind:value={editForm.nomor} />
					</label>
					<label class="block">
						<span class="mb-1.5 block text-sm font-medium">Asrama</span>
						<input
							name="asrama"
							type="text"
							class="input input-bordered w-44"
							placeholder="Ikhwan/Akhwat"
							bind:value={editForm.asrama} />
					</label>
					<label class="flex items-end gap-2 pb-1.5">
						<input name="aktif" type="checkbox" class="toggle toggle-primary" bind:checked={editForm.aktif} />
						<span class="text-sm font-medium">Aktif</span>
					</label>
					<button type="submit" class="btn btn-primary btn-sm">Simpan</button>
					<button type="button" class="btn btn-ghost btn-sm" onclick={() => (editingId = null)}>
						Batal
					</button>
				</form>
			{:else}
				<div class="flex flex-wrap items-center gap-3">
					<div class="min-w-0 flex-1">
						<a href="/kamar/{k.id}" class="font-medium hover:underline">Kamar {k.nomor}</a>
						<p class="text-sm text-base-content/60">
							{k.asrama ?? 'Tanpa asrama'}
							· {k.jumlah_santri} santri
						</p>
					</div>
					<span class={`badge badge-sm ${k.aktif ? 'badge-success' : 'badge-neutral'}`}>
						{k.aktif ? 'Aktif' : 'Nonaktif'}
					</span>
					{#if isAdmin}
						<button
							class="btn btn-ghost btn-square btn-sm"
							aria-label="Edit kamar"
							title="Edit"
							onclick={() => startEdit(k)}>
							<IconEdit class="size-4" stroke-width={1.75} />
						</button>
						<form method="POST" action="?/delete" onsubmit={() => confirm(`Hapus Kamar ${k.nomor}?`)}>
							<input type="hidden" name="id" value={k.id} />
							<button
								class="btn btn-ghost btn-square btn-sm text-error"
								aria-label="Hapus kamar"
								title="Hapus"
								type="submit">
								<IconTrash class="size-4" stroke-width={1.75} />
							</button>
						</form>
					{/if}
				</div>
			{/if}
		</li>
	{/each}
</ul>

{#if data.kamar === undefined}
	<div class="mt-6" role="status" aria-busy="true" aria-live="polite">
		<SkeletonCard count={4} ariaLabel="Memuat daftar kamar..." />
	</div>
{:else if kamar.length === 0}
	<div class="mt-6">
		<EmptyState title="Belum ada kamar" desc="Tambahkan kamar pertama lewat formulir di atas." />
	</div>
{/if}
