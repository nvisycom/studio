<script setup lang="ts">
import type { File as NvisyFile, UpdateFile } from "@nvisy/sdk/datatypes";
import { FileText, Loader2, Upload } from "@lucide/vue";
import { toast } from "vue-sonner";
import {
	DeleteFileDialog,
	EditFileDialog,
	FilesGridView,
	FilesTableView,
	UploadFilesDialog,
} from "#console/components/pages/files";
import { Button } from "#console/components/ui/button";

const { t } = useI18n();
const { wLink } = useWorkspaceLink();

useHead({ title: "Files" });

definePageMeta({
	pageCategory: "header.category.files",
	// The controls live in the app header (FilesHeaderControls), so reclaim the
	// header's category slot for them.
	hideCategory: true,
});

// Search/filter/view state is shared with the header controls via useFilesView.
const {
	searchQuery,
	selectedModalities,
	selectedFormats,
	viewMode,
	uploadOpen: uploadDialogOpen,
	filesQuery,
	hasFilters,
	clearFilters,
} = useFilesView();

const {
	files,
	isLoading,
	error,
	deleteFileAsync,
	isDeleting,
	updateFileAsync,
	isUpdating,
	uploadFilesAsync,
	downloadFile,
	downloadMultiple,
	loadMore,
	hasMore,
	isLoadingMore,
} = useFiles({ query: filesQuery });

const isDraggingOver = ref(false);

const deleteDialogOpen = ref(false);
const editDialogOpen = ref(false);
// Files dropped onto the page, handed to the upload dialog so a drop and a
// browse share the same validated flow.
const droppedFiles = ref<File[]>([]);
const fileToDelete = ref<NvisyFile | null>(null);
const fileToEdit = ref<NvisyFile | null>(null);

// Selection — passed whole to the file views; the page reads it for bulk ops.
const filesSelection = useSelection({
	items: files,
	getKey: (f) => f.id,
});
const { selected: selectedFiles, clear: clearSelection } = filesSelection;

const selectedFilesCount = computed(() => selectedFiles.value.size);
const hasSelection = computed(() => selectedFilesCount.value > 0);

// Get studio files store
const { openFile: openFileInStudio } = useStudioFiles();

function viewFile(fileId: string) {
	// Find the file to pass metadata
	const file = files.value?.find((f) => f.id === fileId);
	openFileInStudio(fileId, file);
	navigateTo(wLink("/studio"));
}

function handleBulkOpen() {
	if (!hasSelection.value) return;
	const fileIds = Array.from(selectedFiles.value);
	// Open each selected file in the studio
	for (const fileId of fileIds) {
		const file = files.value?.find((f) => f.id === fileId);
		openFileInStudio(fileId, file);
	}
	navigateTo(wLink("/studio"));
}

async function handleDownloadFile(file: NvisyFile) {
	try {
		await downloadFile(file.id, file.displayName);
		toast.success(t("files.messages.downloadStarted"));
	} catch {
		toast.error(t("files.errors.downloadFailed"));
	}
}

async function handleBulkDownload() {
	if (!hasSelection.value) return;
	try {
		await downloadMultiple(Array.from(selectedFiles.value));
		toast.success(t("files.messages.downloadStarted"));
	} catch {
		toast.error(t("files.errors.downloadFailed"));
	}
}

function openDeleteDialog(file?: NvisyFile) {
	fileToDelete.value = file || null;
	deleteDialogOpen.value = true;
}

function openBulkDeleteDialog() {
	fileToDelete.value = null;
	deleteDialogOpen.value = true;
}

async function confirmDelete() {
	try {
		if (fileToDelete.value) {
			await deleteFileAsync(fileToDelete.value.id);
			toast.success(t("files.messages.fileDeleted"));
		} else if (hasSelection.value) {
			for (const fileId of Array.from(selectedFiles.value)) {
				await deleteFileAsync(fileId);
			}
			toast.success(t("files.messages.filesDeleted"));
			clearSelection();
		}
	} catch {
		toast.error(t("files.errors.deleteFailed"));
	} finally {
		deleteDialogOpen.value = false;
		fileToDelete.value = null;
	}
}

function openEditDialog(file: NvisyFile) {
	fileToEdit.value = file;
	editDialogOpen.value = true;
}

async function confirmEdit(data: UpdateFile) {
	if (!fileToEdit.value) return;
	try {
		await updateFileAsync({
			fileId: fileToEdit.value.id,
			updates: data,
		});
		toast.success(t("files.messages.fileUpdated"));
	} catch {
		toast.error(t("files.errors.updateFailed"));
	} finally {
		editDialogOpen.value = false;
		fileToEdit.value = null;
	}
}

// Reset any dropped files when the dialog closes, so the next open (from the
// header's upload button, which just flips the shared open state) starts empty.
watch(uploadDialogOpen, (open) => {
	if (!open) droppedFiles.value = [];
});

function handleUploadComplete() {
	toast.success(t("files.messages.filesUploaded"));
	uploadDialogOpen.value = false;
	isDraggingOver.value = false;
}

