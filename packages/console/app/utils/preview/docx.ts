/**
 * Client-side mapping from a detection's raw-source byte span (a `SourceRef`
 * into a DOCX part) to the rendered run it belongs to.
 *
 * docx-preview renders each `<w:r>` run as a `<span>` in document order but
 * drops the run's raw byte position, so highlighting can't work off the DOM
 * text alone (tabs, symbols, footnotes inject synthetic text that desyncs a
 * character walk). Instead we parse the rendered parts (the document body plus
 * headers/footers/notes) ourselves into ordered `<w:t>` runs with their byte
 * spans, each tagged with its part, and resolve a SourceRef's (part, byte range)
 * to (run ordinal, char range in that run).
 *
 * A SourceRef's bytes always land inside `<w:t>` text (that is what the decoded
 * stream a recognizer scanned was built from), never in the tags between runs,
 * so keying on the run sidesteps every synthetic-text desync.
 */

/**
 * A raw-source byte range from a detection (a `SourceRef`), flattened to plain
 * offsets. `part` names the container file the bytes index (for DOCX, usually
 * `word/document.xml`); absent for a single-file source.
 */
export interface DocxSourceRef {
	part?: string;
	start: number;
	end: number;
}

/** One `<w:t>` run: its text and its raw byte span within a container part. */
export interface DocxRun {
	/** The container part this run belongs to (e.g. `word/document.xml`, a
	 * header, or a footer) — matches the `part` on a detection's `SourceRef`. */
	part: string;
	/** Ordinal in parse order (document.xml first, then aux parts). */
	index: number;
	/** The run's decoded text (XML entities resolved). */
	text: string;
	/** Byte offset in the part where the run's text content begins. */
	byteStart: number;
	/** Byte offset (exclusive) where the run's text content ends. */
	byteEnd: number;
}

/**
 * DOCX parts that render as visible page text (so their runs can be highlighted
 * and their entities are locatable): the main document body, plus headers,
 * footers, and foot/endnotes. Other parts (`.rels`, styles, metadata) are not
 * visible body text. `word/document.xml` is the common case.
 */
export function isRenderedDocxPart(part: string | undefined): boolean {
	if (!part) return true; // no part = single-file source = the document body
	return (
		part === "word/document.xml" ||
		/^word\/(header\d*|footer\d*|footnotes|endnotes)\.xml$/.test(part)
	);
}

/**
 * The kind of rendered region a DOCX part belongs to. docx-preview renders each
 * kind into a distinct DOM container (headers into `<header>`, footers into
 * `<footer>`, foot/endnotes into `<li>`, the body into neither), so grouping
 * runs by category lets alignment restrict a text node to runs from the same
 * region — without that, identical text in a header and the body could map to
 * the wrong part. A single-file source (no part) is the body.
 */
export type DocxPartCategory = "body" | "header" | "footer" | "note";

export function docxPartCategory(part: string | undefined): DocxPartCategory {
	if (!part) return "body";
	if (/^word\/header\d*\.xml$/.test(part)) return "header";
	if (/^word\/footer\d*\.xml$/.test(part)) return "footer";
	if (/^word\/(footnotes|endnotes)\.xml$/.test(part)) return "note";
	return "body";
}

const XML_ENTITIES: Record<string, string> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
};

/** Resolve XML character references in a `<w:t>` body to their characters. */
function decodeXmlEntities(raw: string): string {
	return raw.replace(
		/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g,
		(whole, body: string) => {
			if (body[0] === "#") {
				const code =
					body[1] === "x" || body[1] === "X"
						? Number.parseInt(body.slice(2), 16)
						: Number.parseInt(body.slice(1), 10);
				// Keep the raw text for a malformed or out-of-range code point
				// (> U+10FFFF), which would otherwise throw a RangeError.
				if (Number.isNaN(code) || code < 0 || code > 0x10ffff) return whole;
				return String.fromCodePoint(code);
			}
			return XML_ENTITIES[body] ?? whole;
		},
	);
}

/**
 * Parse one part's XML into ordered `<w:t>` runs with byte spans. Byte offsets
 * are into the part's UTF-8 source (what `SourceRef.range` indexes); the text is
 * UTF-16 with entities decoded. `startIndex` continues the ordinal across parts.
 */
