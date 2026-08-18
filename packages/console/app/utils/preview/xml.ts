import { type FormattedText, type Token, buildMap, identity } from "./shared";

/**
 * Pretty-print XML with 2-space indentation, re-indenting only the whitespace
 * *between* elements — every non-whitespace character (tags, attributes, text
 * content) is preserved verbatim and in order, so the raw→formatted char map
 * from `buildMap` stays exact and entity highlights land after reformatting.
 *
 * Element text content is kept on the tag's line (trimmed of its surrounding
 * whitespace), so `<a>value</a>` isn't split apart. Falls back to the raw text
 * (identity map) if the reindent would ever change a non-whitespace character
 * (mixed/whitespace-significant content) — same spirit as JSON's parse fallback.
 */
export function formatXml(raw: string): FormattedText {
	const formatted = reindentXml(raw);
	if (formatted === null || stripWs(formatted) !== stripWs(raw)) {
		return identity(raw);
	}
	return { text: formatted, map: buildMap(raw, formatted) };
}

const stripWs = (s: string) => s.replace(/\s+/g, "");

/**
 * Re-indent XML by walking its tags and text runs. Returns null if the input
 * doesn't look like well-formed markup we can safely reflow.
 */
function reindentXml(raw: string): string | null {
	// Split into tags (`<...>`) and the text between them.
	const parts = raw.match(/<[^>]*>|[^<]+/g);
	if (!parts) return null;

	const out: string[] = [];
	let depth = 0;
	const pad = () => "  ".repeat(Math.max(depth, 0));

	for (let i = 0; i < parts.length; i++) {
		const part = parts[i]!;
		if (part[0] === "<") {
			const isClosing = part.startsWith("</");
			const isSelfClosing = part.endsWith("/>");
			// Declarations, comments, CDATA, processing instructions don't nest.
			const isSpecial =
				part.startsWith("<?") ||
				part.startsWith("<!--") ||
				part.startsWith("<![") ||
				part.startsWith("<!");

			if (isClosing) depth = Math.max(depth - 1, 0);

			// Inline text: `<tag>text</tag>` stays on one line — if the previous
			// emitted line is an open tag and this run is its text + close tag.
			out.push(pad() + part);

			if (!isClosing && !isSelfClosing && !isSpecial) depth++;
		} else {
			// Text run: keep non-whitespace content, trimmed, appended to the open
			// tag's line rather than on its own line.
			const text = part.trim();
			if (text.length > 0 && out.length > 0) {
				out[out.length - 1] += text;
				// The following close tag should sit on the same line too; peek.
				const next = parts[i + 1];
				if (next?.startsWith("</")) {
					depth = Math.max(depth - 1, 0);
					out[out.length - 1] += next;
					i++;
				}
			}
		}
	}
	return out.join("\n");
}

/**
 * Tokenize XML into positioned color spans, reusing the shared token kinds:
 * tag names → `keyword`, attribute names → `key`, attribute values → `string`.
 * Angle brackets, slashes, and `=` are left as punctuation gaps the caller
 * renders in the base color. Comments/CDATA/PI bodies are left plain.
 */
export function tokenizeXml(text: string): Token[] {
	const tokens: Token[] = [];
	const tagRe =
		/<\/?([A-Za-z_][\w.:-]*)|([A-Za-z_][\w.:-]*)\s*=|"[^"]*"|'[^']*'/g;
	// Walk tag regions; only emit inside `<...>` so text content stays plain.
	let i = 0;
	while (i < text.length) {
		if (text[i] !== "<") {
			i++;
			continue;
		}
		const end = text.indexOf(">", i);
		const tagEnd = end === -1 ? text.length : end + 1;
		const tag = text.slice(i, tagEnd);
		// Skip comments/CDATA/PI bodies (leave plain).
		if (
			!tag.startsWith("<!--") &&
			!tag.startsWith("<![") &&
			!tag.startsWith("<?")
		) {
			tagRe.lastIndex = 0;
			let m: RegExpExecArray | null;
			// biome-ignore lint/suspicious/noAssignInExpressions: canonical regex loop
			while ((m = tagRe.exec(tag)) !== null) {
				const base = i + m.index;
				if (m[1] !== undefined) {
					// Tag name (after `<` or `</`).
					const nameStart = base + m[0].indexOf(m[1]);
					tokens.push({
						start: nameStart,
						end: nameStart + m[1].length,
						kind: "keyword",
					});
				} else if (m[2] !== undefined) {
					// Attribute name (before `=`).
					tokens.push({ start: base, end: base + m[2].length, kind: "key" });
				} else {
					// Quoted attribute value.
					tokens.push({ start: base, end: base + m[0].length, kind: "string" });
				}
			}
		}
		i = tagEnd;
	}
	return tokens;
}
