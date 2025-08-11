"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVoiceStore } from "@/store/voices";
import { useState } from "react";

export function VoiceCloner() {
	const [name, setName] = useState("My Voice");
	const [files, setFiles] = useState<FileList | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const { setVoices, voices } = useVoiceStore();

	async function onClone() {
		if (!files || files.length === 0) return;
		setIsLoading(true);
		const form = new FormData();
		form.append("name", name);
		for (const f of Array.from(files)) form.append("files", f);
		const res = await fetch("/api/voice-clone", { method: "POST", body: form });
		setIsLoading(false);
		if (!res.ok) return;
		const data = await res.json();
		const newVoice = { voiceId: data.voice.voiceId, name: data.voice.name };
		setVoices([...voices, newVoice]);
	}

	return (
		<Card className="space-y-4 p-4">
			<div className="space-y-2">
				<Label htmlFor="name">Voice name</Label>
				<Input
					id="name"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="voiceFiles">Audio files (mp3/ogg)</Label>
				<Input
					id="voiceFiles"
					type="file"
					accept="audio/*"
					multiple
					onChange={(e) => setFiles(e.target.files)}
				/>
			</div>
			<Button onClick={onClone} disabled={isLoading || !files?.length}>
				{isLoading ? "Cloning…" : "Clone voice"}
			</Button>
		</Card>
	);
}
