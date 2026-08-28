import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const GET = async ({ locals, url, platform }) => {
	const code = url.searchParams.get('code');
	if (!code) throw redirect(303, '/pengaturan?tab=gdrive');

	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: env.GOOGLE_CLIENT_ID!,
			client_secret: env.GOOGLE_CLIENT_SECRET!,
			code,
			redirect_uri: env.GOOGLE_REDIRECT_URI!,
			grant_type: 'authorization_code'
		})
	});
	const { access_token, refresh_token, expires_in } = await res.json() as { access_token: string; refresh_token: string; expires_in: number };
	
	// Simpan refresh_token ke Cloudflare KV (aman, tidak pernah dikirim ke browser)
	const kv = platform?.env?.GDRIVE_TOKENS;
	if (kv && refresh_token) {
		await kv.put('refresh_token', refresh_token);
	}

	// folder_id tetap di Supabase (hanya metadata, bukan secret)
	await locals.supabase.from('gdrive_creds').upsert({
		id: 1,
		access_token,
		expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
		connected_at: new Date().toISOString()
	});

	throw redirect(303, '/pengaturan?tab=gdrive');
};
