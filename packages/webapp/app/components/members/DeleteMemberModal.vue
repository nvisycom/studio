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
 * Team member data structure
 */
interface Member {
	id: string;
	name: string;
	email: string;
	role: string;
}

/**
 * Component props interface
 */
interface Props {
	/** Controls dialog visibility */
	open?: boolean;
	/** The member to be deleted */
	member?: Member | null;
}

/**
 * Component emits interface
 */
interface Emits {
	/** Emitted when dialog visibility changes */
	(e: "update:open", value: boolean): void;
	/** Emitted when user confirms deletion */
	(e: "confirm"): void;
}

const props = withDefaults(defineProps<Props>(), {
	open: false,
	member: null,
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
 * Confirm member deletion
 */
function confirm(): void {
	emit("confirm");
}

/**
 * Cancel the deletion and close dialog
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
          <DialogTitle>Delete Member</DialogTitle>
        </div>
        <DialogDescription>
          Are you sure you want to delete <strong>{{ member?.name }}</strong> from your team?
          This action cannot be undone.
        </DialogDescription>
      </DialogHeader>

      <!-- Member details preview -->
      <div class="py-4">
        <div class="p-4 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <p class="text-sm text-neutral-900 dark:text-white font-medium mb-1">
            {{ member?.name }}
          </p>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            {{ member?.email }}
          </p>
          <p class="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
            Role: {{ member?.role }}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="cancel">
          Cancel
        </Button>
        <Button
          variant="destructive"
          @click="confirm"
        >
          Delete Member
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
