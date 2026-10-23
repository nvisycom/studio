<script setup lang="ts">
import { Check, Plus, X } from "@lucide/vue";
// Bare reka-ui input (just the `<input>`, no search-icon/bordered wrapper): our
// themed `ComboboxInput` is built for a command-palette look, whose wrapper
// chrome doesn't belong inside an inline tag field.
import { ComboboxInput } from "reka-ui";
import {
	Combobox,
	ComboboxAnchor,
	ComboboxEmpty,
	ComboboxItem,
	ComboboxList,
} from "#console/components/ui/combobox";

/**
 * A tag field with suggestions: chosen values sit as removable chips inside the
 * box, an inline input filters a suggestion list, and a value the list doesn't
 * cover can still be typed and added (Enter, or the "Add" row). Suggestions are
 * hints, not an allow-list — used for the pipeline's jurisdiction/language scope,
 * where the codes are well-known but an exotic one must still be enterable.
 *
 * The model is the list of selected codes. Each suggestion carries a `value`
 * (the code stored) and a `label` (the display name shown beside it).
 */
interface Option {
	value: string;
	label: string;
}

defineOptions({ inheritAttrs: false });

const model = defineModel<string[]>({ default: () => [] });

const props = withDefaults(
	defineProps<{
		/** Suggested options (code + display name). */
		options: Option[];
		placeholder?: string;
		/** Label shown in the "Add «term»" custom-value row (e.g. "Add"). */
		addLabel?: string;
		/** Accessible name for a chip's remove button (the chip label is appended). */
		removeLabel?: string;
		/** Normalize a free-typed term before storing it (e.g. upper/lowercase). */
		normalize?: (raw: string) => string;
		contentClass?: string;
		id?: string;
	}>(),
	{ normalize: (raw: string) => raw.trim(), removeLabel: "Remove" },
);

const term = ref("");

// The display label for a chip: the option's name if known, else the raw code
// (a free-typed value has no option entry).
function chipLabel(value: string): string {
	return props.options.find((o) => o.value === value)?.label ?? value;
}

// Suggestions matching the typed term, by code prefix or name substring (case-
// insensitive), excluding already-selected ones. Capped so the list stays short.
const filtered = computed<Option[]>(() => {
	const q = term.value.trim().toLowerCase();
	const available = props.options.filter((o) => !model.value.includes(o.value));
	const matches = q
		? available.filter(
				(o) =>
					o.value.toLowerCase().startsWith(q) ||
					o.label.toLowerCase().includes(q),
			)
		: available;
	return matches.slice(0, 50);
});

// The normalized custom value for the current term, offered as an "Add" row when
// it isn't blank, isn't already selected, and doesn't match a known option — by
// its value (code) OR its label (name). A typed name like "Poland" matches the
// `PL` option's label, so the real option takes precedence over an "Add Poland".
const customValue = computed<string | null>(() => {
	const value = props.normalize(term.value);
	if (!value || model.value.includes(value)) return null;
	const q = term.value.trim().toLowerCase();
	if (
		props.options.some((o) => o.value === value || o.label.toLowerCase() === q)
	)
		return null;
	return value;
});

function add(value: string) {
	if (value && !model.value.includes(value))
		model.value = [...model.value, value];
	term.value = "";
}
function remove(value: string) {
	model.value = model.value.filter((v) => v !== value);
}

// Enter adds the custom value when the term doesn't match a suggestion; when it
// does, let the combobox select the highlighted item (don't double-handle).
function onEnter(event: Event) {
	if (customValue.value && filtered.value.length === 0) {
		event.preventDefault();
		add(customValue.value);
	}
}
</script>

<template>
  <Combobox
    v-model="model"
    multiple
    :ignore-filter="true"
    :reset-search-term-on-blur="false"
    :open-on-focus="true"
    :open-on-click="true"
  >
    <!-- Tag field: chips + inline filtering input inside one box. -->
    <ComboboxAnchor as-child>
      <div
        class="flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
      >
        <span
          v-for="value in model"
          :key="value"
          class="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-sm font-normal text-secondary-foreground"
        >
          {{ chipLabel(value) }}
          <button
            type="button"
            class="rounded-sm text-muted-foreground transition-colors hover:text-foreground"
            :aria-label="`${props.removeLabel} ${chipLabel(value)}`"
            @click="remove(value)"
          >
            <X :size="13" />
          </button>
        </span>
        <ComboboxInput
          :id="props.id"
          v-model="term"
          v-bind="$attrs"
          class="h-6 min-w-12 flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0"
          :placeholder="model.length ? '' : props.placeholder"
          @keydown.enter="onEnter"
        />
      </div>
    </ComboboxAnchor>

    <ComboboxList
      align="start"
      :class="props.contentClass ?? 'w-(--reka-popper-anchor-width) min-w-64'"
    >
      <ComboboxEmpty v-if="!customValue">
        {{ props.placeholder }}
      </ComboboxEmpty>
      <!-- The item list scrolls once it outgrows this height (the country list
           is long); the content box itself is overflow-hidden. -->
      <div class="max-h-72 overflow-y-auto">
        <!-- Matching options first, so a typed name/code resolves to a real
             option before the free-entry "Add" row below. -->
        <ComboboxItem
          v-for="option in filtered"
          :key="option.value"
          :value="option.value"
          class="gap-2"
          @select.prevent="add(option.value)"
        >
          <Check
            :size="14"
            :class="model.includes(option.value) ? 'opacity-100' : 'opacity-0'"
          />
          <span class="font-mono text-xs text-muted-foreground">
            {{ option.value }}
          </span>
          <span class="truncate">{{ option.label }}</span>
        </ComboboxItem>
        <!-- Add a free-typed value the suggestions don't cover. -->
        <ComboboxItem
          v-if="customValue"
          :value="customValue"
          class="gap-2"
          @select.prevent="add(customValue)"
        >
          <Plus :size="14" class="text-muted-foreground" />
          <span class="truncate">
            {{ props.addLabel }}
            <span class="font-medium">{{ customValue }}</span>
          </span>
        </ComboboxItem>
      </div>
    </ComboboxList>
  </Combobox>
</template>
