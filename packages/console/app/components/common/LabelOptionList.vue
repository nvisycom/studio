<script setup lang="ts">
import type { LabelSection } from "#console/composables/useLabelOptions";
import { Check } from "@lucide/vue";
import {
	ComboboxEmpty,
	ComboboxGroup,
	ComboboxItem,
} from "#console/components/ui/combobox";

/**
 * The catalogue option list shared by the label pickers: an empty/loading state
 * plus the category-grouped items. The caller owns the surrounding `Combobox` +
 * anchor/input (which differ between the single and multi pickers) and supplies
 * the derived `sections`/`labelName` (from `useLabelOptions`) plus a `selected`
 * predicate that drives each item's check mark.
 */
const { t } = useI18n();

defineProps<{
	sections: LabelSection[];
	labelName: (id: string) => string;
	isLoading: boolean;
	/** Whether a label id is currently selected (single or multi). */
	selected: (id: string) => boolean;
}>();
</script>

<template>
  <div class="max-h-72 overflow-y-auto">
    <ComboboxEmpty>
      {{ isLoading ? t("common.labelPicker.loading") : t("common.labelPicker.empty") }}
    </ComboboxEmpty>
    <ComboboxGroup
      v-for="[category, labels] in sections"
      :key="category || '__uncategorized__'"
    >
      <div
        class="px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {{ category || t("common.labelPicker.uncategorized") }}
      </div>
      <ComboboxItem v-for="label in labels" :key="label.id" :value="label.id">
        <Check
          :size="14"
          class="mr-2 shrink-0"
          :class="selected(label.id) ? 'opacity-100' : 'opacity-0'"
        />
        <span class="truncate">{{ labelName(label.id) }}</span>
      </ComboboxItem>
    </ComboboxGroup>
  </div>
</template>
