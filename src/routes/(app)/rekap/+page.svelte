<script lang="ts">
	import { IconPrinter } from '@tabler/icons-svelte';
	import type { Rekap } from '$lib/types';

	let { data } = $props();

	const rekap = $derived((data.rekap as Rekap | null) ?? null);

	const kamarRows = $derived(
		(rekap?.per_kamar ?? [])
			.slice()
			.sort((a, b) => (a.nomor ?? 0) - (b.nomor ?? 0))
			.map((k) => ({ label: k.nomor != null ? `Kamar ${k.nomor}` : 'Tanpa kamar', jumlah: k.jumlah }))
	);
	const kelasRows = $derived(
		(rekap?.per_kelas ?? [])
			.slice()
			.map((k) => ({ label: k.kelas ?? 'Tanpa kelas', jumlah: k.jumlah }))
	);
	const totalKamar = $derived(kamarRows.reduce((s, r) => s + r.jumlah, 0));
	const totalKelas = $derived(kelasRows.reduce((s, r) => s + r.jumlah, 0));
</script>

<svelte:head>
	<title>Rekap Kamar & Kelas | Buku Induk</title>
</svelte:head>

<header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Rekap per Kamar & Kelas</h1>
		<p class="mt-1 max-w-[65ch] text-base-content/70">
			Tabel rekapitulasi jumlah santri per kamar dan per kelas. Dapat dicetak untuk arsip.
		</p>
	</div>
	<div class="print:hidden">
		<button class="btn btn-outline btn-sm" onclick={() => window.print()}>
			<IconPrinter class="size-4" stroke-width={1.75} />
			Cetak
		</button>
	</div>
</header>

{#if !rekap}
	<div class="mt-8 rounded-2xl border border-dashed border-base-300 bg-base-100 p-10 text-center">
		<p class="text-base-content/60">Data belum dapat dimuat.</p>
	</div>
{:else}
	<div class="mt-6 grid gap-4 lg:grid-cols-2">
		<section class="overflow-x-auto rounded-2xl border border-base-300 bg-base-100">
			<h2 class="border-b border-base-200 px-5 py-3 text-sm font-semibold">Rekap per Kamar</h2>
			<table class="table">
				<thead>
					<tr class="text-xs uppercase tracking-wide text-base-content/60">
						<th>Kamar</th>
						<th class="text-right">Jumlah</th>
					</tr>
				</thead>
				<tbody>
					{#each kamarRows as r (r.label)}
						<tr>
							<td>{r.label}</td>
							<td class="text-right font-mono">{r.jumlah}</td>
						</tr>
					{/each}
					{#if kamarRows.length === 0}
						<tr><td colspan="2" class="text-center text-base-content/50">Belum ada data.</td></tr>
					{/if}
				</tbody>
				<tfoot>
					<tr class="font-semibold">
						<td>Total</td>
						<td class="text-right font-mono">{totalKamar}</td>
					</tr>
				</tfoot>
			</table>
		</section>

		<section class="overflow-x-auto rounded-2xl border border-base-300 bg-base-100">
			<h2 class="border-b border-base-200 px-5 py-3 text-sm font-semibold">Rekap per Kelas</h2>
			<table class="table">
				<thead>
					<tr class="text-xs uppercase tracking-wide text-base-content/60">
						<th>Kelas</th>
						<th class="text-right">Jumlah</th>
					</tr>
				</thead>
				<tbody>
					{#each kelasRows as r (r.label)}
						<tr>
							<td>{r.label}</td>
							<td class="text-right font-mono">{r.jumlah}</td>
						</tr>
					{/each}
					{#if kelasRows.length === 0}
						<tr><td colspan="2" class="text-center text-base-content/50">Belum ada data.</td></tr>
					{/if}
				</tbody>
				<tfoot>
					<tr class="font-semibold">
						<td>Total</td>
						<td class="text-right font-mono">{totalKelas}</td>
					</tr>
				</tfoot>
			</table>
		</section>
	</div>
{/if}
