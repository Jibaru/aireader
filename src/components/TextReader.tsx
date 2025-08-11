"use client";
import { AudioProgressBar } from "@/components/AudioProgressBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AudioQueuePlayer } from "@/lib/audio/queue";
import { splitTextIntoChunks } from "@/lib/text/chunkText";
import { useVelocityStore } from "@/store/velocity";
import { useVoiceStore } from "@/store/voices";
import { useEffect, useRef, useState } from "react";

export function TextReader() {
	const { selectedVoiceId } = useVoiceStore();
	const { playbackRate } = useVelocityStore();
	const [text, setText] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const playerRef = useRef<AudioQueuePlayer | null>(null);

	function ensurePlayer(): AudioQueuePlayer {
		if (!playerRef.current) {
			playerRef.current = new AudioQueuePlayer();
		}
		playerRef.current.setPlaybackRate(playbackRate);
		return playerRef.current;
	}

	// Update playback rate when velocity changes
	useEffect(() => {
		if (playerRef.current) {
			playerRef.current.setPlaybackRate(playbackRate);
		}
	}, [playbackRate]);

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

		// Stream enqueue progressively to keep UI responsive
		for (const chunk of chunks) {
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
			<AudioProgressBar player={playerRef.current} />
		</Card>
	);
}
