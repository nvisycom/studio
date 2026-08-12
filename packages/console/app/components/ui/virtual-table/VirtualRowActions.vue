<script setup lang="ts">
import { MoreHorizontal } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import RowActionItems from "#console/components/pages/RowActionItems.vue";
import type { RowAction } from "#console/components/pages/RowActionItems.vue";

/**
 * The trailing ⋯ actions cell for VirtualTable rows — a dropdown of the row's
 * actions. Kept as its own SFC so the table's column def stays a one-liner
 * rather than a deep `h()` tree.
 */
defineProps<{
	actions: RowAction[];
	menuLabel: string;
}>();
</script>

<template>
  <div v-if="actions.length" class="text-right" @click.stop>
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
        <RowActionItems :actions="actions" variant="dropdown" />
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
