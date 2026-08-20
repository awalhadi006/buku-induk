import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

let _client: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
	if (!_client) {
		_client = createClient(env.PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
			auth: { persistSession: false }
		});
	}
	return _client;
}
