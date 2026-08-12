<script setup lang="ts">
import type { File as NvisyFile, UpdateFile } from "@nvisy/sdk/datatypes";
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
	file?: NvisyFile | null;
	isLoading?: boolean;
}

interface Emits {
	(e: "update:open", value: boolean): void;
	(e: "update", data: UpdateFile): void;
}

const props = withDefaults(defineProps<Props>(), {
	open: false,
	file: null,
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
	if (!props.file) return false;
	return displayName.value.trim() !== props.file.displayName;
});

// Repopulate the form whenever the file changes or the dialog reopens.
watch(
	[() => props.open, () => props.file],
	() => {
		if (props.open && props.file) {
			populateForm(props.file);
		}
	},
	{ immediate: true },
);

// Functions
function populateForm(file: NvisyFile) {
	displayName.value = file.displayName;
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

function updateFile() {
	if (!isFormValid.value || !props.file) return;

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
        <DialogTitle>{{ t("files.dialogs.edit.title") }}</DialogTitle>
        <DialogDescription>
          {{ t("files.dialogs.edit.description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6 py-6">
        <!-- File Name -->
        <div>
          <Label required class="mb-2 text-sm font-medium">
            {{ t("files.dialogs.edit.nameLabel") }}
          </Label>
          <Input
            v-model="displayName"
            :placeholder="t('files.dialogs.edit.namePlaceholder')"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="cancel">
          {{ t("files.dialogs.edit.cancel") }}
        </Button>
        <Button
          @click="updateFile"
          :disabled="!isFormValid || !hasChanges || isLoading"
        >
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("files.dialogs.edit.save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
