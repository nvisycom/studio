<script setup lang="ts" generic="T extends string">
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
	}>(),
	{ searchable: false },
);

function isSelected(value: T): boolean {
	return model.value.includes(value);
}
</script>

<template>
  <Combobox v-model="model" multiple>
    <ComboboxAnchor as-child class="w-auto">
      <ComboboxTrigger as-child>
        <Button
          v-bind="$attrs"
          variant="outline"
          size="sm"
          class="h-9 font-normal"
        >
          <Filter :size="14" class="mr-2 text-muted-foreground" />
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
