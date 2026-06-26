<script setup lang="ts">
import type {
	File as NvisyFile,
	UpdateFile,
	ContentSegmentation,
} from "@nvisy/sdk/datatypes";
import { Loader2, ChevronDown } from "@lucide/vue";
import { Input } from "#console/components/ui/input";
import { Button } from "#console/components/ui/button";
import { Switch } from "#console/components/ui/switch";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";

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
const highPriority = ref(false);
const isIndexed = ref(true);
const visualSupport = ref(false);
const contentSegmentation = ref<ContentSegmentation>("semantic");

// Helper to convert priority value to boolean (priority > 5 means high priority)
function isHighPriority(priority: number | undefined): boolean {
	return (priority ?? 5) > 5;
}

// Segmentation options
const segmentationOptions: { value: ContentSegmentation; labelKey: string }[] =
	[
		{ value: "none", labelKey: "files.dialogs.edit.segmentationNone" },
		{ value: "semantic", labelKey: "files.dialogs.edit.segmentationSemantic" },
		{ value: "fixed", labelKey: "files.dialogs.edit.segmentationFixed" },
	];

// Computed validation
const isFormValid = computed(() => {
	return displayName.value.trim().length > 0;
});

const hasChanges = computed(() => {
	if (!props.file) return false;
	return (
		displayName.value.trim() !== props.file.displayName ||
		highPriority.value !== isHighPriority(props.file.processingPriority) ||
		isIndexed.value !== (props.file.fileKnowledge?.isIndexed ?? true) ||
		visualSupport.value !==
			(props.file.fileKnowledge?.visualSupport ?? false) ||
		contentSegmentation.value !==
			(props.file.fileKnowledge?.contentSegmentation ?? "semantic")
	);
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
	highPriority.value = isHighPriority(file.processingPriority);
	isIndexed.value = file.fileKnowledge?.isIndexed ?? true;
	visualSupport.value = file.fileKnowledge?.visualSupport ?? false;
	contentSegmentation.value =
		file.fileKnowledge?.contentSegmentation ?? "semantic";
}

function handleOpenChange(open: boolean) {
	if (!open) {
		resetForm();
	}
	emit("update:open", open);
}

function resetForm() {
	displayName.value = "";
	highPriority.value = false;
	isIndexed.value = true;
	visualSupport.value = false;
	contentSegmentation.value = "semantic";
}

function updateFile() {
	if (!isFormValid.value || !props.file) return;

	emit("update", {
		displayName: displayName.value.trim(),
		processingPriority: highPriority.value ? 10 : 5,
		isIndexed: isIndexed.value,
		visualSupport: isIndexed.value ? visualSupport.value : false,
		contentSegmentation: isIndexed.value ? contentSegmentation.value : "none",
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

        <!-- High Priority -->
        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <label class="text-sm font-medium text-neutral-900 dark:text-white">
              {{ t("files.dialogs.edit.highPriorityLabel") }}
            </label>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              {{ t("files.dialogs.edit.highPriorityDescription") }}
            </p>
          </div>
          <Switch v-model="highPriority" />
        </div>

        <!-- Knowledge Settings -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <label
                class="text-sm font-medium text-neutral-900 dark:text-white"
              >
                {{ t("files.dialogs.edit.indexedLabel") }}
              </label>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                {{ t("files.dialogs.edit.indexedDescription") }}
              </p>
            </div>
            <Switch v-model="isIndexed" />
          </div>

          <div
            class="flex items-center justify-between"
            :class="{ 'opacity-50': !isIndexed }"
          >
            <div class="space-y-0.5">
              <label
                class="text-sm font-medium text-neutral-900 dark:text-white"
              >
                {{ t("files.dialogs.edit.visualSupportLabel") }}
              </label>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                {{ t("files.dialogs.edit.visualSupportDescription") }}
              </p>
            </div>
            <Switch v-model="visualSupport" :disabled="!isIndexed" />
          </div>

          <!-- Content Segmentation -->
          <div :class="{ 'opacity-50': !isIndexed }">
            <label
              class="block text-sm font-medium text-neutral-900 dark:text-white mb-2"
            >
              {{ t("files.dialogs.edit.segmentationLabel") }}
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger as-child :disabled="!isIndexed">
                <Button
                  variant="outline"
                  class="w-full justify-between font-normal"
                  :disabled="!isIndexed"
                >
                  {{
                    t(
                      segmentationOptions.find(
                        (o) => o.value === contentSegmentation,
                      )?.labelKey || "files.dialogs.edit.segmentationSemantic",
                    )
                  }}
                  <ChevronDown :size="16" class="ml-2 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                class="w-[--radix-dropdown-menu-trigger-width]"
              >
                <DropdownMenuItem
                  v-for="option in segmentationOptions"
                  :key="option.value"
                  @click="contentSegmentation = option.value"
                  class="cursor-pointer"
                >
                  {{ t(option.labelKey) }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {{ t("files.dialogs.edit.segmentationDescription") }}
            </p>
          </div>
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
