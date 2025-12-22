<script setup lang="ts">
import { ref, computed, watch } from "vue";
import Input from "@/components/ui/input/Input.vue";
import Button from "@/components/ui/button/Button.vue";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface Webhook {
	id: string;
	name: string;
	url: string;
	status: "active" | "inactive";
	events: string[];
	createdAt: Date;
	lastDelivery: Date;
}

interface Props {
	open?: boolean;
	webhook?: Webhook | null;
}

interface Emits {
	(e: "update:open", value: boolean): void;
	(e: "delete", webhookId: string): void;
}

const props = withDefaults(defineProps<Props>(), {
	open: false,
	webhook: null,
});

const emit = defineEmits<Emits>();

// Form data
const confirmationText = ref("");

// Computed validation
const isConfirmationValid = computed(() => {
	return confirmationText.value === props.webhook?.name;
});

// Watch for dialog open/close to reset form
watch(
	() => props.open,
	(isOpen) => {
		if (!isOpen) {
			confirmationText.value = "";
		}
	},
);

// Functions
function handleOpenChange(open: boolean) {
	emit("update:open", open);
}

function confirmDelete() {
	if (!isConfirmationValid.value || !props.webhook) return;

	emit("delete", props.webhook.id);
	emit("update:open", false);
}

function cancel() {
	confirmationText.value = "";
	emit("update:open", false);
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Delete Webhook</DialogTitle>
        <DialogDescription>
          This action cannot be undone. This will permanently delete the webhook and stop all event deliveries.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <div>
          <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
            Please type <strong>{{ webhook?.name }}</strong> to confirm deletion:
          </p>
          <Input
            v-model="confirmationText"
            :placeholder="webhook?.name || ''"
            class="text-neutral-900 dark:text-white"
            @keyup.enter="confirmDelete"
          />
        </div>

        <div class="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p class="text-sm text-red-800 dark:text-red-200">
            <strong>Warning:</strong> Deleting this webhook will immediately stop all event deliveries to this endpoint.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          @click="cancel"
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          @click="confirmDelete"
          :disabled="!isConfirmationValid"
        >
          Delete Webhook
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
