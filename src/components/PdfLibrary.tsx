"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { type PdfLibraryItem, pdfLibrary } from "@/lib/pdf/library";
import { FileText, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type PdfLibraryProps = {
	onSelectPdf?: (pdf: PdfLibraryItem) => void;
};

export function PdfLibrary({ onSelectPdf }: PdfLibraryProps) {
	const [pdfs, setPdfs] = useState<PdfLibraryItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [stats, setStats] = useState({ count: 0, totalSize: 0 });

	const loadLibrary = useCallback(async () => {
		setIsLoading(true);
		try {
			const [libraryPdfs, libraryStats] = await Promise.all([
				pdfLibrary.getAllPdfs(),
				pdfLibrary.getStats(),
			]);
			setPdfs(libraryPdfs);
			setStats(libraryStats);
		} catch (error) {
			console.error("Error loading PDF library:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadLibrary();
	}, [loadLibrary]);

	const handleSelectPdf = async (pdf: PdfLibraryItem) => {
		try {
			// Update last used date
			await pdfLibrary.updateLastUsed(pdf.id);
			// Reload library to reflect changes
			await loadLibrary();
			// Notify parent component
			onSelectPdf?.(pdf);
		} catch (error) {
			console.error("Error selecting PDF:", error);
		}
	};

	const handleDeletePdf = async (pdf: PdfLibraryItem, e: React.MouseEvent) => {
		e.stopPropagation(); // Prevenir selección del PDF

		if (!confirm(`Are you sure you want to delete "${pdf.name}"?`)) {
			return;
		}

		try {
			await pdfLibrary.deletePdf(pdf.id);
			await loadLibrary(); // Reload library
		} catch (error) {
			console.error("Error deleting PDF:", error);
			alert("Error deleting PDF");
		}
	};

	const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		try {
			await pdfLibrary.addPdf(file);
			await loadLibrary(); // Reload library
			// Limpiar input
			e.target.value = "";
		} catch (error) {
			console.error("Error uploading PDF:", error);
			alert("Error uploading PDF");
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	const formatDate = (timestamp: number) => {
		return new Date(timestamp).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	if (isLoading) {
		return (
			<Card className="p-8 text-center">
				<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-current border-r-transparent border-solid" />
				<p className="mt-4 text-muted-foreground">Loading library...</p>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header with statistics and upload file */}
			<Card className="p-4">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-semibold text-xl">PDF Library</h2>
						<p className="text-muted-foreground text-sm">
							{stats.count} PDFs • {formatFileSize(stats.totalSize)}
						</p>
					</div>
					<div>
						<Label htmlFor="uploadPdf" className="cursor-pointer">
							<Button variant="default" className="gap-2" asChild>
								<div>
									<Upload className="h-4 w-4" />
									Upload PDF
								</div>
							</Button>
						</Label>
						<input
							id="uploadPdf"
							type="file"
							accept="application/pdf"
							onChange={handleUploadPdf}
							className="hidden"
						/>
					</div>
				</div>
			</Card>

			{/* Lista de PDFs */}
			{pdfs.length === 0 ? (
				<Card className="p-8 text-center">
					<FileText className="mx-auto h-12 w-12 text-muted-foreground" />
					<h3 className="mt-4 font-medium text-lg">No PDFs in your library</h3>
					<p className="mt-2 text-muted-foreground">
						Upload your first PDF to start building your library
					</p>
				</Card>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{pdfs.map((pdf) => (
						<Card
							key={pdf.id}
							className="cursor-pointer p-4 transition-all hover:scale-[1.02] hover:shadow-md"
							onClick={() => handleSelectPdf(pdf)}
						>
							<div className="flex items-start justify-between">
								<div className="min-w-0 flex-1">
									<div className="mb-2 flex items-center gap-2">
										<FileText className="h-5 w-5 flex-shrink-0 text-red-600" />
										<h3
											className="break-words font-medium text-sm leading-tight"
											title={pdf.name}
										>
											{pdf.name.replace(/\.pdf$/i, "")}
										</h3>
									</div>
									<div className="space-y-1 text-muted-foreground text-xs">
										<p>Size: {formatFileSize(pdf.size)}</p>
										<p>Uploaded: {formatDate(pdf.uploadedAt)}</p>
										<p>Last used: {formatDate(pdf.lastUsed)}</p>
									</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={(e) => handleDeletePdf(pdf, e)}
									className="ml-2 h-8 w-8 flex-shrink-0 p-0 text-muted-foreground hover:text-destructive"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
