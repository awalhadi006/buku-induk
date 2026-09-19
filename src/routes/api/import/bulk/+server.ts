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

	console.log('[Bulk API] Received rows:', rows.length);

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

		// Collect all unique walis from this batch
		const waliMap = new Map<string, Record<string, unknown>>();
		const waliRowIndices = new Map<string, number[]>();

		for (let j = 0; j < batch.length; j++) {
			const row = batch[j];
			const wali = row._wali as Record<string, unknown> | undefined;
			if (wali && (wali.nama_ayah || wali.nama_ibu || wali.nama_wali)) {
				const key = `${wali.nama_ayah ?? ''}|${wali.nama_ibu ?? ''}|${wali.nama_wali ?? ''}`;
				if (!waliMap.has(key)) {
					waliMap.set(key, wali);
				}
				const indices = waliRowIndices.get(key) || [];
				indices.push(j);
				waliRowIndices.set(key, indices);
			}
		}

		// Bulk upsert all unique walis at once (single subrequest)
		const waliIds = new Map<string, string>();
		if (waliMap.size > 0) {
			const walisToUpsert = Array.from(waliMap.values());
			console.log('[Bulk API] Upserting walis:', walisToUpsert.length);

			const { data: upsertedWali, error: waliError } = await supabaseAdmin
				.from('wali_santri')
				.upsert(walisToUpsert, {
					onConflict: 'nama_ayah,nama_ibu,nama_wali',
					ignoreDuplicates: false
				})
				.select('id,nama_ayah,nama_ibu,nama_wali');

			if (waliError) {
				console.error('[Bulk API] Wali upsert error:', waliError);
			} else if (upsertedWali) {
				for (const w of upsertedWali) {
					const key = `${w.nama_ayah ?? ''}|${w.nama_ibu ?? ''}|${w.nama_wali ?? ''}`;
					waliIds.set(key, w.id);
				}
			}
		}

		// Build santri payloads
		const santriPayloads: Record<string, unknown>[] = [];
		const validIndices: number[] = [];

		for (let j = 0; j < batch.length; j++) {
			const row = batch[j];
			const { _wali, ...santriData } = row;

			let waliId: string | null = null;
			const wali = _wali as Record<string, unknown> | undefined;
			if (wali && (wali.nama_ayah || wali.nama_ibu || wali.nama_wali)) {
				const key = `${wali.nama_ayah ?? ''}|${wali.nama_ibu ?? ''}|${wali.nama_wali ?? ''}`;
				waliId = waliIds.get(key) || null;
			}

			const payload: Record<string, unknown> = { ...santriData, custom: {} };
			if (waliId) payload.wali_santri_id = waliId;

			// kamar_id and kelas_id are already resolved by client
			if (payload.kamar_id && typeof payload.kamar_id !== 'string') {
				delete payload.kamar_id;
			}
			if (payload.kelas_id && typeof payload.kelas_id !== 'string') {
				delete payload.kelas_id;
			}

			santriPayloads.push(payload);
			validIndices.push(j);
		}

		console.log('[Bulk API] Santri payloads to process:', santriPayloads.length);

		// Fetch existing NIS values from database (single subrequest)
		const nisValues = santriPayloads
			.map((p) => p.nis)
			.filter((n) => n && typeof n === 'string' && n.trim() !== '');

		let existingNisMap = new Map<string, string>(); // nis -> id
		if (nisValues.length > 0) {
			const { data: existingSantri, error: fetchError } = await supabaseAdmin
				.from('santri')
				.select('id, nis')
				.in('nis', nisValues);

			if (fetchError) {
				console.error('[Bulk API] Fetch existing NIS error:', fetchError);
			} else if (existingSantri) {
				for (const s of existingSantri) {
					existingNisMap.set(s.nis, s.id);
				}
			}
		}

		// Split into insert (new) and update (existing)
		const toInsert: Record<string, unknown>[] = [];
		const toUpdate: { payload: Record<string, unknown>; id: string; rowIdx: number }[] = [];

		for (let j = 0; j < santriPayloads.length; j++) {
			const payload = santriPayloads[j];
			const nis = String(payload.nis ?? '').trim();
			const rowIdx = i + validIndices[j];

			if (nis && existingNisMap.has(nis)) {
				toUpdate.push({ payload, id: existingNisMap.get(nis)!, rowIdx });
			} else {
				// Check for duplicates within this batch
				const isDuplicateInBatch = toInsert.some((p) => String(p.nis ?? '').trim() === nis) ||
					toUpdate.some((u) => String(u.payload.nis ?? '').trim() === nis);

				if (isDuplicateInBatch) {
					const nama = String(payload.nama_lengkap ?? '');
					results.failed++;
					results.errors.push({
						row: rowIdx + 1,
						nama,
						reason: 'NIS duplikat dalam file import',
						kategori: 'database'
					});
				} else {
					toInsert.push(payload);
				}
			}
		}

		// Bulk insert new santri (single subrequest)
		if (toInsert.length > 0) {
			console.log('[Bulk API] Inserting new santri:', toInsert.length);
			const { data: inserted, error: insertError } = await supabaseAdmin
				.from('santri')
				.insert(toInsert)
				.select('id, nama_lengkap');

			if (insertError) {
				console.error('[Bulk API] Bulk insert error:', JSON.stringify(insertError, null, 2));
				// Fallback: individual inserts
				for (const payload of toInsert) {
					const idx = santriPayloads.findIndex((p) => p === payload);
					const rowIdx = idx >= 0 ? i + validIndices[idx] : i;
					const nama = String(payload.nama_lengkap ?? '');
					const { error } = await supabaseAdmin.from('santri').insert(payload);
					if (error) {
						results.failed++;
						results.errors.push({
							row: rowIdx + 1,
							nama,
							reason: error.message || error.details || error.hint || 'Gagal menyimpan ke database',
							kategori: 'database'
						});
						console.error(`[Bulk API] Insert error for ${nama}:`, JSON.stringify(error, null, 2));
					} else {
						results.success++;
					}
				}
			} else if (inserted) {
				results.success += inserted.length;
			}
		}

		// Bulk update existing santri (single subrequest using upsert on id)
		if (toUpdate.length > 0) {
			console.log('[Bulk API] Updating existing santri:', toUpdate.length);
			const updatePayloads = toUpdate.map((u) => ({ ...u.payload, id: u.id }));

			const { data: updated, error: updateError } = await supabaseAdmin
				.from('santri')
				.upsert(updatePayloads, {
					onConflict: 'id',
					ignoreDuplicates: false
				})
				.select('id, nama_lengkap');

			if (updateError) {
				console.error('[Bulk API] Bulk update error:', JSON.stringify(updateError, null, 2));
				// Fallback: individual updates
				for (const u of toUpdate) {
					const nama = String(u.payload.nama_lengkap ?? '');
					const { error } = await supabaseAdmin.from('santri').update(u.payload).eq('id', u.id);
					if (error) {
						results.failed++;
						results.errors.push({
							row: u.rowIdx + 1,
							nama,
							reason: error.message || error.details || error.hint || 'Gagal mengupdate database',
							kategori: 'database'
						});
						console.error(`[Bulk API] Update error for ${nama}:`, JSON.stringify(error, null, 2));
					} else {
						results.success++;
					}
				}
			} else if (updated) {
				results.success += updated.length;
			}
		}
	}

	// Log audit
	await supabaseAdmin.from('audit_logs').insert({
		action: 'import',
		entity: 'santri',
		after: { rows: rows.length, berhasil: results.success, gagal: results.failed }
	});

	console.log('[Bulk API] Final results:', results);

	return json(results);
};