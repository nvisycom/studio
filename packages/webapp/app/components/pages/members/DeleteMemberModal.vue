<script setup lang="ts">
import type { Member } from "@nvisy/sdk";
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
  member?: Member | null;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "confirm"): void;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  member: null,
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
          <DialogTitle>{{ t("members.modals.delete.title") }}</DialogTitle>
        </div>
        <DialogDescription>
          {{
            t("members.modals.delete.description", {
              name: member?.displayName,
            })
          }}
        </DialogDescription>
      </DialogHeader>

      <!-- Member details preview -->
      <div class="py-4">
        <div
          class="p-4 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
        >
          <p class="text-sm text-neutral-900 dark:text-white font-medium mb-1">
            {{ member?.displayName }}
          </p>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            {{ member?.emailAddress }}
          </p>
          <p class="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
            {{ t("members.modals.delete.role") }}:
            {{
              member?.memberRole ? t(`members.roles.${member.memberRole}`) : ""
            }}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="cancel">
          {{ t("members.modals.delete.cancelButton") }}
        </Button>
        <Button variant="destructive" @click="confirm">
          {{ t("members.modals.delete.confirmButton") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
