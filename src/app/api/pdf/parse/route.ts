import "server-only";
import { NextResponse } from "next/server";

// Parse client-side instead. Keep endpoint to avoid 404s.
export async function POST() {
	return NextResponse.json(
		{ error: "PDF parsing moved client-side" },
		{ status: 410 },
	);
}
