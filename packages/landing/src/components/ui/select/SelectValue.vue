<script setup lang="ts">
import type { SelectValueProps } from "reka-ui";

const _props = defineProps<SelectValueProps>();
</script>

<template>
  <SelectValue
    data-slot="select-value"
    v-bind="props"
  >
    <slot />
  </SelectValue>
</template>
