<script setup lang="ts">
import type { Component } from "vue";

/**
 * The shared empty-state tile: an icon in a rounded muted square, a title, and an
 * optional description, centered in its container. Matches the empty state the
 * data tables render, so "nothing here yet" reads the same across the app. An
 * optional default slot renders a CTA under the text.
 */
defineProps<{
	icon: Component;
	title: string;
	description?: string;
	/** Smaller variant for a narrow panel (e.g. the studio inspector). */
	compact?: boolean;
}>();
</script>

<template>
  <div
    class="flex h-full flex-col items-center justify-center text-center"
    :class="compact ? 'gap-1 p-6' : 'min-h-[240px] py-16'"
  >
    <div
      class="flex items-center justify-center rounded-lg bg-muted/50"
      :class="compact ? 'mb-2 size-9' : 'mb-4 size-10'"
    >
      <component
        :is="icon"
        class="text-muted-foreground"
        :class="compact ? 'size-4.5' : 'size-5'"
      />
    </div>
    <p class="text-sm font-medium text-foreground">{{ title }}</p>
    <p
      v-if="description"
      class="max-w-sm text-sm text-muted-foreground"
      :class="compact ? '' : 'mt-1'"
    >
      {{ description }}
    </p>
    <div v-if="$slots.default" :class="compact ? 'mt-3' : 'mt-4'">
      <slot />
    </div>
  </div>
</template>
