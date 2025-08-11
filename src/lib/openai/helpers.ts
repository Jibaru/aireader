import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function translateToSpanish(text: string): Promise<string> {
	if (!text) throw new Error("No text provided for translation.");

	const { text: translated } = await generateText({
		model: openai("gpt-4o-mini"), // fast, cheaper model
		prompt: `<role>You are a expert translator</role>
<task>Translate the input text to spanish</task>
<input>${text}</input>
<output>Only rerieve the translated text</output>`,
	});

	return translated.trim();
}
