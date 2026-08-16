<script setup lang="ts">
import type { ExtraLabel } from "#console/composables/useLabelOptions";
import { X } from "@lucide/vue";
import LabelOptionList from "./LabelOptionList.vue";
import {
	Combobox,
	ComboboxAnchor,
	ComboboxInput,
	ComboboxList,
} from "#console/components/ui/combobox";

/**
 * A multi-select picker over the global (builtin) label catalogue, styled like
 * a tag field: chosen labels sit as removable chips inside the box, with an
 * inline input to add more. The model is the list of selected label ids.
 * Labels are grouped by category and filtered client-side (the catalogue is
 * small and cached), showing each label's localized name.
 */
const { t } = useI18n();

defineOptions({ inheritAttrs: false });

const model = defineModel<string[]>({ default: () => [] });

const props = withDefaults(
	defineProps<{
		placeholder?: string;
		contentClass?: string;
		/** Drop the field's own border/padding when it sits inside another box. */
		borderless?: boolean;
		/**
		 * Extra, non-catalogue labels to offer (e.g. a policy's own custom
		 * labels). Grouped under their own section at the top of the list.
		 */
		extraLabels?: ExtraLabel[];
	}>(),
	{ extraLabels: () => [] },
);

const { sections, labelName, isLoading } = useLabelOptions(
	() => props.extraLabels,
);

function remove(id: string) {
	model.value = model.value.filter((v) => v !== id);
}
</script>

<template>
  <Combobox
    v-model="model"
    multiple
    :ignore-filter="false"
    :open-on-focus="true"
    :open-on-click="true"
  >
    <!-- Tag field: chips + inline search input inside one box. Borderless when
         it sits inside another framed container (e.g. a scope card). -->
    <ComboboxAnchor as-child>
      <div
        class="flex min-h-9 w-full flex-wrap items-center gap-1.5 text-sm"
        :class="
          borderless
            ? 'px-0'
            : 'rounded-md border border-input bg-transparent px-2 py-1.5 shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50'
        "
      >
        <span
          v-for="id in model"
          :key="id"
          class="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm font-normal text-secondary-foreground"
        >
          {{ labelName(id) }}
          <button
            type="button"
            class="rounded-sm text-muted-foreground transition-colors hover:text-foreground"
            :aria-label="t('common.labelPicker.remove', { name: labelName(id) })"
            @click="remove(id)"
          >
            <X :size="13" />
          </button>
        </span>
        <ComboboxInput
          class="h-6 min-w-24 flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
          :placeholder="model.length ? '' : (placeholder ?? t('common.labelPicker.placeholder'))"
        />
      </div>
    </ComboboxAnchor>

    <ComboboxList
      align="start"
      :class="contentClass ?? 'w-(--reka-popper-anchor-width) min-w-72'"
    >
      <LabelOptionList
        :sections="sections"
        :label-name="labelName"
        :is-loading="isLoading"
        :selected="(id) => model.includes(id)"
      />
    </ComboboxList>
  </Combobox>
</template>
