import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const TYPE_LABELS: Record<string, string> = {
	feat: 'Penambahan Fitur',
	fix: 'Perbaikan Sistem',
	docs: 'Pembaruan Dokumen',
	style: 'Perubahan Tampilan',
	refactor: 'Optimasi Internal',
	perf: 'Peningkatan Kecepatan',
	test: 'Pengujian Sistem',
	chore: 'Pemeliharaan Rutin',
	ci: 'Sistem Otomatisasi',
	build: 'Sistem Rilis'
};

const KEYWORD_MAP: Record<string, string> = {
	'academic year': 'tahun ajaran',
	'active': 'aktif',
	'management': 'pengelolaan',
	'approval': 'persetujuan',
	'request': 'permintaan',
	'change': 'perubahan',
	'export': 'unduh/ekspor',
	'notification': 'pemberitahuan/notifikasi',
	'dashboard': 'halaman utama',
	'rekap': 'ringkasan data',
	'santri': 'santri',
	'wali': 'orang tua/wali',
	'timeline': 'riwayat urutan waktu',
	'filter': 'penyaringan data',
	'add': 'tambah',
	'update': 'perbarui',
	'delete': 'hapus',
	'fix': 'perbaiki',
	'make': 'buat',
	'implement': 'terapkan',
	'show': 'tampilkan',
	'humanize': 'permudah pembacaan'
};

function humanize(subject: string): string {
	const m = subject.match(/^(feat|fix|docs|style|refactor|perf|test|chore|ci|build)(?:\([^)]+\))?!?:\s*(.*)$/i);
	let type = '';
	let content = subject;

	if (m) {
		type = TYPE_LABELS[m[1].toLowerCase()] ?? m[1];
		content = m[2];
	}

	// Terjemahkan kata kunci jika pesan masih bahasa Inggris
	let humanized = content;
	for (const [en, id] of Object.entries(KEYWORD_MAP)) {
		const regex = new RegExp(`\\b${en}\\b`, 'gi');
		humanized = humanized.replace(regex, id);
	}

	humanized = humanized.charAt(0).toUpperCase() + humanized.slice(1);
	return type ? `${type}: ${humanized}` : humanized;
}

export async function load({ locals, fetch, setHeaders }) {
	const { user } = locals;
	if (!user) throw redirect(303, '/login');

	const headers: Record<string, string> = {
		Accept: 'application/vnd.github+json',
		'User-Agent': 'buku-induk'
	};
	// ponytail: token opsional — tanpa token, API publik bisa kena rate-limit IP bersama Cloudflare
	if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;

	let commitsError = false;
	let data: any[] | null = null;
	try {
		const res = await fetch('https://api.github.com/repos/awalhadi006/buku-induk/commits?per_page=30', { headers });
		if (!res.ok) commitsError = true;
		else {
			data = (await res.json()) as any[];
			setHeaders({ 'cache-control': 'public, max-age=300' });
		}
	} catch {
		commitsError = true;
	}

	const commits = (commitsError ? [] : (data ?? []).map((c) => ({
		short: c.sha.slice(0, 7),
		date: (c.commit?.author?.date ?? '').slice(0, 10),
		subject: c.commit?.message?.split('\n')[0] ?? '',
		label: humanize(c.commit?.message?.split('\n')[0] ?? '')
	})));

	return { commits, commitsError };
}
