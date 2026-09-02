<script setup lang="ts">
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";

defineProps<{
	open?: boolean;
	title: string;
	description: string;
	/** Provider icon URL; the tile stays empty when absent. */
	icon?: string | null;
	iconAlt?: string;
}>();

const emit = defineEmits<(e: "update:open", value: boolean) => void>();
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-xl gap-0 p-0">
      <!-- Provider header -->
      <DialogHeader
        class="flex-row items-center gap-3 space-y-0 border-b border-border/60 p-6"
      >
        <div
          class="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40"
        >
          <img
            v-if="icon"
            :src="icon"
            :alt="iconAlt"
            class="size-6 object-contain"
          />
        </div>
        <div class="min-w-0 space-y-1">
          <DialogTitle class="truncate text-base">{{ title }}</DialogTitle>
          <DialogDescription class="text-sm">
            {{ description }}
          </DialogDescription>
        </div>
      </DialogHeader>

      <div class="max-h-[62vh] space-y-6 overflow-y-auto p-6">
        <slot />
      </div>

      <slot name="footer" />
    </DialogContent>
  </Dialog>
</template>
