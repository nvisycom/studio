<script setup lang="ts">
import { ref, computed } from "vue";
import {
	Search,
	FileText,
	FileImage,
	FileCode,
	FileSpreadsheet,
	Download,
	Eye,
	Trash2,
	MoreHorizontal,
	ChevronDown,
	Upload,
	FileArchive,
	Pencil,
	Loader2,
	File as FileIcon,
	Filter,
	ArrowUpDown,
	X,
} from "lucide-vue-next";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DeleteFileDialog,
	RenameFileDialog,
	UploadFilesDialog,
} from "~/components/pages/files";
import type { File as NvisyFile } from "@nvisy/sdk/datatypes";

const { t } = useI18n();

definePageMeta({
	pageCategory: "Files",
});

// API composables
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
	refresh,
} = useFiles();

// Local state
const searchQuery = ref("");
const filterStatus = ref("any");
const selectedSorting = ref("date-desc");
const selectedFiles = ref<Set<string>>(new Set());

// Dialog states
const deleteDialogOpen = ref(false);
const renameDialogOpen = ref(false);
const uploadDialogOpen = ref(false);
const fileToDelete = ref<NvisyFile | null>(null);
const fileToRename = ref<NvisyFile | null>(null);
const filesToDeleteMultiple = ref<string[]>([]);

const statusFilters = computed(() => [
	{ label: t("files.filters.anyStatus"), value: "any" },
	{ label: t("files.filters.pending"), value: "pending" },
	{ label: t("files.filters.processing"), value: "processing" },
	{ label: t("files.filters.completed"), value: "completed" },
	{ label: t("files.filters.failed"), value: "failed" },
]);

const sortingOptions = computed(() => [
	{ label: t("files.sorting.dateDesc"), value: "date-desc" },
	{ label: t("files.sorting.dateAsc"), value: "date-asc" },
	{ label: t("files.sorting.nameAsc"), value: "name-asc" },
	{ label: t("files.sorting.nameDesc"), value: "name-desc" },
	{ label: t("files.sorting.sizeDesc"), value: "size-desc" },
	{ label: t("files.sorting.sizeAsc"), value: "size-asc" },
]);

const filteredFiles = computed(() => {
	let filtered = files.value || [];

	// Apply search filter
	if (searchQuery.value.trim()) {
		const query = searchQuery.value.toLowerCase();
		filtered = filtered.filter((file) =>
			file.displayName.toLowerCase().includes(query),
		);
	}

	// Apply status filter
	if (filterStatus.value !== "any") {
		filtered = filtered.filter((file) => file.status === filterStatus.value);
	}

	// Sort the results
	filtered = [...filtered].sort((a, b) => {
		switch (selectedSorting.value) {
			case "date-asc":
				return (
					new Date(a.updatedAt || 0).getTime() -
					new Date(b.updatedAt || 0).getTime()
				);
			case "date-desc":
				return (
					new Date(b.updatedAt || 0).getTime() -
					new Date(a.updatedAt || 0).getTime()
				);
			case "name-asc":
				return a.displayName.localeCompare(b.displayName);
			case "name-desc":
				return b.displayName.localeCompare(a.displayName);
			case "size-asc":
				return a.fileSize - b.fileSize;
			case "size-desc":
				return b.fileSize - a.fileSize;
			default:
				return 0;
		}
	});

	return filtered;
});

const allSelected = computed(() => {
	return (
		filteredFiles.value.length > 0 &&
		selectedFiles.value.size === filteredFiles.value.length
	);
});

const hasFilters = computed(() => {
	return searchQuery.value.trim() || filterStatus.value !== "any";
});

// File type icon helper
function getFileIcon(fileName: string) {
	const ext = fileName.split(".").pop()?.toLowerCase();
	switch (ext) {
		case "pdf":
		case "doc":
		case "docx":
		case "txt":
		case "md":
			return FileText;
		case "png":
		case "jpg":
		case "jpeg":
		case "gif":
		case "svg":
		case "webp":
			return FileImage;
		case "json":
		case "xml":
		case "html":
		case "css":
		case "js":
		case "ts":
			return FileCode;
		case "csv":
		case "xlsx":
		case "xls":
			return FileSpreadsheet;
		default:
			return FileIcon;
	}
}

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

// Delete single file
function openDeleteDialog(file: NvisyFile) {
	fileToDelete.value = file;
	filesToDeleteMultiple.value = [];
	deleteDialogOpen.value = true;
}

// Delete multiple files
function openDeleteMultipleDialog() {
	fileToDelete.value = null;
	filesToDeleteMultiple.value = Array.from(selectedFiles.value);
	deleteDialogOpen.value = true;
}

