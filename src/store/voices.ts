"use client";
import { DEFAULT_ELEVENLABS_VOICE_ID } from "@/lib/elevenlabs/constants";
import { create } from "zustand";

export type Voice = {
	voiceId: string;
	name: string;
};

type VoiceState = {
	voices: Voice[];
	selectedVoiceId: string | null;
	setVoices: (voices: Voice[]) => void;
	selectVoice: (voiceId: string) => void;
};

export const useVoiceStore = create<VoiceState>((set) => ({
	voices: [{ voiceId: DEFAULT_ELEVENLABS_VOICE_ID, name: "Default Voice" }],
	selectedVoiceId: DEFAULT_ELEVENLABS_VOICE_ID,
	setVoices: (voices) => set({ voices }),
	selectVoice: (voiceId) => set({ selectedVoiceId: voiceId }),
}));
