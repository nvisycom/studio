<script setup lang="ts">
import type { TooltipTriggerProps } from "reka-ui";

const _props = defineProps<TooltipTriggerProps>();
</script>

<template>
  <TooltipTrigger
    data-slot="tooltip-trigger"
    v-bind="props"
  >
    <slot />
  </TooltipTrigger>
</template>
