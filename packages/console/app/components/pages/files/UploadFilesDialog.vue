<script setup lang="ts">
import { Upload, X, Check, Loader2, CloudUpload } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";
import {
	ACCEPTED_ACCEPT_ATTR,
	formatFileSize,
	getFileIcon,
	isAcceptedFileName,
} from "#console/utils/file";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

type UploadStatus = "pending" | "uploading" | "success" | "error";

interface UploadingFile {
	id: string;
	file: File;
	status: UploadStatus;
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

// Files eligible to upload (valid + not yet sent). Drives the submit button.
const pendingFiles = computed(() =>
	uploadingFiles.value.filter((f) => f.status === "pending"),
);
const totalPendingSize = computed(() =>
	pendingFiles.value.reduce((sum, f) => sum + f.file.size, 0),
);

/** Validate a file up front; returns an error message, or null if valid. */
function validate(file: File): string | null {
	if (!isAcceptedFileName(file.name)) {
		return t("files.dialogs.upload.errors.unsupported");
	}
	if (file.size > MAX_FILE_SIZE) {
		return t("files.dialogs.upload.errors.tooLarge", {
			max: formatFileSize(MAX_FILE_SIZE),
		});
	}
	return null;
}

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
	if (e.dataTransfer?.files) addFiles(Array.from(e.dataTransfer.files));
}

function handleFileSelect(e: Event) {
	const input = e.target as HTMLInputElement;
	if (input.files) addFiles(Array.from(input.files));
	input.value = "";
}

function addFiles(files: File[]) {
	const added: UploadingFile[] = files.map((file) => {
		const error = validate(file);
		return {
			id: crypto.randomUUID(),
			file,
			status: error ? "error" : "pending",
			error: error ?? undefined,
		};
	});
	uploadingFiles.value.push(...added);
}

function removeFile(id: string) {
	uploadingFiles.value = uploadingFiles.value.filter((f) => f.id !== id);
}

async function startUpload() {
	const pending = pendingFiles.value;
	if (pending.length === 0) return;

	for (const file of pending) file.status = "uploading";

	try {
		await props.uploadFn(pending.map((f) => f.file));
		for (const file of pending) file.status = "success";
		emit("uploaded");
	} catch (error) {
		for (const file of pending) {
			file.status = "error";
			file.error =
				error instanceof Error
					? error.message
					: t("files.dialogs.upload.errors.failed");
		}
	}
}

function handleClose() {
	if (isUploading.value) return;
	uploadingFiles.value = [];
	emit("update:open", false);
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
        <DialogDescription>
          {{ t("files.dialogs.upload.subtitle", { max: formatFileSize(MAX_FILE_SIZE) }) }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Drop zone -->
        <button
          type="button"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
          @click="handleBrowseClick"
          :class="[
            'flex w-full flex-col items-center rounded-xl border px-6 py-8 text-center transition-colors',
            isDragging
              ? 'border-foreground/30 bg-muted'
              : 'border-border/60 bg-muted/40 hover:bg-muted/70',
          ]"
        >
          <input
            ref="fileInputRef"
            type="file"
            multiple
            :accept="ACCEPTED_ACCEPT_ATTR"
            class="hidden"
            @change="handleFileSelect"
          />
          <div
            class="mb-3 flex size-11 items-center justify-center rounded-full bg-muted"
          >
            <CloudUpload :size="22" class="text-muted-foreground" />
          </div>
          <p class="text-sm font-medium text-foreground">
            {{
              isDragging
                ? t("files.dialogs.upload.dropHint")
                : t("files.dialogs.upload.description")
            }}
          </p>
          <p class="mt-1 text-xs text-muted-foreground">
            {{ t("files.dialogs.upload.browseHint") }}
          </p>
        </button>

        <!-- File list -->
        <div v-if="hasFiles" class="space-y-3">
          <div class="flex items-center justify-between px-0.5">
            <p class="text-xs font-medium text-muted-foreground">
              {{
                t(
                  "files.dialogs.upload.selected",
                  { count: uploadingFiles.length },
                  uploadingFiles.length,
                )
              }}
            </p>
            <p
              v-if="pendingFiles.length"
              class="text-xs tabular-nums text-muted-foreground"
            >
              {{ formatFileSize(totalPendingSize) }}
            </p>
          </div>

          <div class="max-h-56 space-y-2 overflow-y-auto">
            <div
              v-for="item in uploadingFiles"
              :key="item.id"
              class="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-2.5"
            >
              <div
                class="flex size-9 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground"
              >
                <component :is="getFileIcon(item.file.name)" :size="16" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm text-foreground">
                  {{ item.file.name }}
                </p>
                <p
                  :class="[
                    'truncate text-xs',
                    item.status === 'error'
                      ? 'text-destructive'
                      : 'text-muted-foreground',
                  ]"
                >
                  {{ item.status === "error" ? item.error : formatFileSize(item.file.size) }}
                </p>
              </div>
              <div class="flex shrink-0 items-center">
                <!-- In-flight / settled states show a status glyph; pending and
                     rejected rows stay removable. -->
                <Loader2
                  v-if="item.status === 'uploading'"
                  :size="16"
                  class="animate-spin text-muted-foreground"
                />
                <Check
                  v-else-if="item.status === 'success'"
                  :size="16"
                  class="text-foreground"
                />
                <Button
                  v-else
                  variant="ghost"
                  size="icon"
                  class="size-6 text-muted-foreground hover:text-foreground"
                  :aria-label="t('files.dialogs.upload.remove')"
                  @click="removeFile(item.id)"
                >
                  <X :size="14" />
                </Button>
              </div>
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
          :disabled="!pendingFiles.length || isUploading"
          class="font-normal"
        >
          <Upload v-if="!isUploading" :size="16" class="mr-2" />
          <Loader2 v-else :size="16" class="mr-2 animate-spin" />
          {{
            isUploading
              ? t("files.dialogs.upload.uploading")
              : t(
                  "files.dialogs.upload.uploadCount",
                  { count: pendingFiles.length },
                  pendingFiles.length,
                )
          }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
