<script lang="ts">
	import { page } from '$app/state';
	import {
		IconUserCog,
		IconShieldCheck,
		IconListDetails,
		IconCalendar,
		IconHistory,
		IconEdit,
		IconTrash,
		IconPlus
	} from '@tabler/icons-svelte';
	import { PERAN_LABEL, DASHBOARD_METRICS } from '$lib/types';
	import { ABILITIES } from '$lib/permissions';

	type Profile = {
		id: string;
		peran: string;
		nama: string | null;
		kamar_id: number | null;
		kelas_id: number | null;
	};
	type Permission = { role: string; abilities: string[] };
	type Field = {
		id: number;
		nama: string;
		label: string;
		tipe: string;
		opsi: string[];
		aktif: boolean;
		urutan: number;
	};
	type Audit = {
		id: number;
		actor_id: string | null;
		action: string;
		entity: string;
		entity_id: string | null;
		created_at: string;
	};

	let { data, form } = $props();

	const profiles = $derived(data.profiles as Profile[]);
	const kamar = $derived(data.kamar as { id: number; nomor: number }[]);
	const kelas = $derived(data.kelas as { id: number; tingkat: string; rombel: string }[]);
	const permissions = $derived(data.permissions as Permission[]);
	const fields = $derived(data.fields as Field[]);
	const settings = $derived(data.settings as Record<string, string>);
	const auditLogs = $derived(data.auditLogs as Audit[]);

	const enabledMetrics = $derived(
		(Array.isArray(data.enabledMetrics) ? data.enabledMetrics : []) as string[]
	);

	const actionError = $derived((form as { error?: string } | null)?.error ?? null);
	const tab = $derived(page.url.searchParams.get('tab') ?? 'users');
	const actorName = $derived(
		Object.fromEntries(profiles.map((p) => [p.id, p.nama ?? p.id.slice(0, 8)]))
	);

	let editingId = $state<string | null>(null);
	let editForm = $state({ nama: '', peran: 'asatidz', kamar_id: '', kelas_id: '' });

	function startEdit(p: Profile) {
		editingId = p.id;
		editForm = {
			nama: p.nama ?? '',
			peran: p.peran,
			kamar_id: p.kamar_id != null ? String(p.kamar_id) : '',
			kelas_id: p.kelas_id != null ? String(p.kelas_id) : ''
		};
	}

	let editingField = $state<number | null>(null);
	let fieldForm = $state({ nama: '', label: '', tipe: 'text', opsi: '', urutan: '0', aktif: true });

	function startEditField(f: Field) {
		editingField = f.id;
		fieldForm = {
			nama: f.nama,
			label: f.label,
			tipe: f.tipe,
			opsi: (f.opsi ?? []).join('\n'),
			urutan: String(f.urutan),
			aktif: f.aktif
		};
	}

	const TIPE_LABEL: Record<string, string> = {
		text: 'Teks',
		number: 'Angka',
		select: 'Pilihan',
		date: 'Tanggal'
	};

	function d(iso: string) {
		const date = new Date(iso);
		return Number.isNaN(date.getTime())
			? iso
			: date.toLocaleDateString('id-ID') + ' ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
	}
</script>

<svelte:head>
	<title>Pengaturan | Buku Induk</title>
</svelte:head>

<header>
	<h1 class="text-2xl font-semibold tracking-tight">Pengaturan</h1>
	<p class="mt-1 max-w-[65ch] text-base-content/70">
		Pengguna dan perannya, peran & izin, konfigurasi field, tahun ajaran aktif, dan audit log.
	</p>
</header>

