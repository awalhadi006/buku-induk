import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';

let _client: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
	if (!_client) {
		_client = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY!, {
			auth: { persistSession: false }
		});
	}
	return _client;
}
