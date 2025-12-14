<script setup lang="ts">
import { ref, watch } from "vue";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
	(e: "confirm", newName: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const newTokenName = ref("");

// Watch for token changes to update the input
watch(
	() => props.token,
	(token) => {
		if (token) {
			newTokenName.value = token.name;
		}
	},
	{ immediate: true },
);

function handleConfirm() {
	if (newTokenName.value.trim()) {
		emit("confirm", newTokenName.value.trim());
		emit("update:open", false);
	}
}

function handleCancel() {
	emit("update:open", false);
	// Reset to original name
	if (props.token) {
		newTokenName.value = props.token.name;
	}
}
</script>

<template>
  <AlertDialog :open="open" @update:open="emit('update:open', $event)">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Rename Token</AlertDialogTitle>
        <AlertDialogDescription>
          Enter a new name for this API token. This will not affect the token's
          functionality.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div class="py-4">
        <Label for="tokenName" class="mb-2 block">Token Name</Label>
        <Input
          id="tokenName"
          v-model="newTokenName"
          placeholder="e.g., Production API"
          @keyup.enter="handleConfirm"
        />
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel @click="handleCancel">Cancel</AlertDialogCancel>
        <AlertDialogAction
          @click="handleConfirm"
          :disabled="!newTokenName.trim() || newTokenName === token?.name"
        >
          Rename
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
