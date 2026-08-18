import { fail, redirect } from '@sveltejs/kit';

const ADMIN_ROLES = ['superadmin', 'admin_tu'];

async function isAdmin(locals: App.Locals): Promise<boolean> {
	const { user, supabase } = locals;
	if (!user) throw redirect(303, '/login');
	const { data: profile } = await supabase
		.from('profiles')
		.select('peran')
		.eq('id', user.id)
		.maybeSingle();
	return ADMIN_ROLES.includes(profile?.peran ?? '');
}

export async function load({ locals }) {
	if (!(await isAdmin(locals))) throw redirect(303, '/');

	const [{ data: kelas }, { data: santriCounts }] = await Promise.all([
		locals.supabase
			.from('kelas')
			.select('id,tingkat,rombel,tahun_ajaran,aktif')
			.eq('aktif', true)
			.order('tahun_ajaran', { ascending: false, nullsFirst: false })
			.order('tingkat')
			.order('rombel'),
		locals.supabase
			.from('santri')
			.select('kelas_id, status_santri')
			.in('status_santri', ['aktif', 'khusus'])
	]);

	const countsByKelas: Record<number, number> = {};
	for (const s of santriCounts ?? []) {
		if (s.kelas_id) {
			countsByKelas[s.kelas_id] = (countsByKelas[s.kelas_id] ?? 0) + 1;
		}
	}

	return {
		kelas: (kelas ?? []).map((k) => ({
			...k,
			jumlahSantri: countsByKelas[k.id] ?? 0
		}))
	};
}

export const actions = {
	naikKelas: async ({ locals, request }) => {
		if (!(await isAdmin(locals))) return fail(403, { error: 'Tidak punya izin mutasi kelas.' });

		const fd = await request.formData();
		const sourceId = Number(fd.get('source_kelas_id'));
		const targetId = Number(fd.get('target_kelas_id'));
		const tanggal = (fd.get('tanggal_efektif') as string)?.trim() || new Date().toISOString().slice(0, 10);

		if (!sourceId || !targetId) {
			return fail(400, { error: 'Pilih kelas asal dan kelas tujuan.' });
		}
		if (sourceId === targetId) {
			return fail(400, { error: 'Kelas asal dan kelas tujuan tidak boleh sama.' });
		}

		const { data: count, error: rpcErr } = await locals.supabase.rpc('bulk_naik_kelas', {
			p_source_kelas_id: sourceId,
			p_target_kelas_id: targetId,
			p_tanggal_efektif: tanggal
		});

		if (rpcErr) return fail(400, { error: rpcErr.message });
		if (!count || count === 0) {
			return fail(400, { error: 'Tidak ada santri aktif di kelas asal.' });
		}

		return { success: true, count, type: 'naik' };
	},

	lulusMassal: async ({ locals, request }) => {
		if (!(await isAdmin(locals))) return fail(403, { error: 'Tidak punya izin kelulusan massal.' });

		const fd = await request.formData();
		const kelasId = Number(fd.get('kelas_id'));
		const tanggal = (fd.get('tanggal_efektif') as string)?.trim() || new Date().toISOString().slice(0, 10);

		if (!kelasId) {
			return fail(400, { error: 'Pilih kelas yang akan diluluskan.' });
		}

		const { data: count, error: rpcErr } = await locals.supabase.rpc('bulk_lulus_massal', {
			p_kelas_id: kelasId,
			p_tanggal_efektif: tanggal
		});

		if (rpcErr) return fail(400, { error: rpcErr.message });
		if (!count || count === 0) {
			return fail(400, { error: 'Tidak ada santri aktif di kelas terpilih.' });
		}

		return { success: true, count, type: 'lulus' };
	}
};
