import type { MaybeRefOrGetter } from "vue";

/** An extra, non-catalogue label offered alongside the catalogue (e.g. custom). */
export interface ExtraLabel {
	id: string;
	name: string;
}

/**
 * A section of the picker list. `key` is a stable identity (distinct from the
 * display `label`, which is user/locale text that could collide across
 * sections); `label` is undefined for the uncategorized bucket.
 */
export interface LabelSection {
	key: string;
	label?: string;
	items: { id: string }[];
}

/**
 * The option list shared by the label pickers: the catalogue grouped by
 * category (uncategorized last) plus any `extraLabels` under their own "Custom"
 * group, and a name resolver that prefers an extra label, then the catalogue,
 * then the raw id. Only the id is used to render each item; the name resolves
 * via `labelName`.
 */
export function useLabelOptions(extraLabels: MaybeRefOrGetter<ExtraLabel[]>) {
	const { t } = useI18n();
	const { labelsByCategory, labelName: catalogName, isLoading } = useLabels();

	const extras = computed(() => toValue(extraLabels));

	function labelName(id: string): string {
		const extra = extras.value.find((l) => l.id === id);
		return extra ? extra.name : catalogName(id);
	}

	const sections = computed<LabelSection[]>(() => {
		const named = extras.value.filter((l) => l.name.trim());
		const custom: LabelSection[] = named.length
			? [{ key: "custom", label: t("common.labelPicker.custom"), items: named }]
			: [];
		const catalog: LabelSection[] = Object.entries(labelsByCategory.value)
			.sort(([a], [b]) => {
				if (!a) return 1;
				if (!b) return -1;
				return a.localeCompare(b);
			})
			.map(([category, items]) => ({
				// Namespace catalog keys so they can't collide with "custom".
				key: category ? `cat:${category}` : "uncategorized",
				label: category || undefined,
				items,
			}));
		return [...custom, ...catalog];
	});

	return { sections, labelName, isLoading };
}
