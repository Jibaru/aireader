"use client";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth";
import { useState } from "react";
import { toast } from "sonner";

interface LoginDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
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

			// Clear form and close dialog
			setUsername("");
			setPassword("");
			onOpenChange(false);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Login failed";
			toast.error(message);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Login to AIReader</DialogTitle>
					<DialogDescription>
						Please sign in to access TTS, OCR, and voice cloning features.
					</DialogDescription>
				</DialogHeader>

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

					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isLoading}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading ? "Signing in..." : "Sign in"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
