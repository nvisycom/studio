import type { Audit } from "@nvisy/sdk/datatypes";
import type { MaybeRefOrGetter } from "vue";
import type { CategorizedGroup } from "#console/composables/useEntities";
import type { TextEntityView } from "#console/composables/useTextEntities";
import type { ImageEntityView } from "#console/composables/useImageEntities";
import type { AudioEntityView } from "#console/composables/useAudioEntities";

/**
 * A detected studio entity of any modality — the union the audit list, the count,
 * and the redaction edit path all work with. Each variant extends
 * {@link BaseEntityView} and carries a `modality` discriminator; the modality-
 * specific location (text byte offsets / image box / audio span) lives on each.
 */
export type StudioEntityView =
	| TextEntityView
	| ImageEntityView
	| AudioEntityView;

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
	// All run (composables can't be called conditionally); each returns [] for a
	// modality that isn't its own, so exactly one is active for a given audit. Pick
	// that one by the audit's modality and surface its stream, so the branch is
	// expressed once.
	const text = useTextEntities(audit, documentText, docxParts);
	const image = useImageEntities(audit);
	const audio = useAudioEntities(audit);

	const active = computed(() => {
		switch (toValue(audit)?.report.body?.modality) {
			case "image":
				return image;
			case "audio":
				return audio;
			default:
				return text;
		}
	});

	const entities = computed<StudioEntityView[]>(
		() => active.value.entities.value,
	);
	const categorizedGroups = computed<StudioCategorizedGroup[]>(
		() => active.value.categorizedGroups.value,
	);
	const count = computed(() => active.value.count.value);

	return { entities, categorizedGroups, count };
}