{#if actionError}
	<div class="alert alert-error mt-6" role="alert">
		<span>{actionError}</span>
	</div>
{/if}

<div class="tabs tabs-box mt-6 w-full overflow-x-auto">
	<a class="tab" class:tab-active={tab === 'users'} href="/pengaturan?tab=users">Pengguna</a>
	<a class="tab" class:tab-active={tab === 'permissions'} href="/pengaturan?tab=permissions">Peran & Izin</a>
	<a class="tab" class:tab-active={tab === 'fields'} href="/pengaturan?tab=fields">Field Kustom</a>
	<a class="tab" class:tab-active={tab === 'ta'} href="/pengaturan?tab=ta">Tahun Ajaran</a>
	<a class="tab" class:tab-active={tab === 'dashboard'} href="/pengaturan?tab=dashboard">Dashboard</a>
	<a class="tab" class:tab-active={tab === 'audit'} href="/pengaturan?tab=audit">Audit Log</a>
</div>

{#if tab === 'users'}
	<section class="mt-6">
		<h2 class="flex items-center gap-2 text-sm font-semibold">
			<IconUserCog class="size-4" stroke-width={1.75} />
			Pengguna & peran
		</h2>
		<p class="mt-1 text-sm text-base-content/60">
			Akun dibuat dari dashboard Supabase Auth; di sini Superadmin menetapkan peran dan cakupan
			kamar/kelas untuk wali kamar & wali kelas.
		</p>

		<div class="mt-4 overflow-x-auto rounded-2xl border border-base-300 bg-base-100">
			<table class="table">
				<thead>
					<tr class="text-xs uppercase tracking-wide text-base-content/60">
						<th>Nama</th>
						<th>Peran</th>
						<th class="hidden sm:table-cell">Cakupan</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each profiles as p (p.id)}
						<tr class="align-top">
							<td class="min-w-0 max-w-[18ch]">
								{#if editingId === p.id}
									<input
										name="nama"
										class="input input-bordered input-sm w-full"
										bind:value={editForm.nama}
										placeholder="Nama pengguna" />
								{:else}
									<span class="font-medium">{p.nama || '—'}</span>
									<p class="font-mono text-xs text-base-content/50">{p.id.slice(0, 8)}</p>
								{/if}
							</td>
							<td>
								{#if editingId === p.id}
									<select class="select select-bordered select-sm w-full" bind:value={editForm.peran}>
										{#each Object.entries(PERAN_LABEL) as [value, label] (value)}
											<option value={value}>{label}</option>
										{/each}
									</select>
								{:else}
									<span class="badge badge-ghost badge-sm">{PERAN_LABEL[p.peran] ?? p.peran}</span>
								{/if}
							</td>
							<td class="hidden sm:table-cell">
								{#if editingId === p.id}
									<div class="flex flex-col gap-2">
										{#if editForm.peran === 'wali_kamar'}
											<select class="select select-bordered select-sm w-full" bind:value={editForm.kamar_id}>
												<option value="">— Tanpa kamar —</option>
												{#each kamar as k (k.id)}
													<option value={k.id}>{`Kamar ${k.nomor}`}</option>
												{/each}
											</select>
										{:else if editForm.peran === 'wali_kelas'}
											<select class="select select-bordered select-sm w-full" bind:value={editForm.kelas_id}>
												<option value="">— Tanpa kelas —</option>
												{#each kelas as k (k.id)}
													<option value={k.id}>{`${k.tingkat} ${k.rombel}`}</option>
												{/each}
											</select>
										{:else}
											<span class="text-sm text-base-content/60">—</span>
										{/if}
									</div>
								{:else}
									<span class="text-sm text-base-content/60">
										{#if p.peran === 'wali_kamar'}
											{p.kamar_id != null
												? `Kamar ${kamar.find((k) => k.id === p.kamar_id)?.nomor ?? p.kamar_id}`
												: '—'}
										{:else if p.peran === 'wali_kelas'}
											{p.kelas_id != null
												? `${kelas.find((k) => k.id === p.kelas_id)?.tingkat ?? ''} ${kelas.find((k) => k.id === p.kelas_id)?.rombel ?? ''}`
												: '—'}
										{:else}
											—
										{/if}
									</span>
								{/if}
							</td>
							<td class="text-right">
								{#if editingId === p.id}
									<form method="POST" action="?/updateProfile" class="flex justify-end gap-2">
										<input type="hidden" name="id" value={p.id} />
										<input type="hidden" name="nama" value={editForm.nama} />
										<input type="hidden" name="peran" value={editForm.peran} />
										<input type="hidden" name="kamar_id" value={editForm.kamar_id} />
										<input type="hidden" name="kelas_id" value={editForm.kelas_id} />
										<button type="submit" class="btn btn-primary btn-sm">Simpan</button>
										<button type="button" class="btn btn-ghost btn-sm" onclick={() => (editingId = null)}>
											Batal
										</button>
									</form>
								{:else}
									<button
										class="btn btn-ghost btn-square btn-sm"
										aria-label="Edit pengguna"
										title="Edit"
										onclick={() => startEdit(p)}>
										<IconEdit class="size-4" stroke-width={1.75} />
									</button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

{:else if tab === 'permissions'}
	<section class="mt-6">
		<h2 class="flex items-center gap-2 text-sm font-semibold">
			<IconShieldCheck class="size-4" stroke-width={1.75} />
			Peran & izin (runtime)
		</h2>
		<p class="mt-1 text-sm text-base-content/60">
			Matriks izin berlaku langsung. Perubahan di sini memengaruhi hak akses semua pengguna.
		</p>

		<div class="mt-4 grid gap-4 lg:grid-cols-2">
			{#each permissions as perm (perm.role)}
				<form method="POST" action="?/updatePermissions" class="rounded-2xl border border-base-300 bg-base-100 p-5">
					<input type="hidden" name="role" value={perm.role} />
					<h3 class="text-sm font-semibold">{PERAN_LABEL[perm.role] ?? perm.role}</h3>
					<div class="mt-3 grid gap-2 sm:grid-cols-2">
						{#each ABILITIES as a (a.key)}
							<label class="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									name="ability"
									value={a.key}
									class="checkbox checkbox-primary checkbox-sm"
									checked={perm.abilities.includes(a.key)} />
								{a.label}
							</label>
						{/each}
					</div>
					<button type="submit" class="btn btn-primary btn-sm mt-4">Simpan izin</button>
				</form>
			{/each}
		</div>
	</section>

{:else if tab === 'fields'}
	<section class="mt-6">
		<h2 class="flex items-center gap-2 text-sm font-semibold">
			<IconListDetails class="size-4" stroke-width={1.75} />
			Field kustom
		</h2>
		<p class="mt-1 text-sm text-base-content/60">
			Kolom tambahan di luar field bawaan santri. Nilainya tersimpan di data santri (JSONB).
		</p>

		<form method="POST" action="?/createField" class="mt-4 rounded-2xl border border-base-300 bg-base-100 p-5">
			<h3 class="text-sm font-semibold">Tambah field</h3>
			<div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<label class="block">
					<span class="mb-1.5 block text-sm font-medium">Nama (kode) *</span>
					<input name="nama" type="text" required class="input input-bordered w-full" placeholder="asal_santri" />
				</label>
				<label class="block">
					<span class="mb-1.5 block text-sm font-medium">Label *</span>
					<input name="label" type="text" required class="input input-bordered w-full" placeholder="Asal santri" />
				</label>
				<label class="block">
					<span class="mb-1.5 block text-sm font-medium">Tipe</span>
					<select name="tipe" class="select select-bordered w-full">
						{#each Object.entries(TIPE_LABEL) as [value, label] (value)}
							<option value={value}>{label}</option>
						{/each}
					</select>
				</label>
				<label class="block">
					<span class="mb-1.5 block text-sm font-medium">Urutan</span>
					<input name="urutan" type="number" min="0" value="0" class="input input-bordered w-full" />
				</label>
			</div>
			<label class="mt-3 block">
				<span class="mb-1.5 block text-sm font-medium">Opsi (satu per baris, untuk tipe Pilihan)</span>
				<textarea name="opsi" rows="2" class="textarea textarea-bordered w-full" placeholder="Putra&#10;Putri"></textarea>
			</label>
			<label class="mt-3 flex items-center gap-2">
				<input name="aktif" type="checkbox" checked class="toggle toggle-primary toggle-sm" />
				<span class="text-sm font-medium">Aktif</span>
			</label>
			<button type="submit" class="btn btn-primary btn-sm mt-4">
				<IconPlus class="size-4" stroke-width={2} />
				Tambah field
			</button>
		</form>

		<ul class="mt-4 space-y-3">
			{#each fields as f (f.id)}
				<li class="rounded-2xl border border-base-300 bg-base-100 p-4">
					{#if editingField === f.id}
						<form method="POST" action="?/updateField" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
							<input type="hidden" name="id" value={f.id} />
							<label class="block">
								<span class="mb-1.5 block text-sm font-medium">Nama (kode) *</span>
								<input name="nama" type="text" required class="input input-bordered w-full" bind:value={fieldForm.nama} />
							</label>
							<label class="block">
								<span class="mb-1.5 block text-sm font-medium">Label *</span>
								<input name="label" type="text" required class="input input-bordered w-full" bind:value={fieldForm.label} />
							</label>
							<label class="block">
								<span class="mb-1.5 block text-sm font-medium">Tipe</span>
								<select name="tipe" class="select select-bordered w-full" bind:value={fieldForm.tipe}>
									{#each Object.entries(TIPE_LABEL) as [value, label] (value)}
										<option value={value}>{label}</option>
									{/each}
								</select>
							</label>
							<label class="block">
								<span class="mb-1.5 block text-sm font-medium">Urutan</span>
								<input name="urutan" type="number" min="0" class="input input-bordered w-full" bind:value={fieldForm.urutan} />
							</label>
							{#if fieldForm.tipe === 'select'}
								<label class="block sm:col-span-2 lg:col-span-4">
									<span class="mb-1.5 block text-sm font-medium">Opsi (satu per baris)</span>
									<textarea name="opsi" rows="3" class="textarea textarea-bordered w-full" bind:value={fieldForm.opsi}></textarea>
								</label>
							{/if}
							<label class="flex items-center gap-2">
								<input name="aktif" type="checkbox" class="toggle toggle-primary toggle-sm" bind:checked={fieldForm.aktif} />
								<span class="text-sm font-medium">Aktif</span>
							</label>
							<div class="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
								<button type="submit" class="btn btn-primary btn-sm">Simpan</button>
								<button type="button" class="btn btn-ghost btn-sm" onclick={() => (editingField = null)}>Batal</button>
							</div>
						</form>
					{:else}
						<div class="flex flex-wrap items-center gap-3">
							<div class="min-w-0 flex-1">
								<p class="font-medium">{f.label}</p>
								<p class="font-mono text-xs text-base-content/50">{f.nama} · {TIPE_LABEL[f.tipe] ?? f.tipe}</p>
								{#if f.tipe === 'select' && (f.opsi ?? []).length > 0}
									<p class="mt-1 text-xs text-base-content/60">{(f.opsi ?? []).join(', ')}</p>
								{/if}
							</div>
							<span class={`badge badge-sm ${f.aktif ? 'badge-success' : 'badge-neutral'}`}>
								{f.aktif ? 'Aktif' : 'Nonaktif'}
							</span>
							<button
								class="btn btn-ghost btn-square btn-sm"
								aria-label="Edit field"
								title="Edit"
								onclick={() => startEditField(f)}>
								<IconEdit class="size-4" stroke-width={1.75} />
							</button>
							<form method="POST" action="?/deleteField" onsubmit={() => confirm(`Hapus field "${f.label}"?`)}>
								<input type="hidden" name="id" value={f.id} />
								<button class="btn btn-ghost btn-square btn-sm text-error" aria-label="Hapus field" title="Hapus" type="submit">
									<IconTrash class="size-4" stroke-width={1.75} />
								</button>
							</form>
						</div>
					{/if}
				</li>
			{/each}
		</ul>

		{#if fields.length === 0}
			<div class="mt-4 rounded-2xl border border-dashed border-base-300 bg-base-100 p-8 text-center">
				<p class="text-base-content/60">Belum ada field kustom.</p>
			</div>
		{/if}
	</section>

{:else if tab === 'ta'}
	<section class="mt-6">
		<h2 class="flex items-center gap-2 text-sm font-semibold">
			<IconCalendar class="size-4" stroke-width={1.75} />
			Tahun ajaran aktif
		</h2>
		<p class="mt-1 max-w-[65ch] text-sm text-base-content/60">
			Menjadi konteks dashboard dan rekap "saat ini".
		</p>

		<form method="POST" action="?/updateSetting" class="mt-4 max-w-md rounded-2xl border border-base-300 bg-base-100 p-5">
			<input type="hidden" name="key" value="tahun_ajaran_aktif" />
			<label class="block">
				<span class="mb-1.5 block text-sm font-medium">Tahun ajaran aktif</span>
				<input
					name="value"
					type="text"
					class="input input-bordered w-full"
					value={settings['tahun_ajaran_aktif'] ?? ''}
					placeholder="mis. 2026/2027" />
			</label>
			<button type="submit" class="btn btn-primary btn-sm mt-4">Simpan</button>
		</form>
	</section>

{:else if tab === 'dashboard'}
	<section class="mt-6">
		<h2 class="flex items-center gap-2 text-sm font-semibold">
			<IconCalendar class="size-4" stroke-width={1.75} />
			Konfigurasi Dashboard Rekap
		</h2>
		<p class="mt-1 max-w-[65ch] text-sm text-base-content/60">
			Pilih metrik angka yang ingin ditampilkan di dashboard utama.
		</p>

		<form
			method="POST"
			action="?/updateDashboardMetrics"
			class="mt-4 max-w-md rounded-2xl border border-base-300 bg-base-100 p-5">
			<div class="grid gap-2">
				{#each DASHBOARD_METRICS as m (m.key)}
					<label class="flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							name="metrics"
							value={m.key}
							class="checkbox checkbox-primary checkbox-sm"
							checked={enabledMetrics.includes(m.key)} />
						{m.label}
					</label>
				{/each}
			</div>
			<button type="submit" class="btn btn-primary btn-sm mt-4">Simpan</button>
		</form>
	</section>

{:else if tab === 'audit'}
	<section class="mt-6">
		<h2 class="flex items-center gap-2 text-sm font-semibold">
			<IconHistory class="size-4" stroke-width={1.75} />
			Audit log
		</h2>
		<p class="mt-1 text-sm text-base-content/60">
			Riwayat perubahan append-only — tidak bisa diubah/dihapus. 100 catatan terbaru.
		</p>

		<div class="mt-4 overflow-x-auto rounded-2xl border border-base-300 bg-base-100">
			<table class="table">
				<thead>
					<tr class="text-xs uppercase tracking-wide text-base-content/60">
						<th>Waktu</th>
						<th>Pengguna</th>
						<th>Aksi</th>
						<th>Entitas</th>
					</tr>
				</thead>
				<tbody>
					{#each auditLogs as log (log.id)}
						<tr class="hover:bg-base-200/50">
							<td class="whitespace-nowrap font-mono text-xs">{d(log.created_at)}</td>
							<td class="font-mono text-xs">{log.actor_id ? actorName[log.actor_id] ?? log.actor_id.slice(0, 8) : '(sistem)'}</td>
							<td>
								<span class="badge badge-ghost badge-sm">{log.action}</span>
							</td>
							<td class="font-mono text-xs">
								{log.entity}
								{#if log.entity_id}<span class="text-base-content/50"> · {log.entity_id.slice(0, 8)}</span>{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if auditLogs.length === 0}
			<div class="mt-4 rounded-2xl border border-dashed border-base-300 bg-base-100 p-8 text-center">
				<p class="text-base-content/60">Belum ada catatan audit.</p>
			</div>
		{/if}
	</section>
{/if}
