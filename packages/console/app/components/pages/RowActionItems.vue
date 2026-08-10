<script setup lang="ts">
import type { Component } from "vue";
import {
	ContextMenuItem,
	ContextMenuSeparator,
} from "#console/components/ui/context-menu";
import {
	DropdownMenuItem,
	DropdownMenuSeparator,
} from "#console/components/ui/dropdown-menu";

/** One row action, rendered identically in the context and dropdown menus. */
export interface RowAction {
	/** Stable key for the v-for. */
	key: string;
	label: string;
	icon: Component;
	/** Styles the item as destructive. */
	danger?: boolean;
	disabled?: boolean;
	/** Render a separator above this item. */
	separatorBefore?: boolean;
	select: () => void;
}

defineProps<{
	actions: RowAction[];
	/** Which menu family to render into. */
	variant: "context" | "dropdown";
}>();
</script>

<template>
  <template v-for="action in actions" :key="action.key">
    <component
      :is="variant === 'context' ? ContextMenuSeparator : DropdownMenuSeparator"
      v-if="action.separatorBefore"
    />
    <component
      :is="variant === 'context' ? ContextMenuItem : DropdownMenuItem"
      :disabled="action.disabled"
      :class="[
        variant === 'context' && 'cursor-pointer',
        action.danger && 'text-destructive focus:text-destructive',
      ]"
      @click="action.select()"
    >
      <component :is="action.icon" :size="14" class="mr-2" />
      {{ action.label }}
    </component>
  </template>
</template>
