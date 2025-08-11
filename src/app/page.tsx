import { PdfReader } from "@/components/PdfReader";
import { TextReader } from "@/components/TextReader";
import { VelocitySelector } from "@/components/VelocitySelector";
import { VoiceCloner } from "@/components/VoiceCloner";
import { VoiceSelector } from "@/components/VoiceSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-8">
			<div className="mx-auto max-w-4xl space-y-8">
				<div className="space-y-2 text-center">
					<h1 className="font-bold text-3xl tracking-tight">AIReader</h1>
					<p className="text-muted-foreground">
						Listen to PDFs and text using ElevenLabs voices
					</p>
				</div>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<VoiceSelector />
					<VelocitySelector />
				</div>
				<Tabs defaultValue="text" className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="text">Text to Speech</TabsTrigger>
						<TabsTrigger value="pdf">PDF Reader</TabsTrigger>
						<TabsTrigger value="voice">Add Voice</TabsTrigger>
					</TabsList>
					<TabsContent value="text">
						<TextReader />
					</TabsContent>
					<TabsContent value="pdf">
						<PdfReader />
					</TabsContent>
					<TabsContent value="voice">
						<VoiceCloner />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
