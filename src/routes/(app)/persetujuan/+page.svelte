<script lang="ts">
	import { IconCheck, IconX, IconClock, IconUserCheck } from '@tabler/icons-svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';

	let { data, form } = $props();

	type RequestItem = {
		id: number;
		field: string;
		old_value: string | null;
		new_value: string | null;
		status: 'pending' | 'approved' | 'rejected';
		created_at: string;
		santri: { id: string; nama_lengkap: string } | null;
		applicant: { id: string; nama: string | null } | null;
	};

	const requests = $derived((data.requests ?? []) as RequestItem[]);
	const pendingRequests = $derived(requests.filter((r) => r.status === 'pending'));
	const handledRequests = $derived(requests.filter((r) => r.status !== 'pending'));

	const actionError = $derived((form as { error?: string } | null)?.error ?? null);

	function formatDate(iso: string) {
		const d = new Date(iso);
		return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('id-ID') + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
	}
</script>

<svelte:head>
	<title>Persetujuan Perubahan Data | Buku Induk</title>
</svelte:head>

<header>
	<h1 class="text-2xl font-semibold tracking-tight">Persetujuan Perubahan Data</h1>
	<p class="mt-1 max-w-[65ch] text-base-content/70">
		Daftar pengajuan perubahan data santri dari Wali Kamar atau Wali Kelas yang memerlukan persetujuan Admin TU.
	</p>
</header>

{#if actionError}
	<div class="alert alert-error mt-6" role="alert">
		<span>{actionError}</span>
	</div>
{/if}

{#if data.requests === undefined}
	<div class="mt-8" role="status" aria-busy="true" aria-live="polite">
		<Skeleton variant="table" rows={3} cols={6} ariaLabel="Memuat pengajuan persetujuan..." />
		<Skeleton variant="table" rows={3} cols={5} ariaLabel="Memuat riwayat persetujuan..." class="mt-6" />
	</div>
{:else}

<section class="mt-8">
	<h2 class="flex items-center gap-2 text-base font-semibold">
		<IconClock class="size-5 text-warning" stroke-width={1.75} />
		Menunggu Persetujuan ({pendingRequests.length})
	</h2>

	{#if pendingRequests.length === 0}
		<div class="mt-4">
			<EmptyState
				title="Tidak ada pengajuan"
				desc="Tidak ada pengajuan perubahan yang menunggu persetujuan." />
		</div>
	{:else}
		<div class="mt-4 overflow-x-auto rounded-lg border border-base-300 bg-base-100">
			<table class="table">
				<thead>
					<tr class="text-xs uppercase tracking-wider text-base-content/60 bg-base-200/50">
						<th>Tanggal</th>
						<th>Santri</th>
						<th>Pengaju</th>
						<th>Field</th>
						<th>Perubahan</th>
						<th class="text-right">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-base-200 text-sm">
					{#each pendingRequests as req (req.id)}
						<tr class="hover:bg-base-200/30">
							<td class="whitespace-nowrap font-mono text-xs">{formatDate(req.created_at)}</td>
							<td class="font-medium">
								{#if req.santri}
									<a href="/santri/{req.santri.id}" class="text-primary hover:underline">{req.santri.nama_lengkap}</a>
								{:else}
									<span class="text-base-content/50">(Santri dihapus)</span>
								{/if}
							</td>
							<td>{req.applicant?.nama ?? 'Wali'}</td>
							<td class="font-mono text-xs font-semibold text-base-content/80">{req.field}</td>
							<td class="min-w-[180px]">
								<p class="max-w-[240px] truncate text-xs text-base-content/55" title={req.old_value ?? ''}>
									{req.old_value ?? '—'}
								</p>
								<p class="mt-0.5 max-w-[240px] truncate text-sm font-medium text-success" title={req.new_value ?? ''}>
									{req.new_value ?? '—'}
								</p>
							</td>
							<td class="text-right">
								<div class="flex items-center justify-end gap-2">
									<form method="POST" action="?/approve">
										<input type="hidden" name="id" value={req.id} />
										<button type="submit" class="btn btn-success btn-xs gap-1">
											<IconCheck class="size-3.5" />
											Setujui
										</button>
									</form>
									<form method="POST" action="?/reject">
										<input type="hidden" name="id" value={req.id} />
										<button type="submit" class="btn btn-error btn-outline btn-xs gap-1">
											<IconX class="size-3.5" />
											Tolak
										</button>
									</form>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>

{#if handledRequests.length > 0}
	<section class="mt-10">
		<h2 class="flex items-center gap-2 text-base font-semibold">
			<IconUserCheck class="size-5 text-base-content/60" stroke-width={1.75} />
			Riwayat Persetujuan
		</h2>
		<div class="mt-4 overflow-x-auto rounded-lg border border-base-300 bg-base-100">
			<table class="table">
				<thead>
					<tr class="bg-base-200/50 text-xs uppercase tracking-wider text-base-content/60">
						<th>Tanggal</th>
						<th>Santri</th>
						<th>Pengaju</th>
						<th>Field</th>
						<th>Nilai Baru</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-base-200 text-sm">
					{#each handledRequests as req (req.id)}
						<tr class="hover:bg-base-200/30">
							<td class="whitespace-nowrap font-mono text-xs">{formatDate(req.created_at)}</td>
							<td>{req.santri?.nama_lengkap ?? '—'}</td>
							<td>{req.applicant?.nama ?? 'Wali'}</td>
							<td class="font-mono text-xs text-base-content/80">{req.field}</td>
							<td class="max-w-[150px] truncate">{req.new_value ?? '—'}</td>
							<td>
								{#if req.status === 'approved'}
									<span class="badge badge-success badge-sm">Disetujui</span>
								{:else}
									<span class="badge badge-error badge-sm">Ditolak</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
{/if}
{/if}
