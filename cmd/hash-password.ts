#!/usr/bin/env bun

import { createInterface } from "node:readline";
import bcrypt from "bcryptjs";

const rl = createInterface({
	input: process.stdin,
	output: process.stdout,
});

function hashPassword(password: string): string {
	if (!password || password.trim() === "") {
		console.error("Password cannot be empty");
		process.exit(1);
	}

	try {
		const hash = bcrypt.hashSync(password, 10);
		console.log(hash);
		return hash;
	} catch (error) {
		console.error(error instanceof Error ? error.message : "Unknown error");
		process.exit(1);
	}
}

function main(): void {
	const args = process.argv.slice(2);

	if (args.length > 0) {
		const password = args.join(" ");
		hashPassword(password);
		process.exit(0);
	}

	rl.question("", (password: string) => {
		rl.close();
		hashPassword(password);
	});
}

if (import.meta.main) {
	main();
}

export { hashPassword };
