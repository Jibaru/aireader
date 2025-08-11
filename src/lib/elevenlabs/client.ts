import "server-only";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

let cachedClient: ElevenLabsClient | null = null;

export function getElevenLabsClient(): ElevenLabsClient {
	if (cachedClient) return cachedClient;
	const apiKey = process.env.ELEVENLABS_API_KEY;
	if (!apiKey) {
		throw new Error("Missing ELEVENLABS_API_KEY environment variable");
	}
	cachedClient = new ElevenLabsClient({ apiKey });
	return cachedClient;
}
