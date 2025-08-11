import "server-only";
import { getElevenLabsClient } from "@/lib/elevenlabs/client";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const client = getElevenLabsClient();
		const res = await client.voices.getAll();
		return NextResponse.json({ voices: res.voices ?? res });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
