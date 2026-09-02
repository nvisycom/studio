<script setup lang="ts">
import { AlertCircle, Loader2 } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";

withDefaults(
	defineProps<{
		open?: boolean;
		title: string;
		description: string;
		confirmLabel: string;
		cancelLabel: string;
		/** Disables the confirm button and shows a spinner. */
		isLoading?: boolean;
		/** Confirm button variant; destructive by default. */
		variant?: "destructive" | "default";
	}>(),
	{ open: false, isLoading: false, variant: "destructive" },
);

const emit = defineEmits<{
	(e: "update:open", value: boolean): void;
	(e: "confirm"): void;
}>();
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <div class="flex items-center gap-3 mb-2">
          <div class="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertCircle :size="20" class="text-red-600 dark:text-red-400" />
          </div>
          <DialogTitle>{{ title }}</DialogTitle>
        </div>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>

      <!-- Optional details/warning box supplied by the caller. -->
      <div v-if="$slots.details" class="py-4">
        <slot name="details" />
      </div>

      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">
          {{ cancelLabel }}
        </Button>
        <Button :variant="variant" :disabled="isLoading" @click="emit('confirm')">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ confirmLabel }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
