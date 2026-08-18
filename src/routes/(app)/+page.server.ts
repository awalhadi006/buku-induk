import type { Rekap } from '$lib/types';
import { ALL_METRIC_KEYS } from '$lib/types';

function parseEnabled(value: string | null | undefined): string[] {
	if (!value) return ALL_METRIC_KEYS;
	try {
		const arr = JSON.parse(value);
		return Array.isArray(arr) && arr.length
			? arr.filter((k) => ALL_METRIC_KEYS.includes(k))
			: ALL_METRIC_KEYS;
	} catch {
		return ALL_METRIC_KEYS;
	}
}

export async function load({ locals }) {
	const [rekapRes, settingsRes, taAktifRes, alumniRes] = await Promise.all([
		locals.supabase.rpc('fn_rekap'),
		locals.supabase.from('settings').select('key,value').eq('key', 'dashboard_metrics').maybeSingle(),
		locals.supabase.from('settings').select('value').eq('key', 'tahun_ajaran_aktif').maybeSingle(),
		locals.supabase
			.from('status_history')
			.select('tanggal_efektif')
			.eq('jenis', 'status_santri')
			.eq('nilai_baru', 'lulus')
	]);

	const rekapError: string | null = rekapRes.error?.message ?? null;
	const rekap: Rekap | null = rekapError ? null : (rekapRes.data as Rekap | null);

	const alumniPerTahun: Record<string, number> = {};
	for (const h of alumniRes.data ?? []) {
		const tahun = (h.tanggal_efektif ?? '').slice(0, 4);
		if (tahun) alumniPerTahun[tahun] = (alumniPerTahun[tahun] ?? 0) + 1;
	}

	return {
		rekap,
		rekapError,
		tahunAjaranAktif: taAktifRes.data?.value || null,
		enabledMetrics: parseEnabled(settingsRes.data?.value),
		alumniPerTahun
	};
}
