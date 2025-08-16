"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth";
import { useState } from "react";
import { toast } from "sonner";

export function LoginForm() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { login } = useAuthStore();

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (!username || !password) {
			toast.error("Please enter both username and password");
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ username, password }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Login failed");
			}

			// Store token and update auth state
			login(data.token, username);
			toast.success("Login successful!");
		} catch (error) {
			const message = error instanceof Error ? error.message : "Login failed";
			toast.error(message);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/30 p-8">
			<Card className="w-full max-w-md space-y-6 p-6">
				<div className="space-y-2 text-center">
					<h1 className="font-bold text-2xl tracking-tight">
						Welcome to AIReader
					</h1>
					<p className="text-muted-foreground text-sm">
						Please sign in to access the application
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="username">Username</Label>
						<Input
							id="username"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="Enter your username"
							disabled={isLoading}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Enter your password"
							disabled={isLoading}
							required
						/>
					</div>

					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading ? "Signing in..." : "Sign in"}
					</Button>
				</form>
			</Card>
		</div>
	);
}
