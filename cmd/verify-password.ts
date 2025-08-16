#!/usr/bin/env bun

import { createInterface } from "node:readline";
import bcrypt from "bcryptjs";

const rl = createInterface({
	input: process.stdin,
	output: process.stdout,
});

function verifyPassword(password: string, hash: string): boolean {
	try {
		const isValid = bcrypt.compareSync(password, hash);
		console.log(isValid);
		return isValid;
	} catch (error) {
		console.error(error instanceof Error ? error.message : "Unknown error");
		return false;
	}
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);

	if (args.length >= 2) {
		const password = args[0];
		const hash = args[1];
		verifyPassword(password, hash);
		process.exit(0);
	}

	return new Promise((resolve) => {
		rl.question("", (password: string) => {
			rl.question("", (hash: string) => {
				rl.close();
				verifyPassword(password, hash);
				resolve();
			});
		});
	});
}

if (import.meta.main) {
	main();
}
