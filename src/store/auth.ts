"use client";
import Cookies from "js-cookie";
import { create } from "zustand";

type AuthState = {
	token: string | null;
	username: string | null;
	isAuthenticated: boolean;
	login: (token: string, username: string) => void;
	logout: () => void;
	checkAuth: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
	token: null,
	username: null,
	isAuthenticated: false,

	login: (token: string, username: string) => {
		// Store token in cookies (client-side for convenience)
		Cookies.set("client-auth-token", token, {
			expires: 7, // 7 days
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
		});

		set({
			token,
			username,
			isAuthenticated: true,
		});
	},

	logout: async () => {
		// Call logout API to clear HTTP-only cookie
		try {
			await fetch("/api/auth/logout", {
				method: "POST",
			});
		} catch (error) {
			console.error("Logout API call failed:", error);
		}

		// Clear client-side token
		Cookies.remove("client-auth-token");

		set({
			token: null,
			username: null,
			isAuthenticated: false,
		});
	},

	checkAuth: () => {
		const token = Cookies.get("client-auth-token");
		if (token) {
			try {
				// Basic token validation (you could decode JWT here if needed)
				const payload = JSON.parse(atob(token.split(".")[1]));
				const isExpired = payload.exp < Math.floor(Date.now() / 1000);

				if (!isExpired) {
					set({
						token,
						username: payload.username,
						isAuthenticated: true,
					});
				} else {
					// Token expired, clear it
					get().logout();
				}
			} catch {
				// Invalid token, clear it
				get().logout();
			}
		}
	},
}));
