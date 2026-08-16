<script lang="ts">
	import { IconArrowRight, IconAward, IconChevronLeft, IconRepeat, IconSchool } from '@tabler/icons-svelte';

	type Kelas = {
		id: number;
		tingkat: string;
		rombel: string;
		tahun_ajaran: string | null;
		aktif: boolean;
		jumlahSantri: number;
	};

	let { data, form } = $props();

	const kelas = $derived((data.kelas ?? []) as Kelas[]);
	const actionError = $derived((form as { error?: string } | null)?.error ?? null);
	const actionSuccess = $derived((form as { success?: boolean; count?: number; type?: string } | null)?.success ?? false);
	const countAffected = $derived((form as { count?: number } | null)?.count ?? 0);
	const lastActionType = $derived((form as { type?: string } | null)?.type ?? '');

	let sourceNaik = $state<string>('');
	let targetNaik = $state<string>('');
	let sourceLulus = $state<string>('');

	const selectedSourceNaik = $derived(kelas.find((k) => String(k.id) === sourceNaik));
	const selectedTargetNaik = $derived(kelas.find((k) => String(k.id) === targetNaik));
	const selectedSourceLulus = $derived(kelas.find((k) => String(k.id) === sourceLulus));
</script>

<svelte:head>
	<title>Kenaikan Kelas & Kelulusan Massal | Buku Induk</title>
</svelte:head>

<div class="mb-6 flex items-center gap-2">
	<a href="/kelas" class="btn btn-ghost btn-sm gap-1">
		<IconChevronLeft class="size-4" stroke-width={2} />
		Kembali ke Daftar Kelas
	</a>
</div>

<header>
	<h1 class="text-2xl font-semibold tracking-tight">Kenaikan Kelas & Kelulusan Massal</h1>
	<p class="mt-1 max-w-[65ch] text-base-content/70">
		Pindahkan rombongan belajar santri antar tingkat/kelas atau proses kelulusan akhir secara serentak.
	</p>
</header>

