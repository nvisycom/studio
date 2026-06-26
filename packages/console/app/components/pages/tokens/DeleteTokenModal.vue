<script setup lang="ts">
import type { ApiToken } from "@nvisy/sdk/datatypes";
import { AlertCircle } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";

interface Props {
	open: boolean;
	token: ApiToken | null;
}

interface Emits {
	(e: "update:open", value: boolean): void;
	(e: "confirm"): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();

function closeModal() {
	emit("update:open", false);
}

function confirmDelete() {
	emit("confirm");
}
</script>

<template>
  <Dialog :open="open" @update:open="closeModal">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <div class="flex items-center gap-3 mb-2">
          <div class="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertCircle :size="20" class="text-red-600 dark:text-red-400" />
          </div>
          <DialogTitle>{{ t("tokens.modals.delete.title") }}</DialogTitle>
        </div>
        <DialogDescription>
          {{ t("tokens.modals.delete.description", { name: token?.name }) }}
        </DialogDescription>
      </DialogHeader>

      <div class="py-4">
        <div
          class="p-4 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
        >
          <p class="text-sm text-neutral-900 dark:text-white font-medium mb-1">
            {{ token?.name }}
          </p>
          <p class="text-xs text-neutral-500 dark:text-neutral-500">
            {{ t("tokens.modals.delete.lastUsed") }}:
            {{ token?.lastUsedAt ?? t("tokens.modals.delete.never") }}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="closeModal">
          {{ t("tokens.modals.delete.cancelButton") }}
        </Button>
        <Button variant="destructive" @click="confirmDelete">
          {{ t("tokens.modals.delete.confirmButton") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
