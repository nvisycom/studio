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
  open?: boolean;
  count?: number;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "confirm"): void;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  count: 0,
});

const emit = defineEmits<Emits>();

const { t } = useI18n();

function handleOpenChange(open: boolean): void {
  emit("update:open", open);
}

function confirm(): void {
  emit("confirm");
}

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
          <DialogTitle>{{
            t("members.modals.cancelMultiple.title")
          }}</DialogTitle>
        </div>
        <DialogDescription>
          {{ t("members.modals.cancelMultiple.description", count) }}
        </DialogDescription>
      </DialogHeader>

      <!-- Information message -->
      <div class="py-4">
        <div
          class="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
        >
          <p class="text-sm text-amber-900 dark:text-amber-100">
            <span class="font-medium"
              >{{ t("members.modals.cancelMultiple.noteTitle") }}:</span
            >
            {{ t("members.modals.cancelMultiple.noteDescription") }}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="cancel">
          {{ t("members.modals.cancelMultiple.keepButton") }}
        </Button>
        <Button variant="destructive" @click="confirm">
          {{ t("members.modals.cancelMultiple.confirmButton") }} ({{ count }})
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
