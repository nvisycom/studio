import { type FormattedText, type Token, identity } from "./shared";

const isWhitespace = (ch: string) =>
	ch === " " || ch === "\t" || ch === "\n" || ch === "\r";

/** Length of the escape sequence at `s[i]` (which must be a backslash): 6 for
 * `\uXXXX`, 2 for every other (`\"`, `\n`, `\\`, …). */
function escapeLength(s: string, i: number): number {
	return s[i + 1] === "u" ? 6 : 2;
}

/** Whether `ch` can start a JSON number literal (a digit or a leading minus). */
const startsNumber = (ch: string) => ch === "-" || (ch >= "0" && ch <= "9");
/** Whether `ch` can appear inside a JSON number literal. */
const isNumberChar = (ch: string) =>
	(ch >= "0" && ch <= "9") ||
	ch === "-" ||
	ch === "+" ||
	ch === "." ||
	ch === "e" ||
	ch === "E";

/** Length of the number literal starting at `s[i]` (which must start one). */
function numberLength(s: string, i: number): number {
	let j = i;
	while (j < s.length && isNumberChar(s[j]!)) j++;
	return j - i;
}

/**
 * Build the raw→formatted char-index map by walking both JSON strings in
 * lockstep. They encode the same value in the same order, differing only in
 * (a) whitespace *between* tokens and (b) how string contents are escaped —
 * `JSON.stringify` resolves `\uXXXX`/`\/` (e.g. `A`→`A`, `\/`→`/`) but
 * preserves `\"`, `\\`, `\n`, … as-is. So a whitespace-only {@link buildMap}
 * drifts on escapes; instead, pair one logical character from each side at a
 * time — an escape sequence on the raw side pairs with its formatted
 * counterpart (an escape or a single char), whatever their differing lengths.
 */
function buildJsonMap(raw: string, formatted: string): number[] {
	const map: number[] = new Array(raw.length + 1);
	let r = 0;
	let f = 0;
	let inString = false;
	while (r < raw.length) {
		// Between tokens, each side has its own whitespace — advance independently.
		if (!inString) {
			if (isWhitespace(raw[r]!)) {
				while (f < formatted.length && isWhitespace(formatted[f]!)) f++;
				map[r] = f;
				r++;
				continue;
			}
			while (f < formatted.length && isWhitespace(formatted[f]!)) f++;
			// A number is canonicalized by JSON.stringify (1.0 -> 1, 1e3 -> 1000), so
			// its raw and formatted lengths differ and a char walk would drift after
			// it. Pair the whole literal atomically — mapping every raw number char to
			// the formatted number's start — so following offsets realign. (An entity
			// span never begins mid-number, so a coarse map inside is fine.)
			if (startsNumber(raw[r]!)) {
				const rl = numberLength(raw, r);
				// A non-finite value (e.g. `1e999`) stringifies to `null`, not a number
				// literal, so its formatted token has no number chars — advance past the
				// 4-char `null` instead of stalling f (which would drift the rest).
				const fl = startsNumber(formatted[f]!) ? numberLength(formatted, f) : 4;
				for (let k = 0; k < rl; k++) map[r + k] = f;
				r += rl;
				f += fl;
				continue;
			}
		}
		if (raw[r] === '"') {
			inString = !inString;
			map[r] = f;
			r++;
			f++;
			continue;
		}
		if (inString && raw[r] === "\\") {
			// One escaped char: consume the raw escape and its formatted form (which
			// may be a shorter/longer escape or a single resolved char).
			const rl = escapeLength(raw, r);
			const fl = formatted[f] === "\\" ? escapeLength(formatted, f) : 1;
			for (let k = 0; k < rl; k++) map[r + k] = f;
			r += rl;
			f += fl;
			continue;
		}
		map[r] = f;
		r++;
		f++;
	}
	while (f < formatted.length && isWhitespace(formatted[f]!)) f++;
	map[raw.length] = formatted.length; // end sentinel
	return map;
}

/**
 * Pretty-print JSON with 2-space indentation. Falls back to the raw text
 * (identity map) when it doesn't parse, so a malformed file still shows.
 *
 * The raw→formatted char map ({@link buildJsonMap}) accounts for both the
 * whitespace reflow and JSON's escape re-encoding, so highlight/add-entity
 * offsets stay correct even when the source uses `\uXXXX` / `\"` / `\n` escapes
 * that differ from the shown text.
 */
export function formatJson(raw: string): FormattedText {
	let formatted: string;
	try {
		formatted = JSON.stringify(JSON.parse(raw), null, 2);
	} catch {
		return identity(raw);
	}
	return { text: formatted, map: buildJsonMap(raw, formatted) };
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
