import "server-only";
import jwt from "jsonwebtoken";
import { type NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

export function verifyAuth(req: NextRequest): {
	isValid: boolean;
	username?: string;
	error?: string;
} {
	try {
		// Get token from cookie
		const token = req.cookies.get("auth-token")?.value;

		if (!token) {
			return { isValid: false };
		}

		// Verify JWT token
		const decoded = jwt.verify(token, JWT_SECRET) as {
			username: string;
			exp: number;
		};

		// Check if token is expired
		if (decoded.exp < Math.floor(Date.now() / 1000)) {
			return { isValid: false };
		}

		return { isValid: true, username: decoded.username };
	} catch (error) {
		console.error("Authentication error:", error);
		return {
			isValid: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export function requireAuth(req: NextRequest): NextResponse | null {
	const auth = verifyAuth(req);

	if (!auth.isValid) {
		return NextResponse.json(
			{ error: "Authentication required" },
			{ status: 401 },
		);
	}

	return null;
}
