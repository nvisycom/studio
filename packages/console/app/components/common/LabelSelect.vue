<script setup lang="ts">
import type { ExtraLabel } from "#console/composables/useLabelOptions";
import { Check, ChevronsUpDown } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import {
	Combobox,
	ComboboxAnchor,
	ComboboxEmpty,
	ComboboxGroup,
	ComboboxInput,
	ComboboxItem,
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
              :class="model === label.id ? 'opacity-100' : 'opacity-0'"
            />
            <span class="truncate">{{ labelName(label.id) }}</span>
          </ComboboxItem>
        </ComboboxGroup>
      </div>
    </ComboboxList>
  </Combobox>
</template>
