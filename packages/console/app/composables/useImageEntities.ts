import type { Audit } from "@nvisy/sdk/datatypes";
import type { MaybeRefOrGetter } from "vue";
import {
	type BaseEntityView,
	type CategorizedGroup as CategorizedGroupBase,
	categorize,
	provenance,
} from "#console/composables/useEntities";

/**
 * A detected image entity, for the image preview's bounding-box overlay + the
 * audit list. The modality-agnostic fields come from {@link BaseEntityView}; this
 * adds the *box* — the entity's own image location (a face, a signature, or a
 * text match's region), in the image's natural pixel coordinates.
 *
 * Unlike text entities, an image entity's location is geometric and comes
 * straight from the recognizer (`entity.location`), not from mapping text offsets
 * onto OCR — an image entity need not be text at all.
 */
export interface ImageEntityView extends BaseEntityView {
	modality: "image";
	/** Axis-aligned bounding box in the image's natural pixel coordinates. */
	box: ImageBox;
	/** 1-based page, for multi-page image documents (PDF); absent for a plain image. */
	page?: number;
}

/** A bounding box in natural pixel coordinates (top-left `min`, bottom-right `max`). */
export interface ImageBox {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

/** The category-grouped audit sections for image entities. */
export type ImageCategorizedGroup = CategorizedGroupBase<ImageEntityView>;

/**
 * Flatten a detection's audit into image entities with bounding boxes — the shape
 * the image preview overlays. Only the `image` body modality yields any; a
 * non-image (or absent) audit returns nothing.
 */
export function useImageEntities(audit: MaybeRefOrGetter<Audit | null>) {
	const { resolveLabel, labelName } = useLabels();

	const entities = computed<ImageEntityView[]>(() => {
		const body = toValue(audit)?.report.body;
		if (body?.modality !== "image") return [];
		return body.entities.map((e) => {
			const bbox = e.location.bounding_box;
			return {
				id: e.id,
				modality: "image" as const,
				label: e.label,
				category: resolveLabel(e.label)?.category ?? null,
				confidence: e.confidence,
				box: {
					minX: bbox.min.x,
					minY: bbox.min.y,
					maxX: bbox.max.x,
					maxY: bbox.max.y,
				},
				...(e.location.page !== undefined ? { page: e.location.page } : {}),
				...provenance(e),
			} satisfies ImageEntityView;
		});
	});

	const count = computed(() => entities.value.length);

	// Image cluster key: distinct boxes only break a tie when there's no value; the
	// page is part of the identity (a multi-page doc can repeat a box across pages).
	const imageClusterKey = (item: ImageEntityView) => ({
		location: `${item.page ?? 0}:${item.box.minX},${item.box.minY},${item.box.maxX},${item.box.maxY}`,
	});

	const categorizedGroups = computed<ImageCategorizedGroup[]>(() =>
		categorize(entities.value, labelName, imageClusterKey),
	);

	return { entities, categorizedGroups, count };
}
