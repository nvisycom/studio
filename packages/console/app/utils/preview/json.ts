import { type FormattedText, type Token, buildMap, identity } from "./shared";

const ESCAPES: Record<string, string> = {
	'"': '"',
	"\\": "\\",
	"/": "/",
	b: "\b",
	f: "\f",
	n: "\n",
	r: "\r",
	t: "\t",
};

/**
 * Decode the JSON escape sequences inside string literals, tracking where each
 * raw char index moves to in the decoded text. Prettifying alone only reflows
 * whitespace, but `JSON.parse` also *collapses* escapes (`\uXXXX` → one char,
 * `\n` → newline), so the raw→formatted map has to account for that shift — the
 * whitespace-only {@link buildMap} can't. This yields the raw→decoded step; the
 * decoded text then differs from the formatted text only in whitespace.
 *
 * Only string *contents* are decoded; structural characters pass through. A
 * surrogate pair written as two `\uXXXX` escapes decodes to two UTF-16 units,
 * which is exactly how JS strings hold it, so indices stay consistent.
 */
function decodeJsonStrings(raw: string): { decoded: string; map: number[] } {
	const out: string[] = [];
	const map: number[] = new Array(raw.length + 1);
	let d = 0;
	let i = 0;
	let inString = false;
	while (i < raw.length) {
		const ch = raw[i]!;
		if (ch === '"') {
			inString = !inString;
			map[i] = d;
			out.push(ch);
			d++;
			i++;
			continue;
		}
		if (inString && ch === "\\") {
			const next = raw[i + 1];
			if (next === "u") {
				const decoded = String.fromCharCode(
					Number.parseInt(raw.slice(i + 2, i + 6), 16),
				);
				for (let k = 0; k < 6; k++) map[i + k] = d;
				out.push(decoded);
				d += decoded.length;
				i += 6;
				continue;
			}
			const decoded = ESCAPES[next ?? ""] ?? next ?? "";
			map[i] = d;
			map[i + 1] = d;
			out.push(decoded);
			d++;
			i += 2;
			continue;
		}
		map[i] = d;
		out.push(ch);
		d++;
		i++;
	}
	map[raw.length] = d; // end sentinel
	return { decoded: out.join(""), map };
}

/**
 * Pretty-print JSON with 2-space indentation. Falls back to the raw text
 * (identity map) when it doesn't parse, so a malformed file still shows.
 *
 * The raw→formatted char map composes two steps: raw→decoded (escapes collapse,
 * {@link decodeJsonStrings}) then decoded→formatted (whitespace reflow only,
 * {@link buildMap}) — so highlight/add-entity offsets are correct even when the
 * source uses `\uXXXX` / `\"` escapes that differ from the shown text.
 */
export function formatJson(raw: string): FormattedText {
	let formatted: string;
	try {
		formatted = JSON.stringify(JSON.parse(raw), null, 2);
	} catch {
		return identity(raw);
	}
	const { decoded, map: rawToDecoded } = decodeJsonStrings(raw);
	const decodedToFormatted = buildMap(decoded, formatted);
	// Compose: raw char → decoded char → formatted char.
	const map = rawToDecoded.map(
		(d) => decodedToFormatted[d] ?? formatted.length,
	);
	return { text: formatted, map };
}

/**
 * Tokenize pretty-printed JSON into positioned color spans. Purpose-built for
 * our preview: it needs token *positions* (to reconcile with entity highlight
 * spans), which off-the-shelf highlighters that emit finished HTML don't give.
 * JSON's grammar is tiny, so this stays a few lines and adds no dependency.
 *
 * Only meaningful tokens (strings, numbers, keywords) are emitted; punctuation
 * and whitespace are left as gaps the caller renders in the base color. A
 * string is classed `key` when the next non-space char is a colon.
 */
export function tokenizeJson(text: string): Token[] {
	const tokens: Token[] = [];
	let i = 0;
	while (i < text.length) {
		const ch = text[i]!;
		if (ch === '"') {
			// Consume the string, honoring backslash escapes.
			const start = i;
			i++;
			while (i < text.length) {
				if (text[i] === "\\") i += 2;
				else if (text[i] === '"') {
					i++;
					break;
				} else i++;
			}
			// Key if the next non-space character is a colon.
			let j = i;
			while (j < text.length && (text[j] === " " || text[j] === "\n")) j++;
			tokens.push({ start, end: i, kind: text[j] === ":" ? "key" : "string" });
		} else if (ch === "-" || (ch >= "0" && ch <= "9")) {
			const start = i;
			i++;
			while (i < text.length && /[0-9eE+.-]/.test(text[i]!)) i++;
			tokens.push({ start, end: i, kind: "number" });
		} else if (text.startsWith("true", i) || text.startsWith("null", i)) {
			tokens.push({ start: i, end: i + 4, kind: "keyword" });
			i += 4;
		} else if (text.startsWith("false", i)) {
			tokens.push({ start: i, end: i + 5, kind: "keyword" });
			i += 5;
		} else {
			i++; // punctuation / whitespace — rendered in the base color
		}
	}
	return tokens;
}
