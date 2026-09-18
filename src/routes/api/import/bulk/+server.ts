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

		// Build santri payloads for bulk upsert
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

		console.log('[Bulk API] Santri payloads to upsert:', santriPayloads.length);

		// Bulk upsert santri on NIS (single subrequest) - handles duplicates
		const { data: upserted, error: upsertError } = await supabaseAdmin
			.from('santri')
			.upsert(santriPayloads, {
				onConflict: 'nis',
				ignoreDuplicates: false
			})
			.select('id, nama_lengkap');

		console.log('[Bulk API] Upsert result:', { upserted: upserted?.length, error: upsertError });

		if (upsertError) {
			console.error('[Bulk API] Bulk upsert error:', JSON.stringify(upsertError, null, 2));
			// If bulk upsert fails, check each row individually but batch in smaller groups
			const SUB_BATCH = 10;
			for (let j = 0; j < santriPayloads.length; j += SUB_BATCH) {
				const subBatch = santriPayloads.slice(j, j + SUB_BATCH);
				const subIndices = validIndices.slice(j, j + SUB_BATCH);

				const { data: subUpserted, error: subError } = await supabaseAdmin
					.from('santri')
					.upsert(subBatch, {
						onConflict: 'nis',
						ignoreDuplicates: false
					})
					.select('id, nama_lengkap');

				if (subError) {
					// Last resort: individual inserts
					for (let k = 0; k < subBatch.length; k++) {
						const payload = subBatch[k];
						const rowIdx = i + subIndices[k];
						const nama = String(payload.nama_lengkap ?? '');

						const { error } = await supabaseAdmin.from('santri').upsert(payload, {
							onConflict: 'nis'
						});
						if (error) {
							results.failed++;
							results.errors.push({
								row: rowIdx + 1,
								nama,
								reason: error.message || error.details || error.hint || 'Gagal menyimpan ke database',
								kategori: 'database'
							});
							console.error(`[Bulk API] Row ${rowIdx + 1} (${nama}) error:`, JSON.stringify(error, null, 2));
						} else {
							results.success++;
						}
					}
				} else if (subUpserted) {
					results.success += subUpserted.length;
				}
			}
		} else if (upserted) {
			results.success += upserted.length;
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