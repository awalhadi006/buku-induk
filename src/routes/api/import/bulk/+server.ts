import { json } from '@sveltejs/kit';
import { getProfile, hasRole, ADMIN_ROLES } from '$lib/server/auth';
import { getSupabaseAdmin } from '$lib/supabase-admin';

const BATCH_SIZE = 100;

export const POST = async ({ request, locals }) => {
	const profile = await getProfile(locals);
	if (!profile || !hasRole(profile, ADMIN_ROLES)) {
		return json({ error: 'Tidak punya izin import.' }, { status: 403 });
	}

	const supabaseAdmin = getSupabaseAdmin();

	let body: {
		rows: Record<string, unknown>[];
	};

	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { rows } = body;

	if (!Array.isArray(rows) || rows.length === 0) {
		return json({ error: 'Tidak ada data untuk diimport' }, { status: 400 });
	}

	const results: {
		success: number;
		failed: number;
		errors: { row: number; nama: string; reason: string; kategori: string }[];
		warnings: { row: number; nama: string; warnings: string[] }[];
	} = {
		success: 0,
		failed: 0,
		errors: [],
		warnings: []
	};

	// Process in batches
	for (let i = 0; i < rows.length; i += BATCH_SIZE) {
		const batch = rows.slice(i, i + BATCH_SIZE);

		// Prepare wali inserts first (to get IDs)
		const waliToCreate: Record<string, unknown>[] = [];
		const waliBatchIndices: number[] = [];

		for (let j = 0; j < batch.length; j++) {
			const row = batch[j];
			const wali = row._wali as Record<string, unknown> | undefined;
			if (wali && (wali.nama_ayah || wali.nama_ibu || wali.nama_wali)) {
				waliToCreate.push(wali);
				waliBatchIndices.push(j);
			}
		}

		// Bulk find/create wali
		const waliIds: (string | null)[] = [];
		if (waliToCreate.length > 0) {
			for (const wali of waliToCreate) {
				const { data: existing } = await supabaseAdmin
					.from('wali_santri')
					.select('id')
					.eq('nama_ayah', wali.nama_ayah ?? null)
					.eq('nama_ibu', wali.nama_ibu ?? null)
					.eq('nama_wali', wali.nama_wali ?? null)
					.limit(1)
					.maybeSingle();

				if (existing) {
					waliIds.push(existing.id);
				} else {
					const { data, error } = await supabaseAdmin
						.from('wali_santri')
						.insert(wali)
						.select('id')
						.single();
					if (error) {
						waliIds.push(null);
					} else {
						waliIds.push(data.id);
					}
				}
			}
		}

		// Build santri payloads for bulk insert
		const santriPayloads: Record<string, unknown>[] = [];
		const validIndices: number[] = [];

		for (let j = 0; j < batch.length; j++) {
			const row = batch[j];
			const { _wali, ...santriData } = row;

			const waliIdx = waliBatchIndices.indexOf(j);
			const waliId = waliIdx >= 0 ? waliIds[waliIdx] : null;

			const payload: Record<string, unknown> = { ...santriData, custom: {} };
			if (waliId) payload.wali_santri_id = waliId;

			// kamar_id and kelas_id are already resolved by client
			// Just ensure they're strings (UUIDs)
			if (payload.kamar_id && typeof payload.kamar_id !== 'string') {
				delete payload.kamar_id;
			}
			if (payload.kelas_id && typeof payload.kelas_id !== 'string') {
				delete payload.kelas_id;
			}

			santriPayloads.push(payload);
			validIndices.push(j);
		}

		// Bulk insert santri
		const { data: inserted, error: insertError } = await supabaseAdmin
			.from('santri')
			.insert(santriPayloads)
			.select('id, nama_lengkap');

		if (insertError) {
			// If bulk insert fails, try individual inserts to get better error info
			for (let j = 0; j < santriPayloads.length; j++) {
				const payload = santriPayloads[j];
				const rowIdx = i + validIndices[j];
				const nama = String(payload.nama_lengkap ?? '');

				const { error } = await supabaseAdmin.from('santri').insert(payload);
				if (error) {
					results.failed++;
					results.errors.push({
						row: rowIdx + 1,
						nama,
						reason: 'Gagal menyimpan ke database',
						kategori: 'database'
					});
				} else {
					results.success++;
				}
			}
		} else if (inserted) {
			results.success += inserted.length;
		}
	}

	// Log audit
	await supabaseAdmin.from('audit_logs').insert({
		action: 'import',
		entity: 'santri',
		after: { rows: rows.length, berhasil: results.success, gagal: results.failed }
	});

	return json(results);
};