<script setup lang="ts">
import { ref, watch } from "vue";
import type { ApiToken } from "@nvisy/sdk";
import { Edit } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  token: ApiToken | null;
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

function closeModal() {
  emit("update:open", false);
  // Reset to original name
  if (props.token) {
    newTokenName.value = props.token.name;
  }
}

function confirmRename() {
  if (newTokenName.value.trim()) {
    emit("confirm", newTokenName.value.trim());
    closeModal();
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="closeModal">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Rename Token</DialogTitle>
        <DialogDescription>
          Enter a new name for this API token. This will not affect the token's
          functionality.
        </DialogDescription>
      </DialogHeader>
      <div class="py-4">
        <Label for="tokenName" class="mb-2 block">Token Name</Label>
        <Input
          id="tokenName"
          v-model="newTokenName"
          placeholder="e.g., Production API"
          @keyup.enter="confirmRename"
        />
      </div>
      <DialogFooter>
        <Button @click="closeModal" variant="outline"> Cancel </Button>
        <Button
          @click="confirmRename"
          :disabled="!newTokenName.trim() || newTokenName === token?.name"
        >
          <Edit :size="16" class="mr-2" />
          Rename
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
