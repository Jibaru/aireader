"use client";
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { Button } from "@/components/ui/button";

type PdfViewerProps = {
	fileUrl: string;
	onPageChange?: (pageNumber: number) => void;
};

export function PdfViewer({ fileUrl, onPageChange }: PdfViewerProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [numPages, setNumPages] = useState<number>(1);
	const [pageNumber, setPageNumber] = useState<number>(1);
	useEffect(() => {
		// Configure worker once and align with installed pdfjs-dist version
		// biome-ignore lint/suspicious/noExplicitAny: pdfjs types don't export GlobalWorkerOptions properly
		(pdfjs as any).GlobalWorkerOptions.workerSrc = new URL(
			"pdfjs-dist/build/pdf.worker.min.mjs",
			import.meta.url,
		).toString();
	}, []);

	// Notify parent when page changes
	useEffect(() => {
		onPageChange?.(pageNumber);
	}, [pageNumber, onPageChange]);

	// Prevent wheel scrolling inside the viewer; navigation only via buttons
	useEffect(() => {
		function blockWheel(e: WheelEvent) {
			if (!containerRef.current) return;
			if (!containerRef.current.contains(e.target as Node)) return;
			e.preventDefault();
			e.stopPropagation();
		}
		const el = containerRef.current;
		if (el) el.addEventListener("wheel", blockWheel, { passive: false });
		return () => {
			// biome-ignore lint/suspicious/noExplicitAny: EventListener type mismatch with removeEventListener
			if (el) el.removeEventListener("wheel", blockWheel as any);
		};
	}, []);

	return (
		<div className="w-full space-y-3">
			<div
				ref={containerRef}
				className="mx-auto h-[1100px] w-[840px] overflow-hidden rounded-md border bg-background"
			>
				<Document
					file={fileUrl}
					loading={<div className="p-6">Loading PDF…</div>}
					onLoadSuccess={({ numPages }) => setNumPages(numPages)}
				>
					<Page
						pageNumber={pageNumber}
						height={1000}
						renderAnnotationLayer
						renderTextLayer
						loading={<div className="p-6">Loading…</div>}
					/>
				</Document>
			</div>
			<div className="flex items-center justify-between">
				<Button
					variant="secondary"
					onClick={() => {
						const newPage = Math.max(1, pageNumber - 1);
						setPageNumber(newPage);
						onPageChange?.(newPage);
					}}
					disabled={pageNumber <= 1}
				>
					Prev
				</Button>
				<div className="text-muted-foreground text-sm">
					Page {pageNumber} / {numPages}
				</div>
				<Button
					onClick={() => {
						const newPage = Math.min(numPages, pageNumber + 1);
						setPageNumber(newPage);
						onPageChange?.(newPage);
					}}
					disabled={pageNumber >= numPages}
				>
					Next
				</Button>
			</div>
		</div>
	);
}
