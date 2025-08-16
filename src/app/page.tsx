"use client";
import { LoginDialog } from "@/components/LoginDialog";
import { TextReader } from "@/components/TextReader";
import { VoiceCloner } from "@/components/VoiceCloner";
import { VoiceSelector } from "@/components/VoiceSelector";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PdfLibraryItem } from "@/lib/pdf/library";
import { useAuthStore } from "@/store/auth";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

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
	const { isAuthenticated, username, logout, checkAuth } = useAuthStore();
	const [activeTab, setActiveTab] = useState("text");
	const [showLoginDialog, setShowLoginDialog] = useState(false);
	const pdfReaderRef = useRef<{
		loadFromLibrary: (blob: Blob, id: string) => void;
	}>(null);

	// Check authentication on mount
	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	const handleSelectPdfFromLibrary = async (pdf: PdfLibraryItem) => {
		// Switch to PDF Reader tab
		setActiveTab("pdf");
		// Wait a bit for component to mount
		setTimeout(() => {
			pdfReaderRef.current?.loadFromLibrary(pdf.file, pdf.id);
		}, 100);
	};

	const handleLogout = () => {
		logout();
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-8">
			<div className="mx-auto max-w-4xl space-y-8">
				<div className="space-y-2 text-center">
					<div className="flex items-center justify-between">
						<div className="flex-1" />
						<div className="flex-1">
							<h1 className="font-bold text-3xl tracking-tight">AIReader</h1>
							<p className="text-muted-foreground">
								Listen to PDFs and text using ElevenLabs voices
							</p>
						</div>
						<div className="flex flex-1 items-center justify-end gap-4">
							{isAuthenticated ? (
								<>
									{username && (
										<span className="text-muted-foreground text-sm">
											Welcome, {username}
										</span>
									)}
									<Button variant="outline" size="sm" onClick={handleLogout}>
										Logout
									</Button>
								</>
							) : (
								<Button
									variant="default"
									size="sm"
									onClick={() => setShowLoginDialog(true)}
								>
									Login
								</Button>
							)}
						</div>
					</div>
				</div>
				<div className="flex justify-center">
					<VoiceSelector />
				</div>
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid h-auto w-full grid-cols-2 gap-1 md:grid-cols-4">
						<TabsTrigger value="text" className="text-xs sm:text-sm">
							Text to Speech
						</TabsTrigger>
						<TabsTrigger value="pdf" className="text-xs sm:text-sm">
							PDF Reader
						</TabsTrigger>
						<TabsTrigger value="library" className="text-xs sm:text-sm">
							Library
						</TabsTrigger>
						<TabsTrigger value="voice" className="text-xs sm:text-sm">
							Add Voice
						</TabsTrigger>
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

			<LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
		</div>
	);
}
