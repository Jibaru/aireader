"use client";
import { DEFAULT_OCR_MODEL, type OcrModel } from "@/lib/constants/ocr";
import { create } from "zustand";

type ModelState = {
	selectedModel: OcrModel;
	selectModel: (model: OcrModel) => void;
};

export const useModelStore = create<ModelState>((set) => ({
	selectedModel: DEFAULT_OCR_MODEL,
	selectModel: (model) => set({ selectedModel: model }),
}));
