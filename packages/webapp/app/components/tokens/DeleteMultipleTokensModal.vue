<script setup lang="ts">
import { Trash2 } from "lucide-vue-next";
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

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();

function closeModal() {
	emit("update:open", false);
}

function confirmDelete() {
	emit("confirm");
	closeModal();
}
</script>

<template>
  <Dialog :open="open" @update:open="closeModal">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t("tokens.modals.deleteMultiple.title") }}</DialogTitle>
        <DialogDescription>
          {{ t("tokens.modals.deleteMultiple.description", count) }}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button @click="closeModal" variant="outline">
          {{ t("tokens.modals.deleteMultiple.cancelButton") }}
        </Button>
        <Button @click="confirmDelete" variant="destructive">
          <Trash2 :size="16" class="mr-2" />
          {{ t("tokens.modals.deleteMultiple.confirmButton") }} ({{ count }})
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
