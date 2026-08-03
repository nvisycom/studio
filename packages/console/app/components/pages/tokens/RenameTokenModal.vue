<script setup lang="ts">
import type { ApiToken } from "@nvisy/sdk/datatypes";
import { Edit } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";

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

const { t } = useI18n();

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
        <DialogTitle>{{ t("tokens.modals.rename.title") }}</DialogTitle>
        <DialogDescription>
          {{ t("tokens.modals.rename.description") }}
        </DialogDescription>
      </DialogHeader>
      <div class="py-4">
        <Label for="tokenName" class="mb-2 block font-normal">
          {{ t("tokens.modals.rename.nameLabel") }}
        </Label>
        <Input
          id="tokenName"
          v-model="newTokenName"
          :placeholder="t('tokens.create.namePlaceholder')"
          @keyup.enter="confirmRename"
        />
      </div>
      <DialogFooter>
        <Button @click="closeModal" variant="outline">
          {{ t("tokens.modals.rename.cancelButton") }}
        </Button>
        <Button
          @click="confirmRename"
          :disabled="!newTokenName.trim() || newTokenName === token?.name"
        >
          <Edit :size="16" class="mr-2" />
          {{ t("tokens.modals.rename.saveButton") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
