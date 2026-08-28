import type { MaybeRefOrGetter } from "vue";
import type { TextEntityView } from "#console/composables/useTextEntities";
import {
	type FormattedText,
	type ParsedCsv,
	type Token,
	type TokenKind,
	formatCsv,
	formatJson,
	formatXml,
	parseCsv,
	resolveTabularSpan,
	tokenizeCsv,
	tokenizeJson,
	tokenizeXml,
} from "#console/utils/preview";

/** A rendered run of text carrying its syntax color and any entity overlay. */
export interface Segment {
	text: string;
	kind: TokenKind | null;
	entity: TextEntityView | null;
	/**
	 * Char offset of this segment's first character in the formatted text. For
	 * unformatted files (plain text) the formatted text equals the raw file, so
	 * this doubles as a document char offset — the basis for turning a reviewer's
	 * text selection into a byte-offset span.
	 */
	start: number;
}

/**
 * Turn a text file's raw content + detected entities into the data the studio
 * preview renders: the prettified text, per-line runs coloured by syntax and
 * flagged by entity, plus the parsed CSV grid.
 *
 * This owns the offset-heavy pipeline (formatting, byte→char mapping, span
 * reconciliation) so the component stays about view state. Extension drives the
 * behaviour: `json`/`xml` prettify + colour, `csv` parses to a grid, others
 * pass through as plain highlighted text.
 */
