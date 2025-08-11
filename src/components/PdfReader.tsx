"use client";
import { MediaControls } from "@/components/MediaControls";
import { PdfViewer } from "@/components/PdfViewer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
// Page-level TTS; no chunking per page
import { AudioQueuePlayer } from "@/lib/audio/queue";
import { ttsCache } from "@/lib/pdf/tts-cache";
import { useVelocityStore } from "@/store/velocity";
import { useVoiceStore } from "@/store/voices";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/build/pdf.mjs";
import { useCallback, useEffect, useRef, useState } from "react";

export function PdfReader() {
	const { selectedVoiceId } = useVoiceStore();
	const { playbackRate } = useVelocityStore();
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingCache, setIsLoadingCache] = useState(false);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [pdfId, setPdfId] = useState<string | null>(null);
	const [isCurrentPageCached, setIsCurrentPageCached] = useState(false);
	const playerRef = useRef<AudioQueuePlayer | null>(null);

	function ensurePlayer(): AudioQueuePlayer {
		if (!playerRef.current) {
			playerRef.current = new AudioQueuePlayer();
		}
		playerRef.current.setPlaybackRate(playbackRate);
		return playerRef.current;
	}

	const updateCachedStatus = useCallback(async () => {
		if (!pdfId || !selectedVoiceId) {
			setIsCurrentPageCached(false);
			return;
		}
		const isCached = await ttsCache.isPageCached(
			pdfId,
			selectedVoiceId,
			currentPage,
		);
		setIsCurrentPageCached(isCached);
	}, [pdfId, selectedVoiceId, currentPage]);

	// Update cached status when page, PDF, or voice changes
	useEffect(() => {
		updateCachedStatus();
	}, [updateCachedStatus]);

	// Update playback rate when velocity changes
	useEffect(() => {
		if (playerRef.current) {
			playerRef.current.setPlaybackRate(playbackRate);
		}
	}, [playbackRate]);

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
			// Update cached status after adding to cache
			await updateCachedStatus();
		}
	}

	async function loadPageToCache(
		pageNumber: number,
		voiceId: string,
		text?: string,
	) {
		if (!pdfId || !selectedVoiceId) return;

		// Check if already cached
		const isCached = await ttsCache.isPageCached(pdfId, voiceId, pageNumber);
		if (isCached) return;

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

		// Generate TTS and cache it (without playing)
		const res = await fetch("/api/tts", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ text: pageText, voiceId }),
		});
		if (!res.ok) return;
		const blob = await res.blob();

		await ttsCache.addPageToCache(pdfId, voiceId, pageNumber, blob);
		// Update cached status after adding to cache
		await updateCachedStatus();
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

	async function onLoad() {
		if (!selectedVoiceId || !pdfUrl || !pdfId) return;
		setIsLoadingCache(true);

		// Load current page to cache without playing
		await loadPageToCache(currentPage, selectedVoiceId);
		setIsLoadingCache(false);
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
			<div className="flex items-center gap-2 text-muted-foreground text-sm">
				Currently on page {currentPage}. Click Play to read this page with OCR.
				{isCurrentPageCached && (
					<span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 font-medium text-green-700 text-xs ring-1 ring-green-600/20 ring-inset">
						Cached
					</span>
				)}
			</div>

			<div className="flex flex-wrap gap-2">
				<Button
					variant="secondary"
					onClick={onLoad}
					disabled={
						!selectedVoiceId || !pdfUrl || isLoadingCache || isCurrentPageCached
					}
					className="flex-1 sm:flex-none"
				>
					{isLoadingCache ? "Loading…" : "Load PDF"}
				</Button>
				<Button
					variant="outline"
					onClick={onClearCache}
					className="flex-1 sm:flex-none"
				>
					Clear PDF cache
				</Button>
			</div>

			<MediaControls
				player={playerRef.current}
				onStop={onStop}
				onPlay={onPlay}
				isLoading={isLoading}
				canPlay={!!(selectedVoiceId && pdfUrl)}
				playLabel="Play PDF"
			/>
		</Card>
	);
}
