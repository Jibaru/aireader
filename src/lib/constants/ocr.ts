// OCR Model constants
export const OCR_MODELS = {
	MISTRAL: "mistral",
	OPENAI: "openai",
} as const;

export const DEFAULT_OCR_MODEL = OCR_MODELS.MISTRAL;

// Language constants
export const LANGUAGES = {
	SPANISH: "es-ES",
	ENGLISH: "en-US",
} as const;

export const DEFAULT_LANGUAGE = LANGUAGES.SPANISH;

// Model and language options for UI components
export const MODEL_OPTIONS = [
	{ code: OCR_MODELS.MISTRAL, name: "Mistral" },
	{ code: OCR_MODELS.OPENAI, name: "OpenAI" },
] as const;

export const LANGUAGE_OPTIONS = [
	{ code: LANGUAGES.SPANISH, name: "Spanish" },
	{ code: LANGUAGES.ENGLISH, name: "English" },
] as const;

// Type definitions
export type OcrModel = (typeof OCR_MODELS)[keyof typeof OCR_MODELS];
export type Language = (typeof LANGUAGES)[keyof typeof LANGUAGES];
