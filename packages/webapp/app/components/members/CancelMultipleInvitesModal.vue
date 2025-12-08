<script setup lang="ts">
import { AlertCircle } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

/**
 * Component props interface
 */
interface Props {
	/** Controls dialog visibility */
	open?: boolean;
	/** Number of invitations to be canceled */
	count?: number;
}

/**
 * Component emits interface
 */
interface Emits {
	/** Emitted when dialog visibility changes */
	(e: "update:open", value: boolean): void;
	/** Emitted when user confirms bulk cancellation */
	(e: "confirm"): void;
}

const props = withDefaults(defineProps<Props>(), {
	open: false,
	count: 0,
});

const emit = defineEmits<Emits>();

/**
 * Handle dialog visibility change
 * @param open - New visibility state
 */
function handleOpenChange(open: boolean): void {
	emit("update:open", open);
}

/**
 * Confirm bulk invitation cancellation
 */
function confirm(): void {
	emit("confirm");
}

/**
 * Cancel the action and close dialog
 */
function cancel(): void {
	emit("update:open", false);
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <div class="flex items-center gap-3 mb-2">
          <div class="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertCircle :size="20" class="text-red-600 dark:text-red-400" />
          </div>
          <DialogTitle>Cancel Multiple Invitations</DialogTitle>
        </div>
        <DialogDescription>
          Are you sure you want to cancel {{ count }} {{ count === 1 ? 'invitation' : 'invitations' }}?
          The invitation links will no longer be valid.
        </DialogDescription>
      </DialogHeader>

      <!-- Information message -->
      <div class="py-4">
        <div class="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p class="text-sm text-amber-900 dark:text-amber-100">
            <span class="font-medium">Note:</span> You can always send new invitations to these email addresses later.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="cancel">
          Keep
        </Button>
        <Button
          variant="destructive"
          @click="confirm"
        >
          Cancel {{ count }} {{ count === 1 ? 'Invitation' : 'Invitations' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
