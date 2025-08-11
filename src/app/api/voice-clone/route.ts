import "server-only";
import { getElevenLabsClient } from "@/lib/elevenlabs/client";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
	try {
		const client = getElevenLabsClient();

		const formData = await req.formData();
		const name = String(formData.get("name") || "My Voice");

		const files: File[] = [];
		const fileEntries = formData.getAll("files");
		for (const entry of fileEntries) {
			if (entry instanceof File) files.push(entry);
		}

		if (files.length === 0) {
			return NextResponse.json(
				{ error: "No audio files provided" },
				{ status: 400 },
			);
		}

		// Convert File objects to Node.js Readable streams for the SDK
		const nodeStreams = await Promise.all(
			files.map(async (file) => {
				const arrayBuffer = await file.arrayBuffer();
				return Buffer.from(arrayBuffer);
			}),
		);

		const voice = await client.voices.ivc.create({
			name,
			files: nodeStreams,
		});

		return NextResponse.json({ voice });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
