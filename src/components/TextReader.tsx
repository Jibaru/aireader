"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { AudioQueuePlayer } from "@/lib/audio/queue";
import {
	sliceChunksFromOffset,
	splitTextIntoChunks,
} from "@/lib/text/chunkText";
import { useVoiceStore } from "@/store/voices";
import { useRef, useState } from "react";

export function TextReader() {
	const { selectedVoiceId } = useVoiceStore();
	const [text, setText] = useState("");
	const [startOffset, setStartOffset] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const playerRef = useRef<AudioQueuePlayer | null>(null);

	function ensurePlayer(): AudioQueuePlayer {
		if (!playerRef.current) playerRef.current = new AudioQueuePlayer();
		return playerRef.current;
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
	}

	async function onPlay() {
		if (!selectedVoiceId) return;
		setIsLoading(true);
		const chunks = splitTextIntoChunks(text);
		const startChunks = sliceChunksFromOffset(chunks, startOffset);

		// Stream enqueue progressively to keep UI responsive
		for (const chunk of startChunks) {
			// Fire-and-forget; queue handles ordering
			void enqueueChunk(chunk.text, selectedVoiceId);
			await new Promise((r) => setTimeout(r, 50));
		}
		setIsLoading(false);
	}

	function onStop() {
		ensurePlayer().clear();
	}

	return (
		<Card className="space-y-4 p-4">
			<div className="space-y-2">
				<Label htmlFor="inputText">Text</Label>
				<Textarea
					id="inputText"
					placeholder="Type or paste your text here..."
					className="min-h-[160px]"
					value={text}
					onChange={(e) => setText(e.target.value)}
				/>
			</div>
			<div className="space-y-2">
				<Label>Start position</Label>
				<Slider
					min={0}
					max={Math.max(0, text.length)}
					value={[Math.min(startOffset, text.length)]}
					onValueChange={(v) => setStartOffset(v[0] ?? 0)}
				/>
				<div className="text-muted-foreground text-sm">
					Character offset: {startOffset}
				</div>
			</div>
			<div className="flex gap-2">
				<Button
					onClick={onPlay}
					disabled={!selectedVoiceId || !text || isLoading}
				>
					{isLoading ? "Queueing…" : "Play"}
				</Button>
				<Button variant="secondary" onClick={onStop}>
					Stop
				</Button>
			</div>
		</Card>
	);
}
