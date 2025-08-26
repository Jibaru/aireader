import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { requireAuth } from "@/lib/auth/middleware";
import {
	DEFAULT_LANGUAGE,
	DEFAULT_OCR_MODEL,
	OCR_MODELS,
} from "@/lib/constants/ocr";
import { extractText, uploadFile } from "@/lib/mistral/helpers";
import { extractPdfText, translate } from "@/lib/openai/helpers";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	// Check authentication
	const authError = requireAuth(request);
	if (authError) return authError;

	try {
		const formData = await request.formData();
		const file = formData.get("file") as File;
		const pageNumber = formData.get("pageNumber") as string;
		const modelCode = formData.get("modelCode") || DEFAULT_OCR_MODEL;
		const languageCode =
			(formData.get("languageCode") as string) || DEFAULT_LANGUAGE;

		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		let tempPath = "";
		try {
			let translatedText = "";
			if (modelCode === OCR_MODELS.MISTRAL) {
				// Save the file temporarily
				const bytes = await file.arrayBuffer();
				const buffer = Buffer.from(bytes);
				tempPath = join(tmpdir(), `page_${pageNumber}_${Date.now()}.png`);
				await writeFile(tempPath, buffer);

				const signedUrl = await uploadFile(tempPath);
				const text = await extractText(signedUrl);
				translatedText = await translate(text, languageCode);

				await unlink(tempPath);
			} else if (modelCode === OCR_MODELS.OPENAI) {
				// Save the file as PDF temporarily
				const bytes = await file.arrayBuffer();
				const buffer = Buffer.from(bytes);
				tempPath = join(tmpdir(), `document_${Date.now()}.pdf`);
				await writeFile(tempPath, buffer);

				const extractedText = await extractPdfText(tempPath);
				translatedText = await translate(extractedText, languageCode);

				await unlink(tempPath);
			}

			return NextResponse.json({ text: translatedText });
		} catch (error) {
			// Clean up temp file in case of error
			try {
				if (tempPath !== "") {
					await unlink(tempPath);
				}
			} catch {}
			throw error;
		}
	} catch (error) {
		console.error("OCR processing error:", error);
		return NextResponse.json(
			{ error: "Failed to process OCR" },
			{ status: 500 },
		);
	}
}
