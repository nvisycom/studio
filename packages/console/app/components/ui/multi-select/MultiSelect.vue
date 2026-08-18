<script setup lang="ts" generic="T extends string">
import type { Component } from "vue";
import { Check, Filter } from "@lucide/vue";
import { Badge } from "#console/components/ui/badge";
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

interface Option {
	value: T;
	label: string;
}

// Forward attrs onto the trigger, not the (renderless) Combobox root, so a
// caller's data-testid / aria-* / title lands on the element they interact with.
defineOptions({ inheritAttrs: false });

const model = defineModel<T[]>({ default: () => [] });

const props = withDefaults(
	defineProps<{
		options: Option[];
		label: string;
		searchable?: boolean;
		searchPlaceholder?: string;
		emptyText?: string;
		itemClass?: string;
		contentClass?: string;
		/** Trigger button variant (default `outline`; `ghost` for a quieter look). */
		variant?: "outline" | "ghost";
		/**
		 * Icon-only trigger: show `icon` (or a filter glyph) plus the count badge,
		 * with the label in the tooltip. For a compact header/toolbar.
		 */
		compact?: boolean;
		/** Trigger icon; defaults to a filter glyph. */
		icon?: Component;
	}>(),
	{ searchable: false, variant: "outline", compact: false },
);

function isSelected(value: T): boolean {
	return model.value.includes(value);
}
</script>

<template>
  <Combobox v-model="model" multiple>
    <ComboboxAnchor as-child class="w-auto">
      <ComboboxTrigger as-child>
        <!-- Compact: icon-only trigger with the count badge and a tooltip. -->
        <Button
          v-if="props.compact"
          v-bind="$attrs"
          :variant="model.length ? 'secondary' : props.variant"
          size="icon-sm"
          class="relative size-8"
          :title="props.label"
          :aria-label="props.label"
        >
          <component :is="props.icon ?? Filter" :size="16" />
          <span
            v-if="model.length"
            class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground"
          >
            {{ model.length }}
          </span>
        </Button>
        <!-- Default: labelled button. -->
        <Button
          v-else
          v-bind="$attrs"
          :variant="props.variant"
          size="sm"
          class="h-9 font-normal"
        >
          <component
            :is="props.icon ?? Filter"
            :size="14"
            class="mr-2 text-muted-foreground"
          />
          {{ props.label }}
          <Badge v-if="model.length" variant="secondary" class="ml-2">
            {{ model.length }}
          </Badge>
        </Button>
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxList align="end" :class="props.contentClass ?? 'w-52'">
      <ComboboxInput
        v-if="props.searchable"
        :placeholder="props.searchPlaceholder"
      />
      <ComboboxEmpty>{{ props.emptyText }}</ComboboxEmpty>
      <ComboboxGroup>
        <ComboboxItem
          v-for="option in props.options"
          :key="option.value"
          :value="option.value"
          :class="props.itemClass"
        >
          <Check
            :size="14"
            class="mr-2"
            :class="isSelected(option.value) ? 'opacity-100' : 'opacity-0'"
          />
          {{ option.label }}
        </ComboboxItem>
      </ComboboxGroup>
    </ComboboxList>
  </Combobox>
</template>
