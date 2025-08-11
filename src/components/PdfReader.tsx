"use client";
import { PdfViewer } from "@/components/PdfViewer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
// Page-level TTS; no chunking per page
import { AudioQueuePlayer } from "@/lib/audio/queue";
import { ttsCache } from "@/lib/pdf/tts-cache";
import { useVoiceStore } from "@/store/voices";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/build/pdf.mjs";
import { useRef, useState } from "react";

export function PdfReader() {
	const { selectedVoiceId } = useVoiceStore();
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [pdfId, setPdfId] = useState<string | null>(null);
	const playerRef = useRef<AudioQueuePlayer | null>(null);

	function ensurePlayer(): AudioQueuePlayer {
		if (!playerRef.current) playerRef.current = new AudioQueuePlayer();
		return playerRef.current;
	}

	async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		setPdfUrl(URL.createObjectURL(file));
		// Generate unique PDF identifier for caching
		const id = await ttsCache.generatePdfId(file);
		setPdfId(id);
		// PDF is loaded for viewing
		setCurrentPage(1);
	}

	async function enqueueChunk(chunkText: string, voiceId: string) {
		const res = await fetch("/api/tts", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ text: chunkText, voiceId }),
		});
		if (!res.ok) return;
		const blob = await res.blob();
		const url = URL.createObjectURL(blob);
		ensurePlayer().enqueue({ id: crypto.randomUUID(), url });
		return blob;
	}

	async function enqueuePageAudio(
		pageNumber: number,
		voiceId: string,
		text?: string,
	) {
		if (!pdfId || !selectedVoiceId) return;

		// Check if page is cached
		const cachedBlob = await ttsCache.getCachedPageAudio(
			pdfId,
			voiceId,
			pageNumber,
		);
		if (cachedBlob) {
			const url = URL.createObjectURL(cachedBlob);
			ensurePlayer().enqueue({ id: crypto.randomUUID(), url });
			return;
		}

		// If not cached and text is not provided, extract text first
		let pageText = text;
		if (!pageText) {
			const inputEl = document.getElementById(
				"pdfFile",
			) as HTMLInputElement | null;
			const file = inputEl?.files?.[0];
			if (!file) return;
			pageText = await extractPageText(file, pageNumber).catch(() => "");
			if (!pageText) return;
		}

		// Generate TTS and cache it
		const blob = await enqueueChunk(pageText, voiceId);
		if (blob) {
			await ttsCache.addPageToCache(pdfId, voiceId, pageNumber, blob);
		}
	}

	async function extractPageAsImage(
		file: File,
		pageNumber: number,
	): Promise<Blob | null> {
		const arrayBuffer = await file.arrayBuffer();
		(GlobalWorkerOptions as unknown as { workerSrc: string }).workerSrc =
			new URL(
				"pdfjs-dist/build/pdf.worker.min.mjs",
				import.meta.url,
			).toString();
		const loadingTask = getDocument({ data: new Uint8Array(arrayBuffer) });
		const doc = await loadingTask.promise;
		if (pageNumber > doc.numPages) return null;

		const page = await doc.getPage(pageNumber);
		const viewport = page.getViewport({ scale: 2 }); // Higher scale for better OCR

		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");
		if (!context) throw new Error("Could not get 2D context");
		canvas.height = viewport.height;
		canvas.width = viewport.width;

		const renderContext = {
			canvasContext: context,
			viewport: viewport,
		};

		await page.render(renderContext).promise;

		return new Promise((resolve) => {
			canvas.toBlob((blob) => resolve(blob), "image/png", 0.95);
		});
	}

	async function extractPageText(
		file: File,
		pageNumber: number,
	): Promise<string> {
		const imageBlob = await extractPageAsImage(file, pageNumber);
		if (!imageBlob) return "";

		// Create a temporary file
		const formData = new FormData();
		formData.append("file", imageBlob, `page_${pageNumber}.png`);
		formData.append("pageNumber", pageNumber.toString());

		// Call server-side API to handle Mistral OCR
		const response = await fetch("/api/pdf/ocr", {
			method: "POST",
			body: formData,
		});

		if (!response.ok) {
			console.error("OCR failed:", await response.text());
			return "";
		}

		const { text } = await response.json();
		return text || "";
	}

	async function onPlay() {
		if (!selectedVoiceId || !pdfUrl || !pdfId) return;
		setIsLoading(true);

		let pageToRead = currentPage;
		const player = ensurePlayer();

		player.setOnEnded(async () => {
			pageToRead += 1;
			await enqueuePageAudio(pageToRead, selectedVoiceId);
		});

		// Start playing from current page
		await enqueuePageAudio(pageToRead, selectedVoiceId);
		setIsLoading(false);
	}

	function onStop() {
		ensurePlayer().clear();
	}

	async function onClearCache() {
		await ttsCache.clearAllCache();
		// Show some feedback (you could use a toast here)
		console.log("PDF TTS cache cleared");
	}

	return (
		<Card className="space-y-4 p-4">
			<div className="space-y-2">
				<Label htmlFor="pdfFile">Upload PDF</Label>
				<input
					id="pdfFile"
					type="file"
					accept="application/pdf"
					onChange={onUpload}
				/>
			</div>
			{pdfUrl ? (
				<div className="space-y-2">
					<Label>PDF Viewer</Label>
					<PdfViewer
						fileUrl={pdfUrl}
						onPageChange={(pageNumber) => {
							setCurrentPage(pageNumber);
						}}
					/>
				</div>
			) : null}
			<div className="text-muted-foreground text-sm">
				Currently on page {currentPage}. Click Play to read this page with OCR.
			</div>
			<div className="flex gap-2">
				<Button
					onClick={onPlay}
					disabled={!selectedVoiceId || !pdfUrl || isLoading}
				>
					{isLoading ? "Queueing…" : "Play PDF"}
				</Button>
				<Button variant="secondary" onClick={onStop}>
					Stop
				</Button>
				<Button variant="outline" onClick={onClearCache}>
					Clear PDF cache
				</Button>
			</div>
		</Card>
	);
}
