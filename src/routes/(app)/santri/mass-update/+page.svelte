<script lang="ts">
	import { IconSchool, IconUserCheck } from '@tabler/icons-svelte';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	const kelas = $derived(data.kelas as { id: number; tingkat: string; rombel: string; tahun_ajaran: string | null }[]);

	const error = $derived((form as { error?: string } | null)?.error ?? null);
	const success = $derived((form as { success?: boolean; message?: string } | null));
	const successMsg = $derived(success?.success ? success.message : null);

	let busy = $state(false);
</script>

<svelte:head>
	<title>Update Massal | Buku Induk</title>
</svelte:head>

<header>
	<h1 class="text-2xl font-semibold tracking-tight">Update Massal Santri</h1>
	<p class="mt-1 max-w-[65ch] text-base-content/70">
		Kenaikan kelas atau perubahan status menjadi alumni untuk seluruh santri dalam satu kelas.
	</p>
</header>

{#if error}
	<div class="alert alert-error mt-6" role="alert">
		<span>{error}</span>
	</div>
{/if}

{#if successMsg}
	<div class="alert alert-success mt-6" role="alert">
		<span>{successMsg}</span>
	</div>
{/if}

<div class="mt-6 grid gap-6 lg:grid-cols-2">
	<!-- Kenaikan Kelas -->
	<div class="rounded-2xl border border-base-300 bg-base-100 p-5">
		<div class="flex items-center gap-3">
			<span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
				<IconSchool class="size-5" stroke-width={1.75} />
			</span>
			<div>
				<h2 class="font-semibold">Kenaikan Kelas</h2>
				<p class="text-sm text-base-content/60">Pindahkan semua santri aktif ke kelas tujuan.</p>
			</div>
		</div>

		<form
			method="POST"
			action="?/promote"
			class="mt-5 space-y-4"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					await update();
					busy = false;
				};
			}}>
			<label class="block">
				<span class="mb-1.5 block text-sm font-medium">Kelas Asal</span>
				<select name="from" required class="select select-bordered w-full">
					<option value="">— Pilih kelas asal —</option>
					{#each kelas as k (k.id)}
						<option value={k.id}>
							{k.tingkat} {k.rombel}{k.tahun_ajaran ? ` (${k.tahun_ajaran})` : ''}
						</option>
					{/each}
				</select>
			</label>

			<label class="block">
				<span class="mb-1.5 block text-sm font-medium">Kelas Tujuan</span>
				<select name="to" required class="select select-bordered w-full">
					<option value="">— Pilih kelas tujuan —</option>
					{#each kelas as k (k.id)}
						<option value={k.id}>
							{k.tingkat} {k.rombel}{k.tahun_ajaran ? ` (${k.tahun_ajaran})` : ''}
						</option>
					{/each}
				</select>
			</label>

			<button type="submit" class="btn btn-primary btn-sm" disabled={busy}>
				{#if busy}
					<span class="loading loading-spinner loading-sm"></span>
				{/if}
				Naikkan Kelas
			</button>
		</form>
	</div>

	<!-- Ubah Status Alumni -->
	<div class="rounded-2xl border border-base-300 bg-base-100 p-5">
		<div class="flex items-center gap-3">
			<span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
				<IconUserCheck class="size-5" stroke-width={1.75} />
			</span>
			<div>
				<h2 class="font-semibold">Ubah Status Alumni</h2>
				<p class="text-sm text-base-content/60">Tandai semua santri aktif sebagai lulus/alumni.</p>
			</div>
		</div>

		<form
			method="POST"
			action="?/graduate"
			class="mt-5 space-y-4"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					await update();
					busy = false;
				};
			}}>
			<label class="block">
				<span class="mb-1.5 block text-sm font-medium">Kelas</span>
				<select name="kelas_id" required class="select select-bordered w-full">
					<option value="">— Pilih kelas —</option>
					{#each kelas as k (k.id)}
						<option value={k.id}>
							{k.tingkat} {k.rombel}{k.tahun_ajaran ? ` (${k.tahun_ajaran})` : ''}
						</option>
					{/each}
				</select>
			</label>

			<div class="rounded-xl bg-base-200/50 p-3 text-sm text-base-content/70">
				Semua santri dengan status <span class="font-medium text-base-content">Aktif</span> di kelas ini akan diubah
				menjadi <span class="font-medium text-base-content">Lulus</span>.
			</div>

			<button type="submit" class="btn btn-secondary btn-sm" disabled={busy}>
				{#if busy}
					<span class="loading loading-spinner loading-sm"></span>
				{/if}
				Set sebagai Alumni
			</button>
		</form>
	</div>
</div>
