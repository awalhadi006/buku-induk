import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(
	env.PUBLIC_SUPABASE_URL!,
	SUPABASE_SERVICE_ROLE_KEY!,
	{ auth: { persistSession: false } }
);
