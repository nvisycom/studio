<script setup lang="ts">
import type { HTMLAttributes } from "vue";

const _props = defineProps<{
	class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <AvatarRoot
    data-slot="avatar"
    :class="cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', props.class)"
  >
    <slot />
  </AvatarRoot>
</template>
