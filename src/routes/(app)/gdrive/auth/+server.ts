import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const GET = ({ locals }) => {
	if (locals.profile?.peran !== 'superadmin') throw redirect(303, '/');
	const url = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
		client_id: env.GOOGLE_CLIENT_ID!,
		redirect_uri: env.GOOGLE_REDIRECT_URI!,
		response_type: 'code',
		scope: 'https://www.googleapis.com/auth/drive.file',
		access_type: 'offline',
		prompt: 'consent'
	});
	throw redirect(303, url);
};
