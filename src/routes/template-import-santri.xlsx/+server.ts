import { buildTemplateBuffer } from '$lib/excel';

export async function GET() {
	const buffer = buildTemplateBuffer();
	return new Response(Buffer.from(buffer), {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': 'attachment; filename="template-import-santri.xlsx"'
		}
	});
}