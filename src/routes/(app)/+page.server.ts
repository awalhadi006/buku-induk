import type { Rekap } from '$lib/types';
import { ALL_METRIC_KEYS } from '$lib/types';

export async function load({ locals }) {
	const [{ data: rekap }, { data: settings }] = await Promise.all([
		locals.supabase.rpc('fn_rekap'),
		locals.supabase.from('settings').select('key,value').eq('key', 'dashboard_metrics').maybeSingle()
	]);

	let enabled: string[] = ALL_METRIC_KEYS;
	try {
		if (settings?.value) enabled = JSON.parse(settings.value);
	} catch {}

	return {
		rekap: rekap as Rekap | null,
		enabledMetrics: enabled
	};
}
