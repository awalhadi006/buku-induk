import { env } from '$env/dynamic/private';

export async function getValidToken(supabase: any, kv: any): Promise<string | null> {
	const refreshTokenFromKV = await kv?.get('refresh_token');
	const refreshTokenFromDB = (await supabase
		.from('gdrive_creds')
		.select('refresh_token')
		.eq('id', 1)
		.maybeSingle())?.data?.refresh_token;

	const refreshToken = refreshTokenFromKV || refreshTokenFromDB;
	if (!refreshToken) return null;

	const { expires_at } = await supabase
		.from('gdrive_creds')
		.select('expires_at')
		.eq('id', 1)
		.maybeSingle()
		.data || {};
	if (expires_at && new Date(expires_at).getTime() > Date.now()) {
		const { data } = await supabase
			.from('gdrive_creds')
			.select('access_token')
			.eq('id', 1)
			.maybeSingle();
		return data?.access_token || null;
	}

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
	const { access_token, expires_in } = await res.json() as { access_token: string; expires_in: number };
	await supabase.from('gdrive_creds').update({
		access_token,
		expires_at: new Date(Date.now() + expires_in * 1000).toISOString()
	}).eq('id', 1);

	return access_token;
}

export async function deleteDriveFile(supabase: any, gdriveUrl: string, kv: any): Promise<void> {
	const id = gdriveUrl.replace('gdrive:', '');
	if (!id) return;
	const clientId = env.GOOGLE_CLIENT_ID;
	const clientSecret = env.GOOGLE_CLIENT_SECRET;
	const refreshToken = await kv?.get('refresh_token');

	if (!clientId || !clientSecret) {
		console.error('Missing Google OAuth credentials');
		return;
	}

	let accessToken: string | null = null;
	if (refreshToken) {
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
		if (tokenRes.ok) {
			const { access_token } = await tokenRes.json() as { access_token: string; expires_in: number };
			accessToken = access_token;
		}
	}

	if (!accessToken) {
		const dbRes = await supabase
			.from('gdrive_creds')
			.select('access_token, expires_at')
			.eq('id', 1)
			.maybeSingle();
		if (!dbRes.data?.access_token || new Date(dbRes.data.expires_at).getTime() <= Date.now()) {
			return;
		}
		accessToken = dbRes.data.access_token;
	}

	await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
		method: 'DELETE',
		headers: { Authorization: `Bearer ${accessToken}` }
	});
}

export async function getAccessToken(supabase: any, kv: any): Promise<string | null> {
	const refreshToken = await kv?.get('refresh_token');
	if (!refreshToken) return null;

	const clientId = env.GOOGLE_CLIENT_ID;
	const clientSecret = env.GOOGLE_CLIENT_SECRET;
	if (!clientId || !clientSecret) return null;

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
	if (!tokenRes.ok) return null;
	const { access_token } = await tokenRes.json() as { access_token: string; expires_in: number };
	return access_token;
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

export async function uploadToSession(sessionUrl: string, file: File): Promise<void> {
	const uploadRes = await fetch(sessionUrl, {
		method: 'PUT',
		headers: {
			'Content-Type': file.type,
			'X-Upload-Content-Length': String(file.size)
		},
		body: file
	});

	if (!uploadRes.ok) {
		throw new Error('Upload ke Google Drive gagal');
	}
}