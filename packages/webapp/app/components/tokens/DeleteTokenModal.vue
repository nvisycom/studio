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

interface Token {
	id: string;
	name: string;
	service: string;
	browser: string;
	os: string;
	authMethod: string;
	scope: string[];
	createdAt: Date;
	expiresAt: Date | null;
	lastUsed: Date | null;
	token?: string;
}

interface Props {
	open: boolean;
	token: Token | null;
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
        <DialogTitle>Delete Token</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete "{{ token?.name }}"? This action cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button @click="closeModal" variant="outline">
          Cancel
        </Button>
        <Button @click="confirmDelete" variant="destructive">
          <Trash2 :size="16" class="mr-2" />
          Delete Token
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
