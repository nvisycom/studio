<script setup lang="ts">
import type { TooltipProviderProps } from "reka-ui";

const _props = withDefaults(defineProps<TooltipProviderProps>(), {
	delayDuration: 0,
});
</script>

<template>
  <TooltipProvider v-bind="props">
    <slot />
  </TooltipProvider>
</template>
