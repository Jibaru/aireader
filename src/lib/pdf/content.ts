/*
  Heuristics to extract readable content (headings and paragraphs) from a PDF page using pdfjs.
  - Groups text items into lines by Y position
  - Merges lines into blocks by vertical gaps
  - Filters out headers/footers and page numbers
  - Detects headings by larger font size or ALL CAPS
*/

type PdfJsPage = {
	getTextContent(): Promise<{ items: TextItem[] }>;
	getViewport(params: { scale: number }): { height?: number };
};

type TextItem = {
	str: string;
	transform: number[]; // [a,b,c,d,e,f] where d ~ scaleY, e=x, f=y
};

type Line = {
	y: number;
	text: string;
	fontSize: number;
};

function median(values: number[]): number {
	if (values.length === 0) return 0;
	const arr = [...values].sort((a, b) => a - b);
	const mid = Math.floor(arr.length / 2);
	return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
}

function isPageNumber(text: string): boolean {
	const t = text.trim();
	if (/^page\s+\d+(\s*of\s*\d+)?$/i.test(t)) return true;
	if (/^\d{1,4}$/.test(t)) return true;
	return false;
}

function isAllCaps(text: string): boolean {
	const letters = text.replace(/[^a-zA-Z]/g, "");
	return letters.length > 0 && letters === letters.toUpperCase();
}

export async function extractReadableContentFromPage(
	page: PdfJsPage,
): Promise<string> {
	const viewport = page.getViewport({ scale: 1 });
	const height: number = viewport.height ?? 0;
	const content = await page.getTextContent();
	const items = (content.items as TextItem[]).filter((it) => it?.str);
	if (items.length === 0) return "";

	// Group into lines by Y, using small threshold
	const sorted = [...items].sort(
		(a, b) =>
			b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4],
	);
	const lines: Line[] = [];
	const yThreshold = 2.0;
	let currentY = Number.NaN;
	let currentLine: TextItem[] = [];

	function pushLine() {
		if (currentLine.length === 0) return;
		// Order by X and build string
		currentLine.sort((a, b) => a.transform[4] - b.transform[4]);
		const text = currentLine
			.map((it) => it.str)
			.join(" ")
			.replace(/\s+/g, " ")
			.trim();
		const avgFont =
			currentLine.reduce((s, it) => s + Math.abs(it.transform[3] ?? 0), 0) /
			currentLine.length;
		const y = currentLine[0].transform[5];
		if (text) lines.push({ y, text, fontSize: avgFont });
		currentLine = [];
	}

	for (const it of sorted) {
		const y = it.transform[5];
		if (Number.isNaN(currentY)) {
			currentY = y;
			currentLine.push(it);
		} else if (Math.abs(y - currentY) <= yThreshold) {
			currentLine.push(it);
		} else {
			pushLine();
			currentY = y;
			currentLine.push(it);
		}
	}
	pushLine();

	if (lines.length === 0) return "";

	// Filter out headers/footers by margin and page numbers
	const margin = Math.max(24, height * 0.08);
	const filtered = lines.filter((ln) => {
		if (ln.y > height - margin) return false; // footer
		if (ln.y < margin) return false; // header
		if (isPageNumber(ln.text)) return false;
		return true;
	});
	if (filtered.length === 0) return "";

	// Determine heading threshold
	const fontMedian = median(filtered.map((l) => l.fontSize));
	const headingThreshold = fontMedian * 1.25;

	// Group into blocks by vertical gaps
	const gapThreshold = 14; // px gap between lines to break paragraph
	const blocks: { lines: Line[] }[] = [];
	let block: Line[] = [];
	for (let i = 0; i < filtered.length; i++) {
		const ln = filtered[i];
		const prev = filtered[i - 1];
		const gap = i === 0 ? 0 : Math.abs((prev?.y ?? ln.y) - ln.y);
		const isNewBlock = i === 0 || gap > gapThreshold;
		if (isNewBlock) {
			if (block.length) blocks.push({ lines: block });
			block = [ln];
		} else {
			block.push(ln);
		}
	}
	if (block.length) blocks.push({ lines: block });

	// Build readable text: keep headings and paragraphs, skip tiny blocks
	const out: string[] = [];
	for (const b of blocks) {
		const text = b.lines
			.map((l) => l.text)
			.join(" ")
			.replace(/\s+/g, " ")
			.trim();
		if (!text) continue;
		// Consider heading if any line is large or ALL CAPS and length short
		const maxFont = Math.max(...b.lines.map((l) => l.fontSize));
		const looksHeading = maxFont > headingThreshold || isAllCaps(text);
		if (looksHeading) {
			out.push(text);
			continue;
		}
		// Paragraph: skip very short noise
		if (text.length < 20) continue;
		out.push(text);
	}

	return out.join("\n");
}
