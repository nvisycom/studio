<script setup lang="ts">
import type {
	File as NvisyFile,
	UpdateFile,
	ListFiles,
	ModalityToken,
	FormatToken,
} from "@nvisy/sdk/datatypes";
import {
	FileText,
	Filter,
	LayoutGrid,
	List,
	Loader2,
	Search,
	Upload,
} from "@lucide/vue";
import { toast } from "vue-sonner";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import { Badge } from "#console/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import {
	DeleteFileDialog,
	EditFileDialog,
	FilesGridView,
	FilesTableView,
	UploadFilesDialog,
} from "#console/components/pages/files";

const { t } = useI18n();

useHead({ title: "Files" });

definePageMeta({
	pageCategory: "Files",
});

// Filter state — filtering is done server-side via the listFiles query.
const searchQuery = ref("");
const selectedModalities = ref<ModalityToken[]>([]);
const selectedFormats = ref<FormatToken[]>([]);

const filesQuery = computed<ListFiles>(() => ({
	...(searchQuery.value.trim() && { search: searchQuery.value.trim() }),
	...(selectedModalities.value.length && {
		modality: selectedModalities.value,
	}),
	...(selectedFormats.value.length && { formats: selectedFormats.value }),
}));

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

const viewMode = ref<"list" | "grid">("list");
const isDraggingOver = ref(false);

const deleteDialogOpen = ref(false);
const editDialogOpen = ref(false);
const uploadDialogOpen = ref(false);
const fileToDelete = ref<NvisyFile | null>(null);
const fileToEdit = ref<NvisyFile | null>(null);
const isUploadingDrop = ref(false);

const MODALITY_TOKENS: ModalityToken[] = ["text", "image", "tabular", "audio"];
const FORMAT_TOKENS: FormatToken[] = [
	"csv",
	"docx",
	"htm",
	"html",
	"jpeg",
	"jpg",
	"json",
	"log",
	"png",
	"tif",
	"tiff",
	"txt",
	"wav",
	"xlsx",
	"xml",
];

function toggleModality(token: ModalityToken) {
	const next = new Set(selectedModalities.value);
	next.has(token) ? next.delete(token) : next.add(token);
	selectedModalities.value = [...next];
}

function toggleFormat(token: FormatToken) {
	const next = new Set(selectedFormats.value);
	next.has(token) ? next.delete(token) : next.add(token);
	selectedFormats.value = [...next];
}

const hasFilters = computed(
	() =>
		searchQuery.value.trim().length > 0 ||
		selectedModalities.value.length > 0 ||
		selectedFormats.value.length > 0,
);

// Selection
const {
	selected: selectedFiles,
	allSelected,
	toggle: toggleFileSelection,
	toggleAll: toggleSelectAll,
	clear: clearSelection,
} = useSelection({
	items: files,
	getKey: (f) => f.id,
});

const selectedFilesCount = computed(() => selectedFiles.value.size);
const hasSelection = computed(() => selectedFilesCount.value > 0);

// Get studio files store
const { openFile: openFileInStudio } = useStudioFiles();

function viewFile(fileId: string) {
	// Find the file to pass metadata
	const file = files.value?.find((f) => f.id === fileId);
	openFileInStudio(fileId, file);
	navigateTo("/studio");
}

function handleBulkOpen() {
	if (!hasSelection.value) return;
	const fileIds = Array.from(selectedFiles.value);
	// Open each selected file in the studio
	for (const fileId of fileIds) {
		const file = files.value?.find((f) => f.id === fileId);
		openFileInStudio(fileId, file);
	}
	navigateTo("/studio");
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
		isUploadingDrop.value = true;
		try {
			await uploadFilesAsync(Array.from(droppedFiles));
			toast.success(t("files.messages.filesUploaded"));
		} catch {
			toast.error(t("files.errors.uploadFailed"));
		} finally {
			isUploadingDrop.value = false;
		}
	}
}

