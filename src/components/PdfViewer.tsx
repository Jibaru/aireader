"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PdfViewerProps = {
	fileUrl: string;
	onPageChange?: (pageNumber: number) => void;
};

export function PdfViewer({ fileUrl, onPageChange }: PdfViewerProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
	const buttonCooldownRef = useRef<boolean>(false);
	const [numPages, setNumPages] = useState<number>(1);
	const [pageNumber, setPageNumber] = useState<number>(1);
	const [containerWidth, setContainerWidth] = useState<number>(0);
	const [pageInputValue, setPageInputValue] = useState<string>("1");
	useEffect(() => {
		// Configure worker once and align with installed pdfjs-dist version
		// Configure worker with proper typing
		(
			pdfjs as typeof pdfjs & { GlobalWorkerOptions: { workerSrc: string } }
		).GlobalWorkerOptions.workerSrc = new URL(
			"pdfjs-dist/build/pdf.worker.min.mjs",
			import.meta.url,
		).toString();

		// Suppress TextLayer cancellation warnings
		const originalConsoleError = console.error;
		console.error = (...args) => {
			const message = args[0]?.toString() || "";
			if (
				message.includes("TextLayer task cancelled") ||
				message.includes("AbortException")
			) {
				return; // Suppress these specific warnings
			}
			originalConsoleError.apply(console, args);
		};

		return () => {
			console.error = originalConsoleError;
		};
	}, []);

	// Debounced page change handler
	const debouncedPageChange = useCallback(
		(newPage: number) => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
			debounceTimerRef.current = setTimeout(() => {
				onPageChange?.(newPage);
			}, 100); // 100ms debounce
		},
		[onPageChange],
	);

	// Notify parent when page changes (debounced)
	useEffect(() => {
		debouncedPageChange(pageNumber);
	}, [pageNumber, debouncedPageChange]);

	// Cleanup debounce timer on unmount
	useEffect(() => {
		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, []);

	// Track container width for responsive PDF rendering
	useEffect(() => {
		if (!containerRef.current) return;

		const updateContainerWidth = () => {
			if (containerRef.current) {
				setContainerWidth(containerRef.current.clientWidth);
			}
		};

		const resizeObserver = new ResizeObserver(updateContainerWidth);
		resizeObserver.observe(containerRef.current);
		updateContainerWidth(); // Initial measurement

		return () => resizeObserver.disconnect();
	}, []);

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
			if (el) el.removeEventListener("wheel", blockWheel);
		};
	}, []);

	// Debounced navigation functions
	const handlePrevPage = useCallback(() => {
		if (buttonCooldownRef.current) return;
		buttonCooldownRef.current = true;

		const newPage = Math.max(1, pageNumber - 1);
		setPageNumber(newPage);
		setPageInputValue(newPage.toString());

		setTimeout(() => {
			buttonCooldownRef.current = false;
		}, 150); // 150ms cooldown
	}, [pageNumber]);

	const handleNextPage = useCallback(() => {
		if (buttonCooldownRef.current) return;
		buttonCooldownRef.current = true;

		const newPage = Math.min(numPages, pageNumber + 1);
		setPageNumber(newPage);
		setPageInputValue(newPage.toString());

		setTimeout(() => {
			buttonCooldownRef.current = false;
		}, 150); // 150ms cooldown
	}, [pageNumber, numPages]);

	// Handle direct page input
	const handlePageInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			// Allow empty string for typing, or numbers within valid range
			if (
				value === "" ||
				(/^\d+$/.test(value) &&
					Number.parseInt(value) >= 1 &&
					Number.parseInt(value) <= numPages)
			) {
				setPageInputValue(value);
			}
		},
		[numPages],
	);

	const handlePageInputSubmit = useCallback(() => {
		const pageNum = Number.parseInt(pageInputValue);
		if (!Number.isNaN(pageNum) && pageNum >= 1 && pageNum <= numPages) {
			setPageNumber(pageNum);
		} else {
			// Reset to current page if invalid
			setPageInputValue(pageNumber.toString());
		}
	}, [pageInputValue, numPages, pageNumber]);

	const handlePageInputKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				handlePageInputSubmit();
				e.currentTarget.blur();
			} else if (e.key === "Escape") {
				setPageInputValue(pageNumber.toString());
				e.currentTarget.blur();
			}
		},
		[handlePageInputSubmit, pageNumber],
	);

	// Update input value when page changes externally
	useEffect(() => {
		setPageInputValue(pageNumber.toString());
	}, [pageNumber]);

	return (
		<div className="w-full space-y-3">
			<div
				ref={containerRef}
				className="mx-auto max-w-full overflow-hidden rounded-md border bg-background sm:max-w-[840px]"
				style={{
					height: containerWidth > 0 ? "auto" : "600px", // Fallback height while measuring
				}}
			>
				<Document
					file={fileUrl}
					loading={<div className="p-6">Loading PDF…</div>}
					onLoadSuccess={({ numPages }) => setNumPages(numPages)}
				>
					<Page
						pageNumber={pageNumber}
						width={
							containerWidth > 0
								? Math.min(containerWidth - 32, 800)
								: undefined
						} // 32px for padding, max 800px
						renderAnnotationLayer
						renderTextLayer
						loading={<div className="p-6">Loading…</div>}
						onRenderError={(error) => {
							// Suppress TextLayer cancellation errors
							if (
								!error.message.includes("cancelled") &&
								!error.message.includes("AbortException")
							) {
								console.error("PDF render error:", error);
							}
						}}
					/>
				</Document>
			</div>
			<div className="flex items-center justify-between">
				<Button
					variant="secondary"
					onClick={handlePrevPage}
					disabled={pageNumber <= 1}
				>
					Prev
				</Button>
				<div className="flex items-center gap-2 text-muted-foreground text-sm">
					<span>Page</span>
					<Input
						type="text"
						value={pageInputValue}
						onChange={handlePageInputChange}
						onBlur={handlePageInputSubmit}
						onKeyDown={handlePageInputKeyDown}
						className="h-8 w-16 text-center"
						min={1}
						max={numPages}
					/>
					<span>/ {numPages}</span>
				</div>
				<Button onClick={handleNextPage} disabled={pageNumber >= numPages}>
					Next
				</Button>
			</div>
		</div>
	);
}