export function useDocumentSegments(inputs: {
	text: MaybeRefOrGetter<string | null>;
	entities: MaybeRefOrGetter<TextEntityView[]>;
	fileKind: MaybeRefOrGetter<string>;
}) {
	const rawText = computed(() => toValue(inputs.text));
	const entities = computed(() => toValue(inputs.entities));
	const fileKind = computed(() => toValue(inputs.fileKind));

	// Structured text (JSON/CSV) is prettified for reading. The formatter also
	// returns a raw-char → formatted-char map so entity highlights (offsets into
	// the RAW text) still land after reformatting; others pass through (identity).
	const formatted = computed<FormattedText>(() => {
		const text = rawText.value ?? "";
		switch (fileKind.value) {
			case "json":
				return formatJson(text);
			case "xml":
				return formatXml(text);
			case "csv":
				return formatCsv(text);
			default:
				return { text, map: [] };
		}
	});

	// Syntax-color tokens over the formatted text (JSON + XML + CSV).
	const tokens = computed<Token[]>(() => {
		switch (fileKind.value) {
			case "json":
				return tokenizeJson(formatted.value.text);
			case "xml":
				return tokenizeXml(formatted.value.text);
			case "csv":
				return tokenizeCsv(formatted.value.text);
			default:
				return [];
		}
	});

	// Parsed CSV (grid + per-cell flat ranges), for placing tabular entities.
	const parsedCsv = computed<ParsedCsv | null>(() =>
		fileKind.value === "csv" ? parseCsv(formatted.value.text) : null,
	);

	// Entity offsets are UTF-8 *byte* positions; JS strings are UTF-16. Build a
	// byte→char-index map over the RAW text so spans resolve to the right code
	// units before being remapped onto the formatted text.
	const byteToChar = computed<number[] | null>(() => {
		const text = rawText.value;
		if (!text || entities.value.length === 0) return null;
		const encoder = new TextEncoder();
		const map: number[] = [];
		let byte = 0;
		for (let i = 0; i < text.length; i++) {
			const codePoint = text.codePointAt(i)!;
			const width = encoder.encode(String.fromCodePoint(codePoint)).length;
			const isSurrogatePair = codePoint > 0xffff;
			for (let b = 0; b < width; b++) map[byte + b] = i;
			byte += width;
			if (isSurrogatePair) i++; // skip the low surrogate
		}
		map[byte] = text.length; // end sentinel
		return map;
	});

	// Resolve entity spans onto the formatted text.
	// - Text/JSON entities are document byte offsets into the shown text: byte →
	//   raw char (byteMap) → formatted char (the formatter's raw→formatted map).
	// - XML entities' `range` indexes the *decoded* stream (entities resolved),
	//   which differs from the raw text we show, so we use the `source` byte span
	//   into the raw file instead — same as DOCX.
	// - Tabular (CSV) entities are byte offsets *within a cell*: from the cell's
	//   content start, advance by the byte offset converted to a char index.
	const entitySpans = computed(() => {
		const byteMap = byteToChar.value;
		const csv = parsedCsv.value;
		const fmtMap = formatted.value.map;
		const toFormatted = (rawChar: number | undefined) =>
			rawChar == null ? undefined : fmtMap.length ? fmtMap[rawChar] : rawChar;
		const rawByteSpan = (startByte: number, endByte: number) => ({
			start: toFormatted(byteMap?.[startByte]),
			end: toFormatted(byteMap?.[endByte]),
		});

		const resolve = (e: TextEntityView): { start?: number; end?: number } => {
			// Tabular: byte offsets within a cell → flat char range (csv helper).
			if (e.cell) {
				if (!csv) return {};
				return (
					resolveTabularSpan(csv, e.cell.row, e.cell.column, e.start, e.end) ??
					{}
				);
			}
			if (!byteMap) return {};
			// XML (and any text with source refs): the entity's `range` indexes the
			// decoded stream, but we show the raw file, so use the single-file source
			// byte span instead (a `.part`-tagged ref belongs to another container).
			const ref = e.sourceRefs?.find((r) => !r.part);
			if (ref) return rawByteSpan(ref.start, ref.end);
			// Plain text / JSON: decoded == raw, so the location range applies.
			return rawByteSpan(e.start, e.end);
		};

		return entities.value
			.map((e) => ({ e, ...resolve(e) }))
			.filter(
				(s): s is { e: TextEntityView; start: number; end: number } =>
					s.start != null && s.end != null && s.end > s.start,
			)
			.sort((a, b) => a.start - b.start);
	});

	// Merge the two independent span sets — syntax-color tokens (base layer) and
	// entity highlights (overlay) — into one ordered run list. Split at every
	// boundary of either set; each run then knows its token color and whether it
	// sits inside an entity.
	const segments = computed<Segment[]>(() => {
		const text = formatted.value.text;
		if (!text) return [];

		const toks = tokens.value;

		// De-overlap the entity spans once (keep the earliest on a clash); the SAME
		// list drives both the boundary set and the per-run lookup, so a run is only
		// attributed to an entity whose edges were actually split.
		const placed: { e: TextEntityView; start: number; end: number }[] = [];
		let cursor = 0;
		for (const s of entitySpans.value) {
			if (s.start < cursor) continue;
			placed.push(s);
			cursor = s.end;
		}

		const bounds = new Set<number>([0, text.length]);
		for (const t of toks) {
			bounds.add(t.start);
			bounds.add(t.end);
		}
		for (const s of placed) {
			bounds.add(s.start);
			bounds.add(s.end);
		}
		const points = [...bounds].sort((a, b) => a - b);

		const kindAt = (i: number): TokenKind | null =>
			toks.find((t) => i >= t.start && i < t.end)?.kind ?? null;
		const entityAt = (i: number): TextEntityView | null =>
			placed.find((s) => i >= s.start && i < s.end)?.e ?? null;

		const out: Segment[] = [];
		for (let p = 0; p < points.length - 1; p++) {
			const start = points[p]!;
			const end = points[p + 1]!;
			if (end <= start) continue;
			out.push({
				text: text.slice(start, end),
				kind: kindAt(start),
				entity: entityAt(start),
				start,
			});
		}
		return out;
	});

	// Group segments into lines for the numbered gutter. A segment spanning a
	// newline is split at each break so every line holds only its own runs; each
	// part keeps its own char `start` (advanced past preceding parts + newlines)
	// so a selection maps back to the right offset.
	const lines = computed<Segment[][]>(() => {
		const out: Segment[][] = [[]];
		for (const seg of segments.value) {
			const parts = seg.text.split("\n");
			let offset = seg.start;
			parts.forEach((part, i) => {
				if (i > 0) out.push([]); // newline → start a new line
				if (part)
					out[out.length - 1]!.push({ ...seg, text: part, start: offset });
				offset += part.length + 1; // + the split-out "\n"
			});
		}
		return out;
	});

	// Whether a reviewer can add entities by selecting text here. Works for any
	// flat-text preview (plain text, JSON, XML) — a selection's formatted-char
	// offset maps back to a source byte offset via the formatter's raw→formatted
	// map ({@link formattedToRaw}). CSV is a grid, not flat text with such a map,
	// so it's excluded.
	const canAddEntities = computed(() => fileKind.value !== "csv");

	// Inverse of the formatter's raw→formatted char map: for each formatted char
	// index, the raw char index it came from. A formatter whose token lengths
	// change (JSON, where numbers are canonicalized) supplies an exact `inverseMap`
	// — use it directly, so a selection inside a `1e3`→`1000` token snaps to the
	// token's raw start rather than a stray inner char. Otherwise (whitespace-only
	// transforms like XML) invert the forward map: non-whitespace chars pair 1:1 in
	// order, so filling each formatted position with the latest raw index at or
	// before it is exact. Empty map (plain text) means identity.
	const formattedToRaw = computed<number[] | null>(() => {
		const fmt = formatted.value;
		if (fmt.inverseMap) return fmt.inverseMap;
		const map = fmt.map; // raw index → formatted index
		if (map.length === 0) return null; // identity: formatted === raw
		const fmtLen = fmt.text.length;
		const inverse: number[] = new Array(fmtLen + 1);
		let raw = 0;
		for (let f = 0; f <= fmtLen; f++) {
			// Advance raw while its formatted position is still <= f.
			while (raw < map.length - 1 && map[raw + 1]! <= f) raw++;
			inverse[f] = raw;
		}
		return inverse;
	});

	// A formatted-char offset (from a document selection over the shown text) →
	// raw-char index. Identity for plain text; otherwise via the reverse map.
	function charToRaw(formattedOffset: number): number {
		const raw = rawText.value ?? "";
		const inverse = formattedToRaw.value;
		const rawChar = inverse
			? (inverse[Math.max(0, Math.min(formattedOffset, inverse.length - 1))] ??
				0)
			: formattedOffset;
		return Math.max(0, Math.min(rawChar, raw.length));
	}

	// UTF-8 byte offset of a raw-char index (the API's entity locations are byte
	// offsets; JS strings are UTF-16, so encode the prefix).
	function rawToByte(rawChar: number): number {
		const raw = rawText.value ?? "";
		return new TextEncoder().encode(raw.slice(0, rawChar)).length;
	}

	// Map a formatted-text selection to a raw *byte* range. Both endpoints resolve
	// through the reverse map, but a formatted token whose raw source is shorter
	// (a canonicalized number: `1e3` shown as `1000`) collapses every interior
	// formatted position onto the token's single raw start — so a selection *inside*
	// such a token would yield an empty raw range and drop a valid add. When the
	// raw range collapses but the formatted selection wasn't empty, expand it to the
	// whole raw token (a number is redacted whole anyway) so the range stays useful.
	function charRangeToBytes(
		startFmt: number,
		endFmt: number,
	): { byteStart: number; byteEnd: number } {
		let rawStart = charToRaw(startFmt);
		let rawEnd = charToRaw(endFmt);
		if (rawEnd <= rawStart && endFmt > startFmt) {
			// Expand to the enclosing raw token: walk out while the raw chars share the
			// same formatted position (the hallmark of a collapsed token like a number).
			// Stop at whitespace — the space before a token collapses onto the same
			// formatted position, but isn't part of the token.
			const map = formatted.value.map;
			const raw = rawText.value ?? "";
			if (map.length) {
				const at = map[rawStart];
				const isWs = (i: number) => /\s/.test(raw[i] ?? "");
				while (rawStart > 0 && map[rawStart - 1] === at && !isWs(rawStart - 1))
					rawStart--;
				while (rawEnd < map.length - 1 && map[rawEnd] === at && !isWs(rawEnd))
					rawEnd++;
			}
		}
		return { byteStart: rawToByte(rawStart), byteEnd: rawToByte(rawEnd) };
	}

	return { formatted, lines, canAddEntities, charRangeToBytes };
}
