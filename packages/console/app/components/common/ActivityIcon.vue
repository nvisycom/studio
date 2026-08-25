<script setup lang="ts">
import type { Component } from "vue";
import { activityActionColor } from "#console/utils/activities";

/**
 * An activity's icon: the category glyph in a muted tile with a small colored
 * corner dot for the action. The category says *what*, the dot's color says
 * *what happened* (created/updated/deleted/…) at a glance; the row's message
 * spells out the verb.
 */
const props = defineProps<{
	/** The category glyph (file, member, …). */
	icon: Component;
	/** The verb — the last segment of the event type. */
	action: string;
}>();

const dotClass = computed(() => activityActionColor(props.action));
</script>

<template>
  <div class="relative shrink-0">
    <div
      class="flex size-8 items-center justify-center rounded-md border border-border/60 bg-muted/40 text-muted-foreground"
    >
      <component :is="icon" :size="16" :stroke-width="1.75" />
    </div>
    <span
      class="absolute -bottom-px -right-px size-2 rounded-full ring-2 ring-background"
      :class="dotClass"
    />
  </div>
</template>