{#if actionError}
	<div class="alert alert-error mt-6" role="alert">
		<span>{actionError}</span>
	</div>
{/if}

{#if actionSuccess}
	<div class="alert alert-success mt-6" role="alert">
		<span>
			{#if lastActionType === 'naik'}
				Berhasil memindahkan <strong>{countAffected}</strong> santri ke kelas baru.
			{:else}
				Berhasil meluluskan <strong>{countAffected}</strong> santri. Data santri kini tersimpan di arsip alumni.
			{/if}
		</span>
	</div>
{/if}

<div class="mt-8 grid gap-8 lg:grid-cols-2">
	<!-- BLOK 1: KENAIKAN / PEMINDAHAN KELAS -->
	<div class="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
		<div class="flex items-center gap-3 border-b border-base-200 pb-4">
			<span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
				<IconRepeat class="size-5" stroke-width={1.75} />
			</span>
			<div>
				<h2 class="text-lg font-semibold">Kenaikan Kelas</h2>
				<p class="text-xs text-base-content/60">Pindahkan seluruh santri aktif dari satu kelas ke kelas lain</p>
			</div>
		</div>

		<form
			method="POST"
			action="?/naikKelas"
			class="mt-5 space-y-4"
			onsubmit={(e) => {
				if (!selectedSourceNaik || !selectedTargetNaik) return;
				const confirmed = confirm(
					`Pindahkan ${selectedSourceNaik.jumlahSantri} santri dari kelas ${selectedSourceNaik.tingkat} ${selectedSourceNaik.rombel} ke ${selectedTargetNaik.tingkat} ${selectedTargetNaik.rombel}?`
				);
				if (!confirmed) e.preventDefault();
			}}>
			<label class="block">
				<span class="mb-1.5 block text-sm font-medium">Kelas Asal *</span>
				<select name="source_kelas_id" class="select select-bordered w-full" bind:value={sourceNaik} required>
					<option value="">-- Pilih kelas asal --</option>
					{#each kelas as k (k.id)}
						<option value={String(k.id)}>
							{k.tingkat} {k.rombel} {k.tahun_ajaran && k.tahun_ajaran !== '—' ? `(${k.tahun_ajaran})` : ''} — {k.jumlahSantri} santri
						</option>
					{/each}
				</select>
			</label>

			<div class="flex justify-center text-base-content/40">
				<IconArrowRight class="size-5 rotate-90 lg:rotate-0" />
			</div>

			<label class="block">
				<span class="mb-1.5 block text-sm font-medium">Kelas Tujuan *</span>
				<select name="target_kelas_id" class="select select-bordered w-full" bind:value={targetNaik} required>
					<option value="">-- Pilih kelas tujuan --</option>
					{#each kelas as k (k.id)}
						<option value={String(k.id)} disabled={String(k.id) === sourceNaik}>
							{k.tingkat} {k.rombel} {k.tahun_ajaran && k.tahun_ajaran !== '—' ? `(${k.tahun_ajaran})` : ''}
						</option>
					{/each}
				</select>
			</label>

			{#if selectedSourceNaik}
				<div class="rounded-xl bg-base-200/50 p-3 text-xs text-base-content/70">
					Akan memindahkan <strong>{selectedSourceNaik.jumlahSantri}</strong> santri aktif/khusus.
				</div>
			{/if}

			<button
				type="submit"
				class="btn btn-primary w-full"
				disabled={!sourceNaik || !targetNaik || sourceNaik === targetNaik}>
				<IconRepeat class="size-4" stroke-width={2} />
				Proses Kenaikan Kelas
			</button>
		</form>
	</div>

	<!-- BLOK 2: KELULUSAN MASSAL -->
	<div class="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
		<div class="flex items-center gap-3 border-b border-base-200 pb-4">
			<span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-content">
				<IconAward class="size-5 text-primary" stroke-width={1.75} />
			</span>
			<div>
				<h2 class="text-lg font-semibold">Kelulusan Massal</h2>
				<p class="text-xs text-base-content/60">Ubah status seluruh santri di tingkat akhir menjadi Lulus</p>
			</div>
		</div>

		<form
			method="POST"
			action="?/lulusMassal"
			class="mt-5 space-y-4"
			onsubmit={(e) => {
				if (!selectedSourceLulus) return;
				const confirmed = confirm(
					`Ubah status ${selectedSourceLulus.jumlahSantri} santri di kelas ${selectedSourceLulus.tingkat} ${selectedSourceLulus.rombel} menjadi 'Lulus'?`
				);
				if (!confirmed) e.preventDefault();
			}}>
			<label class="block">
				<span class="mb-1.5 block text-sm font-medium">Pilih Kelas *</span>
				<select name="kelas_id" class="select select-bordered w-full" bind:value={sourceLulus} required>
					<option value="">-- Pilih kelas yang lulus --</option>
					{#each kelas as k (k.id)}
						<option value={String(k.id)}>
							{k.tingkat} {k.rombel} {k.tahun_ajaran && k.tahun_ajaran !== '—' ? `(${k.tahun_ajaran})` : ''} — {k.jumlahSantri} santri
						</option>
					{/each}
				</select>
			</label>

			<div class="rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning-content">
				<p class="font-semibold text-warning">Perhatian</p>
				<p class="mt-0.5">Santri yang diluluskan akan diubah statusnya menjadi <strong>Lulus</strong> dan tercatat ke dalam <strong>Arsip Alumni</strong>.</p>
			</div>

			{#if selectedSourceLulus}
				<div class="rounded-xl bg-base-200/50 p-3 text-xs text-base-content/70">
					Akan meluluskan <strong>{selectedSourceLulus.jumlahSantri}</strong> santri aktif/khusus.
				</div>
			{/if}

			<button
				type="submit"
				class="btn btn-warning w-full"
				disabled={!sourceLulus || (selectedSourceLulus?.jumlahSantri ?? 0) === 0}>
				<IconAward class="size-4" stroke-width={2} />
				Proses Kelulusan
			</button>
		</form>
	</div>
</div>
