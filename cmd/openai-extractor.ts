import { extractPdfText } from "@/lib/openai/helpers";

extractPdfText("pdf.pdf").then(console.log).catch(console.error);
