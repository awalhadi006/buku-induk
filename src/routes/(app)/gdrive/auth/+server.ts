import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const GET = async ({ locals }) => {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');

	const { data: profile } = await supabase.from('profiles').select('peran').eq('id', user.id).maybeSingle();
	if (profile?.peran !== 'superadmin') throw redirect(303, '/');

	const clientId = env.GOOGLE_CLIENT_ID;
	const redirectUri = env.GOOGLE_REDIRECT_URI;

	if (!clientId || !redirectUri) {
		console.error('Missing Google OAuth Config:', { clientId: !!clientId, redirectUri: !!redirectUri });
		throw redirect(303, '/pengaturan?tab=gdrive&error=missing_config');
	}

	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		response_type: 'code',
		scope: 'https://www.googleapis.com/auth/drive.file',
		access_type: 'offline',
		prompt: 'consent'
	});

	const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
	throw redirect(303, url);
};
