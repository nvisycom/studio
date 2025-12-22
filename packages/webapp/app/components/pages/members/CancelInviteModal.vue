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
 * Pending invitation data structure
 */
interface Invite {
	id: string;
	email: string;
	role: string;
}

/**
 * Component props interface
 */
interface Props {
	/** Controls dialog visibility */
	open?: boolean;
	/** The invitation to be canceled */
	invite?: Invite | null;
}

/**
 * Component emits interface
 */
interface Emits {
	/** Emitted when dialog visibility changes */
	(e: "update:open", value: boolean): void;
	/** Emitted when user confirms cancellation */
	(e: "confirm"): void;
}

const props = withDefaults(defineProps<Props>(), {
	open: false,
	invite: null,
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
 * Confirm invitation cancellation
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
          <DialogTitle>Cancel Invitation</DialogTitle>
        </div>
        <DialogDescription>
          Are you sure you want to cancel the invitation for <strong>{{ invite?.email }}</strong>?
          They will not be able to join using the current invitation link.
        </DialogDescription>
      </DialogHeader>

      <!-- Invitation details preview -->
      <div class="py-4">
        <div class="p-4 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <p class="text-sm text-neutral-900 dark:text-white font-medium mb-1">
            {{ invite?.email }}
          </p>
          <p class="text-xs text-neutral-500 dark:text-neutral-500">
            Role: {{ invite?.role }}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="cancel">
          Keep Invitation
        </Button>
        <Button
          variant="destructive"
          @click="confirm"
        >
          Cancel
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
