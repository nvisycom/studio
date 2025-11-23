<script setup lang="ts">
import type { AvatarImageProps } from "reka-ui";

const _props = defineProps<AvatarImageProps>();
</script>

<template>
  <AvatarImage
    data-slot="avatar-image"
    v-bind="props"
    class="aspect-square size-full"
  >
    <slot />
  </AvatarImage>
</template>
