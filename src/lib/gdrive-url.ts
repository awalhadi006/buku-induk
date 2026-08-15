// Helper murni (tanpa env) untuk mengubah nilai 'gdrive:<id>' menjadi URL tampilan.
// Dipisah dari gdrive.ts agar tidak menarik $env/dynamic/private ke bundle browser.

export function photoUrl(value: string | null | undefined): string | null {
	if (!value) return null;
	if (value.startsWith('gdrive:')) return `https://drive.google.com/thumbnail?id=${value.slice(7)}&sz=w512`;
	return value;
}

export function docUrl(value: string | null | undefined): string | null {
	if (!value) return null;
	if (value.startsWith('gdrive:')) return `https://drive.google.com/file/d/${value.slice(7)}/view?usp=sharing`;
	return value;
}
