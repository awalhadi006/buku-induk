import { createBrowserClient } from '@supabase/ssr';
import { env as publicEnv } from '$env/dynamic/public';

const PUBLIC_SUPABASE_URL = publicEnv.PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const PUBLIC_SUPABASE_ANON_KEY = publicEnv.PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

export const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
