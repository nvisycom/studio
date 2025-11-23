<script setup lang="ts">
import type { SelectGroupProps } from "reka-ui";

const _props = defineProps<SelectGroupProps>();
</script>

<template>
  <SelectGroup
    data-slot="select-group"
    v-bind="props"
  >
    <slot />
  </SelectGroup>
</template>
