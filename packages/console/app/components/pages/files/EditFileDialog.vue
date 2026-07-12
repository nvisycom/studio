<script setup lang="ts">
import type { File as NvisyFile, UpdateFile } from "@nvisy/sdk/datatypes";
import { Loader2 } from "@lucide/vue";
import { Input } from "#console/components/ui/input";
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

// Watch for file prop changes to populate form
watch(
	() => props.file,
	(newFile) => {
		if (newFile && props.open) {
			populateForm(newFile);
		}
	},
	{ immediate: true },
);

watch(
	() => props.open,
	(isOpen) => {
		if (isOpen && props.file) {
			populateForm(props.file);
		}
	},
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
          <label
            class="block text-sm font-medium text-neutral-900 dark:text-white mb-2"
          >
            {{ t("files.dialogs.edit.nameLabel") }}
          </label>
          <Input
            v-model="displayName"
            :placeholder="t('files.dialogs.edit.namePlaceholder')"
            class="text-neutral-900 dark:text-white"
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
