import type { MaybeRefOrGetter } from "vue";

/** An extra, non-catalogue label offered alongside the catalogue (e.g. custom). */
export interface ExtraLabel {
	id: string;
	name: string;
}

/** A named list section for the picker: `[category, labels]`. */
export type LabelSection = [string, { id: string }[]];

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
			? [[t("common.labelPicker.custom"), named]]
			: [];
		const catalog = Object.entries(labelsByCategory.value).sort(([a], [b]) => {
			if (!a) return 1;
			if (!b) return -1;
			return a.localeCompare(b);
		});
		return [...custom, ...catalog];
	});

	return { sections, labelName, isLoading };
}
