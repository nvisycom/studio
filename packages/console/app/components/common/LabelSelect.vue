<script setup lang="ts">
import type { ExtraLabel } from "#console/composables/useLabelOptions";
import { ChevronsUpDown } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import LabelOptionList from "./LabelOptionList.vue";
import {
	Combobox,
	ComboboxAnchor,
	ComboboxInput,
	ComboboxList,
	ComboboxTrigger,
} from "#console/components/ui/combobox";

/**
 * A single-label picker over the global catalogue (plus any `extraLabels`, e.g.
 * a policy's own custom labels). The model is the chosen label id, or "" for
 * none. Compact enough for a table row; labels are grouped by category and
 * filtered by name.
 */
const { t } = useI18n();

defineOptions({ inheritAttrs: false });

const model = defineModel<string>({ default: "" });

const props = withDefaults(
	defineProps<{
		placeholder?: string;
		contentClass?: string;
		/** Extra, non-catalogue labels (e.g. custom labels), grouped first. */
		extraLabels?: ExtraLabel[];
	}>(),
	{ extraLabels: () => [] },
);

const { sections, labelName, isLoading } = useLabelOptions(
	() => props.extraLabels,
);
</script>

<template>
  <Combobox v-model="model" :ignore-filter="false" :open-on-click="true">
    <ComboboxAnchor as-child>
      <ComboboxTrigger as-child>
        <Button
          v-bind="$attrs"
          variant="outline"
          size="sm"
          class="h-9 w-full justify-between gap-2 font-normal"
        >
          <span class="truncate" :class="{ 'text-muted-foreground': !model }">
            {{ model ? labelName(model) : (placeholder ?? t("common.labelSelect.placeholder")) }}
          </span>
          <ChevronsUpDown :size="14" class="shrink-0 text-muted-foreground" />
        </Button>
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxList
      align="start"
      :class="contentClass ?? 'w-(--reka-popper-anchor-width) min-w-64'"
    >
      <ComboboxInput :placeholder="t('common.labelPicker.search')" />
      <LabelOptionList
        :sections="sections"
        :label-name="labelName"
        :is-loading="isLoading"
        :selected="(id) => model === id"
      />
    </ComboboxList>
  </Combobox>
</template>
