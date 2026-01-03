<script setup lang="ts">
import { ref, computed } from "vue";
import {
	Search,
	FileText,
	ChevronDown,
	Upload,
	Loader2,
	Filter,
	List,
	LayoutGrid,
} from "lucide-vue-next";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	DeleteFileDialog,
	EditFileDialog,
	FilesGridView,
	FilesTableView,
	UploadFilesDialog,
} from "~/components/pages/files";
import type { File as NvisyFile, UpdateFile } from "@nvisy/sdk/datatypes";

const { t } = useI18n();

definePageMeta({
	pageCategory: "Files",
});

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
} = useFiles();

const searchQuery = ref("");
const filterStatus = ref("any");
const viewMode = ref<"list" | "grid">("list");
const isDraggingOver = ref(false);

const deleteDialogOpen = ref(false);
const editDialogOpen = ref(false);
const uploadDialogOpen = ref(false);
const fileToDelete = ref<NvisyFile | null>(null);
const fileToEdit = ref<NvisyFile | null>(null);
const selectedFiles = ref<Set<string>>(new Set());

const selectedFilesCount = computed(() => selectedFiles.value.size);
const hasSelection = computed(() => selectedFilesCount.value > 0);
const allSelected = computed(
	() =>
		filteredFiles.value.length > 0 &&
		filteredFiles.value.every((f) => selectedFiles.value.has(f.fileId)),
);

function toggleSelectAll() {
	if (allSelected.value) {
		selectedFiles.value = new Set();
	} else {
		selectedFiles.value = new Set(filteredFiles.value.map((f) => f.fileId));
	}
}

function toggleFileSelection(fileId: string) {
	const newSet = new Set(selectedFiles.value);
	if (newSet.has(fileId)) {
		newSet.delete(fileId);
	} else {
		newSet.add(fileId);
	}
	selectedFiles.value = newSet;
}

function clearSelection() {
	selectedFiles.value = new Set();
}

const statusFilters = computed(() => [
	{ label: t("files.filters.anyStatus"), value: "any" },
	{ label: t("files.filters.pending"), value: "pending" },
	{ label: t("files.filters.processing"), value: "processing" },
	{ label: t("files.filters.completed"), value: "completed" },
	{ label: t("files.filters.failed"), value: "failed" },
]);

const filteredFiles = computed(() => {
	let filtered = files.value || [];

	if (searchQuery.value.trim()) {
		const query = searchQuery.value.toLowerCase();
		filtered = filtered.filter((file) =>
			file.displayName.toLowerCase().includes(query),
		);
	}

	if (filterStatus.value !== "any") {
		filtered = filtered.filter((file) => file.status === filterStatus.value);
	}

	return filtered;
});

const hasFilters = computed(() => {
	return searchQuery.value.trim() || filterStatus.value !== "any";
});

function viewFile(fileId: string) {
	navigateTo(`/files/studio?id=${fileId}`);
}

async function handleDownloadFile(file: NvisyFile) {
	try {
		await downloadFile(file.fileId, file.displayName);
		toast.success(t("files.messages.downloadStarted"));
	} catch {
		toast.error(t("files.errors.downloadFailed"));
	}
}

