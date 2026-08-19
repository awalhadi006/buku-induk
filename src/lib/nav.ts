import { ROLES } from '$lib/permissions';

export type NavItemDef = {
	href: string;
	label: string;
};

export const NAV_ITEMS: NavItemDef[] = [
	{ href: '/', label: 'Rekapitulasi' },
	{ href: '/santri', label: 'Santri' },
	{ href: '/rekap', label: 'Rekap Kamar/Kelas' },
	{ href: '/wali', label: 'Wali Santri' },
	{ href: '/kamar', label: 'Kamar' },
	{ href: '/kelas', label: 'Kelas' },
	{ href: '/kelas/mutasi', label: 'Mutasi Kelas & Lulus' },
	{ href: '/persetujuan', label: 'Persetujuan Data' },
	{ href: '/import', label: 'Import Excel' },
	{ href: '/pengaturan', label: 'Pengaturan' },
	{ href: '/santri/alumni', label: 'Arsip Alumni' },
	{ href: '/updates', label: 'Apa yang Baru' }
];

export const DEFAULT_SIDEBAR_ROLES: Record<string, string[]> = {
	'/': [...ROLES],
	'/santri': [...ROLES],
	'/rekap': ['superadmin', 'admin_tu'],
	'/wali': ['superadmin', 'admin_tu'],
	'/kamar': ['superadmin', 'admin_tu'],
	'/kelas': ['superadmin', 'admin_tu'],
	'/kelas/mutasi': ['superadmin', 'admin_tu'],
	'/persetujuan': ['superadmin', 'admin_tu'],
	'/import': ['superadmin', 'admin_tu'],
	'/pengaturan': ['superadmin', 'admin_tu'],
	'/updates': [...ROLES],
	'/santri/alumni': ['superadmin', 'admin_tu']
};

export function parseSidebarNav(jsonStr: string | null | undefined): Record<string, string[]> {
	if (!jsonStr) return DEFAULT_SIDEBAR_ROLES;
	try {
		const parsed = JSON.parse(jsonStr);
		if (typeof parsed === 'object' && parsed !== null) {
			const result: Record<string, string[]> = {};
			for (const item of NAV_ITEMS) {
				if (Array.isArray(parsed[item.href])) {
					result[item.href] = parsed[item.href].filter((r: unknown) => typeof r === 'string' && ROLES.includes(r));
				} else {
					result[item.href] = DEFAULT_SIDEBAR_ROLES[item.href] ?? [];
				}
			}
			return result;
		}
	} catch {}
	return DEFAULT_SIDEBAR_ROLES;
}
