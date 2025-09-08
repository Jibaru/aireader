import fs from "node:fs";
import { openai } from "@ai-sdk/openai";
import { experimental_generateSpeech, generateText } from "ai";
import { client } from "./client";

export async function translate(
	text: string,
	languageCode = "es-ES",
): Promise<string> {
	if (!text) throw new Error("No text provided for translation.");

	const { text: translated } = await generateText({
		model: openai("gpt-5-nano"), // fast, cheaper model
		prompt: `<role>You are a expert translator</role>
<task>Translate the input text to ${languageCode} language.</task>
<input>${text}</input>
<output>Only rerieve the translated text</output>`,
	});

	return translated.trim();
}

export async function extractPdfText(pdfPath: string): Promise<string> {
	// Read PDF file and convert to base64
	const pdfBuffer = fs.readFileSync(pdfPath);
	const base64Pdf = pdfBuffer.toString("base64");

	// Use OpenAI Responses API for PDF processing
	const response = await client.responses.create({
		model: "gpt-5-nano",
		input: [
			{
				role: "user",
				content: [
					{
						type: "input_text",
						text: `<role>You are an expert PDF text extraction assistant</role>
<task>
Extract all content from this PDF document while preserving the exact order and structure as it appears in the document.
</task>
<instructions>
1. Process the document from top to bottom, left to right, exactly as it appears
2. For text content: Extract the exact text maintaining original formatting, line breaks, and spacing
3. For non-text elements (figures, charts, diagrams, images, tables, graphs): Describe them completely and detailed in place using the format: [FIGURE: brief description]
4. Maintain the sequential order - if content appears as: text, figure, text, then output should be: text, [FIGURE: description], text
5. Do not include headers or footer elements of the PDF
6. Preserve table structures and formatting when possible
</instructions>
<output_format>
Return the content in the exact order it appears in the PDF, with text content as-is and non-text elements described as [FIGURE: description].
</output_format>`,
					},
					{
						type: "input_file",
						filename: "document.pdf",
						file_data: `data:application/pdf;base64,${base64Pdf}`,
					},
				],
			},
		],
	});

	return response.output
		.filter((item) => item.type === "message")
		.map((item) => {
			return item.content
				.map((content) => {
					if (content.type === "output_text") {
						return content.text;
					}
					return "";
				})
				.join("\n");
		})
		.join("\n");
}

export async function textToSpeech(
	content: string,
): Promise<Uint8Array<ArrayBufferLike>> {
	const audio = await experimental_generateSpeech({
		model: openai.speech("gpt-4o-mini-tts"),
		text: content,
		voice: "alloy",
		language: "es",
	});

	return audio.audio.uint8Array;
}