function parsePartRuns(
	part: string,
	xml: string,
	startIndex: number,
): DocxRun[] {
	const runs: DocxRun[] = [];
	const encoder = new TextEncoder();
	// Quote-aware opening tag so a literal `>` inside an attribute value doesn't
	// end the tag early (which would corrupt the run's byte offsets). Group 1 is
	// the whole opening tag; group 2 is the run text.
	const re = /(<w:t\b(?:[^"'<>]|"[^"]*"|'[^']*')*>)([\s\S]*?)<\/w:t>/g;
	let match: RegExpExecArray | null;
	let index = startIndex;
	// Walk a char cursor and its byte offset together, encoding only the delta
	// from the previous position to this run — matches come in document order, so
	// the cursor only advances. This keeps parsing O(n), not O(n²).
	let charCursor = 0;
	let byteCursor = 0;
	// biome-ignore lint/suspicious/noAssignInExpressions: canonical regex-exec loop
	while ((match = re.exec(xml)) !== null) {
		const inner = match[2] ?? "";
		const innerCharStart = match.index + (match[1] ?? "").length;
		byteCursor += encoder.encode(xml.slice(charCursor, innerCharStart)).length;
		charCursor = innerCharStart;
		const byteStart = byteCursor;
		byteCursor += encoder.encode(inner).length;
		charCursor = innerCharStart + inner.length;
		runs.push({
			part,
			index: index++,
			text: decodeXmlEntities(inner),
			byteStart,
			byteEnd: byteCursor,
		});
	}
	return runs;
}

/**
 * Parse a DOCX's rendered parts into ordered `<w:t>` runs, each tagged with its
 * container part. Only parts that render as visible page text are parsed (see
 * {@link isRenderedDocxPart}), so header/footer/footnote entities can be
 * highlighted too — not just the main body. `parts` maps a part name to its XML.
 */
export function parseDocxParts(parts: Map<string, string>): DocxRun[] {
	const runs: DocxRun[] = [];
	// document.xml first (the common case), then the rest in name order for a
	// stable, deterministic run ordinal sequence.
	const names = [...parts.keys()]
		.filter(isRenderedDocxPart)
		.sort((a, b) =>
			a === "word/document.xml"
				? -1
				: b === "word/document.xml"
					? 1
					: a.localeCompare(b),
		);
	for (const name of names) {
		const xml = parts.get(name);
		if (xml) runs.push(...parsePartRuns(name, xml, runs.length));
	}
	return runs;
}

/** A resolved highlight: which rendered run, and the char range within it. */
export interface DocxRunSpan {
	/** Ordinal of the run to highlight. */
	runIndex: number;
	/** Char offset within the run's text where the highlight starts. */
	charStart: number;
	/** Char offset within the run's text where the highlight ends. */
	charEnd: number;
}

/**
 * Resolve a raw-source byte range (from a `SourceRef`) within a given part to
 * the run span(s) it covers. A range usually lands in one run; a span that the
 * backend fused across runs is returned as several. Byte offsets outside any
 * run's text (or in another part) are skipped. Char offsets are into the run's
 * *decoded* text. A missing `part` matches the main document body.
 */
export function resolveDocxSpan(
	runs: DocxRun[],
	part: string | undefined,
	byteStart: number,
	byteEnd: number,
): DocxRunSpan[] {
	const wanted = part ?? "word/document.xml";
	const out: DocxRunSpan[] = [];
	for (const run of runs) {
		if (run.part !== wanted) continue;
		if (run.byteEnd <= byteStart || run.byteStart >= byteEnd) continue;
		// Overlap of [byteStart, byteEnd) with this run's byte span.
		const from = Math.max(byteStart, run.byteStart);
		const to = Math.min(byteEnd, run.byteEnd);
		// Byte offsets within the run -> char offsets in its decoded text. The run
		// text is decoded, but entity-free runs (the common case) are 1:1 for
		// ASCII; convert precisely so multi-byte and entity runs still land.
		const charStart = runByteToChar(run, from - run.byteStart);
		const charEnd = runByteToChar(run, to - run.byteStart);
		if (charEnd > charStart) {
			out.push({ runIndex: run.index, charStart, charEnd });
		}
	}
	return out;
}

/**
 * Reconstruct an entity's matched text from its raw-source byte ranges by
 * slicing the raw bytes of each ref's container part. Works for any part (the
 * main `document.xml`, but also `.rels` hyperlink targets and other metadata),
 * so a detection outside the visible body still shows its value. Ranges are
 * concatenated in order. Returns "" when no part bytes are available.
 *
 * `parts` maps a part name to its raw bytes; a ref with no `part` falls back to
 * `document.xml`. Byte offsets are UTF-8; the slice is decoded to a string.
 */
export function docxMatchedText(
	parts: Map<string, Uint8Array>,
	refs: DocxSourceRef[],
): string {
	const decoder = new TextDecoder();
	let out = "";
	for (const ref of refs) {
		const bytes = parts.get(ref.part ?? "word/document.xml");
		if (!bytes) continue;
		out += decoder.decode(bytes.subarray(ref.start, ref.end));
	}
	return out;
}

/**
 * Convert a char offset within a run's decoded text to a byte offset within the
 * run's *raw* `<w:t>` bytes — the inverse of {@link runByteToChar}, for turning a
 * reviewer's selection (a char position in the rendered run) into a raw source
 * byte position. For entity-free runs (the common case) raw and decoded text
 * coincide, so this is the standard UTF-16 char -> UTF-8 byte conversion. A run
 * carrying `&amp;`-style entities is atomic in the source model, so a selection
 * boundary inside such a run is snapped to the nearest run edge.
 */
function runCharToByte(run: DocxRun, charInRun: number): number {
	const rawLen = run.byteEnd - run.byteStart;
	if (charInRun <= 0) return 0;
	if (charInRun >= run.text.length) return rawLen;
	const encoder = new TextEncoder();
	// A run with entities decodes shorter than its raw bytes; a mid-run char
	// offset can't be mapped precisely (the SourceRef model treats `&amp;` as
	// atomic), so snap such a run to its full raw span rather than drift.
	if (encoder.encode(run.text).length !== rawLen) {
		return charInRun >= run.text.length / 2 ? rawLen : 0;
	}
	// Entity-free: exact UTF-16 char prefix -> UTF-8 byte length.
	return encoder.encode(run.text.slice(0, charInRun)).length;
}

/**
 * A raw-source byte span within a container part, resolved from a reviewer's
 * selection over the rendered runs — the coordinate a DOCX "add entity" edit
 * carries (`TextLocation.source`). All runs of a single selection lie in one
 * part; a selection spanning parts (or matching no run) yields null.
 */
export interface DocxByteSpan {
	part: string;
	start: number;
	end: number;
}

/**
 * Resolve a selection — a start run + char offset and an end run + char offset,
 * as located against the parsed runs — to a raw-source byte span in the runs'
 * shared part. The endpoints must sit in the same part (a selection can't cross
 * container boundaries meaningfully); returns null otherwise. The span runs from
 * the start endpoint's raw byte to the end endpoint's raw byte, so it also covers
 * the inter-run source bytes (tags, other runs) between them — exactly the raw
 * range the redaction engine overwrites.
 */
export function resolveDocxSelection(
	startRun: DocxRun,
	startChar: number,
	endRun: DocxRun,
	endChar: number,
): DocxByteSpan | null {
	if (startRun.part !== endRun.part) return null;
	const start = startRun.byteStart + runCharToByte(startRun, startChar);
	const end = endRun.byteStart + runCharToByte(endRun, endChar);
	if (end <= start) return null;
	return { part: startRun.part, start, end };
}

/**
 * Convert a byte offset within a run's *raw* `<w:t>` bytes to a char offset in
 * its decoded text. For entity-free runs the raw and decoded text coincide, so
 * this is the standard UTF-8 byte -> UTF-16 char conversion. Runs containing
 * `&amp;`-style entities are atomic in the source model (a SourceRef covers the
 * whole `&amp;`), so a boundary never falls inside one; we clamp to run edges.
 */
function runByteToChar(run: DocxRun, byteInRun: number): number {
	if (byteInRun <= 0) return 0;
	const encoder = new TextEncoder();
	const rawLen = run.byteEnd - run.byteStart;
	if (byteInRun >= rawLen) return run.text.length;
	// Walk decoded chars, accumulating their raw byte width. Without entities the
	// decoded text equals the raw text, so this is exact; with entities it is a
	// safe approximation that never over-runs the run (clamped above).
	let bytes = 0;
	for (let i = 0; i < run.text.length; i++) {
		const codePoint = run.text.codePointAt(i)!;
		bytes += encoder.encode(String.fromCodePoint(codePoint)).length;
		if (codePoint > 0xffff) i++;
		if (bytes >= byteInRun) return i + 1;
	}
	return run.text.length;
}
