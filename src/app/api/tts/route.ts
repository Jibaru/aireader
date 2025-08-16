import "server-only";
import { requireAuth } from "@/lib/auth/middleware";
import { getElevenLabsClient } from "@/lib/elevenlabs/client";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
	// Check authentication
	const authError = requireAuth(req);
	if (authError) return authError;

	try {
		const client = getElevenLabsClient();
		const { text, voiceId, modelId, outputFormat } = await req.json();

		if (!text || !voiceId) {
			return new Response(
				JSON.stringify({ error: "Missing text or voiceId" }),
				{
					status: 400,
					headers: { "content-type": "application/json" },
				},
			);
		}

		const audioStream = await client.textToSpeech.convert(voiceId, {
			text,
			modelId: modelId || "eleven_multilingual_v2",
			outputFormat: outputFormat || "mp3_44100_128",
		});

		return new Response(audioStream as ReadableStream, {
			status: 200,
			headers: {
				"content-type": "audio/mpeg",
				"transfer-encoding": "chunked",
			},
		});
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "content-type": "application/json" },
		});
	}
}
