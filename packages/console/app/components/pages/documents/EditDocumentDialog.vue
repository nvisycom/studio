<script setup lang="ts">
import type {
	WorkspaceDocument as NvisyDocument,
	UpdateWorkspaceDocument,
} from "@nvisy/sdk/datatypes";
import { Loader2 } from "@lucide/vue";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { Button } from "#console/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";

const { t } = useI18n();

interface Props {
	open?: boolean;
	document?: NvisyDocument | null;
	isLoading?: boolean;
}

interface Emits {
	(e: "update:open", value: boolean): void;
	(e: "update", data: UpdateWorkspaceDocument): void;
}

const props = withDefaults(defineProps<Props>(), {
	open: false,
	document: null,
	isLoading: false,
});

const emit = defineEmits<Emits>();

// Form data
const displayName = ref("");

// Computed validation
const isFormValid = computed(() => {
	return displayName.value.trim().length > 0;
});

const hasChanges = computed(() => {
	if (!props.document) return false;
	return displayName.value.trim() !== props.document.displayName;
});

// Repopulate the form whenever the file changes or the dialog reopens.
watch(
	[() => props.open, () => props.document],
	() => {
		if (props.open && props.document) {
			populateForm(props.document);
		}
	},
	{ immediate: true },
);

// Functions
function populateForm(document: NvisyDocument) {
	displayName.value = document.displayName;
}

function handleOpenChange(open: boolean) {
	if (!open) {
		resetForm();
	}
	emit("update:open", open);
}

function resetForm() {
	displayName.value = "";
}

function updateDocument() {
	if (!isFormValid.value || !props.document) return;

	emit("update", {
		displayName: displayName.value.trim(),
	});
}

function cancel() {
	resetForm();
	emit("update:open", false);
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ t("documents.dialogs.edit.title") }}</DialogTitle>
        <DialogDescription>
          {{ t("documents.dialogs.edit.description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6 py-6">
        <!-- File Name -->
        <div>
          <Label required class="mb-2 text-sm font-medium">
            {{ t("documents.dialogs.edit.nameLabel") }}
          </Label>
          <Input
            v-model="displayName"
            :placeholder="t('documents.dialogs.edit.namePlaceholder')"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="cancel">
          {{ t("documents.dialogs.edit.cancel") }}
        </Button>
        <Button
          @click="updateDocument"
          :disabled="!isFormValid || !hasChanges || isLoading"
        >
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("documents.dialogs.edit.save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
