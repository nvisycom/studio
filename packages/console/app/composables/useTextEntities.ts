import type { Audit } from "@nvisy/sdk/datatypes";
import type { MaybeRefOrGetter } from "vue";
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

/** A detected text entity, flattened for the audit list + highlight overlay. */
export interface TextEntityView {
	/** Stable entity id (UUIDv7 from recognition). */
	id: string;
	/**
	 * Raw label id, shown verbatim for now (e.g. "person", "email_address"). A
	 * workspace label catalog will resolve these to display names + categories
	 * later; until then the id is the label.
	 */
	label: string;
	/**
	 * The label's catalog category (e.g. "contact", "financial"), or null when
	 * the catalog doesn't know the label. Drives the highlight color per category.
	 */
	category: string | null;
	/**
	 * Byte offsets of the span. For text, offsets into the whole document; for
	 * tabular, offsets *within the cell* named by {@link cell} (the preview maps
	 * those onto the flat text).
	 */
	start: number;
	end: number;
	/** Cell coordinates for tabular entities; absent for plain text. */
	cell?: CellLocation;
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
	/** Effective confidence, 0..1. */
	confidence: number;
	/** Recognizer/source that first found this entity (the birth event). */
	source?: string;
	/**
	 * The specific pattern or model that matched, when the birth event was a
	 * pattern/model recognition (e.g. `"ssn"`, `"gpt-4"`). More precise than
	 * {@link source}; absent for other event kinds.
	 */
	detector?: string;
	/** Whether {@link detector} names a regex pattern or an ML model. */
	detectorKind?: "pattern" | "model";
	/** Detected language of the surrounding text, when known (e.g. "en"). */
	language?: string;
	/**
	 * The matched text — the actual found value (an email, a name). Sliced from
	 * the flat document at this entity's offsets, or for DOCX from its rendered
	 * runs via {@link sourceRefs}. Absent when neither is available (image/audio).
	 */
	text?: string;
}

/**
 * A run of identical occurrences within one label group — same matched value +
 * detector, differing only by location. `lead` is the first occurrence (its
 * value/detector represent the cluster); `items` holds every occurrence in
 * document order, so the UI can collapse them to one row with a count and step
 * through the spans.
 */
export interface EntityCluster {
	/** Stable identity for the cluster (the dedup key). */
	key: string;
	/** The representative occurrence (first in document order). */
	lead: TextEntityView;
	/** Every occurrence, in document order. */
	items: TextEntityView[];
}

/** One label's entities within a category: its display name, items, clusters. */
export interface LabelGroup {
	/** Raw label id. */
	label: string;
	/** Catalog display name (falls back to the id). */
	name: string;
	/** Every occurrence for this label, in document order. */
	items: TextEntityView[];
	/** Occurrences clustered by identical value + detector. */
	clusters: EntityCluster[];
}

