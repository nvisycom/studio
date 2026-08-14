import type { Audit } from "@nvisy/sdk/datatypes";
import type { MaybeRefOrGetter } from "vue";

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
	 * Byte offsets of the span. For text, offsets into the whole document; for
	 * tabular, offsets *within the cell* named by {@link cell} (the preview maps
	 * those onto the flat text).
	 */
	start: number;
	end: number;
	/** Cell coordinates for tabular entities; absent for plain text. */
	cell?: CellLocation;
	/** Effective confidence, 0..1. */
	confidence: number;
	/** Recognizer/source that first found this entity (the birth event). */
	source?: string;
	/** Detected language of the surrounding text, when known (e.g. "en"). */
	language?: string;
}

/** Provenance/language shared by text + tabular entities, for the detail view. */
function provenance(entity: {
	language?: string;
	audit: { source: string; parents: unknown[] }[];
}) {
	// The birth event is the detection with no parents; fall back to the first.
	const birth =
		entity.audit.find((ev) => ev.parents.length === 0) ?? entity.audit[0];
	return { source: birth?.source, language: entity.language };
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
 * Accepts a ref/getter so callers can bind it to reactive audit state.
 */
export function useTextEntities(audit: MaybeRefOrGetter<Audit | null>) {
	const entities = computed<TextEntityView[]>(() => {
		const group = toValue(audit)?.body;

		let views: TextEntityView[];
		if (group?.modality === "text") {
			views = group.entities.map((record) => {
				const e = record.entity;
				return {
					id: e.id,
					label: e.label,
					start: e.location.start,
					end: e.location.end,
					confidence: e.confidence,
					...provenance(e),
				} satisfies TextEntityView;
			});
		} else if (group?.modality === "tabular") {
			// Tabular locations are a cell (row/column) plus optional byte offsets
			// *within* that cell. Carry the cell coords so the preview can place
			// the span on the flat text; unset offsets mean the whole cell.
			views = group.entities.map((record) => {
				const e = record.entity;
				const loc = e.location;
				return {
					id: e.id,
					label: e.label,
					start: loc.start_offset ?? 0,
					end: loc.end_offset ?? Number.POSITIVE_INFINITY,
					cell: {
						row: loc.row_index,
						column: loc.column_index,
						columnName: loc.column_name,
					},
					confidence: e.confidence,
					...provenance(e),
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

	return { entities, groups, count };
}
