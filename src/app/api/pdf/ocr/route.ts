import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { extractText, uploadFile } from "@/lib/mistral/helpers";
import { translateToSpanish } from "@/lib/openai/helpers";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get("file") as File;
		const pageNumber = formData.get("pageNumber") as string;

		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		// Save the file temporarily
		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);
		const tempPath = join(tmpdir(), `page_${pageNumber}_${Date.now()}.png`);

		await writeFile(tempPath, buffer);

		try {
			// Upload to Mistral and extract text
			const signedUrl = await uploadFile(tempPath);
			const text = await extractText(signedUrl);
			const translatedText = await translateToSpanish(text);

			// Clean up temp file
			await unlink(tempPath);

			return NextResponse.json({ text: translatedText });
		} catch (error) {
			// Clean up temp file in case of error
			try {
				await unlink(tempPath);
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
