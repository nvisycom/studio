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

interface Props {
	open: boolean;
	count: number;
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
          <DialogTitle>{{
            t("tokens.modals.deleteMultiple.title")
          }}</DialogTitle>
        </div>
        <DialogDescription>
          {{ t("tokens.modals.deleteMultiple.description", count) }}
        </DialogDescription>
      </DialogHeader>

      <div class="py-4">
        <div
          class="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
        >
          <p class="text-sm text-amber-900 dark:text-amber-100">
            <span class="font-medium"
              >{{ t("tokens.modals.deleteMultiple.warningTitle") }}:</span
            >
            {{ t("tokens.modals.deleteMultiple.warningDescription") }}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="closeModal">
          {{ t("tokens.modals.deleteMultiple.cancelButton") }}
        </Button>
        <Button variant="destructive" @click="confirmDelete">
          {{ t("tokens.modals.deleteMultiple.confirmButton") }} ({{ count }})
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
