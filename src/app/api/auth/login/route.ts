import "server-only";
import { AUTH_PWD_HASH, AUTH_USERNAME, JWT_SECRET } from "@/config/config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
	try {
		const { username, password } = await req.json();

		if (!username || !password) {
			return NextResponse.json(
				{ error: "Username and password are required" },
				{ status: 400 },
			);
		}

		if (!AUTH_USERNAME || !AUTH_PWD_HASH) {
			return NextResponse.json(
				{ error: "Authentication not configured" },
				{ status: 500 },
			);
		}

		// Check username
		if (username !== AUTH_USERNAME) {
			return NextResponse.json(
				{ error: "Invalid credentials" },
				{ status: 401 },
			);
		}

		// Check password
		const isPasswordValid = await bcrypt.compare(password, AUTH_PWD_HASH);
		if (!isPasswordValid) {
			return NextResponse.json(
				{ error: "Invalid credentials" },
				{ status: 401 },
			);
		}

		// Generate JWT token (expires in 1 week)
		const token = jwt.sign(
			{ username, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 },
			JWT_SECRET,
		);

		const response = NextResponse.json(
			{ message: "Login successful", token },
			{ status: 200 },
		);

		// Set HTTP-only cookie
		response.cookies.set("auth-token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 7 * 24 * 60 * 60, // 1 week
		});

		return response;
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
