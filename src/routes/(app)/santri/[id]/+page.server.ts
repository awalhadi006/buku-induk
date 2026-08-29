import { error, fail, redirect } from '@sveltejs/kit';
import { parseSantriForm, SANTRI_COLUMNS } from '$lib/santri';
import { humanizeError } from '$lib/errors';

export async function load({ params, locals }) {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');

	const { data: santri } = await supabase
		.from('santri')
		.select(SANTRI_COLUMNS.join(','))
		.eq('id', params.id)
		.maybeSingle();
	if (!santri) throw error(404, 'Santri tidak ditemukan');

	const [{ data: kamar }, { data: kelas }, { data: wali }, { data: documents }, { data: history }, { data: gdrive }, { data: customFields }] =
		await Promise.all([
			supabase.from('kamar').select('id,nomor,aktif').order('nomor'),
			supabase
				.from('kelas')
				.select('id,tingkat,rombel,tahun_ajaran,aktif')
				.order('tahun_ajaran', { ascending: false, nullsFirst: false })
				.order('tingkat')
				.order('rombel'),
			supabase.from('wali_santri').select('id,nama_ayah,nama_ibu,nama_wali').order('created_at'),
			supabase
				.from('santri_documents')
				.select('id,jenis,nama_file,file_url,uploaded_at')
				.eq('santri_id', params.id)
				.order('uploaded_at', { ascending: false }),
			supabase
				.from('status_history')
				.select('id,santri_id,jenis,nilai_lama,nilai_baru,tanggal_efektif,created_by,created_at')
				.eq('santri_id', params.id)
				.order('tanggal_efektif', { ascending: false }),
			supabase.from('gdrive_creds').select('id,folder_id').eq('id', 1).maybeSingle(),
			supabase.from('custom_fields').select('id,nama,label,tipe,opsi,aktif,urutan').eq('aktif', true).order('urutan').order('id')
		]);

	return {
		santri,
		kamar: kamar ?? [],
		kelas: kelas ?? [],
		wali: (wali ?? []).map((w) => ({
			id: w.id,
			label: w.nama_wali || w.nama_ayah || w.nama_ibu || '(wali tanpa nama)'
		})),
		documents: documents ?? [],
		_status_history: history ?? [],
		gdrive: !!gdrive?.folder_id,
		customFields: customFields ?? []
	};
}

export const actions = {
	update: async ({ params, locals, request }) => {
		const { user, supabase } = locals;
		if (!user) throw redirect(303, '/login');

		const fd = await request.formData();

		const { data: cfs } = await supabase.from('custom_fields').select('nama').eq('aktif', true);
		const payload = parseSantriForm(fd, cfs?.map((f) => f.nama));
		if (!payload.nama_lengkap) return fail(400, { error: 'Nama lengkap wajib diisi.' });

		const { error: err } = await supabase.from('santri').update(payload).eq('id', params.id);
		if (err) return fail(400, { error: humanizeError(err) });

		throw redirect(303, `/santri/${params.id}`);
	},
	delete: async ({ params, locals }) => {
		const { user, supabase } = locals;
		if (!user) throw redirect(303, '/login');

		const { error: err } = await supabase.from('santri').delete().eq('id', params.id);
		if (err) return fail(400, { error: humanizeError(err) });

		throw redirect(303, '/santri');
	},
	updateDocument: async ({ params, locals, request }) => {
		const { user, supabase } = locals;
		if (!user) throw redirect(303, '/login');

		const fd = await request.formData();
		const docId = fd.get('docId') as string;
		const jenis = (fd.get('jenis') as string) ?? '';
		const nama_file = (fd.get('nama_file') as string)?.trim() || null;
		if (!docId || !jenis) return fail(400, { error: 'Data dokumen tidak valid.' });

		const { error } = await supabase
			.from('santri_documents')
			.update({ jenis, nama_file })
			.eq('id', docId)
			.eq('santri_id', params.id);
		if (error) return fail(400, { error: humanizeError(error) });

		throw redirect(303, `/santri/${params.id}`);
	},
	deleteDocument: async ({ params, locals, request, platform }) => {
		const { user, supabase } = locals;
		if (!user) throw redirect(303, '/login');

		const fd = await request.formData();
		const docId = fd.get('docId') as string;
		const { data: doc } = await supabase
			.from('santri_documents')
			.select('file_url')
			.eq('id', docId)
			.eq('santri_id', params.id)
			.maybeSingle();
		if (doc) {
			if (doc.file_url?.startsWith('gdrive:')) {
				const { deleteDriveFile } = await import('$lib/gdrive');
				await deleteDriveFile(supabase, doc.file_url, platform?.env?.GDRIVE_TOKENS);
			} else if (doc.file_url) {
				await supabase.storage.from('santri').remove([doc.file_url]);
			}
			await supabase.from('santri_documents').delete().eq('id', docId);
		}
		throw redirect(303, `/santri/${params.id}`);
	},
	requestChange: async ({ params, locals, request }) => {
		const { user, supabase } = locals;
		if (!user) throw redirect(303, '/login');

		const peranRes = await supabase.from('profiles').select('peran').eq('id', user.id).maybeSingle();
		if (!['wali_kamar', 'wali_kelas'].includes(peranRes.data?.peran ?? ''))
			return fail(403, { error: 'Hanya Wali Kamar/Kelas yang dapat mengajukan perubahan.' });

		const fd = await request.formData();
		const field = (fd.get('field') as string) ?? '';
		const newValue = (fd.get('new_value') as string)?.trim() ?? '';
		if (!field || !newValue) return fail(400, { error: 'Field dan nilai baru wajib diisi.' });

		const { data: cur } = await supabase.from('santri').select(field).eq('id', params.id).maybeSingle();
		const oldValue = (cur && typeof cur === 'object' && field in cur) ? String((cur as Record<string, unknown>)[field]) : null;

		const { error } = await supabase.from('santri_change_requests').insert({
			santri_id: params.id,
			field,
			old_value: oldValue,
			new_value: newValue,
			requested_by: user.id,
			status: 'pending'
		});
		if (error) return fail(400, { error: humanizeError(error) });

		throw redirect(303, `/santri/${params.id}`);
	}
};