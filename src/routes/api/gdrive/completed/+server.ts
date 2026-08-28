import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { user, supabase } = locals;
	if (!user) throw error(401, 'Unauthorized');

	const { data: profile } = await supabase.from('profiles').select('peran').eq('id', user.id).maybeSingle();
	if (!profile || !['superadmin', 'admin_tu', 'wali_kamar', 'wali_kelas'].includes(profile.peran)) {
		throw error(403, 'Tidak punya izin');
	}

	const body = await request.json();
	const { fileId, santriId, jenis, fileName } = body as {
		fileId: string;
		santriId: string;
		jenis: 'foto' | 'dokumen';
		fileName: string;
	};

	if (!fileId || !santriId || !jenis || !fileName) {
		return json({ error: 'Parameter tidak lengkap' }, { status: 400 });
	}

	const gdriveUrl = `gdrive:${fileId}`;

	if (jenis === 'foto') {
		const { error: err } = await supabase.from('santri').update({ foto_url: gdriveUrl }).eq('id', santriId);
		if (err) return json({ error: 'Gagal update foto_url' }, { status: 400 });
	} else {
		const { error: err } = await supabase.from('santri_documents').insert({
			santri_id: santriId,
			jenis,
			nama_file: fileName,
			file_url: gdriveUrl
		});
		if (err) return json({ error: 'Gagal simpan dokumen' }, { status: 400 });
	}

	return json({ success: true });
};
