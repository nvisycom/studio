<script setup lang="ts">
import type { AccordionRootEmits, AccordionRootProps } from "reka-ui";
import { useForwardPropsEmits } from "reka-ui";

const props = defineProps<AccordionRootProps>();
const emits = defineEmits<AccordionRootEmits>();

const _forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <AccordionRoot data-slot="accordion" v-bind="forwarded">
    <slot />
  </AccordionRoot>
</template>
