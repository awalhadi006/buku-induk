import { env } from '$env/dynamic/private';

export async function getValidToken(supabase: any): Promise<string | null> {
	const { data: creds } = await supabase.from('gdrive_creds').select('id,folder_id,access_token,expires_at,refresh_token').eq('id', 1).maybeSingle();
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