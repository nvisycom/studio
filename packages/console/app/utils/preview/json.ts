import { type FormattedText, type Token, buildMap, identity } from "./shared";

/**
 * Pretty-print JSON with 2-space indentation. Falls back to the raw text
 * (identity map) when it doesn't parse, so a malformed file still shows.
 */
export function formatJson(raw: string): FormattedText {
	let formatted: string;
	try {
		formatted = JSON.stringify(JSON.parse(raw), null, 2);
	} catch {
		return identity(raw);
	}
	return { text: formatted, map: buildMap(raw, formatted) };
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
