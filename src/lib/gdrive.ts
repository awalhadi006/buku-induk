import { env } from '$env/dynamic/private';

async function getValidToken(supabase: any): Promise<string | null> {
	const { data: creds } = await supabase.from('gdrive_creds').select('*').eq('id', 1).maybeSingle();
	if (!creds?.refresh_token) return null;

	if (creds.expires_at && new Date(creds.expires_at).getTime() > Date.now()) {
		return creds.access_token;
	}

	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: env.GOOGLE_CLIENT_ID!,
			client_secret: env.GOOGLE_CLIENT_SECRET!,
			grant_type: 'refresh_token',
			refresh_token: creds.refresh_token
		})
	});

	if (!res.ok) return null;
	const { access_token, expires_in } = (await res.json()) as { access_token: string; expires_in: number };
	await supabase.from('gdrive_creds').update({
		access_token,
		expires_at: new Date(Date.now() + expires_in * 1000).toISOString()
	}).eq('id', 1);

	return access_token;
}

async function ensureFolder(token: string, name: string, parentId: string): Promise<string> {
	const safe = name.replace(/'/g, "\\'");
	const q = `mimeType='application/vnd.google-apps.folder' and name='${safe}' and '${parentId}' in parents and trashed=false`;
	const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&spaces=drive`;
	const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
	const { files } = (await res.json()) as { files: { id: string; name: string }[] };
	if (files.length) return files[0].id;

	const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			name,
			mimeType: 'application/vnd.google-apps.folder',
			parents: [parentId]
		})
	});
	const created = (await createRes.json()) as { id: string };
	return created.id;
}

async function uploadToFolder(token: string, file: File, filename: string, folderId: string): Promise<string> {
	const metadata = { name: filename, parents: [folderId] };
	const form = new FormData();
	form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
	form.append('file', file);

	const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}` },
		body: form
	});
	if (!res.ok) throw new Error('Gagal mengunggah ke Google Drive');
	const { id } = (await res.json()) as { id: string };

	await fetch(`https://www.googleapis.com/drive/v3/files/${id}/permissions`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ role: 'reader', type: 'anyone' })
	});

	return id;
}

export async function uploadPhoto(supabase: any, file: File, santriName: string): Promise<string> {
	const token = await getValidToken(supabase);
	if (!token) throw new Error('Gagal autentikasi Google Drive');
	const { data: creds } = await supabase.from('gdrive_creds').select('folder_id').eq('id', 1).single();
	const folderId = await ensureFolder(token, 'Foto', creds.folder_id);
	const childId = await ensureFolder(token, santriName, folderId);
	const id = await uploadToFolder(token, file, file.name || 'foto.jpg', childId);
	return `gdrive:${id}`;
}

export async function uploadDocument(supabase: any, file: File, santriName: string): Promise<string> {
	const token = await getValidToken(supabase);
	if (!token) throw new Error('Gagal autentikasi Google Drive');
	const { data: creds } = await supabase.from('gdrive_creds').select('folder_id').eq('id', 1).single();
	const folderId = await ensureFolder(token, 'Dokumen', creds.folder_id);
	const childId = await ensureFolder(token, santriName, folderId);
	const id = await uploadToFolder(token, file, file.name || 'dokumen.pdf', childId);
	return `gdrive:${id}`;
}

export async function deleteDriveFile(supabase: any, gdriveUrl: string): Promise<void> {
	const id = gdriveUrl.replace('gdrive:', '');
	if (!id) return;
	const token = await getValidToken(supabase);
	if (!token) return;
	await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
		method: 'DELETE',
		headers: { Authorization: `Bearer ${token}` }
	});
}
