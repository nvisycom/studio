<script setup lang="ts">
import type { Component } from "vue";
import type { RowAction } from "./RowActionItems.vue";
import { MoreHorizontal } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { TableCell, TableRow } from "#console/components/ui/table";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuTrigger,
} from "#console/components/ui/context-menu";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import RowActionItems from "./RowActionItems.vue";

export type { RowAction } from "./RowActionItems.vue";

/** A single destructive bulk action shown when multiple rows are selected. */
export interface BulkAction {
	label: string;
	icon: Component;
	/** Selected-row count, appended as "(n)". */
	count: number;
	select: () => void;
}

/** Selection state that switches the menu to bulk-vs-single behavior. */
export interface RowSelection {
	/** Whether this row is part of the current selection. */
	selected: boolean;
	/** Total selected rows. */
	count: number;
	bulk: BulkAction;
}

const props = defineProps<{
	/** Per-row actions (the single-row menu, and the ⋯ dropdown). */
	actions?: RowAction[];
	/** Accessible label for the dropdown trigger button. */
	menuLabel?: string;
	/** Passed through to the row (hover/cursor classes). */
	rowClass?: string;
	/**
	 * When set, the component is a selection row: context-menu only (no ⋯
	 * cell), showing the bulk action while >1 rows are selected, else the
	 * per-row actions (or the `#single` slot).
	 */
	selection?: RowSelection;
}>();

/** Bulk mode: this row is selected and it's part of a multi-selection. */
const showBulk = computed(
	() => !!props.selection?.selected && (props.selection?.count ?? 0) > 1,
);

/** The bulk action rendered as a one-item action list. */
const bulkActions = computed<RowAction[]>(() =>
	props.selection
		? [
				{
					key: "bulk",
					label: `${props.selection.bulk.label} (${props.selection.bulk.count})`,
					icon: props.selection.bulk.icon,
					danger: true,
					select: props.selection.bulk.select,
				},
			]
		: [],
);
</script>

<template>
  <!--
    Selection mode: context menu only, branching bulk-vs-single. The row markup
    (checkbox + cells + click handling) is owned by the table via the default
    slot; `#single` overrides the single-row menu for tables whose per-row
    actions don't fit a flat list.
  -->
  <ContextMenu v-if="selection">
    <ContextMenuTrigger as-child>
      <slot />
    </ContextMenuTrigger>
    <ContextMenuContent>
      <RowActionItems v-if="showBulk" :actions="bulkActions" variant="context" />
      <slot v-else name="single">
        <RowActionItems :actions="actions ?? []" variant="context" />
      </slot>
    </ContextMenuContent>
  </ContextMenu>

  <!--
    Action mode: a full row whose actions live in one place — right-click opens
    the context menu; the trailing ⋯ button opens the same items as a dropdown.
    The data cells come from the default slot.
  -->
  <ContextMenu v-else>
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
              <RowActionItems :actions="actions ?? []" variant="dropdown" />
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    </ContextMenuTrigger>
    <ContextMenuContent>
      <RowActionItems :actions="actions ?? []" variant="context" />
    </ContextMenuContent>
  </ContextMenu>
</template>
