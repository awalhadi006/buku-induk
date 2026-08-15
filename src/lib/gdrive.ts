import { env } from '$env/dynamic/private';

export async function getValidToken(supabase: any) {
	const { data: creds } = await supabase.from('gdrive_creds').select('*').eq('id', 1).maybeSingle();
	if (!creds?.refresh_token) return null;

	if (creds.expires_at && new Date(creds.expires_at).getTime() > Date.now()) {
		return creds.access_token;
	}

	// Refresh token
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
	const { access_token, expires_in } = await res.json();
	await supabase.from('gdrive_creds').update({
		access_token,
		expires_at: new Date(Date.now() + expires_in * 1000).toISOString()
	}).eq('id', 1);

	return access_token;
}

export async function uploadPhoto(supabase: any, file: File, filename: string) {
	const token = await getValidToken(supabase);
	if (!token) throw new Error('Gagal autentikasi Google Drive');

	const { data: creds } = await supabase.from('gdrive_creds').select('folder_id').eq('id', 1).single();
	
	const metadata = { name: filename, parents: [creds.folder_id] };
	const form = new FormData();
	form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
	form.append('file', file);

	const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}` },
		body: form
	});

	if (!res.ok) throw new Error('Gagal mengunggah foto');
	const { id } = await res.json();
	
	// Share file
	await fetch(`https://www.googleapis.com/drive/v3/files/${id}/permissions`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ role: 'reader', type: 'anyone' })
	});

	return `https://drive.google.com/uc?export=view&id=${id}`;
}
