import { env } from '$env/dynamic/private';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateUpload } from '$lib/gdrive/validation';
import { getValidToken, ensureFolder, createUploadSession, GDRIVE_CREDS_ID } from '$lib/gdrive';
import { getProfile, hasRole, UPLOAD_ROLES } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const { user, supabase } = locals;
	if (!user) throw error(401, 'Unauthorized');

	const profile = await getProfile(locals);
	if (!profile || !hasRole(profile, UPLOAD_ROLES)) {
		throw error(403, 'Tidak punya izin upload');
	}

	const kv = platform?.env?.GDRIVE_TOKENS;
	if (!kv) throw error(500, 'KV namespace tidak dikonfigurasi');

	const body = await request.json();
	const { fileName, fileSize, mimeType, santriId, jenis } = body as {
		fileName: string;
		fileSize: number;
		mimeType: string;
		santriId: string;
		jenis: 'foto' | 'dokumen';
	};

	if (!fileName || !fileSize || !mimeType || !santriId || !jenis) {
		return json({ error: 'Parameter tidak lengkap' }, { status: 400 });
	}

	const validationError = validateUpload(jenis, fileSize, mimeType);
	if (validationError) return json({ error: validationError }, { status: 400 });

	const { data: gdrive } = await supabase
		.from('gdrive_creds')
		.select('folder_id')
		.eq('id', GDRIVE_CREDS_ID)
		.maybeSingle();

	if (!gdrive?.folder_id) {
		return json({ error: 'Google Drive belum dikonfigurasi (folder_id kosong)' }, { status: 400 });
	}

	const accessToken = await getValidToken(supabase, kv);
	if (!accessToken) return json({ error: 'Belum terhubung ke Google Drive' }, { status: 401 });

	const { data: santri } = await supabase.from('santri').select('nama_lengkap').eq('id', santriId).maybeSingle();
	const santriName = santri?.nama_lengkap ?? 'Santri';

	const parentFolder = await ensureFolder(accessToken, jenis === 'foto' ? 'Foto' : 'Dokumen', gdrive.folder_id);
	const childFolder = await ensureFolder(accessToken, santriName, parentFolder);

	const { sessionUrl, fileId } = await createUploadSession(
		accessToken,
		fileName,
		mimeType,
		fileSize,
		childFolder
	);

	return json({ sessionUrl, fileId });
};
