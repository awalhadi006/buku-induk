import { writable, type Writable } from 'svelte/store';

export type ImportStatus = 'idle' | 'parsing' | 'uploading' | 'completed' | 'error';

export interface ImportChunk {
	index: number;
	startRow: number;
	endRow: number;
	data: Record<string, unknown>[];
	status: 'pending' | 'uploading' | 'completed' | 'failed';
	error?: string;
}

export interface ImportSession {
	id: string;
	fileName: string;
	totalRows: number;
	chunkSize: number;
	chunks: ImportChunk[];
	currentChunkIndex: number;
	status: ImportStatus;
	progress: number;
	errors: { row: number; nama: string; reason: string; kategori: string }[];
	warnings: { row: number; nama: string; warnings: string[] }[];
	startedAt: number;
	completedAt?: number;
	abortController?: AbortController;
}

function createImportStore() {
	const sessions = writable<Map<string, ImportSession>>(new Map());

	const { subscribe, set, update } = sessions;

	function generateId(): string {
		return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
	}

	function createSession(fileName: string, totalRows: number, chunkSize = 100): ImportSession {
		const id = generateId();
		const chunkCount = Math.ceil(totalRows / chunkSize);
		const chunks: ImportChunk[] = [];

		for (let i = 0; i < chunkCount; i++) {
			const startRow = i * chunkSize;
			const endRow = Math.min(startRow + chunkSize, totalRows);
			chunks.push({
				index: i,
				startRow,
				endRow,
				data: [],
				status: 'pending'
			});
		}

		return {
			id,
			fileName,
			totalRows,
			chunkSize,
			chunks,
			currentChunkIndex: 0,
			status: 'idle',
			progress: 0,
			errors: [],
			warnings: [],
			startedAt: Date.now()
		};
	}

	function setSessionData(sessionId: string, chunks: ImportChunk[]) {
		update((map) => {
			const session = map.get(sessionId);
			if (!session) return map;

			const newMap = new Map(map);
			newMap.set(sessionId, { ...session, chunks });
			return newMap;
		});
	}

	function startSession(sessionId: string, abortController: AbortController) {
		update((map) => {
			const session = map.get(sessionId);
			if (!session) return map;

			const newMap = new Map(map);
			newMap.set(sessionId, {
				...session,
				status: 'uploading',
				abortController
			});
			return newMap;
		});
	}

	function updateChunkStatus(
		sessionId: string,
		chunkIndex: number,
		status: ImportChunk['status'],
		error?: string
	) {
		update((map) => {
			const session = map.get(sessionId);
			if (!session) return map;

			const newChunks = [...session.chunks];
			newChunks[chunkIndex] = { ...newChunks[chunkIndex], status, error };

			const completedChunks = newChunks.filter((c) => c.status === 'completed').length;
			const progress = Math.round((completedChunks / newChunks.length) * 100);

			const newMap = new Map(map);
			newMap.set(sessionId, {
				...session,
				chunks: newChunks,
				currentChunkIndex: chunkIndex,
				progress
			});
			return newMap;
		});
	}

	function addErrors(sessionId: string, errors: ImportSession['errors']) {
		update((map) => {
			const session = map.get(sessionId);
			if (!session) return map;

			const newMap = new Map(map);
			newMap.set(sessionId, {
				...session,
				errors: [...session.errors, ...errors]
			});
			return newMap;
		});
	}

	function addWarnings(sessionId: string, warnings: ImportSession['warnings']) {
		update((map) => {
			const session = map.get(sessionId);
			if (!session) return map;

			const newMap = new Map(map);
			newMap.set(sessionId, {
				...session,
				warnings: [...session.warnings, ...warnings]
			});
			return newMap;
		});
	}

	function completeSession(sessionId: string) {
		update((map) => {
			const session = map.get(sessionId);
			if (!session) return map;

			const newMap = new Map(map);
			newMap.set(sessionId, {
				...session,
				status: 'completed',
				progress: 100,
				completedAt: Date.now()
			});
			return newMap;
		});
	}

	function failSession(sessionId: string, error: string) {
		update((map) => {
			const session = map.get(sessionId);
			if (!session) return map;

			const newMap = new Map(map);
			newMap.set(sessionId, {
				...session,
				status: 'error',
				errors: [...session.errors, { row: 0, nama: '', reason: error, kategori: 'sistem' }]
			});
			return newMap;
		});
	}

	function removeSession(sessionId: string) {
		update((map) => {
			const newMap = new Map(map);
			newMap.delete(sessionId);
			return newMap;
		});
	}

	function getSession(sessionId: string): ImportSession | undefined {
		let result: ImportSession | undefined;
		sessions.subscribe((map) => {
			result = map.get(sessionId);
		})();
		return result;
	}

	function abortSession(sessionId: string) {
		update((map) => {
			const session = map.get(sessionId);
			if (!session) return map;

			session.abortController?.abort();

			const newMap = new Map(map);
			newMap.set(sessionId, { ...session, status: 'error' });
			return newMap;
		});
	}

	return {
		subscribe,
		createSession,
		setSessionData,
		startSession,
		updateChunkStatus,
		addErrors,
		addWarnings,
		completeSession,
		failSession,
		removeSession,
		getSession,
		abortSession
	};
}

export const importStore = createImportStore();

export function getImportStore(): typeof importStore {
	return importStore;
}