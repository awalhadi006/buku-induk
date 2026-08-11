export const PERAN_LABEL: Record<string, string> = {
	superadmin: 'Superadmin',
	admin_tu: 'Admin TU',
	wali_kamar: 'Wali Kamar',
	wali_kelas: 'Wali Kelas',
	asatidz: 'Asatidz'
};

export type Profile = {
	peran: keyof typeof PERAN_LABEL;
	nama: string | null;
	kamar_id: number | null;
	kelas_id: number | null;
};

export type Rekap = {
	total: number;
	per_status: Record<string, number>;
	per_gender: Record<string, number>;
	per_kamar: { nomor: number | null; jumlah: number }[];
	per_kelas: { kelas: string | null; jumlah: number }[];
	per_daerah: Record<string, number>;
};