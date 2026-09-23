import { createClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

const PUBLIC_SUPABASE_URL = publicEnv.PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = privateEnv.SUPABASE_SERVICE_ROLE_KEY ?? '';

let _client: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
	if (PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' || !SUPABASE_SERVICE_ROLE_KEY) {
		throw new Error('Supabase admin client not available: missing environment variables');
	}
	if (!_client) {
		_client = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
			auth: { persistSession: false }
		});
	}
	return _client;
}