/** A category section of the audit list: its label groups and total count. */
export interface CategorizedGroup {
	/** Catalog category, or null for uncategorized labels. */
	category: string | null;
	/** Total entities across the section's label groups. */
	count: number;
	/** The label groups under this category. */
	labels: LabelGroup[];
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
 * A birth audit event, narrowed to the fields we read. `kind` is the
 * discriminated recognition detail: a `pattern` match names the pattern, a
 * `model` match names the model, any other kind carries neither.
 */
type BirthEvent = {
	source: string;
	parents: unknown[];
	kind?: { kind: string; pattern?: { name: string }; model?: { name: string } };
};

/** Provenance/language shared by text + tabular entities, for the detail view. */
function provenance(entity: { language?: string; audit: BirthEvent[] }) {
	// The birth event is the detection with no parents; fall back to the first.
	const birth =
		entity.audit.find((ev) => ev.parents.length === 0) ?? entity.audit[0];

	// Prefer the specific pattern/model name from the birth event's detail.
	const kind = birth?.kind;
	let detector: string | undefined;
	let detectorKind: "pattern" | "model" | undefined;
	if (kind?.kind === "pattern" && kind.pattern) {
		detector = kind.pattern.name;
		detectorKind = "pattern";
	} else if (kind?.kind === "model" && kind.model) {
		detector = kind.model.name;
		detectorKind = "model";
	}

	return {
		source: birth?.source,
		detector,
		detectorKind,
		language: entity.language,
	};
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
		const group = toValue(audit)?.body;
		const doc = toValue(text) ?? null;
		const parts = toValue(docxParts) ?? null;

		let views: TextEntityView[];
		if (group?.modality === "text") {
			// Slice the matched value straight from the flat document by its
			// byte-offset span (converted to char indices for JS strings).
			views = group.entities.map((record) => {
				const e = record.entity;
				const start = e.location.range.start;
				const end = e.location.range.end;
				// Raw-source spans (DOCX/XML): the source bytes the decoded span came
				// from, per container part. The preview maps document-body spans onto
				// rendered runs; other parts (metadata) provide the value only.
				const sourceRefs: DocxSourceRef[] | undefined = e.location.source?.map(
					(ref) => ({
						part: ref.part,
						start: ref.range.start,
						end: ref.range.end,
					}),
				);
				// Matched value. `range` indexes the decoded stream, which for XML
				// differs from the raw text we show, so when a single-file source ref
				// is present slice the raw `doc` by that source byte span instead.
				// DOCX has no flat `doc`, so it slices from the part bytes.
				const rawRef = sourceRefs?.find((r) => !r.part);
				let matched: string | undefined;
				if (doc)
					matched = rawRef
						? sliceBytes(doc, rawRef.start, rawRef.end)
						: sliceBytes(doc, start, end);
				else if (parts && sourceRefs?.length)
					matched = docxMatchedText(parts, sourceRefs);
				// Locatable unless the entity has source refs and none target a
				// rendered part (document body, header, footer, notes) — i.e. it's
				// metadata-only (a DOCX hyperlink target in `.rels`). No source refs
				// means a plain body position, so plain-text/JSON entities stay
				// locatable regardless of fetch state.
				const locatable =
					!sourceRefs?.length ||
					sourceRefs.some((r) => isRenderedDocxPart(r.part));
				return {
					id: e.id,
					label: e.label,
					category: resolveLabel(e.label)?.category ?? null,
					start,
					end,
					confidence: e.confidence,
					locatable,
					...provenance(e),
					...(sourceRefs?.length ? { sourceRefs } : {}),
					...(matched ? { text: matched } : {}),
				} satisfies TextEntityView;
			});
		} else if (group?.modality === "tabular") {
			// Tabular locations are a cell (row/column) plus optional byte offsets
			// *within* that cell. Carry the cell coords so the preview can place
			// the span on the flat text; unset offsets mean the whole cell. The
			// matched value slices from the cell's own text, so parse once.
			const rows = doc ? parseCsv(doc).rows : null;
			views = group.entities.map((record) => {
				const e = record.entity;
				const loc = e.location;
				const start = loc.start_offset ?? 0;
				const end = loc.end_offset ?? Number.POSITIVE_INFINITY;
				const cellValue = rows?.[loc.row_index]?.[loc.column_index];
				return {
					id: e.id,
					label: e.label,
					category: resolveLabel(e.label)?.category ?? null,
					start,
					end,
					cell: {
						row: loc.row_index,
						column: loc.column_index,
						columnName: loc.column_name,
					},
					confidence: e.confidence,
					...provenance(e),
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
		// the visual table rather than meaningless in-cell offsets.
		return views.sort((a, b) => {
			if (a.cell && b.cell) {
				return (
					a.cell.row - b.cell.row ||
					a.cell.column - b.cell.column ||
					a.start - b.start
				);
			}
			return a.start - b.start;
		});
	});

	/** Group by raw label id, for the grouped audit list. */
	const groups = computed(() => {
		const map = new Map<string, TextEntityView[]>();
		for (const entity of entities.value) {
			const list = map.get(entity.label);
			if (list) list.push(entity);
			else map.set(entity.label, [entity]);
		}
		return Array.from(map, ([label, items]) => ({ label, items }));
	});

	const count = computed(() => entities.value.length);

	/**
	 * Cluster a label group's entities by identical value + detector, preserving
	 * document order. Entities that differ only by location (the same email found
	 * many times) collapse into one cluster carrying every occurrence, so the UI
	 * can show one row with a count + prev/next. The cluster key falls back to the
	 * byte span when no matched text is available, so distinct spans stay distinct.
	 */
	function clusterItems(items: TextEntityView[]): EntityCluster[] {
		const map = new Map<string, EntityCluster>();
		const order: string[] = [];
		for (const item of items) {
			const value = item.text ?? `${item.start}:${item.end}`;
			const detector = item.detector ?? item.source ?? "";
			// Keep body vs metadata-only occurrences in separate clusters, so a row's
			// clickability is unambiguous and the stepper never lands off-page.
			const loc = item.locatable === false ? "meta" : "body";
			const key = `${value} ${detector} ${loc}`;
			const existing = map.get(key);
			if (existing) existing.items.push(item);
			else {
				map.set(key, { key, lead: item, items: [item] });
				order.push(key);
			}
		}
		return order.map((k) => map.get(k)!);
	}

	/**
	 * Two-tier grouping for the audit list: entities grouped by label, then those
	 * label groups clustered under their catalog category. A label the catalog
	 * doesn't know (or one with no category) lands under a null category, which
	 * the UI renders as "Uncategorized". Label groups keep the document order
	 * established above; categories are sorted by name, with the uncategorized
	 * bucket last.
	 */
	const categorizedGroups = computed<CategorizedGroup[]>(() => {
		const byCategory = new Map<string | null, LabelGroup[]>();

		for (const group of groups.value) {
			const category = resolveLabel(group.label)?.category ?? null;
			const enriched = {
				label: group.label,
				name: labelName(group.label),
				items: group.items,
				clusters: clusterItems(group.items),
			};
			const bucket = byCategory.get(category);
			if (bucket) bucket.push(enriched);
			else byCategory.set(category, [enriched]);
		}

		return Array.from(byCategory, ([category, labels]) => ({
			category,
			count: labels.reduce((n, l) => n + l.items.length, 0),
			labels,
		})).sort((a, b) => {
			if (a.category === null) return 1;
			if (b.category === null) return -1;
			return a.category.localeCompare(b.category);
		});
	});

	return { entities, groups, categorizedGroups, count };
}
