export type TextChunk = {
	index: number;
	start: number; // character offset
	end: number; // character offset (exclusive)
	text: string;
};

const DEFAULT_MAX_CHARS_PER_CHUNK = 350; // avoid cutting mid-sentence

export function splitTextIntoChunks(
	input: string,
	options?: { maxChars?: number },
): TextChunk[] {
	const text = input?.trim() ?? "";
	if (!text) return [];

	const maxChars = Math.max(
		80,
		options?.maxChars ?? DEFAULT_MAX_CHARS_PER_CHUNK,
	);

	// Split by sentence-ish boundaries while preserving indices
	const sentenceRegex = /(.*?[\.\!\?\n]+|.+?$)/g;
	const sentences: { text: string; start: number; end: number }[] = [];

	let match: RegExpExecArray | null;
	// biome-ignore lint/suspicious/noAssignInExpressions: Standard pattern for regex iteration
	while ((match = sentenceRegex.exec(text)) !== null) {
		const segment = match[0];
		const start = match.index;
		const end = start + segment.length;
		if (segment.trim().length > 0) {
			sentences.push({ text: segment, start, end });
		}
	}

	const chunks: TextChunk[] = [];
	let currentChunk = "";
	let currentStart = 0;
	let chunkStartIdx = 0;

	sentences.forEach((s, i) => {
		const candidate =
			currentChunk.length === 0 ? s.text : `${currentChunk} ${s.text}`;
		if (candidate.length > maxChars && currentChunk.length > 0) {
			chunks.push({
				index: chunks.length,
				start: currentStart,
				end: currentStart + currentChunk.length,
				text: currentChunk,
			});
			currentChunk = s.text.trim();
			currentStart = s.start;
			chunkStartIdx = i;
		} else {
			if (currentChunk.length === 0) {
				currentStart = s.start;
			}
			currentChunk = candidate.trim();
		}
	});

	if (currentChunk.length > 0) {
		chunks.push({
			index: chunks.length,
			start: currentStart,
			end: currentStart + currentChunk.length,
			text: currentChunk,
		});
	}

	return chunks;
}

export function sliceChunksFromOffset(
	chunks: TextChunk[],
	startOffset: number,
): TextChunk[] {
	if (startOffset <= 0) return chunks;
	const startIndex = chunks.findIndex((c) => c.end > startOffset);
	if (startIndex === -1) return [];
	return chunks.slice(startIndex);
}
