import { createClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import { photoUrl } from '$lib/gdrive-url';
import type { RequestHandler } from './$types';

const PUBLIC_SUPABASE_URL = publicEnv.PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = privateEnv.SUPABASE_SERVICE_ROLE_KEY ?? '';
const isPlaceholder = PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' || !SUPABASE_SERVICE_ROLE_KEY;

const fallback = (reason: string) =>
	new Response(null, { status: 302, headers: { location: `/favicon.svg?favicon=${reason}` } });

// Proksi logo sekolah agar favicon same-origin: bebas RLS/anon maupun keanehan Drive.
// Self-contained: jika service key tak dikonfigurasi di environment, jatuh ke fallback (bukan 500).
export const GET: RequestHandler = async () => {
	if (isPlaceholder) return fallback('missing-env');
	const sb = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

	const { data } = (await sb
		.from('settings')
		.select('value')
		.eq('key', 'school_logo_url')
		.maybeSingle()) as { data: { value: string | null } | null };
	const value = data?.value ?? null;
	if (!value) return fallback('no-setting');

	try {
		const upstream = await fetch(photoUrl(value, 'w128')!, { redirect: 'follow' });
		if (!upstream.ok || !upstream.body) return fallback('upstream-failed');
		return new Response(upstream.body, {
			headers: {
				'content-type': upstream.headers.get('content-type') ?? 'image/png',
				'cache-control': 'public, max-age=3600'
			}
		});
	} catch {
		return fallback('upstream-error');
	}
};
