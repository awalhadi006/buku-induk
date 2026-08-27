import { fail, redirect } from '@sveltejs/kit';

const ADMIN_ROLES = ['superadmin', 'admin_tu'];

function humanizeKamarError(err: Error): string {
	const msg = err.message?.toLowerCase() ?? '';
	if (msg.includes('duplicate key') || msg.includes('unique constraint') || msg.includes('kamar_nomor_asrama_unique')) {
		return 'Nomor kamar dan asrama ini sudah ada. Gunakan kombinasi nomor + asrama yang berbeda.';
	}
	if (msg.includes('foreign key') || msg.includes('referenced')) {
		return 'Data terkait tidak ditemukan. Pastikan kamar yang dipilih masih ada.';
	}
	return 'Gagal menyimpan kamar. Silakan coba lagi atau hubungi administrator.';
}

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
	const admin = await isAdmin(locals);
	const { data } = await locals.supabase.from('kamar').select('*, santri(count)').order('nomor');
	const kamar = (data ?? []).map((k: any) => ({
		...k,
		jumlah_santri: k.santri?.[0]?.count ?? 0,
	}));
	return { kamar, isAdmin: admin };
}

export const actions = {
	add: async ({ locals, request }) => {
		if (!(await isAdmin(locals))) return fail(403, { error: 'Tidak punya izin menambah kamar.' });
		const fd = await request.formData();
		const nomor = Number(fd.get('nomor') ?? '');
		if (!Number.isInteger(nomor) || nomor <= 0)
			return fail(400, { error: 'Nomor kamar wajib diisi angka lebih dari 0.' });

		const payload = {
			nomor,
			asrama: (fd.get('asrama') as string | null)?.trim() || null,
			aktif: fd.get('aktif') === 'on'
		};
		const { error } = await locals.supabase.from('kamar').insert(payload);
		if (error) return fail(400, { error: humanizeKamarError(error) });
		throw redirect(303, '/kamar');
	},
	update: async ({ locals, request }) => {
		if (!(await isAdmin(locals))) return fail(403, { error: 'Tidak punya izin mengubah kamar.' });
		const fd = await request.formData();
		const id = Number(fd.get('id') ?? '');
		const nomor = Number(fd.get('nomor') ?? '');
		if (!Number.isInteger(id) || !Number.isInteger(nomor) || nomor <= 0)
			return fail(400, { error: 'Data kamar tidak valid.' });

		const payload = {
			nomor,
			asrama: (fd.get('asrama') as string | null)?.trim() || null,
			aktif: fd.get('aktif') === 'on'
		};
		const { error } = await locals.supabase.from('kamar').update(payload).eq('id', id);
		if (error) return fail(400, { error: humanizeKamarError(error) });
		throw redirect(303, '/kamar');
	},
	delete: async ({ locals, request }) => {
		if (!(await isAdmin(locals))) return fail(403, { error: 'Tidak punya izin menghapus kamar.' });
		const fd = await request.formData();
		const id = Number(fd.get('id') ?? '');
		const { error } = await locals.supabase.from('kamar').delete().eq('id', id);
		if (error) return fail(400, { error: humanizeKamarError(error) });
		throw redirect(303, '/kamar');
	}
};