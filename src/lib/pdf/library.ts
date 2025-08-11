export interface PdfLibraryItem {
	id: string;
	name: string;
	file: Blob;
	size: number;
	uploadedAt: number;
	lastUsed: number;
	thumbnail?: Blob; // For future preview functionality
}

const DB_NAME = "aireader_pdf_library";
const DB_VERSION = 1;
const STORE_NAME = "pdfs";

export class PdfLibrary {
	private static instance: PdfLibrary;
	private dbPromise: Promise<IDBDatabase> | null = null;

	private constructor() {}

	public static getInstance(): PdfLibrary {
		if (!PdfLibrary.instance) {
			PdfLibrary.instance = new PdfLibrary();
		}
		return PdfLibrary.instance;
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
						store.createIndex("name", "name", { unique: false });
						store.createIndex("uploadedAt", "uploadedAt", { unique: false });
						store.createIndex("lastUsed", "lastUsed", { unique: false });
					}
				};
			});
		}
		return this.dbPromise;
	}

	/**
	 * Generate unique PDF ID based on content
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
	 * Add PDF to library
	 */
	public async addPdf(file: File): Promise<string> {
		try {
			// Perform all async operations first
			const id = await this.generatePdfId(file);

			// Check if it already exists
			const existing = await this.getPdf(id);
			if (existing) {
				// Update last used date
				await this.updateLastUsed(id);
				return id;
			}

			// Prepare PDF data
			const fileBuffer = await file.arrayBuffer();
			const pdfItem: PdfLibraryItem = {
				id,
				name: file.name,
				file: new Blob([fileBuffer], { type: "application/pdf" }),
				size: file.size,
				uploadedAt: Date.now(),
				lastUsed: Date.now(),
			};

			// Now create transaction and perform synchronous operation
			const db = await this.getDB();
			const transaction = db.transaction([STORE_NAME], "readwrite");
			const store = transaction.objectStore(STORE_NAME);

			await new Promise<void>((resolve, reject) => {
				const request = store.put(pdfItem);
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});

			return id;
		} catch (error) {
			console.error("Error adding PDF to library:", error);
			throw error;
		}
	}

	/**
	 * Get PDF by ID
	 */
	public async getPdf(id: string): Promise<PdfLibraryItem | null> {
		try {
			const db = await this.getDB();
			const transaction = db.transaction([STORE_NAME], "readonly");
			const store = transaction.objectStore(STORE_NAME);

			const result = await new Promise<PdfLibraryItem | undefined>(
				(resolve, reject) => {
					const request = store.get(id);
					request.onsuccess = () => resolve(request.result);
					request.onerror = () => reject(request.error);
				},
			);

			return result || null;
		} catch (error) {
			console.error("Error getting PDF from library:", error);
			return null;
		}
	}

	/**
	 * Get all PDFs
	 */
	public async getAllPdfs(): Promise<PdfLibraryItem[]> {
		try {
			const db = await this.getDB();
			const transaction = db.transaction([STORE_NAME], "readonly");
			const store = transaction.objectStore(STORE_NAME);
			const index = store.index("lastUsed");

			const results = await new Promise<PdfLibraryItem[]>((resolve, reject) => {
				const request = index.openCursor(null, "prev"); // Most recent first
				const items: PdfLibraryItem[] = [];

				request.onsuccess = () => {
					const cursor = request.result;
					if (cursor) {
						items.push(cursor.value);
						cursor.continue();
					} else {
						resolve(items);
					}
				};
				request.onerror = () => reject(request.error);
			});

			return results;
		} catch (error) {
			console.error("Error getting all PDFs:", error);
			return [];
		}
	}

	/**
	 * Update last used date
	 */
	public async updateLastUsed(id: string): Promise<void> {
		try {
			// Perform all async operations first
			const pdf = await this.getPdf(id);
			if (!pdf) return;

			// Prepare updated data
			const updatedPdf = { ...pdf, lastUsed: Date.now() };

			// Now create transaction and perform synchronous operation
			const db = await this.getDB();
			const transaction = db.transaction([STORE_NAME], "readwrite");
			const store = transaction.objectStore(STORE_NAME);

			await new Promise<void>((resolve, reject) => {
				const request = store.put(updatedPdf);
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});
		} catch (error) {
			console.error("Error updating last used:", error);
		}
	}

	/**
	 * Delete PDF from library
	 */
	public async deletePdf(id: string): Promise<void> {
		try {
			const db = await this.getDB();
			const transaction = db.transaction([STORE_NAME], "readwrite");
			const store = transaction.objectStore(STORE_NAME);

			await new Promise<void>((resolve, reject) => {
				const request = store.delete(id);
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});
		} catch (error) {
			console.error("Error deleting PDF:", error);
			throw error;
		}
	}

	/**
	 * Clear entire library
	 */
	public async clearLibrary(): Promise<void> {
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
			console.error("Error clearing PDF library:", error);
			throw error;
		}
	}

	/**
	 * Get library statistics
	 */
	public async getStats(): Promise<{ count: number; totalSize: number }> {
		try {
			const pdfs = await this.getAllPdfs();
			return {
				count: pdfs.length,
				totalSize: pdfs.reduce((total, pdf) => total + pdf.size, 0),
			};
		} catch (error) {
			console.error("Error getting library stats:", error);
			return { count: 0, totalSize: 0 };
		}
	}
}

// Export singleton instance
export const pdfLibrary = PdfLibrary.getInstance();