async function confirmDelete() {
	try {
		if (fileToDelete.value) {
			await deleteFileAsync(fileToDelete.value.fileId);
			toast.success(t("files.messages.fileDeleted"));
		} else if (filesToDeleteMultiple.value.length > 0) {
			for (const fileId of filesToDeleteMultiple.value) {
				await deleteFileAsync(fileId);
			}
			toast.success(t("files.messages.filesDeleted"));
			selectedFiles.value = new Set();
		}
	} catch {
		toast.error(t("files.errors.deleteFailed"));
	} finally {
		deleteDialogOpen.value = false;
		fileToDelete.value = null;
		filesToDeleteMultiple.value = [];
	}
}

// Rename file
function openRenameDialog(file: NvisyFile) {
	fileToRename.value = file;
	renameDialogOpen.value = true;
}

async function confirmRename(newName: string) {
	if (!fileToRename.value) return;
	try {
		await updateFileAsync({
			fileId: fileToRename.value.fileId,
			updates: { displayName: newName },
		});
		toast.success(t("files.messages.fileRenamed"));
	} catch {
		toast.error(t("files.errors.renameFailed"));
	} finally {
		renameDialogOpen.value = false;
		fileToRename.value = null;
	}
}

// Upload
function openUploadDialog() {
	uploadDialogOpen.value = true;
}

function handleUploadComplete() {
	toast.success(t("files.messages.filesUploaded"));
	uploadDialogOpen.value = false;
}

function selectStatusFilter(value: string) {
	filterStatus.value = value;
}

function selectSorting(value: string) {
	selectedSorting.value = value;
}

