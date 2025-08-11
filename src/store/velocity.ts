import { create } from "zustand";

interface VelocityState {
	playbackRate: number;
	setPlaybackRate: (rate: number) => void;
}

export const useVelocityStore = create<VelocityState>((set) => ({
	playbackRate: 1,
	setPlaybackRate: (rate: number) => set({ playbackRate: rate }),
}));
