import type { Audit, UnitBoundingBox } from "@nvisy/sdk/datatypes";
import type { MaybeRefOrGetter } from "vue";
import {
	type BaseEntityView,
	type CategorizedGroup,
	categorize,
	provenance,
} from "#console/composables/studio/useEntities";
import {
	type DocxSourceRef,
	byteOffsetToChar,
	docxMatchedText,
	isRenderedDocxPart,
	parseCsv,
} from "#console/utils/preview";

/**
 * A tabular entity's cell locator. Tabular byte offsets (`start`/`end`) are
 * *within the cell*, so the preview needs the cell coordinates to place the
 * span on the flat rendered text.
 */
export interface CellLocation {
	row: number;
	column: number;
	/** Header label of the column, when the recognizer knew it. */
	columnName?: string;
}

/**
 * A detected text entity, flattened for the audit list + highlight overlay. The
 * modality-agnostic fields (id, label, category, confidence, provenance,
 * suppressed, added, text) come from {@link BaseEntityView}; this adds the
 * text/tabular *location*.
 */
export interface TextEntityView extends BaseEntityView {
	/**
	 * Which modality group this entity came from. Determines the bucket a
	 * reviewer edit (suppress/retag) lands in when building the redaction
	 * `EditSet` — text and tabular entities go to different arrays.
	 */
	modality: "text" | "tabular";
	/**
	 * Byte offsets of the span in the decoded text. For plain text, offsets into
	 * the whole document; for a paginated modality (PDF), offsets into *that
	 * page's* text (see {@link page}); for tabular, offsets *within the cell*
	 * named by {@link cell}. Meaningful only when {@link decoded} is true — a
	 * reviewer's rendered-medium selection has no decoded span, so these are 0 and
	 * ordering / clustering fall back to {@link sourceRefs} instead.
	 */
	start: number;
	end: number;
	/**
	 * Whether {@link start}/{@link end} are a real decoded span. False for a
	 * source-only mark (a reviewer selection on a rendered medium with no decoded
	 * text), whose position lives in {@link sourceRefs} / {@link rects}.
	 */
	decoded: boolean;
	/** Cell coordinates for tabular entities; absent for plain text. */
	cell?: CellLocation;
	/**
	 * 1-based page the entity is rendered on, for a paginated modality (PDF). The
	 * highlighter paints from {@link rects}; the page scopes those boxes and keys
	 * the ordering/clustering (a repeated header value at the same page-local
	 * offset on each page must stay distinct). Absent for unpaginated text.
	 */
	page?: number;
	/**
	 * Page-normalized highlight boxes (0..1, top-left origin), one per line the
	 * span wraps across, for a rendered modality (PDF). The preview overlays these
	 * directly as percent-positioned boxes — no cross-extractor offset mapping.
	 * Absent for non-rendered text (plain text, DOCX, tabular).
	 */
	rects?: UnitBoundingBox[];
	/**
	 * Raw-source byte ranges this entity came from, per container part (for DOCX,
	 * spans into `word/document.xml`). Present when the decoded text a recognizer
	 * scanned differs from the raw source (DOCX/XML); empty for plain text/CSV,
	 * where {@link start}/{@link end} already index the shown text. The DOCX
	 * preview maps these onto its rendered runs.
	 */
	sourceRefs?: DocxSourceRef[];
	/**
	 * Whether this entity has an on-page location the preview can highlight and
	 * scroll to. False for entities detected only in document metadata (e.g. a
	 * DOCX hyperlink target in `word/_rels/...`, which isn't visible body text) —
	 * their value still shows in the list, but the row isn't clickable. Defaults
	 * to true for plain text / tabular, which are always locatable.
	 */
	locatable?: boolean;
}

/**
 * Slice a matched value out of `source` by a UTF-8 byte-offset span. Offsets
 * are byte positions (the entity's location); JS strings are UTF-16, so convert
 * first. An unbounded `end` (Infinity, "the whole cell") runs to the end.
 */
function sliceBytes(source: string, start: number, end: number): string {
	const from = byteOffsetToChar(source, start);
	const to = Number.isFinite(end)
		? byteOffsetToChar(source, end)
		: source.length;
	return source.slice(from, to);
}

/**
 * A stable position string for a source-only entity, from its raw source refs
 * (`part:start:end`, joined). The offsets are part-local, so the part is part of
 * the key — two parts' identical local ranges must stay distinct. `""` when the
 * entity has no source refs (shouldn't happen for a source-only coord).
 */