async function handleBulkDownload(format: "zip" | "tar") {
	if (!hasSelection.value) return;
	try {
		await downloadMultiple(Array.from(selectedFiles.value), format);
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
			await deleteFileAsync(fileToDelete.value.fileId);
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
			fileId: fileToEdit.value.fileId,
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

function openUploadDialog() {
	uploadDialogOpen.value = true;
}

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

async function handleDrop(e: DragEvent) {
	e.preventDefault();
	isDraggingOver.value = false;

	const droppedFiles = e.dataTransfer?.files;
	if (droppedFiles && droppedFiles.length > 0) {
		try {
			await uploadFilesAsync(Array.from(droppedFiles));
			toast.success(t("files.messages.filesUploaded"));
		} catch {
			toast.error(t("files.errors.uploadFailed"));
		}
	}
}

function selectStatusFilter(value: string) {
	filterStatus.value = value;
}

function clearFilters() {
	searchQuery.value = "";
	filterStatus.value = "any";
}

function handleLoadMore() {
	if (hasMore.value && !isLoadingMore.value) {
		loadMore();
	}
}

function handleGridScroll(event: Event) {
	const target = event.target as HTMLElement;
	const { scrollTop, scrollHeight, clientHeight } = target;
	const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
	if (distanceFromBottom < 100) {
		handleLoadMore();
	}
}
</script>

<template>
  <div
    class="flex flex-col gap-4 p-4 pt-4 pb-6 relative h-[calc(100vh-8rem)]"
    @dragenter="handleDragEnter"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <!-- Drag overlay -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isDraggingOver"
        class="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 backdrop-blur-sm border-2 border-dashed border-primary rounded-lg m-2"
      >
        <div class="text-center">
          <Upload :size="48" class="mx-auto mb-4 text-primary" />
          <p class="text-lg font-normal text-primary">
            {{ t("files.dialogs.upload.dropHint") }}
          </p>
        </div>
      </div>
    </Transition>

    <div class="max-w-7xl mx-auto w-full flex flex-col flex-1 min-h-0">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <Loader2 :size="32" class="animate-spin text-neutral-400" />
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg"
      >
        <p class="text-red-600 dark:text-red-400">
          {{ error.message || t("files.errors.loadFailed") }}
        </p>
      </div>

      <template v-else>
        <!-- Search, Filters, and Actions -->
        <div
          class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6"
        >
          <Button
            variant="outline"
            @click="openUploadDialog"
            class="font-light"
          >
            <Upload :size="16" class="mr-2" />
            {{ t("files.actions.upload") }}
          </Button>

          <div class="relative flex-1">
            <Search
              :size="16"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <Input
              v-model="searchQuery"
              :placeholder="t('files.filters.search')"
              class="pl-10 font-light"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                variant="outline"
                class="justify-between min-w-[160px] font-light"
              >
                <Filter :size="14" class="mr-2 text-neutral-400" />
                {{
                  statusFilters.find((f) => f.value === filterStatus)?.label ||
                  t("files.filters.anyStatus")
                }}
                <ChevronDown :size="16" class="ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-[160px]">
              <DropdownMenuItem
                v-for="filter in statusFilters"
                :key="filter.value"
                @click="selectStatusFilter(filter.value)"
                class="cursor-pointer font-light"
              >
                {{ filter.label }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <!-- View Toggle -->
          <div class="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              class="rounded-r-none px-3"
              :class="{ 'bg-muted': viewMode === 'list' }"
              @click="viewMode = 'list'"
            >
              <List :size="16" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="rounded-l-none px-3"
              :class="{ 'bg-muted': viewMode === 'grid' }"
              @click="viewMode = 'grid'"
            >
              <LayoutGrid :size="16" />
            </Button>
          </div>
        </div>

        <!-- List View (Data Table) -->
        <FilesTableView
          v-if="filteredFiles.length > 0 && viewMode === 'list'"
          :files="filteredFiles"
          :selected-files="selectedFiles"
          :all-selected="allSelected"
          :has-selection="hasSelection"
          :selected-count="selectedFilesCount"
          @toggle-select-all="toggleSelectAll"
          @toggle-selection="toggleFileSelection"
          @view="viewFile"
          @edit="openEditDialog"
          @download="handleDownloadFile"
          @delete="openDeleteDialog"
          @bulk-download="handleBulkDownload"
          @bulk-delete="openBulkDeleteDialog"
          @load-more="handleLoadMore"
        />

        <!-- Grid View -->
        <FilesGridView
          v-else-if="filteredFiles.length > 0 && viewMode === 'grid'"
          :files="filteredFiles"
          :selected-files="selectedFiles"
          @toggle-selection="toggleFileSelection"
          @view="viewFile"
          @edit="openEditDialog"
          @download="handleDownloadFile"
          @delete="openDeleteDialog"
          @scroll="handleGridScroll"
        />

        <!-- Empty State -->
        <div v-else class="py-12 text-center flex-1">
          <div
            class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
          >
            <FileText class="h-6 w-6 text-neutral-400 dark:text-neutral-500" />
          </div>
          <p class="font-normal text-neutral-700 dark:text-neutral-300 mb-1">
            {{ t("files.table.empty.title") }}
          </p>
          <p
            class="font-light text-sm text-neutral-500 dark:text-neutral-400 mb-4"
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
            class="font-light"
            @click="clearFilters"
          >
            {{ t("files.actions.clearFilters") }}
          </Button>
          <Button v-else @click="openUploadDialog" size="sm" class="font-light">
            <Upload :size="16" class="mr-2" />
            {{ t("files.actions.upload") }}
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
      @uploaded="handleUploadComplete"
    />
  </div>
</template>
