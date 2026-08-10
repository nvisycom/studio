<script setup lang="ts">
import type { Component } from "vue";
import { MoreHorizontal } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { TableCell, TableRow } from "#console/components/ui/table";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "#console/components/ui/context-menu";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
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
	/** Actions shown on right-click (whole row) and via the ⋯ dropdown. */
	actions: RowAction[];
	/** Accessible label for the dropdown trigger button. */
	menuLabel: string;
	/** Passed through to the row (e.g. hover/cursor classes). */
	rowClass?: string;
}>();
</script>

<template>
  <!--
    A table row whose actions live in exactly one place. Right-clicking the row
    opens the context menu; the trailing ⋯ button opens the same items as a
    hover dropdown. The data cells are supplied by the default slot.
  -->
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <TableRow :class="rowClass">
        <slot />
        <TableCell class="text-right" @click.stop>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="size-8 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                :aria-label="menuLabel"
              >
                <MoreHorizontal :size="16" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <template v-for="action in actions" :key="action.key">
                <DropdownMenuSeparator v-if="action.separatorBefore" />
                <DropdownMenuItem
                  :disabled="action.disabled"
                  :class="
                    action.danger && 'text-destructive focus:text-destructive'
                  "
                  @click="action.select()"
                >
                  <component :is="action.icon" :size="14" class="mr-2" />
                  {{ action.label }}
                </DropdownMenuItem>
              </template>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    </ContextMenuTrigger>
    <ContextMenuContent>
      <template v-for="action in actions" :key="action.key">
        <ContextMenuSeparator v-if="action.separatorBefore" />
        <ContextMenuItem
          :disabled="action.disabled"
          :class="[
            'cursor-pointer',
            action.danger && 'text-destructive focus:text-destructive',
          ]"
          @click="action.select()"
        >
          <component :is="action.icon" :size="14" class="mr-2" />
          {{ action.label }}
        </ContextMenuItem>
      </template>
    </ContextMenuContent>
  </ContextMenu>
</template>
