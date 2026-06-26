<script setup lang="ts">
import type { Webhook } from "@nvisy/sdk/datatypes";
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

const { t } = useI18n();

interface Props {
	open?: boolean;
	webhook?: Webhook | null;
	isLoading?: boolean;
}

interface Emits {
	(e: "update:open", value: boolean): void;
	(e: "delete", webhookId: string): void;
}

const props = withDefaults(defineProps<Props>(), {
	open: false,
	webhook: null,
	isLoading: false,
});

const emit = defineEmits<Emits>();

function handleOpenChange(open: boolean) {
	emit("update:open", open);
}

function confirmDelete() {
	if (!props.webhook) return;
	emit("delete", props.webhook.webhookId);
}

function cancel() {
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
          <DialogTitle>{{
            t("integrations.dialogs.deleteWebhook.title")
          }}</DialogTitle>
        </div>
        <DialogDescription>
          {{ t("integrations.dialogs.deleteWebhook.description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="py-4">
        <div
          class="p-4 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
        >
          <p class="text-sm text-neutral-900 dark:text-white font-medium mb-1">
            {{ webhook?.displayName }}
          </p>
          <p
            class="text-xs text-neutral-500 dark:text-neutral-500 font-mono truncate"
          >
            {{ webhook?.url }}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="cancel">
          {{ t("integrations.dialogs.deleteWebhook.cancel") }}
        </Button>
        <Button
          variant="destructive"
          @click="confirmDelete"
          :disabled="isLoading"
        >
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("integrations.dialogs.deleteWebhook.confirm") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
