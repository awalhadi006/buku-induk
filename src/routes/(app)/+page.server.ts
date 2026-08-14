import type { Rekap } from '$lib/types';
import { ALL_METRIC_KEYS } from '$lib/types';

function parseEnabled(value: string | null | undefined): string[] {
	if (!value) return ALL_METRIC_KEYS;
	try {
		const arr = JSON.parse(value);
		return Array.isArray(arr) && arr.length ? arr.filter((k) => ALL_METRIC_KEYS.includes(k)) : ALL_METRIC_KEYS;
	} catch {
		return ALL_METRIC_KEYS;
	}
}

export async function load({ locals }) {
	const [{ data: rekap }, { data: settings }] = await Promise.all([
		locals.supabase.rpc('fn_rekap'),
		locals.supabase.from('settings').select('key,value').eq('key', 'dashboard_metrics').maybeSingle()
	]);

	return {
		rekap: rekap as Rekap | null,
		enabledMetrics: parseEnabled(settings?.value)
	};
}
