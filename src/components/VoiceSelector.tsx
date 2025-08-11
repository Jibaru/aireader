"use client";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DEFAULT_ELEVENLABS_VOICE_ID } from "@/lib/elevenlabs/constants";
import { useVoiceStore } from "@/store/voices";
import { useEffect } from "react";

type ElevenLabsVoice = {
	voiceId: string;
	name: string;
};

export function VoiceSelector() {
	const { voices, selectedVoiceId, setVoices, selectVoice } = useVoiceStore();

	useEffect(() => {
		async function fetchVoices() {
			try {
				const res = await fetch("/api/voices");
				const data = await res.json();
				const mapped = (data.voices ?? []).map((v: ElevenLabsVoice) => ({
					voiceId: v.voiceId,
					name: v.name,
				}));
				// Ensure default voice is present and selected by default
				const hasDefault = mapped.some(
					(v: ElevenLabsVoice) => v.voiceId === DEFAULT_ELEVENLABS_VOICE_ID,
				);
				const withDefault = hasDefault
					? mapped
					: [
							{ voiceId: DEFAULT_ELEVENLABS_VOICE_ID, name: "Default Voice" },
							...mapped,
						];

				setVoices(withDefault);
				if (!selectedVoiceId) selectVoice(DEFAULT_ELEVENLABS_VOICE_ID);
			} catch {
				// ignore
			}
		}
		fetchVoices();
	}, [selectedVoiceId, selectVoice, setVoices]);

	return (
		<div className="space-y-2">
			<Label htmlFor="voice">Voice</Label>
			<Select value={selectedVoiceId ?? undefined} onValueChange={selectVoice}>
				<SelectTrigger id="voice" className="w-full">
					<SelectValue placeholder="Select a voice" />
				</SelectTrigger>
				<SelectContent>
					{voices.map((v) => (
						<SelectItem key={v.voiceId} value={v.voiceId}>
							{v.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
