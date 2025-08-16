import { translateToSpanish } from "@/lib/openai/helpers";

translateToSpanish("Hello, how are you?")
	.then(console.log)
	.catch(console.error);
