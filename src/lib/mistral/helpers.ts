import fs from "node:fs";
import { Mistral } from "@mistralai/mistralai";

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({ apiKey: apiKey });

export async function uploadFile(path: string): Promise<string> {
	const uploadedFile = fs.readFileSync(path);
	const fileExtension = path.split(".").pop() || "pdf";
	const fileName = `uploaded_file.${fileExtension}`;

	const uploadedFile_response = await client.files.upload({
		file: {
			fileName,
			content: uploadedFile,
		},
		purpose: "ocr",
	});

	const signedUrl = await client.files.getSignedUrl({
		fileId: uploadedFile_response.id,
	});

	return signedUrl.url;
}

export async function extractText(signedUrl: string): Promise<string> {
	const ocrResponse = await client.ocr.process({
		model: "mistral-ocr-latest",
		document: {
			type: "document_url",
			documentUrl: signedUrl,
		},
		includeImageBase64: false,
	});

	const text = ocrResponse.pages
		.toSorted((a, b) => a.index - b.index)
		.map((page) => page.markdown)
		.join("\n");

	return text;
}
