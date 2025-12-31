<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { Webhook } from "@nvisy/sdk";
import { Loader2 } from "lucide-vue-next";
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

// Form data
const confirmationText = ref("");

// Computed validation
const isConfirmationValid = computed(() => {
  return confirmationText.value === props.webhook?.displayName;
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
  emit("delete", props.webhook.webhookId);
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
        <DialogTitle>{{
          t("integrations.dialogs.deleteWebhook.title")
        }}</DialogTitle>
        <DialogDescription>
          {{ t("integrations.dialogs.deleteWebhook.description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <div>
          <p
            class="text-sm font-light text-neutral-600 dark:text-neutral-400 mb-2"
          >
            {{ t("integrations.dialogs.deleteWebhook.confirmLabel") }}
            <strong class="font-medium">{{ webhook?.displayName }}</strong>
          </p>
          <Input
            v-model="confirmationText"
            :placeholder="webhook?.displayName || ''"
            class="text-neutral-900 dark:text-white"
            @keyup.enter="confirmDelete"
          />
        </div>

        <div
          class="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
        >
          <p class="text-sm font-light text-red-800 dark:text-red-200">
            <strong class="font-medium">{{
              t("integrations.dialogs.deleteWebhook.warningTitle")
            }}</strong>
            {{ t("integrations.dialogs.deleteWebhook.warningDescription") }}
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
          :disabled="!isConfirmationValid || isLoading"
        >
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("integrations.dialogs.deleteWebhook.confirm") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
