<script lang="ts">
import { IconPrinter, IconInbox } from '@tabler/icons-svelte';
import type { Rekap } from '$lib/types';
import PageHeader from '$lib/components/PageHeader.svelte';
import EmptyState from '$lib/components/EmptyState.svelte';
import { StatCardSkeleton, TableSkeleton } from '$lib/components/Skeleton.svelte';

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

<PageHeader
	title="Rekap per Kamar & Kelas"
	desc="Tabel rekapitulasi jumlah santri per kamar dan per kelas. Dapat dicetak untuk arsip.">
	{#snippet actions()}
		<div class="print:hidden">
			<button class="btn btn-outline btn-sm" onclick={() => window.print()}>
				<IconPrinter class="size-4" stroke-width={1.75} />
				Cetak
			</button>
		</div>
	{/snippet}
</PageHeader>

{#if !rekap}
	<div class="mt-6" role="status" aria-busy="true" aria-live="polite">
		<div class="grid grid-cols-2 gap-4 mb-6">
			<StatCardSkeleton ariaLabel="Memuat rekap kamar..." />
			<StatCardSkeleton ariaLabel="Memuat rekap kelas..." />
		</div>
		<div class="grid gap-4 lg:grid-cols-2">
			<TableSkeleton cols={2} rows={4} ariaLabel="Memuat rekap per kamar..." />
			<TableSkeleton cols={2} rows={4} ariaLabel="Memuat rekap per kelas..." />
		</div>
	</div>
{:else if kamarRows.length === 0 && kelasRows.length === 0}
	<EmptyState
		title="Belum ada data rekap"
		desc="Data santri belum tersedia untuk ditampilkan dalam rekap kamar dan kelas."
		Icon={IconInbox}
	>
		{#snippet children()}
			<button class="btn btn-outline btn-sm" onclick={() => window.location.reload()}>
				Muat Ulang
			</button>
		{/snippet}
	</EmptyState>
{:else}
	<div class="mt-6 grid gap-4 lg:grid-cols-2">
		<section class="overflow-x-auto rounded-lg border border-base-300 bg-base-100">
			<h2 class="border-b border-base-200 px-5 py-3 text-sm font-semibold">Rekap per Kamar</h2>
			<table class="table table-zebra table-pin-rows w-full">
				<thead class="sticky top-0 bg-base-200/50">
					<tr class="text-xs uppercase tracking-wider text-base-content/70">
						<th class="px-4 py-3 text-left">Kamar</th>
						<th class="px-4 py-3 text-left text-right">Jumlah</th>
					</tr>
				</thead>
				<tbody>
					{#each kamarRows as r (r.label)}
						<tr class="hover:bg-table-hover">
							<td class="px-4 py-3">{r.label}</td>
							<td class="px-4 py-3 text-right font-mono">{r.jumlah}</td>
						</tr>
					{/each}
					{#if kamarRows.length === 0}
						<tr><td colspan="2" class="px-4 py-3 text-center text-base-content/50">Belum ada data.</td></tr>
					{/if}
				</tbody>
				<tfoot>
					<tr class="font-semibold">
						<td class="px-4 py-3">Total</td>
						<td class="px-4 py-3 text-right font-mono">{totalKamar}</td>
					</tr>
				</tfoot>
			</table>
		</section>

		<section class="overflow-x-auto rounded-lg border border-base-300 bg-base-100">
			<h2 class="border-b border-base-200 px-5 py-3 text-sm font-semibold">Rekap per Kelas</h2>
			<table class="table table-zebra table-pin-rows w-full">
				<thead class="sticky top-0 bg-base-200/50">
					<tr class="text-xs uppercase tracking-wider text-base-content/70">
						<th class="px-4 py-3 text-left">Kelas</th>
						<th class="px-4 py-3 text-left text-right">Jumlah</th>
					</tr>
				</thead>
				<tbody>
					{#each kelasRows as r (r.label)}
						<tr class="hover:bg-table-hover">
							<td class="px-4 py-3">{r.label}</td>
							<td class="px-4 py-3 text-right font-mono">{r.jumlah}</td>
						</tr>
					{/each}
					{#if kelasRows.length === 0}
						<tr><td colspan="2" class="px-4 py-3 text-center text-base-content/50">Belum ada data.</td></tr>
					{/if}
				</tbody>
				<tfoot>
					<tr class="font-semibold">
						<td class="px-4 py-3">Total</td>
						<td class="px-4 py-3 text-right font-mono">{totalKelas}</td>
					</tr>
				</tfoot>
			</table>
		</section>
	</div>
{/if}

<style>
	@media print {
		/* Hide PageHeader actions, header, navbar */
		.print\:hidden,
		header,
		nav,
		.sidebar-rail,
		.drawer-toggle,
		.btn-print {
			display: none !important;
		}

		/* Tables full width, no shadows, no rounded corners */
		section.overflow-x-auto {
			overflow: visible !important;
			border: none !important;
			box-shadow: none !important;
			border-radius: 0 !important;
			background: transparent !important;
			break-inside: avoid;
		}

		section.overflow-x-auto h2 {
			border-bottom: 2px solid var(--color-base-content) !important;
			color: var(--color-base-content) !important;
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}

		/* thead repeats on each page */
		table {
			width: 100% !important;
			border-collapse: collapse !important;
		}

		thead {
			display: table-header-group !important;
		}

		thead tr {
			background: var(--color-base-200) !important;
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}

		thead th {
			border-bottom: 2px solid var(--color-base-content) !important;
			color: var(--color-base-content) !important;
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}

		tbody tr {
			break-inside: avoid;
			page-break-inside: avoid;
		}

		tbody td {
			border-bottom: 1px solid var(--color-base-300) !important;
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}

		tfoot tr {
			background: var(--color-base-200) !important;
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}

		tfoot td {
			border-top: 2px solid var(--color-base-content) !important;
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}

		/* Zebra striping for print */
		tbody tr:nth-child(even) {
			background: var(--color-base-200) !important;
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}

		/* Remove hover effect for print */
		tbody tr:hover {
			background: transparent !important;
		}

		/* Page margins */
		@page {
			margin: 1.5cm;
		}

		body {
			background: white !important;
			color: black !important;
		}

		/* Ensure content fits on page */
		main {
			padding: 0 !important;
			max-width: none !important;
		}

		/* Prevent orphan headers */
		h2 {
			break-after: avoid;
		}
	}
</style>
