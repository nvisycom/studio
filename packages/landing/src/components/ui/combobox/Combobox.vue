<script setup lang="ts">
import type { ComboboxRootEmits, ComboboxRootProps } from "reka-ui";
import { useForwardPropsEmits } from "reka-ui";

const props = defineProps<ComboboxRootProps>();
const emits = defineEmits<ComboboxRootEmits>();

const _forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <ComboboxRoot
    data-slot="combobox"
    v-bind="forwarded"
  >
    <slot />
  </ComboboxRoot>
</template>
