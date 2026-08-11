import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties
		}

		interface Locals {
			supabase: SupabaseClient;
			user: User | null;
		}

		interface PageData {
			user?: User | null;
			profile?: import('$lib/types').Profile | null;
			rekap?: import('$lib/types').Rekap | null;
			santri?: Array<{
				id: string;
				nama_lengkap: string;
				nisn: string | null;
				jenis_kelamin: 'L' | 'P' | null;
				status_santri: string;
				kamar: { nomor: number } | null;
				kelas: { tingkat: string; rombel: string } | null;
			}>;
		}
	}
}

export {};