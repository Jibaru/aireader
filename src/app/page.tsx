"use client";
import { TextReader } from "@/components/TextReader";
import { VoiceCloner } from "@/components/VoiceCloner";
import { VoiceSelector } from "@/components/VoiceSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PdfLibraryItem } from "@/lib/pdf/library";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";

// Dynamic imports for PDF components (client-only)
const PdfReader = dynamic(
	() =>
		import("@/components/PdfReader").then((mod) => ({
			default: mod.PdfReader,
		})),
	{
		ssr: false,
		loading: () => (
			<div className="flex items-center justify-center p-8">
				<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-current border-r-transparent border-solid" />
				<span className="ml-2">Loading PDF Reader...</span>
			</div>
		),
	},
);

const PdfLibrary = dynamic(
	() =>
		import("@/components/PdfLibrary").then((mod) => ({
			default: mod.PdfLibrary,
		})),
	{
		ssr: false,
		loading: () => (
			<div className="flex items-center justify-center p-8">
				<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-current border-r-transparent border-solid" />
				<span className="ml-2">Loading library...</span>
			</div>
		),
	},
);

export default function Home() {
	const [activeTab, setActiveTab] = useState("text");
	const pdfReaderRef = useRef<{
		loadFromLibrary: (blob: Blob, id: string) => void;
	}>(null);

	const handleSelectPdfFromLibrary = async (pdf: PdfLibraryItem) => {
		// Switch to PDF Reader tab
		setActiveTab("pdf");
		// Wait a bit for component to mount
		setTimeout(() => {
			pdfReaderRef.current?.loadFromLibrary(pdf.file, pdf.id);
		}, 100);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-8">
			<div className="mx-auto max-w-4xl space-y-8">
				<div className="space-y-2 text-center">
					<h1 className="font-bold text-3xl tracking-tight">AIReader</h1>
					<p className="text-muted-foreground">
						Listen to PDFs and text using ElevenLabs voices
					</p>
				</div>
				<div className="flex justify-center">
					<VoiceSelector />
				</div>
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid w-full grid-cols-4">
						<TabsTrigger value="text">Text to Speech</TabsTrigger>
						<TabsTrigger value="pdf">PDF Reader</TabsTrigger>
						<TabsTrigger value="library">Library</TabsTrigger>
						<TabsTrigger value="voice">Add Voice</TabsTrigger>
					</TabsList>
					<TabsContent value="text">
						<TextReader />
					</TabsContent>
					<TabsContent value="pdf">
						<PdfReader ref={pdfReaderRef} />
					</TabsContent>
					<TabsContent value="library">
						<PdfLibrary onSelectPdf={handleSelectPdfFromLibrary} />
					</TabsContent>
					<TabsContent value="voice">
						<VoiceCloner />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
