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

export function VoiceSelector() {
	const { voices, selectedVoiceId, setVoices, selectVoice } = useVoiceStore();

	useEffect(() => {
		async function fetchVoices() {
			try {
				const res = await fetch("/api/voices");
				const data = await res.json();
				// biome-ignore lint/suspicious/noExplicitAny: ElevenLabs API response has dynamic voice structure
				const mapped = (data.voices ?? []).map((v: any) => ({
					voiceId: v.voiceId,
					name: v.name,
				}));
				// Ensure default voice is present and selected by default
				const hasDefault = mapped.some(
					// biome-ignore lint/suspicious/noExplicitAny: Voice object from mapped array above
					(v: any) => v.voiceId === DEFAULT_ELEVENLABS_VOICE_ID,
				);
				const withDefault = hasDefault
					? mapped
					: [
							{ voiceId: DEFAULT_ELEVENLABS_VOICE_ID, name: "Default Voice" },
							...mapped,
						];

				setVoices(withDefault);
				if (!selectedVoiceId) selectVoice(DEFAULT_ELEVENLABS_VOICE_ID);
			} catch (e) {
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
