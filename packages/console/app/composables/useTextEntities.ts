import type { Audit } from "@nvisy/sdk/datatypes";
import type { MaybeRefOrGetter } from "vue";

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
	/** Byte offsets into the original text. */
	start: number;
	end: number;
	/** Effective confidence, 0..1. */
	confidence: number;
}

/**
 * Flatten a run's audit into text entities. Only the text modality is surfaced
 * (this feature targets .txt); other modalities return an empty list.
 *
 * Accepts a ref/getter so callers can bind it to reactive audit state.
 */
export function useTextEntities(audit: MaybeRefOrGetter<Audit | null>) {
	const entities = computed<TextEntityView[]>(() => {
		const group = toValue(audit)?.body;
		if (group?.modality !== "text") return [];

		return group.entities
			.map((record) => {
				const e = record.entity;
				return {
					id: e.id,
					label: e.label,
					start: e.location.start,
					end: e.location.end,
					confidence: e.confidence,
				} satisfies TextEntityView;
			})
			.sort((a, b) => a.start - b.start);
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