function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr: string | null | undefined): string {
	if (!dateStr) return "—";
	const date = new Date(dateStr);
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const hours = Math.floor(diff / (1000 * 60 * 60));
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (hours < 1) return t("common.time.justNow");
	if (hours < 24) return t("common.time.hoursAgo", { hours });
	if (days < 7) return t("common.time.daysAgo", { days });
	if (days < 30)
		return t("common.time.weeksAgo", { weeks: Math.floor(days / 7) });

	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function getStatusClasses(status: string): string {
	switch (status) {
		case "completed":
			return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
		case "processing":
			return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
		case "pending":
			return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
		case "failed":
			return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
		default:
			return "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300";
	}
}

function toggleFile(fileId: string) {
	const newSet = new Set(selectedFiles.value);
	if (newSet.has(fileId)) {
		newSet.delete(fileId);
	} else {
		newSet.add(fileId);
	}
	selectedFiles.value = newSet;
}

function toggleSelectAll() {
	if (selectedFiles.value.size === filteredFiles.value.length) {
		selectedFiles.value = new Set();
	} else {
		selectedFiles.value = new Set(filteredFiles.value.map((f) => f.fileId));
	}
}

async function downloadSelectedAsZip() {
	try {
		await downloadMultiple(Array.from(selectedFiles.value), "zip");
		toast.success(t("files.messages.downloadStarted"));
		selectedFiles.value = new Set();
	} catch {
		toast.error(t("files.errors.downloadFailed"));
	}
}

async function downloadSelectedAsTar() {
	try {
		await downloadMultiple(Array.from(selectedFiles.value), "tar");
		toast.success(t("files.messages.downloadStarted"));
		selectedFiles.value = new Set();
	} catch {
		toast.error(t("files.errors.downloadFailed"));
	}
}

function clearFilters() {
	searchQuery.value = "";
	filterStatus.value = "any";
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-7xl mx-auto w-full">
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
        <!-- Header Actions -->
        <div class="flex justify-end items-center gap-2 mb-4">
          <!-- Bulk Download -->
          <div class="flex items-center">
            <Button
              @click="downloadSelectedAsZip"
              :disabled="selectedFiles.size === 0"
              variant="outline"
              class="rounded-r-none font-light"
            >
              <Download :size="16" class="mr-2" />
              {{ t("files.actions.download") }}
            </Button>
            <div
              class="h-8 w-px bg-neutral-200 dark:bg-neutral-700"
              :class="selectedFiles.size === 0 ? 'opacity-50' : 'opacity-100'"
            ></div>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  :disabled="selectedFiles.size === 0"
                  variant="outline"
                  class="rounded-l-none px-2"
                >
                  <ChevronDown :size="16" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  @click="downloadSelectedAsZip"
                  class="cursor-pointer"
                >
                  <FileArchive :size="16" class="mr-2" />
                  {{ t("files.actions.downloadAsZip") }}
                </DropdownMenuItem>
                <DropdownMenuItem
                  @click="downloadSelectedAsTar"
                  class="cursor-pointer"
                >
                  <FileArchive :size="16" class="mr-2" />
                  {{ t("files.actions.downloadAsTar") }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <!-- Bulk Delete -->
          <Button
            @click="openDeleteMultipleDialog"
            :disabled="selectedFiles.size === 0"
            variant="outline"
            class="font-light"
          >
            <Trash2 :size="16" class="mr-2" />
            {{ t("files.actions.delete") }}
          </Button>

          <!-- Upload -->
          <Button @click="openUploadDialog" class="font-light">
            <Upload :size="16" class="mr-2" />
            {{ t("files.actions.upload") }}
          </Button>
        </div>

        <!-- Search and Filters -->
        <div
          class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6"
        >
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

          <!-- Status Filter -->
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

          <!-- Sorting -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                variant="outline"
                class="justify-between min-w-[180px] font-light"
              >
                <ArrowUpDown :size="14" class="mr-2 text-neutral-400" />
                {{
                  sortingOptions.find((o) => o.value === selectedSorting)
                    ?.label || t("files.sorting.dateDesc")
                }}
                <ChevronDown :size="16" class="ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-[180px]">
              <DropdownMenuItem
                v-for="option in sortingOptions"
                :key="option.value"
                @click="selectSorting(option.value)"
                class="cursor-pointer font-light"
              >
                {{ option.label }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <!-- Files Table -->
        <div v-if="filteredFiles.length > 0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[50px]">
                  <Checkbox
                    :model-value="allSelected"
                    @update:model-value="toggleSelectAll"
                    class="border-neutral-400 dark:border-neutral-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </TableHead>
                <TableHead class="uppercase text-xs font-light tracking-wider">
                  {{ t("files.table.headers.name") }}
                </TableHead>
                <TableHead class="uppercase text-xs font-light tracking-wider">
                  {{ t("files.table.headers.size") }}
                </TableHead>
                <TableHead class="uppercase text-xs font-light tracking-wider">
                  {{ t("files.table.headers.status") }}
                </TableHead>
                <TableHead class="uppercase text-xs font-light tracking-wider">
                  {{ t("files.table.headers.updated") }}
                </TableHead>
                <TableHead class="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="file in filteredFiles"
                :key="file.fileId"
                class="border-b border-neutral-200 dark:border-neutral-800"
              >
                <TableCell>
                  <Checkbox
                    :model-value="selectedFiles.has(file.fileId)"
                    @update:model-value="toggleFile(file.fileId)"
                    class="border-neutral-400 dark:border-neutral-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded flex items-center justify-center bg-neutral-100 dark:bg-neutral-800"
                    >
                      <component
                        :is="getFileIcon(file.displayName)"
                        :size="16"
                        class="text-neutral-600 dark:text-neutral-400"
                      />
                    </div>
                    <p class="font-normal text-neutral-900 dark:text-white">
                      {{ file.displayName }}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    class="text-sm font-light text-neutral-600 dark:text-neutral-400"
                  >
                    {{ formatFileSize(file.fileSize) }}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    :class="[
                      'text-xs px-2 py-1 rounded capitalize',
                      getStatusClasses(file.status),
                    ]"
                  >
                    {{ t(`files.filters.${file.status}`) }}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    class="text-sm font-light text-neutral-600 dark:text-neutral-400"
                  >
                    {{ formatDate(file.updatedAt) }}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
                        <MoreHorizontal :size="16" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        @click="viewFile(file.fileId)"
                        class="cursor-pointer"
                      >
                        <Eye :size="14" class="mr-2" />
                        {{ t("files.actions.view") }}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        @click="openRenameDialog(file)"
                        class="cursor-pointer"
                      >
                        <Pencil :size="14" class="mr-2" />
                        {{ t("files.actions.rename") }}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        @click="handleDownloadFile(file)"
                        class="cursor-pointer"
                      >
                        <Download :size="14" class="mr-2" />
                        {{ t("files.actions.download") }}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        @click="openDeleteDialog(file)"
                        class="text-red-600 dark:text-red-400 cursor-pointer"
                      >
                        <Trash2 :size="14" class="mr-2" />
                        {{ t("files.actions.delete") }}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Empty State -->
        <div v-else class="py-12 text-center">
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
            {{ t("integrations.explore.clearFilters") }}
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
      :file-count="filesToDeleteMultiple.length || 1"
      :is-deleting="isDeleting"
      @confirm="confirmDelete"
    />

    <RenameFileDialog
      v-model:open="renameDialogOpen"
      :file-name="fileToRename?.displayName || ''"
      :is-renaming="isUpdating"
      @confirm="confirmRename"
    />

    <UploadFilesDialog
      v-model:open="uploadDialogOpen"
      :upload-fn="uploadFilesAsync"
      @uploaded="handleUploadComplete"
    />
  </div>
</template>
