<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { cn } from "#console/utils/shadcn";

const props = defineProps<{
	class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <span
    data-slot="breadcrumb-page"
    role="link"
    aria-disabled="true"
    aria-current="page"
    :class="cn('text-foreground text-sm font-normal', props.class)"
  >
    <slot />
  </span>
</template>
