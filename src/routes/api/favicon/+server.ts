import { getSupabaseAdmin } from '$lib/supabase-admin';
import { photoUrl } from '$lib/gdrive-url';
import type { RequestHandler } from './$types';

const FALLBACK = new Response(null, { status: 302, headers: { location: '/favicon.svg' } });

// Proksi logo sekolah agar favicon same-origin: bebas RLS/anon maupun keanehan Drive.
export const GET: RequestHandler = async () => {
	const sb = getSupabaseAdmin();
	// ponytail: admin client tanpa generik Database — cast manual, rapikan saat skema DB diketik penuh
	const { data } = (await sb
		.from('settings')
		.select('value')
		.eq('key', 'school_logo_url')
		.maybeSingle()) as { data: { value: string | null } | null };
	const value = data?.value ?? null;
	if (!value) return FALLBACK;

	try {
		const upstream = await fetch(photoUrl(value, 'w128')!, { redirect: 'follow' });
		if (!upstream.ok || !upstream.body) return FALLBACK;
		return new Response(upstream.body, {
			headers: {
				'content-type': upstream.headers.get('content-type') ?? 'image/png',
				'cache-control': 'public, max-age=3600'
			}
		});
	} catch {
		return FALLBACK;
	}
};
