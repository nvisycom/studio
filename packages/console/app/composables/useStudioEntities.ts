import type { Audit } from "@nvisy/sdk/datatypes";
import type { MaybeRefOrGetter } from "vue";
import type { CategorizedGroup } from "#console/composables/useEntities";
import type { TextEntityView } from "#console/composables/useTextEntities";
import type { ImageEntityView } from "#console/composables/useImageEntities";

/**
 * A detected studio entity of any modality — the union the audit list, the count,
 * and the redaction edit path all work with. Both variants extend
 * {@link BaseEntityView} and carry a `modality` discriminator; the modality-
 * specific location (text byte offsets / image box) lives on each.
 */
export type StudioEntityView = TextEntityView | ImageEntityView;

/** The category-grouped audit sections over the modality union. */
export type StudioCategorizedGroup = CategorizedGroup<StudioEntityView>;

/**
 * The studio's unified entity view over a detection's audit. An audit is a single
 * modality (`report.body.modality`), so this dispatches to the matching per-
 * modality composable and exposes one entity stream + grouped list + count,
 * regardless of whether the file is text/tabular or an image. The audit panel,
 * the count badge, and the redaction path consume this without caring which
 * modality produced it.
 */
export function useStudioEntities(
	audit: MaybeRefOrGetter<Audit | null>,
	documentText?: MaybeRefOrGetter<string | null>,
	docxParts?: MaybeRefOrGetter<Map<string, Uint8Array> | null>,
) {
	// Both run (composables can't be called conditionally); each returns [] for a
	// modality that isn't its own, so exactly one is active for a given audit. Pick
	// that one — image audits flow through `image`, text/tabular through `text` —
	// and surface its stream, so the branch is expressed once.
	const text = useTextEntities(audit, documentText, docxParts);
	const image = useImageEntities(audit);

	const active = computed(() =>
		toValue(audit)?.report.body?.modality === "image" ? image : text,
	);

	const entities = computed<StudioEntityView[]>(
		() => active.value.entities.value,
	);
	const categorizedGroups = computed<StudioCategorizedGroup[]>(
		() => active.value.categorizedGroups.value,
	);
	const count = computed(() => active.value.count.value);

	return { entities, categorizedGroups, count };
}
