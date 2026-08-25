<script lang="ts">
	import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-svelte';
import EmptyState from '$lib/components/EmptyState.svelte';

	type Kelas = {
		id: number;
		tingkat: string;
		rombel: string;
		tahun_ajaran: string | null;
		aktif: boolean;
	};

	let { data, form } = $props();

	const kelas = $derived(data.kelas as Kelas[]);
	const taAktif = $derived(data.tahunAjaranAktif as string);
	const isAdmin = $derived(!!data.isAdmin);
	const actionError = $derived((form as { error?: string } | null)?.error ?? null);

	let editingId = $state<number | null>(null);
	let editForm = $state({ tingkat: '7', rombel: 'A', tahun_ajaran: '', aktif: true });

	function startEdit(k: Kelas) {
		editingId = k.id;
		editForm = { tingkat: k.tingkat, rombel: k.rombel, tahun_ajaran: k.tahun_ajaran ?? '', aktif: k.aktif };
	}
</script>

<svelte:head>
	<title>Kelas | Buku Induk</title>
</svelte:head>

<header>
	<h1 class="text-2xl font-semibold tracking-tight">Kelas</h1>
	<p class="mt-1 max-w-[65ch] text-base-content/70">
		Rombongan belajar per tahun ajaran: tingkat (7/8/9) dan rombel (A/B/…).
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
		<h2 class="text-sm font-semibold">Tambah kelas</h2>
		<div class="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
			<label class="block">
				<span class="mb-1.5 block text-sm font-medium">Tingkat *</span>
				<input name="tingkat" type="text" required class="input input-bordered w-full" placeholder="7" />
			</label>
			<label class="block">
				<span class="mb-1.5 block text-sm font-medium">Rombel *</span>
				<input name="rombel" type="text" required class="input input-bordered w-full" placeholder="A" />
			</label>
			<label class="block">
				<span class="mb-1.5 block text-sm font-medium">Tahun Ajaran</span>
				<input name="tahun_ajaran" type="text" class="input input-bordered w-full" placeholder={taAktif || '202X/202Y'} />
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
	{#each kelas as k (k.id)}
		<li class="rounded-lg border border-base-300 bg-base-100 p-4">
			{#if editingId === k.id}
				<form method="POST" action="?/update" class="flex flex-wrap items-end gap-3">
					<input type="hidden" name="id" value={k.id} />
					<label class="block">
						<span class="mb-1.5 block text-sm font-medium">Tingkat *</span>
						<input
							name="tingkat"
							type="text"
							required
							class="input input-bordered w-36"
							bind:value={editForm.tingkat} />
					</label>
					<label class="block">
						<span class="mb-1.5 block text-sm font-medium">Rombel *</span>
						<input
							name="rombel"
							type="text"
							required
							class="input input-bordered w-36"
							bind:value={editForm.rombel} />
					</label>
					<label class="block">
						<span class="mb-1.5 block text-sm font-medium">Tahun Ajaran</span>
						<input
							name="tahun_ajaran"
							type="text"
							class="input input-bordered w-36"
							bind:value={editForm.tahun_ajaran} />
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
						<a href="/kelas/{k.id}" class="font-medium hover:underline">
							{k.tingkat}
							{k.rombel}
							{#if k.tahun_ajaran && k.tahun_ajaran !== '—'}
								<span class="badge badge-ghost badge-sm ml-2 font-normal">{k.tahun_ajaran}</span>
							{/if}
						</a>
					</div>
					<span class={`badge badge-sm ${k.aktif ? 'badge-success' : 'badge-neutral'}`}>
						{k.aktif ? 'Aktif' : 'Nonaktif'}
					</span>
					{#if isAdmin}
						<button
							class="btn btn-ghost btn-square btn-sm"
							aria-label="Edit kelas"
							title="Edit"
							onclick={() => startEdit(k)}>
							<IconEdit class="size-4" stroke-width={1.75} />
						</button>
						<form method="POST" action="?/delete" onsubmit={() => confirm(`Hapus kelas ${k.tingkat}${k.rombel}?`)}>
							<input type="hidden" name="id" value={k.id} />
							<button
								class="btn btn-ghost btn-square btn-sm text-error"
								aria-label="Hapus kelas"
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

{#if kelas.length === 0}
	<div class="mt-6">
		<EmptyState title="Belum ada kelas" desc="Tambahkan kelas pertama lewat formulir di atas." />
	</div>
{/if}