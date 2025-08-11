export interface CachedTTSData {
	id: string;
	pdfId: string;
	pageNumber: number;
	voiceId: string;
	audioBlob: Blob;
	timestamp: number;
}

const DB_NAME = "aireader_tts_cache";
const DB_VERSION = 1;
const STORE_NAME = "tts_audio";
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class TTSCache {
	private static instance: TTSCache;
	private dbPromise: Promise<IDBDatabase> | null = null;

	private constructor() {}

	public static getInstance(): TTSCache {
		if (!TTSCache.instance) {
			TTSCache.instance = new TTSCache();
		}
		return TTSCache.instance;
	}

	private async getDB(): Promise<IDBDatabase> {
		if (!this.dbPromise) {
			this.dbPromise = new Promise((resolve, reject) => {
				const request = indexedDB.open(DB_NAME, DB_VERSION);

				request.onerror = () => reject(request.error);
				request.onsuccess = () => resolve(request.result);

				request.onupgradeneeded = () => {
					const db = request.result;
					if (!db.objectStoreNames.contains(STORE_NAME)) {
						const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
						store.createIndex("pdfId", "pdfId", { unique: false });
						store.createIndex("timestamp", "timestamp", { unique: false });
					}
				};
			});
		}
		return this.dbPromise;
	}

	private generateCacheKey(
		pdfId: string,
		pageNumber: number,
		voiceId: string,
	): string {
		return `${pdfId}_${pageNumber}_${voiceId}`;
	}

	/**
	 * Generate a unique identifier for a PDF based on its content
	 */
	public async generatePdfId(file: File): Promise<string> {
		const buffer = await file.arrayBuffer();
		const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashHex = hashArray
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		return `${file.name}_${file.size}_${hashHex.slice(0, 16)}`;
	}

	/**
	 * Get cached audio blob for a specific page
	 */
	public async getCachedPageAudio(
		pdfId: string,
		voiceId: string,
		pageNumber: number,
	): Promise<Blob | null> {
		try {
			const db = await this.getDB();
			const transaction = db.transaction([STORE_NAME], "readonly");
			const store = transaction.objectStore(STORE_NAME);
			const key = this.generateCacheKey(pdfId, pageNumber, voiceId);

			const result = await new Promise<CachedTTSData | undefined>(
				(resolve, reject) => {
					const request = store.get(key);
					request.onsuccess = () => resolve(request.result);
					request.onerror = () => reject(request.error);
				},
			);

			if (!result) return null;

			// Check if cache is expired
			if (Date.now() - result.timestamp > CACHE_EXPIRY_MS) {
				await this.removeCachedPage(pdfId, voiceId, pageNumber);
				return null;
			}

			return result.audioBlob;
		} catch (error) {
			console.error("Error getting cached page audio:", error);
			return null;
		}
	}

	/**
	 * Add a single page to cache
	 */
	public async addPageToCache(
		pdfId: string,
		voiceId: string,
		pageNumber: number,
		audioBlob: Blob,
	): Promise<void> {
		try {
			const db = await this.getDB();
			const transaction = db.transaction([STORE_NAME], "readwrite");
			const store = transaction.objectStore(STORE_NAME);
			const key = this.generateCacheKey(pdfId, pageNumber, voiceId);

			const cacheData: CachedTTSData = {
				id: key,
				pdfId,
				pageNumber,
				voiceId,
				audioBlob,
				timestamp: Date.now(),
			};

			await new Promise<void>((resolve, reject) => {
				const request = store.put(cacheData);
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});
		} catch (error) {
			console.error("Error adding page to cache:", error);
		}
	}

	/**
	 * Remove cached TTS data for a specific page
	 */
	public async removeCachedPage(
		pdfId: string,
		voiceId: string,
		pageNumber: number,
	): Promise<void> {
		try {
			const db = await this.getDB();
			const transaction = db.transaction([STORE_NAME], "readwrite");
			const store = transaction.objectStore(STORE_NAME);
			const key = this.generateCacheKey(pdfId, pageNumber, voiceId);

			await new Promise<void>((resolve, reject) => {
				const request = store.delete(key);
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});
		} catch (error) {
			console.error("Error removing cached page:", error);
		}
	}

	/**
	 * Remove all cached pages for a specific PDF
	 */
	public async removeCachedPDF(pdfId: string): Promise<void> {
		try {
			const db = await this.getDB();
			const transaction = db.transaction([STORE_NAME], "readwrite");
			const store = transaction.objectStore(STORE_NAME);
			const index = store.index("pdfId");

			const request = index.openCursor(IDBKeyRange.only(pdfId));

			await new Promise<void>((resolve, reject) => {
				request.onsuccess = () => {
					const cursor = request.result;
					if (cursor) {
						cursor.delete();
						cursor.continue();
					} else {
						resolve();
					}
				};
				request.onerror = () => reject(request.error);
			});
		} catch (error) {
			console.error("Error removing cached PDF:", error);
		}
	}

	/**
	 * Clear all cached TTS data
	 */
	public async clearAllCache(): Promise<void> {
		try {
			const db = await this.getDB();
			const transaction = db.transaction([STORE_NAME], "readwrite");
			const store = transaction.objectStore(STORE_NAME);

			await new Promise<void>((resolve, reject) => {
				const request = store.clear();
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});
		} catch (error) {
			console.error("Error clearing TTS cache:", error);
		}
	}

	/**
	 * Check if a specific page is cached
	 */
	public async isPageCached(
		pdfId: string,
		voiceId: string,
		pageNumber: number,
	): Promise<boolean> {
		try {
			const db = await this.getDB();
			const transaction = db.transaction([STORE_NAME], "readonly");
			const store = transaction.objectStore(STORE_NAME);
			const key = this.generateCacheKey(pdfId, pageNumber, voiceId);

			const result = await new Promise<CachedTTSData | undefined>(
				(resolve, reject) => {
					const request = store.get(key);
					request.onsuccess = () => resolve(request.result);
					request.onerror = () => reject(request.error);
				},
			);

			if (!result) return false;

			// Check if cache is expired
			if (Date.now() - result.timestamp > CACHE_EXPIRY_MS) {
				await this.removeCachedPage(pdfId, voiceId, pageNumber);
				return false;
			}

			return true;
		} catch (error) {
			console.error("Error checking if page is cached:", error);
			return false;
		}
	}
}

// Export singleton instance
export const ttsCache = TTSCache.getInstance();
