"use client";
import { DEFAULT_LANGUAGE, type Language } from "@/lib/constants/ocr";
import { create } from "zustand";

type LanguageState = {
	selectedLanguage: Language;
	selectLanguage: (language: Language) => void;
};

export const useLanguageStore = create<LanguageState>((set) => ({
	selectedLanguage: DEFAULT_LANGUAGE,
	selectLanguage: (language) => set({ selectedLanguage: language }),
}));
