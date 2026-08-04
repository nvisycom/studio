<script setup lang="ts">
import { Upload, X, FileText, Check, AlertCircle, Loader2 } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";

interface UploadingFile {
	id: string;
	file: File;
	status: "pending" | "uploading" | "success" | "error";
	progress: number;
	error?: string;
}

interface Props {
	open: boolean;
	uploadFn: (files: File[]) => Promise<unknown>;
}

interface Emits {
	(e: "update:open", value: boolean): void;
	(e: "uploaded"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();

const uploadingFiles = ref<UploadingFile[]>([]);
const isDragging = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const hasFiles = computed(() => uploadingFiles.value.length > 0);
const isUploading = computed(() =>
	uploadingFiles.value.some((f) => f.status === "uploading"),
);
const allComplete = computed(
	() =>
		uploadingFiles.value.length > 0 &&
		uploadingFiles.value.every(
			(f) => f.status === "success" || f.status === "error",
		),
);

function handleDragOver(e: DragEvent) {
	e.preventDefault();
	isDragging.value = true;
}

function handleDragLeave() {
	isDragging.value = false;
}

function handleDrop(e: DragEvent) {
	e.preventDefault();
	isDragging.value = false;
	const files = e.dataTransfer?.files;
	if (files) {
		addFiles(Array.from(files));
	}
}

function handleFileSelect(e: Event) {
	const input = e.target as HTMLInputElement;
	if (input.files) {
		addFiles(Array.from(input.files));
	}
	input.value = "";
}

function addFiles(files: File[]) {
	const newFiles: UploadingFile[] = files.map((file) => ({
		id: crypto.randomUUID(),
		file,
		status: "pending",
		progress: 0,
	}));
	uploadingFiles.value.push(...newFiles);
}

function removeFile(id: string) {
	uploadingFiles.value = uploadingFiles.value.filter((f) => f.id !== id);
}

async function startUpload() {
	const pendingFiles = uploadingFiles.value.filter(
		(f) => f.status === "pending",
	);
	if (pendingFiles.length === 0) return;

	// Mark all as uploading
	for (const file of pendingFiles) {
		file.status = "uploading";
		file.progress = 50; // Indeterminate progress
	}

	try {
		// Upload all files at once
		await props.uploadFn(pendingFiles.map((f) => f.file));

		// Mark all as success
		for (const file of pendingFiles) {
			file.status = "success";
			file.progress = 100;
		}

		emit("uploaded");
	} catch (error) {
		// Mark all as error
		for (const file of pendingFiles) {
			file.status = "error";
			file.error = error instanceof Error ? error.message : "Upload failed";
		}
	}
}

function handleClose() {
	if (!isUploading.value) {
		uploadingFiles.value = [];
		emit("update:open", false);
	}
}

function handleBrowseClick() {
	fileInputRef.value?.click();
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ t("files.dialogs.upload.title") }}</DialogTitle>
      </DialogHeader>

      <div class="py-4 space-y-4">
        <!-- Drop Zone -->
        <div
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
          @click="handleBrowseClick"
          :class="[
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600',
          ]"
        >
          <input
            ref="fileInputRef"
            type="file"
            multiple
            accept=".csv,.docx,.htm,.html,.jpeg,.jpg,.json,.log,.pdf,.png,.rtf,.tif,.tiff,.txt,.wav,.xlsx,.xml"
            class="hidden"
            @change="handleFileSelect"
          />
          <Upload
            :size="32"
            class="mx-auto mb-3 text-neutral-400 dark:text-neutral-500"
          />
          <p class="font-normal text-neutral-700 dark:text-neutral-300 mb-1">
            {{
              isDragging
                ? t("files.dialogs.upload.dropHint")
                : t("files.dialogs.upload.description")
            }}
          </p>
          <Button
            variant="outline"
            size="sm"
            class="mt-2 font-normal"
            @click.stop="handleBrowseClick"
          >
            {{ t("files.dialogs.upload.browseButton") }}
          </Button>
        </div>

        <!-- File List -->
        <div v-if="hasFiles" class="space-y-2 max-h-48 overflow-y-auto">
          <div
            v-for="file in uploadingFiles"
            :key="file.id"
            class="flex items-center gap-3 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900"
          >
            <div
              class="w-8 h-8 rounded flex items-center justify-center bg-neutral-200 dark:bg-neutral-800"
            >
              <FileText
                :size="16"
                class="text-neutral-600 dark:text-neutral-400"
              />
            </div>
            <div class="flex-1 min-w-0">
              <p
                class="text-sm font-normal truncate text-neutral-900 dark:text-white"
              >
                {{ file.file.name }}
              </p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                {{ formatFileSize(file.file.size) }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <Loader2
                v-if="file.status === 'uploading'"
                :size="16"
                class="animate-spin text-primary"
              />
              <Check
                v-else-if="file.status === 'success'"
                :size="16"
                class="text-green-500"
              />
              <AlertCircle
                v-else-if="file.status === 'error'"
                :size="16"
                class="text-red-500"
              />
              <Button
                v-if="file.status === 'pending'"
                variant="ghost"
                size="icon"
                class="h-6 w-6"
                @click="removeFile(file.id)"
              >
                <X :size="14" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          @click="handleClose"
          :disabled="isUploading"
          class="font-normal"
        >
          {{
            allComplete
              ? t("files.dialogs.upload.done")
              : t("files.dialogs.upload.cancel")
          }}
        </Button>
        <Button
          v-if="!allComplete"
          @click="startUpload"
          :disabled="!hasFiles || isUploading"
          class="font-normal"
        >
          <Upload v-if="!isUploading" :size="16" class="mr-2" />
          <Loader2 v-else :size="16" class="mr-2 animate-spin" />
          {{
            isUploading
              ? t("files.dialogs.upload.uploading")
              : t("files.actions.upload")
          }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
