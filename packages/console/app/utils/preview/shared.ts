/**
 * Shared types + helpers for the studio structured-text preview.
 *
 * JSON and CSV are prettified for reading, but detected entities are byte
 * offsets into the *raw* file text — so a formatter must also report how raw
 * character positions move to their formatted positions, letting the caller
 * remap highlight spans onto the prettified text.
 *
 * The mapping trick avoids per-token bookkeeping: prettifying only ever
 * rearranges whitespace *between* tokens, never the non-whitespace characters
 * themselves, and keeps them in the same order. Walking both strings and
 * pairing up their non-whitespace characters yields an exact raw → formatted
 * char map. (A transform that changes non-whitespace — e.g. CSV column
 * alignment, which drops commas — can't use this and must stay identity.)
 */

/** A formatted string plus a raw-char-index → formatted-char-index map. */
export interface FormattedText {
	text: string;
	/**
	 * `map[rawCharIndex]` = the char index in `text`, for every raw char index
	 * from 0 to raw length inclusive (the final entry is the end sentinel). Undo
	 * of formatting is not needed — callers only map raw → formatted.
	 */
	map: number[];
}

/** Syntax-token kinds for restrained JSON coloring. */
export type TokenKind = "key" | "string" | "number" | "keyword" | "punctuation";

/** A colored run over the formatted text: [start, end) with a token kind. */
export interface Token {
	start: number;
	end: number;
	kind: TokenKind;
}

const isWhitespace = (ch: string) =>
	ch === " " || ch === "\t" || ch === "\n" || ch === "\r";

/**
 * Build the raw → formatted char-index map by pairing non-whitespace characters
 * in order. Only valid when the transform is whitespace-only (see module note).
 */
export function buildMap(raw: string, formatted: string): number[] {
	const map: number[] = new Array(raw.length + 1);
	let f = 0;
	for (let r = 0; r < raw.length; r++) {
		if (isWhitespace(raw[r]!)) {
			// Raw whitespace has no fixed counterpart; point it at the current
			// formatted cursor (start of the next non-whitespace run).
			while (f < formatted.length && isWhitespace(formatted[f]!)) f++;
			map[r] = f;
			continue;
		}
		// Advance past any inserted formatted whitespace, then pair the chars.
		while (f < formatted.length && isWhitespace(formatted[f]!)) f++;
		map[r] = f;
		f++;
	}
	while (f < formatted.length && isWhitespace(formatted[f]!)) f++;
	map[raw.length] = formatted.length; // end sentinel
	return map;
}

/** Identity mapping — the text is shown unchanged. */
export function identity(text: string): FormattedText {
	const map: number[] = new Array(text.length + 1);
	for (let i = 0; i <= text.length; i++) map[i] = i;
	return { text, map };
}

const encoder = new TextEncoder();

/**
 * Convert a UTF-8 *byte* offset within `text` to a UTF-16 char index (what
 * `String.prototype.slice` needs). Detected entity offsets are byte positions;
 * JS strings are UTF-16, so a byte offset only equals a char index for ASCII.
 * Clamps out-of-range offsets to the string's char length.
 */
export function byteOffsetToChar(text: string, byteOffset: number): number {
	if (byteOffset <= 0) return 0;
	let bytes = 0;
	for (let i = 0; i < text.length; i++) {
		const codePoint = text.codePointAt(i)!;
		bytes += encoder.encode(String.fromCodePoint(codePoint)).length;
		if (codePoint > 0xffff) i++; // surrogate pair spans two UTF-16 units
		if (bytes >= byteOffset) return i + 1;
	}
	return text.length;
}
