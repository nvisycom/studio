/**
 * Client-side mapping from a detection's raw-source byte span (a `SourceRef`
 * into `word/document.xml`) to the rendered DOCX run it belongs to.
 *
 * docx-preview renders each `<w:r>` run as a `<span>` in document order but
 * drops the run's raw byte position, so highlighting can't work off the DOM
 * text alone (tabs, symbols, footnotes inject synthetic text that desyncs a
 * character walk). Instead we parse `document.xml` ourselves into ordered
 * `<w:t>` runs with their byte spans, stamp each rendered run with its ordinal,
 * and resolve a SourceRef byte range to (run ordinal, char range in that run).
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

/** One `<w:t>` run: its text and its raw byte span in `document.xml`. */
export interface DocxRun {
	/** Ordinal in document order (matches the rendered run's stamped index). */
	index: number;
	/** The run's decoded text (XML entities resolved). */
	text: string;
	/** Byte offset in `document.xml` where the run's text content begins. */
	byteStart: number;
	/** Byte offset (exclusive) where the run's text content ends. */
	byteEnd: number;
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
				return Number.isNaN(code) ? whole : String.fromCodePoint(code);
			}
			return XML_ENTITIES[body] ?? whole;
		},
	);
}

/**
 * Parse `document.xml` into ordered `<w:t>` runs with byte spans. Byte offsets
 * are into the UTF-8 source (what `SourceRef.range` indexes); the text is UTF-16
 * with entities decoded. Runs come out in document order, matching the render.
 */
export function parseDocxRuns(xml: string): DocxRun[] {
	const runs: DocxRun[] = [];
	const encoder = new TextEncoder();
	// Byte offset of the start of `xml.slice(0, charIndex)` — computed lazily as
	// we advance, so we never re-encode the whole prefix per run.
	const re = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
	let match: RegExpExecArray | null;
	let index = 0;
	// biome-ignore lint/suspicious/noAssignInExpressions: canonical regex-exec loop
	while ((match = re.exec(xml)) !== null) {
		const inner = match[1] ?? "";
		const innerCharStart = match.index + match[0].indexOf(">") + 1;
		const innerCharEnd = innerCharStart + inner.length;
		const byteStart = encoder.encode(xml.slice(0, innerCharStart)).length;
		const byteEnd = byteStart + encoder.encode(inner).length;
		runs.push({
			index: index++,
			text: decodeXmlEntities(inner),
			byteStart,
			byteEnd,
		});
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
 * Resolve a raw-source byte range (from a `SourceRef` into `document.xml`) to
 * the run span(s) it covers. A range usually lands in one run; a span that the
 * backend fused across runs is returned as several. Byte offsets outside any
 * run's text are skipped. Char offsets are into the run's *decoded* text.
 */
export function resolveDocxSpan(
	runs: DocxRun[],
	byteStart: number,
	byteEnd: number,
): DocxRunSpan[] {
	const out: DocxRunSpan[] = [];
	for (const run of runs) {
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