function sourcePosition(item: TextEntityView): string {
	return (item.sourceRefs ?? [])
		.map((r) => `${r.part ?? ""}:${r.start}:${r.end}`)
		.join("|");
}

/**
 * Flatten a run's audit into text entities with byte offsets into the flat
 * file text — the shape the document preview highlights against.
 *
 * Handles the two text-backed modalities: `text` (plain files) uses the
 * entity's `location` byte range into the whole document; `tabular`
 * (CSV/spreadsheets) uses its `location`'s cell coords + byte offsets *within*
 * the cell (the preview maps those onto the flat text). Image and audio have no
 * flat-text offsets and return nothing.
 *
 * Accepts ref/getters so callers can bind reactive audit + document text. When
 * `text` (the flat document content) is supplied, each entity also carries the
 * matched `text` sliced from the document — the actual found value. DOCX has no
 * flat text, so `docxRuns` provides the matched value instead: it is sliced from
 * the entity's raw-source byte spans (`sourceRefs`) against the parsed runs.
 */
export function useTextEntities(
	audit: MaybeRefOrGetter<Audit | null>,
	text?: MaybeRefOrGetter<string | null>,
	docxParts?: MaybeRefOrGetter<Map<string, Uint8Array> | null>,
) {
	// Resolve label ids to catalog names + categories (shared with the grouped
	// list below). Read up here so each entity view can carry its category.
	const { resolveLabel, labelName } = useLabels();

	const entities = computed<TextEntityView[]>(() => {
		const group = soleReportPart(toValue(audit)?.report);
		const doc = toValue(text) ?? null;
		const parts = toValue(docxParts) ?? null;

		let views: TextEntityView[];
		if (group?.modality === "text") {
			// Slice the matched value straight from the flat document by its
			// byte-offset span (converted to char indices for JS strings).
			views = group.entities.map((e) => {
				// `location` is a tagged union of where the entity sits. A `Detected`
				// location (what the pipeline finds over text) always carries a decoded
				// `span`, with a `kind` saying where that text physically lives: `inline`
				// (the span is its own source — plain text), `source` (raw-byte refs it
				// decoded from — DOCX/XML), or `rendered` (a page + normalized boxes —
				// PDF). A `Marked` location is a reviewer's rendered-medium selection
				// with NO decoded span, located only by refs/rects; it has no offset, so
				// `start`/`end` stay 0 and its position is carried by `sourceRefs`.
				const loc = e.location;
				const decoded = "span" in loc;
				const start = decoded ? loc.span.start : 0;
				const end = decoded ? loc.span.end : 0;
				// Raw-source spans (DOCX/XML): the source bytes the decoded span came
				// from, per container part. The preview maps document-body spans onto
				// rendered runs; other parts (metadata) provide the value only.
				const sourceRefs: DocxSourceRef[] | undefined =
					loc.kind === "source"
						? loc.refs.map((ref) => ({
								part: ref.part,
								start: ref.range.start,
								end: ref.range.end,
							}))
						: undefined;
				// Rendered geometry (PDF): page-normalized boxes to overlay, scoped to a
				// 1-based page. Painted directly, no offset→glyph mapping.
				const page = loc.kind === "rendered" ? loc.page : undefined;
				const rects = loc.kind === "rendered" ? loc.rects : undefined;
				// Matched value. For a `source` location the decoded `span` indexes the
				// decoded stream, which for XML differs from the raw text we show, so
				// slice the raw `doc` by the single-file source byte span instead. DOCX
				// has no flat `doc`, so it slices from the part bytes. A `rendered` (PDF)
				// value never rides in the audit, so there's nothing to slice there.
				const rawRef = sourceRefs?.find((r) => !r.part);
				let matched: string | undefined;
				if (doc && decoded)
					matched = rawRef
						? sliceBytes(doc, rawRef.start, rawRef.end)
						: sliceBytes(doc, start, end);
				else if (parts && sourceRefs?.length)
					matched = docxMatchedText(parts, sourceRefs);
				// Locatable unless the entity has source refs and none target a
				// rendered part (document body, header, footer, notes) — i.e. it's
				// metadata-only (a DOCX hyperlink target in `.rels`). No source refs
				// means a plain body / rendered position, so plain-text/JSON/PDF
				// entities stay locatable regardless of fetch state.
				//
				// A rendered (PDF) entity also needs usable geometry: if it carries a
				// page + rects but none are valid unit boxes (upstream sent raw points
				// or negative coordinates), it can't be placed on the document, so it's
				// not locatable — the audit row flags it and no highlight/popover is
				// attempted.
				const hasUsableGeometry =
					loc.kind !== "rendered" || !rects?.length || rects.some(isUnitRect);
				const locatable =
					hasUsableGeometry &&
					(!sourceRefs?.length ||
						sourceRefs.some((r) => isRenderedDocxPart(r.part)));
				return {
					id: e.id,
					modality: "text",
					label: e.label,
					category: resolveLabel(e.label)?.category ?? null,
					start,
					end,
					decoded,
					confidence: e.confidence,
					locatable,
					...provenance(e),
					audit: e.audit,
					...(sourceRefs?.length ? { sourceRefs } : {}),
					...(matched ? { text: matched } : {}),
					// Page + boxes for the paginated (PDF) highlight; the offsets above
					// are page-local there.
					...(page != null ? { page } : {}),
					...(rects?.length ? { rects } : {}),
				} satisfies TextEntityView;
			});
		} else if (group?.modality === "tabular") {
			// Tabular locations are a cell (row/column) plus optional byte offsets
			// *within* that cell. Carry the cell coords so the preview can place
			// the span on the flat text; unset offsets mean the whole cell. The
			// matched value slices from the cell's own text, so parse once.
			const rows = doc ? parseCsv(doc).rows : null;
			views = group.entities.map((e) => {
				const loc = e.location;
				const start = loc.start_offset ?? 0;
				const end = loc.end_offset ?? Number.POSITIVE_INFINITY;
				const cellValue = rows?.[loc.row_index]?.[loc.column_index];
				return {
					id: e.id,
					modality: "tabular",
					label: e.label,
					category: resolveLabel(e.label)?.category ?? null,
					start,
					end,
					// In-cell offsets are real (decoded from the cell text); the cell
					// coords below disambiguate them across cells.
					decoded: true,
					cell: {
						row: loc.row_index,
						column: loc.column_index,
						columnName: loc.column_name,
					},
					confidence: e.confidence,
					...provenance(e),
					audit: e.audit,
					...(cellValue !== undefined
						? { text: sliceBytes(cellValue, start, end) }
						: {}),
				} satisfies TextEntityView;
			});
		} else {
			return [];
		}

		// Order by document position: for text, the byte offset; for tabular, by
		// cell (row, then column, then in-cell offset) so the audit list follows
		// the visual table rather than meaningless in-cell offsets. Source-only
		// entities have no decoded offset, so order them after decoded ones by their
		// part path — part-local offsets aren't comparable across parts.
		return views.sort((a, b) => {
			if (a.cell && b.cell) {
				return (
					a.cell.row - b.cell.row ||
					a.cell.column - b.cell.column ||
					a.start - b.start
				);
			}
			// For paginated (PDF) entities the offsets are page-local, so page comes
			// first; unpaginated text has no page and sorts on the offset alone.
			if (a.decoded && b.decoded)
				return (a.page ?? 0) - (b.page ?? 0) || a.start - b.start;
			if (a.decoded !== b.decoded) return a.decoded ? -1 : 1;
			return sourcePosition(a).localeCompare(sourcePosition(b));
		});
	});

	const count = computed(() => entities.value.length);

	// Text cluster key: body vs metadata-only occurrences never merge (the `group`,
	// so a row's clickability is unambiguous and the stepper never lands off-page);
	// the location only breaks a tie when there's no matched value. It carries the
	// coordinates that actually disambiguate a position: the cell (row/column) for
	// tabular, whose byte offsets are *within* the cell; the source part + range for
	// a source-only entity, whose offsets are part-local; otherwise the decoded
	// document offset — prefixed with the page for PDF, whose offsets are page-local
	// (else a repeated header/footer value at the same offset on each page collides).
	const textClusterKey = (item: TextEntityView) => ({
		group: item.locatable === false ? "meta" : "body",
		location: item.cell
			? `${item.cell.row}:${item.cell.column}:${item.start}:${item.end}`
			: item.decoded
				? `${item.page ?? ""}:${item.start}:${item.end}`
				: sourcePosition(item),
	});

	/**
	 * Two-tier grouping for the audit list: entities grouped by label, then those
	 * label groups clustered under their catalog category (see `categorize`).
	 */
	const categorizedGroups = computed<CategorizedGroup<TextEntityView>[]>(() =>
		categorize(entities.value, labelName, textClusterKey),
	);

	return { entities, categorizedGroups, count };
}
