<script setup lang="ts">
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";
import { Button } from "#console/components/ui/button";

interface Props {
	open: boolean;
	documentName: string;
}

interface Emits {
	(e: "update:open", value: boolean): void;
	(e: "confirm"): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

function handleConfirm() {
	emit("confirm");
	emit("update:open", false);
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Document</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete "{{ documentName }}"?
          <br />
          This action cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">
          Cancel
        </Button>
        <Button variant="destructive" @click="handleConfirm">
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
