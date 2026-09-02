<script setup lang="ts">
import type { Feature } from "#console/composables/useFeatures";

const props = defineProps<{ feature: Feature }>();

const { has } = useFeatures();
const enabled = computed(() => has(props.feature));
</script>

<template>
  <slot v-if="enabled" />
</template>
