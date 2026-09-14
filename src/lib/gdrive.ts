import { env } from '$env/dynamic/private';
import type { SupabaseClient } from '@supabase/supabase-js';

export const GDRIVE_CREDS_ID = 1;

type KVNamespaceLike = {
	get(key: string): Promise<string | null>;
};

interface TokenResponse {
	access_token: string;
	expires_in: number;
}

async function refreshOAuthToken(refreshToken: string): Promise<TokenResponse | null> {
	const clientId = env.GOOGLE_CLIENT_ID;
	const clientSecret = env.GOOGLE_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		console.error('Missing Google OAuth credentials');
		return null;
	}

	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			grant_type: 'refresh_token',
			refresh_token: refreshToken
		})
	});

	if (!res.ok) return null;
	return (await res.json()) as TokenResponse;
}

export async function getValidToken(
	supabase: SupabaseClient,
	kv: KVNamespaceLike | undefined
): Promise<string | null> {
	const refreshTokenFromKV = await kv?.get('refresh_token');
	const refreshTokenFromDB = (await supabase
		.from('gdrive_creds')
		.select('refresh_token')
		.eq('id', GDRIVE_CREDS_ID)
		.maybeSingle())?.data?.refresh_token;

	const refreshToken = refreshTokenFromKV || refreshTokenFromDB;
	if (!refreshToken) return null;

	const { data: creds } = await supabase
		.from('gdrive_creds')
		.select('expires_at')
		.eq('id', GDRIVE_CREDS_ID)
		.maybeSingle();
	if (creds?.expires_at && new Date(creds.expires_at).getTime() > Date.now()) {
		const { data } = await supabase
			.from('gdrive_creds')
			.select('access_token')
			.eq('id', GDRIVE_CREDS_ID)
			.maybeSingle();
		return data?.access_token || null;
	}

	const token = await refreshOAuthToken(refreshToken);
	if (!token) return null;

	await supabase.from('gdrive_creds').update({
		access_token: token.access_token,
		expires_at: new Date(Date.now() + token.expires_in * 1000).toISOString()
	}).eq('id', GDRIVE_CREDS_ID);

	return token.access_token;
}

export async function deleteDriveFile(
	supabase: SupabaseClient,
	gdriveUrl: string,
	kv: KVNamespaceLike | undefined
): Promise<void> {
	const id = gdriveUrl.replace('gdrive:', '');
	if (!id) return;

	let accessToken = await getValidToken(supabase, kv);
	if (!accessToken) {
		const { data: cached } = await supabase
			.from('gdrive_creds')
			.select('access_token, expires_at')
			.eq('id', GDRIVE_CREDS_ID)
			.maybeSingle();
		if (!cached?.access_token || new Date(cached.expires_at).getTime() <= Date.now()) return;
		accessToken = cached.access_token;
	}

	await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
		method: 'DELETE',
		headers: { Authorization: `Bearer ${accessToken}` }
	});
}

export async function ensureFolder(accessToken: string, name: string, parentId: string): Promise<string> {
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

export async function createUploadSession(
	accessToken: string,
	fileName: string,
	mimeType: string,
	fileSize: number,
	parentFolderId: string
): Promise<{ sessionUrl: string; fileId: string }> {
	const metadata = { name: fileName, parents: [parentFolderId] };
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
		throw new Error(`Gagal membuat session upload: ${res.status} ${errText}`);
	}

	const sessionUrl = res.headers.get('Location');
	if (!sessionUrl) throw new Error('Google Drive tidak mengembalikan session URL');

	const fileIdMatch = sessionUrl.match(/\/files\/([^\/]+)/);
	const fileId = fileIdMatch ? fileIdMatch[1] : crypto.randomUUID();

	return { sessionUrl, fileId };
}

export async function uploadToSession(sessionUrl: string, file: File, accessToken: string): Promise<void> {
	const uploadRes = await fetch(sessionUrl, {
		method: 'PUT',
		headers: {
			'Content-Type': file.type,
			'X-Upload-Content-Length': String(file.size),
			Authorization: `Bearer ${accessToken}`
		},
		body: file
	});

	if (!uploadRes.ok) {
		throw new Error('Upload ke Google Drive gagal');
	}

	// Buat file bisa diakses publik agar thumbnail Google Drive tampil.
	const fileIdMatch = sessionUrl.match(/\/files\/([^\/]+)/);
	const fileId = fileIdMatch ? fileIdMatch[1] : '';
	if (fileId) {
		await makePublic(accessToken, fileId);
	}
}

/** Set permission file Google Drive jadi "siapa saja dengan tautan dapat melihat". */
export async function makePublic(accessToken: string, fileId: string): Promise<void> {
	const res = await fetch(
		`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ role: 'reader', type: 'anyone' })
		}
	);
	if (!res.ok) {
		const errText = await res.text();
		throw new Error(`Gagal set permission publik untuk file ${fileId}: ${res.status} ${errText}`);
	}
}