function handleDragEnter(e: DragEvent) {
	e.preventDefault();
	if (e.dataTransfer?.types.includes("Files")) {
		isDraggingOver.value = true;
	}
}

function handleDragOver(e: DragEvent) {
	e.preventDefault();
}

function handleDragLeave(e: DragEvent) {
	e.preventDefault();
	const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
	if (
		e.clientX <= rect.left ||
		e.clientX >= rect.right ||
		e.clientY <= rect.top ||
		e.clientY >= rect.bottom
	) {
		isDraggingOver.value = false;
	}
}

function handleDrop(e: DragEvent) {
	e.preventDefault();
	isDraggingOver.value = false;

	const files = e.dataTransfer?.files;
	if (files && files.length > 0) {
		// Route the drop through the upload dialog so it's validated and reviewed
		// the same as a browse — one unified upload flow.
		droppedFiles.value = Array.from(files);
		uploadDialogOpen.value = true;
	}
}

function handleLoadMore() {
	if (hasMore.value && !isLoadingMore.value) {
		loadMore();
	}
}
</script>

<template>
  <div
    class="flex flex-col gap-4 p-4 pt-4 pb-6 relative h-[calc(100vh-5.5rem)]"
    @dragenter="handleDragEnter"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div class="max-w-7xl mx-auto w-full flex flex-col flex-1 min-h-0">
      <!-- Search, filters, view toggle, and upload live in the app header
           (FilesHeaderControls), sharing state via useFilesView. -->

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <Loader2 :size="24" class="animate-spin text-muted-foreground" />
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
      >
        <p class="text-sm text-destructive">
          {{ error.message || t("files.errors.loadFailed") }}
        </p>
      </div>

      <template v-else>
        <!-- Files Content Area -->
        <div v-if="files.length > 0" class="relative flex-1 min-h-0">
          <!-- Drag overlay -->
          <Transition
            enter-active-class="transition-opacity duration-200"
            leave-active-class="transition-opacity duration-200"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
          >
            <div
              v-if="isDraggingOver"
              class="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-sm"
            >
              <div
                class="flex flex-col items-center gap-3 rounded-xl bg-muted/80 px-8 py-6 shadow-sm"
              >
                <div
                  class="flex size-11 items-center justify-center rounded-full bg-background"
                >
                  <Upload :size="22" class="text-muted-foreground" />
                </div>
                <p class="text-sm font-medium text-foreground">
                  {{ t("files.dialogs.upload.dropHint") }}
                </p>
              </div>
            </div>
          </Transition>

          <!-- List View (Data Table). The VirtualTable fills its parent's
               height on its own (its scroll container is `h-full`), so no class
               is passed here — VirtualTable is multi-root, so an inherited
               `class` would be dropped with a Vue warning anyway. -->
          <FilesTableView
            v-if="viewMode === 'list'"
            :files="files"
            :selection="filesSelection"
            @view="viewFile"
            @edit="openEditDialog"
            @download="handleDownloadFile"
            @delete="openDeleteDialog"
            @bulk-open="handleBulkOpen"
            @bulk-download="handleBulkDownload"
            @bulk-delete="openBulkDeleteDialog"
            @load-more="handleLoadMore"
          />

          <!-- Grid View -->
          <FilesGridView
            v-else
            class="h-full"
            :files="files"
            :selection="filesSelection"
            @bulk-open="handleBulkOpen"
            @bulk-download="handleBulkDownload"
            @bulk-delete="openBulkDeleteDialog"
            @view="viewFile"
            @edit="openEditDialog"
            @download="handleDownloadFile"
            @delete="openDeleteDialog"
            @load-more="handleLoadMore"
          />
        </div>

        <!-- Empty State -->
        <div
          v-else
          class="py-16 text-center flex-1 flex flex-col items-center justify-center"
        >
          <div
            class="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50"
          >
            <FileText class="h-5 w-5 text-muted-foreground" />
          </div>
          <p class="text-sm font-medium text-foreground mb-1">
            {{ t("files.table.empty.title") }}
          </p>
          <p
            class="text-sm text-muted-foreground max-w-sm"
            :class="hasFilters ? 'mb-4' : ''"
          >
            {{
              hasFilters
                ? t("files.table.empty.filterDescription")
                : t("files.table.empty.description")
            }}
          </p>
          <Button
            v-if="hasFilters"
            variant="outline"
            size="sm"
            @click="clearFilters"
          >
            {{ t("files.actions.clearFilters") }}
          </Button>
        </div>
      </template>
    </div>

    <!-- Dialogs -->
    <DeleteFileDialog
      v-model:open="deleteDialogOpen"
      :file-name="fileToDelete?.displayName"
      :file-count="fileToDelete ? 1 : selectedFilesCount"
      :is-deleting="isDeleting"
      @confirm="confirmDelete"
    />

    <EditFileDialog
      v-model:open="editDialogOpen"
      :file="fileToEdit"
      :is-loading="isUpdating"
      @update="confirmEdit"
    />

    <UploadFilesDialog
      v-model:open="uploadDialogOpen"
      :upload-fn="uploadFilesAsync"
      :initial-files="droppedFiles"
      @uploaded="handleUploadComplete"
    />
  </div>
</template>
