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