function clearFilters() {
	searchQuery.value = "";
	selectedModalities.value = [];
	selectedFormats.value = [];
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
    class="flex flex-col gap-4 p-4 pt-4 pb-6 relative h-[calc(100vh-5.5rem)]"
    @dragenter="handleDragEnter"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div class="max-w-7xl mx-auto w-full flex flex-col flex-1 min-h-0">
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
        <!-- Search, Filters, and Actions -->
        <div
          class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center mb-4"
        >
          <Button variant="default" size="sm" @click="openUploadDialog">
            <Upload :size="16" class="mr-2" />
            {{ t("files.actions.upload") }}
          </Button>

          <div class="relative flex-1">
            <Search
              :size="16"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              v-model="searchQuery"
              :placeholder="t('files.filters.search')"
              class="pl-10 h-9 text-sm"
            />
          </div>

          <!-- Modality Filter -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="sm" class="h-9 font-normal">
                <Filter :size="14" class="mr-2 text-muted-foreground" />
                {{ t("files.filters.modality") }}
                <Badge
                  v-if="selectedModalities.length"
                  variant="secondary"
                  class="ml-2"
                >
                  {{ selectedModalities.length }}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-44">
              <DropdownMenuLabel>{{
                t("files.filters.modality")
              }}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                v-for="token in MODALITY_TOKENS"
                :key="token"
                :model-value="selectedModalities.includes(token)"
                class="capitalize"
                @update:model-value="toggleModality(token)"
                @select.prevent
              >
                {{ t(`files.filters.modalities.${token}`) }}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <!-- Format Filter -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="sm" class="h-9 font-normal">
                <Filter :size="14" class="mr-2 text-muted-foreground" />
                {{ t("files.filters.format") }}
                <Badge
                  v-if="selectedFormats.length"
                  variant="secondary"
                  class="ml-2"
                >
                  {{ selectedFormats.length }}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              class="max-h-72 w-40 overflow-y-auto"
            >
              <DropdownMenuLabel>{{
                t("files.filters.format")
              }}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                v-for="token in FORMAT_TOKENS"
                :key="token"
                :model-value="selectedFormats.includes(token)"
                class="font-mono text-xs"
                @update:model-value="toggleFormat(token)"
                @select.prevent
              >
                {{ token }}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <!-- View Toggle -->
          <div class="flex items-center border border-border/50 rounded-md">
            <Button
              variant="ghost"
              size="sm"
              class="rounded-r-none px-2.5 h-9"
              :class="{ 'bg-muted': viewMode === 'list' }"
              @click="viewMode = 'list'"
            >
              <List :size="16" class="text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="rounded-l-none px-2.5 h-9"
              :class="{ 'bg-muted': viewMode === 'grid' }"
              @click="viewMode = 'grid'"
            >
              <LayoutGrid :size="16" class="text-muted-foreground" />
            </Button>
          </div>
        </div>

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
              class="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg border-2 border-dashed border-border"
            >
              <div class="text-center -mt-16">
                <Upload
                  :size="32"
                  :stroke-width="1.5"
                  class="mx-auto mb-3 text-muted-foreground"
                />
                <p class="text-sm font-medium text-foreground">
                  {{ t("files.dialogs.upload.dropHint") }}
                </p>
              </div>
            </div>
          </Transition>

          <!-- Upload progress overlay -->
          <Transition
            enter-active-class="transition-opacity duration-200"
            leave-active-class="transition-opacity duration-200"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
          >
            <div
              v-if="isUploadingDrop"
              class="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg border border-border"
            >
              <div class="text-center -mt-16">
                <Loader2
                  :size="24"
                  :stroke-width="1.5"
                  class="mx-auto mb-3 text-muted-foreground animate-spin"
                />
                <p class="text-sm font-medium text-foreground">
                  {{ t("files.dialogs.upload.uploading") }}
                </p>
              </div>
            </div>
          </Transition>

          <!-- List View (Data Table) -->
          <FilesTableView
            v-if="viewMode === 'list'"
            class="h-full"
            :files="files"
            :selected-files="selectedFiles"
            :all-selected="allSelected"
            :selected-count="selectedFilesCount"
            @toggle-select-all="toggleSelectAll"
            @toggle-selection="toggleFileSelection"
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
            :selected-files="selectedFiles"
            :selected-count="selectedFilesCount"
            @toggle-selection="toggleFileSelection"
            @bulk-open="handleBulkOpen"
            @bulk-download="handleBulkDownload"
            @bulk-delete="openBulkDeleteDialog"
            @view="viewFile"
            @edit="openEditDialog"
            @download="handleDownloadFile"
            @delete="openDeleteDialog"
            @scroll="handleGridScroll"
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
          <p class="text-sm text-muted-foreground mb-4 max-w-sm">
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
          <Button v-else @click="openUploadDialog" size="sm">
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
