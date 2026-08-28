import { env } from '$env/dynamic/private';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateUpload } from '$lib/gdrive/validation';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const { user, supabase } = locals;
	if (!user) throw error(401, 'Unauthorized');

	const { data: profile } = await supabase.from('profiles').select('peran').eq('id', user.id).maybeSingle();
	if (!profile || !['superadmin', 'admin_tu', 'wali_kamar', 'wali_kelas'].includes(profile.peran)) {
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
		.eq('id', 1)
		.maybeSingle();

	if (!gdrive?.folder_id) {
		return json({ error: 'Google Drive belum dikonfigurasi (folder_id kosong)' }, { status: 400 });
	}

	const refreshToken = await kv.get('refresh_token');
	if (!refreshToken) return json({ error: 'Belum terhubung ke Google Drive' }, { status: 401 });

	const clientId = env.GOOGLE_CLIENT_ID;
	const clientSecret = env.GOOGLE_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		console.error('Missing Google OAuth credentials');
		return json({ error: 'Google OAuth tidak dikonfigurasi' }, { status: 500 });
	}

	const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			grant_type: 'refresh_token',
			refresh_token: refreshToken
		})
	});
	if (!tokenRes.ok) return json({ error: 'Gagal mendapatkan access token' }, { status: 401 });
	const { access_token: accessToken } = await tokenRes.json() as { access_token: string; expires_in: number };

	const { data: santri } = await supabase.from('santri').select('nama_lengkap').eq('id', santriId).maybeSingle();
	const santriName = santri?.nama_lengkap ?? 'Santri';

	const parentFolder = await ensureFolder(accessToken, jenis === 'foto' ? 'Foto' : 'Dokumen', gdrive.folder_id);
	const childFolder = await ensureFolder(accessToken, santriName, parentFolder);

	const metadata = { name: fileName, parents: [childFolder] };
	const res = await fetch(
		'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id',
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
				'X-Upload-Content-Type': mimeType,
				'X-Upload-Content-Length': String(fileSize)
			},
			body: JSON.stringify(metadata)
		}
	);

	if (!res.ok) {
		const errText = await res.text();
		return json({ error: `Gagal membuat session upload: ${res.status}` }, { status: 502 });
	}

	const sessionUrl = res.headers.get('Location');
	if (!sessionUrl) throw error(500, 'Google Drive tidak mengembalikan session URL');

	const fileIdMatch = sessionUrl.match(/\/files\/([^\/]+)/);
	const fileId = fileIdMatch ? fileIdMatch[1] : crypto.randomUUID();

	return json({ sessionUrl, fileId });
};

async function ensureFolder(accessToken: string, name: string, parentId: string): Promise<string> {
	const safe = name.replace(/'/g, "\\'");
	const q = `mimeType='application/vnd.google-apps.folder' and name='${safe}' and '${parentId}' in parents and trashed=false`;
	const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&spaces=drive`;
	const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
	const { files } = (await listRes.json()) as { files: { id: string; name: string }[] };
	if (files.length) return files[0].id;

	const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
		method: 'POST',
		headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] })
	});
	const created = (await createRes.json()) as { id: string };
	return created.id;
}
