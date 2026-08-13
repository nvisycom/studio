import { type FormattedText, byteOffsetToChar, identity } from "./shared";

/**
 * CSV is shown as-is in the flat text view (identity map, so entity highlights
 * stay correct). Column alignment would change the non-whitespace sequence the
 * offset map relies on; the aligned/structured rendering is the table view.
 */
export function formatCsv(raw: string): FormattedText {
	return identity(raw);
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
