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
 * Both direction maps between a JSON file's raw text and its prettified form,
 * built in one lockstep walk. They encode the same value in the same order,
 * differing only in (a) whitespace *between* tokens, (b) how string contents are
 * escaped — `JSON.stringify` resolves `\uXXXX`/`\/` (e.g. `A`→`A`, `\/`→`/`) but
 * preserves `\"`, `\\`, `\n`, … — and (c) canonicalized numbers (`1e3`→`1000`,
 * `1.0`→`1`, `1e999`→`null`), whose length changes. So a whitespace-only
 * {@link buildMap} drifts on (b)/(c); instead, pair one logical token from each
 * side at a time, whatever their differing lengths.
 *
 * - `map[rawIndex]` → formatted index (highlighting raw entity spans).
 * - `inverse[formattedIndex]` → raw index (turning a formatted-text selection
 *   back into a raw offset). A canonicalized number is atomic in both maps: its
 *   raw chars all point at the formatted token start, and every formatted char of
 *   the token points back at the raw token *start* — so a selection boundary
 *   inside it snaps to the token's raw start, never a stray inner char (which a
 *   naive inversion of `map` would pick, since several raw chars collapse there).
 */
function buildJsonMaps(
	raw: string,
	formatted: string,
): { map: number[]; inverse: number[] } {
	const map: number[] = new Array(raw.length + 1);
	const inverse: number[] = new Array(formatted.length + 1);
	// Fill inverse[from, to) with a single raw index (a token whose formatted span
	// maps back to one raw position — a number token, or padding whitespace).
	const fillInverse = (from: number, to: number, rawIndex: number) => {
		for (let k = from; k < to; k++) inverse[k] = rawIndex;
	};
	let r = 0;
	let f = 0;
	let inString = false;
	while (r < raw.length) {
		// Between tokens, each side has its own whitespace — advance independently.
		if (!inString) {
			if (isWhitespace(raw[r]!)) {
				const fromF = f;
				while (f < formatted.length && isWhitespace(formatted[f]!)) f++;
				map[r] = f;
				// Any formatted whitespace consumed here belongs to this raw ws char.
				fillInverse(fromF, f, r);
				r++;
				continue;
			}
			const fromF = f;
			while (f < formatted.length && isWhitespace(formatted[f]!)) f++;
			// Formatted indentation before a token maps back to the token's raw start.
			fillInverse(fromF, f, r);
			// A number is canonicalized by JSON.stringify (1.0 -> 1, 1e3 -> 1000), so
			// its raw and formatted lengths differ and a char walk would drift after
			// it. Pair the whole literal atomically — every raw number char -> the
			// formatted number's start, and every formatted number char -> the raw
			// number's start — so a boundary inside it snaps to the raw token start.
			if (startsNumber(raw[r]!)) {
				const rl = numberLength(raw, r);
				// A non-finite value (e.g. `1e999`) stringifies to `null`, not a number
				// literal, so its formatted token has no number chars — advance past the
				// 4-char `null` instead of stalling f (which would drift the rest).
				const fl = startsNumber(formatted[f]!) ? numberLength(formatted, f) : 4;
				for (let k = 0; k < rl; k++) map[r + k] = f;
				fillInverse(f, f + fl, r);
				r += rl;
				f += fl;
				continue;
			}
		}
		if (raw[r] === '"') {
			inString = !inString;
			map[r] = f;
			inverse[f] = r;
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
			fillInverse(f, f + fl, r);
			r += rl;
			f += fl;
			continue;
		}
		map[r] = f;
		inverse[f] = r;
		r++;
		f++;
	}
	// Trailing formatted whitespace + both end sentinels point past the raw end.
	while (f < formatted.length) inverse[f++] = raw.length;
	inverse[formatted.length] = raw.length;
	map[raw.length] = formatted.length;
	return { map, inverse };
}

/**
 * Pretty-print JSON with 2-space indentation. Falls back to the raw text
 * (identity map) when it doesn't parse, so a malformed file still shows.
 *
 * The direction maps ({@link buildJsonMaps}) account for the whitespace reflow,
 * JSON's escape re-encoding, and number canonicalization, so highlight offsets
 * (raw → formatted) and add-entity selections (formatted → raw) both stay correct
 * even when the source uses `\uXXXX` / `\"` / `\n` escapes or numbers like `1e3`
 * that differ from the shown text.
 */
export function formatJson(raw: string): FormattedText {
	let formatted: string;
	try {
		formatted = JSON.stringify(JSON.parse(raw), null, 2);
	} catch {
		return identity(raw);
	}
	const { map, inverse } = buildJsonMaps(raw, formatted);
	return { text: formatted, map, inverseMap: inverse };
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
