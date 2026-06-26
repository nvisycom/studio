<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "#console/utils/shadcn";
import { Separator } from "#console/components/ui/separator";

const props = defineProps<{
	class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <Separator
    data-slot="sidebar-separator"
    data-sidebar="separator"
    :class="cn('bg-sidebar-border !w-full', props.class)"
  >
    <slot />
  </Separator>
</template>
