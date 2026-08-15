<script setup lang="ts">
import { refDebounced } from "@vueuse/core";
import { Check, ChevronsUpDown, File as FileIcon } from "@lucide/vue";
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
 * A single-file picker with server-side search. Typing queries the files API
 * (case-insensitive partial name match), so it reaches any file in the
 * workspace rather than only a first page. The model is the selected file id,
 * or null for "no file".
 *
 * The trigger shows the selected file's name even after the search results
 * move on — the label is remembered from the moment of selection.
 */
const { t } = useI18n();

defineOptions({ inheritAttrs: false });

const model = defineModel<string | null>({ default: null });

withDefaults(
	defineProps<{
		/** Placeholder shown when nothing is selected. */
		placeholder?: string;
		contentClass?: string;
	}>(),
	{},
);

// Search box → debounced → the files query, so keystrokes don't spam the API.
const search = ref("");
const debouncedSearch = refDebounced(search, 250);
const { files } = useFiles({
	query: computed(() => ({ search: debouncedSearch.value || undefined })),
	pageSize: 20,
});

// Remember the chosen file's name so the trigger label survives the search
// results changing. Seed it from whichever result matches the current model.
const selectedLabel = ref("");
watch(
	[() => model.value, files],
	([id, list]) => {
		if (!id) {
			selectedLabel.value = "";
			return;
		}
		const match = list?.find((f) => f.id === id);
		if (match) selectedLabel.value = match.displayName;
	},
	{ immediate: true },
);

// Start each open with a fresh, empty search field.
function resetSearch() {
	search.value = "";
}

// reka echoes the selected item's value into ComboboxInput on select — for a
// string model that's the file id. Return "" so nothing is ever echoed; our own
// `search` v-model is the only thing that fills the box.
const displayValue = () => "";
</script>

<template>
  <Combobox v-model="model" :ignore-filter="true" @update:open="resetSearch">
    <ComboboxAnchor as-child>
      <ComboboxTrigger as-child>
        <Button
          v-bind="$attrs"
          variant="outline"
          size="sm"
          class="h-9 justify-between gap-2 font-normal"
        >
          <span class="flex min-w-0 items-center gap-2">
            <FileIcon :size="14" class="shrink-0 text-muted-foreground" />
            <span class="truncate">
              {{ selectedLabel || placeholder || t("common.filePicker.placeholder") }}
            </span>
          </span>
          <ChevronsUpDown :size="14" class="shrink-0 text-muted-foreground" />
        </Button>
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxList align="start" :class="contentClass ?? 'w-64'">
      <!-- ComboboxInput drives reka's item registry (so results show). Its
           :display-value returns "" so reka never echoes the selected file id
           into the box; our own v-model is the search term. The wrapper renders
           its own search icon and border. -->
      <ComboboxInput
        v-model="search"
        :display-value="displayValue"
        :placeholder="t('common.filePicker.search')"
      />
      <ComboboxEmpty>{{ t("common.filePicker.empty") }}</ComboboxEmpty>
      <ComboboxGroup>
        <ComboboxItem
          v-for="file in files ?? []"
          :key="file.id"
          :value="file.id"
        >
          <Check
            :size="14"
            class="mr-2 shrink-0"
            :class="model === file.id ? 'opacity-100' : 'opacity-0'"
          />
          <span class="truncate">{{ file.displayName }}</span>
        </ComboboxItem>
      </ComboboxGroup>
    </ComboboxList>
  </Combobox>
</template>
