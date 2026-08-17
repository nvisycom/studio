import {
	type FormattedText,
	type Token,
	byteOffsetToChar,
	identity,
} from "./shared";

/**
 * CSV is shown as-is in the flat text view (identity map, so entity highlights
 * stay correct). Column alignment would change the non-whitespace sequence the
 * offset map relies on; the aligned/structured rendering is the table view.
 */
export function formatCsv(raw: string): FormattedText {
	return identity(raw);
}

/**
 * Tokenize flat CSV into positioned color spans, mirroring `tokenizeJson` so the
 * raw text view colors CSV the same way it colors JSON. `formatCsv` is identity,
 * so token positions are char indices into the raw text directly.
 *
 * Scanning follows the same RFC-4180-ish rules as `parseCsv` (quoted fields may
 * contain commas/newlines, `""` escapes a quote). Each field is classed:
 * `key` for the whole header row (the first line), `number` for a bare numeric
 * data cell, `string` for a quoted data cell. Delimiters, newlines, and plain
 * unquoted text are left as gaps the caller renders in the base color.
 */
export function tokenizeCsv(text: string): Token[] {
	const tokens: Token[] = [];
	let line = 0; // 0 = header row
	let fieldStart = 0;
	let inQuotes = false;
	let quoted = false; // this field opened with a quote

	const endField = (end: number) => {
		if (end <= fieldStart) return;
		const value = text.slice(fieldStart, end);
		let kind: Token["kind"] | null = null;
		if (line === 0) {
			kind = "key"; // header row is the anchor
		} else if (quoted) {
			kind = "string";
		} else if (/^-?\d+(\.\d+)?$/.test(value.trim()) && value.trim() !== "") {
			kind = "number";
		}
		if (kind) tokens.push({ start: fieldStart, end, kind });
	};

	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (inQuotes) {
			if (ch === '"') {
				if (text[i + 1] === '"')
					i++; // escaped quote
				else inQuotes = false;
			}
			continue;
		}
		if (ch === '"') {
			inQuotes = true;
			if (i === fieldStart) quoted = true; // opening quote of the field
		} else if (ch === ",") {
			endField(i);
			fieldStart = i + 1;
			quoted = false;
		} else if (ch === "\n" || ch === "\r") {
			endField(i);
			if (ch === "\r" && text[i + 1] === "\n") i++; // CRLF
			line++;
			fieldStart = i + 1;
			quoted = false;
		}
	}
	// Flush the trailing field when the file doesn't end with a newline.
	endField(text.length);
	return tokens;
}

/** Char range `[start, end)` of one cell in the flat CSV text. */
export interface CellRange {
	/** Start of the raw field (including an opening quote) in the flat text. */
	start: number;
	/** End (exclusive) of the raw field. */
	end: number;
	/**
	 * Char index where the cell's *content* begins — `start`, or `start + 1`
	 * for a quoted field. Entity in-cell offsets are relative to the content, so
	 * map them from here. (Escaped `""` inside a quoted field still shifts later
	 * offsets; exact quoted-cell mapping is deferred to the structured view.)
	 */
	valueStart: number;
}

/** A CSV parsed into a grid of cell values plus each cell's flat char range. */
export interface ParsedCsv {
	/** `rows[r][c]` — the cell's text value (quotes stripped, `""` unescaped). */
	rows: string[][];
	/** `ranges["r,c"]` — the cell's `[start, end)` in the flat text. */
	ranges: Map<string, CellRange>;
	/** Largest column count across rows (ragged rows are padded when rendered). */
	columns: number;
}

/**
 * Parse flat CSV into a grid + per-cell flat char ranges in a single scan.
 *
 * RFC-4180-ish: comma-separated fields, `\n`/`\r\n` rows, double-quoted fields
 * (which may contain commas/newlines) with `""` escapes. The ranges cover the
 * *raw* field including its quotes, so tabular entity offsets (which are into
 * the flat text) still land; the parsed value has quotes stripped for display.
 */
export function parseCsv(text: string): ParsedCsv {
	const rows: string[][] = [];
	const ranges = new Map<string, CellRange>();
	let row: string[] = [];
	let r = 0;
	let c = 0;
	let cellStart = 0;
	let quoted = false; // this field opened with a quote
	let value = "";
	let inQuotes = false;

	const endCell = (end: number) => {
		ranges.set(`${r},${c}`, {
			start: cellStart,
			end,
			valueStart: quoted ? cellStart + 1 : cellStart,
		});
		row.push(value);
		value = "";
		quoted = false;
	};
	const endRow = () => {
		rows.push(row);
		row = [];
		r++;
		c = 0;
	};

	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (inQuotes) {
			if (ch === '"') {
				if (text[i + 1] === '"') {
					value += '"';
					i++; // escaped quote
				} else inQuotes = false;
			} else value += ch;
			continue;
		}
		if (ch === '"') {
			inQuotes = true;
			if (i === cellStart) quoted = true; // opening quote of the field
		} else if (ch === ",") {
			endCell(i);
			c++;
			cellStart = i + 1;
		} else if (ch === "\n" || ch === "\r") {
			endCell(i);
			if (ch === "\r" && text[i + 1] === "\n") i++; // CRLF
			endRow();
			cellStart = i + 1;
		} else {
			value += ch;
		}
	}
	// Flush the trailing cell/row when the file doesn't end with a newline.
	if (cellStart < text.length || value || row.length) {
		endCell(text.length);
		endRow();
	}

	const columns = rows.reduce((max, r) => Math.max(max, r.length), 0);
	return { rows, ranges, columns };
}

/**
 * Resolve a tabular entity's in-cell byte span to a `[start, end)` char range
 * in the flat CSV text. Detection reports byte offsets *within the cell*; from
 * the cell's content start, advance by the offset converted to a char index.
 * Returns null when the cell isn't found. An infinite `end` means "whole cell".
 */
export function resolveTabularSpan(
	csv: ParsedCsv,
	row: number,
	column: number,
	startByte: number,
	endByte: number,
): { start: number; end: number } | null {
	const range = csv.ranges.get(`${row},${column}`);
	if (!range) return null;
	const value = csv.rows[row]?.[column] ?? "";
	const start = range.valueStart + byteOffsetToChar(value, startByte);
	const end = Number.isFinite(endByte)
		? range.valueStart + byteOffsetToChar(value, endByte)
		: range.end;
	return { start, end: Math.min(end, range.end) };
}
