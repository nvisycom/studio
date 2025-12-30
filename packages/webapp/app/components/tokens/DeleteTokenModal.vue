<script setup lang="ts">
import type { ApiToken } from "@nvisy/sdk";
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
  token: ApiToken | null;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "confirm"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

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
        <DialogTitle>Revoke Token</DialogTitle>
        <DialogDescription>
          Are you sure you want to revoke "{{ token?.name }}"? This action
          cannot be undone and any applications using this token will lose
          access.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button @click="closeModal" variant="outline"> Cancel </Button>
        <Button @click="confirmDelete" variant="destructive">
          <Trash2 :size="16" class="mr-2" />
          Revoke Token
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
