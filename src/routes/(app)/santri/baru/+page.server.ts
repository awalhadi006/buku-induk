import { requireAdmin } from '$lib/server/auth';
import { GDRIVE_CREDS_ID } from '$lib/gdrive';

export async function load(event) {
	await requireAdmin(event.locals, '/santri');

	const [{ data: kamar }, { data: kelas }, { data: wali }, { data: gd }, { data: customFields }, { data: nisPattern }] =
		await Promise.all([
			event.locals.supabase.from('kamar').select('id,nomor').eq('aktif', true).order('nomor'),
			event.locals.supabase
				.from('kelas')
				.select('id,tingkat,rombel,tahun_ajaran')
				.eq('aktif', true)
				.order('tahun_ajaran', { ascending: false })
				.order('tingkat')
				.order('rombel'),
			event.locals.supabase.from('wali_santri').select('id,nama_ayah,nama_ibu,nama_wali').order('created_at'),
			event.locals.supabase.from('gdrive_creds').select('id,refresh_token').eq('id', GDRIVE_CREDS_ID).maybeSingle(),
			event.locals.supabase.from('custom_fields').select('*').eq('aktif', true).order('urutan').order('id'),
			event.locals.supabase.from('settings').select('value').eq('key', 'nis_pattern').maybeSingle()
		]);

	return {
		kamar: kamar ?? [],
		kelas: kelas ?? [],
		wali: (wali ?? []).map((w) => ({
			id: w.id,
			label: w.nama_wali || w.nama_ayah || w.nama_ibu || '(wali tanpa nama)'
		})),
		gdrive: !!gd?.refresh_token,
		customFields: customFields ?? [],
		nisPattern: nisPattern?.value ?? ''
	};
}
