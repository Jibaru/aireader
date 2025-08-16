import "server-only";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
	try {
		console.log("Processing logout request...", req);

		const response = NextResponse.json(
			{ message: "Logout successful" },
			{ status: 200 },
		);

		// Clear the auth cookie
		response.cookies.set("auth-token", "", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 0, // Expire immediately
		});

		return response;
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
