<script setup lang="ts">
import { ref, computed } from "vue";
import {
  Search,
  FileText,
  Download,
  Eye,
  Trash2,
  MoreVertical,
  ChevronDown,
  Upload,
  FileArchive,
  Pencil,
  Loader2,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import type { File as NvisyFile } from "@nvisy/sdk";

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
  downloadFile,
  downloadMultiple,
} = useFiles();

// Local state
const searchQuery = ref("");
const filterStatus = ref("any");
const selectedSorting = ref("date-desc");
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFiles = ref<Set<string>>(new Set());

const statusFilters = [
  { label: "Any Status", value: "any" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
];

const sortingOptions = [
  { label: "Date (Newest)", value: "date-desc" },
  { label: "Date (Oldest)", value: "date-asc" },
  { label: "Name (A-Z)", value: "name-asc" },
  { label: "Name (Z-A)", value: "name-desc" },
  { label: "Size (Largest)", value: "size-desc" },
  { label: "Size (Smallest)", value: "size-asc" },
];

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

function viewFile(fileId: string) {
  navigateTo(`/files/studio?id=${fileId}`);
}

async function handleDownloadFile(file: NvisyFile) {
  await downloadFile(file.fileId, file.displayName);
}

async function handleDeleteFile(fileId: string) {
  if (confirm("Are you sure you want to delete this file?")) {
    await deleteFileAsync(fileId);
  }
}

function handleUploadClick() {
  fileInputRef.value?.click();
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const uploadedFiles = target.files;
  if (uploadedFiles && uploadedFiles.length > 0) {
    // TODO: Implement file upload via API
    console.log(
      "Uploading files:",
      Array.from(uploadedFiles).map((f) => f.name),
    );
  }
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

  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300";
    case "processing":
      return "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300";
    case "pending":
      return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300";
    case "failed":
      return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300";
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

async function downloadSelectedAsZip() {
  await downloadMultiple(Array.from(selectedFiles.value), "zip");
  selectedFiles.value = new Set();
}

async function downloadSelectedAsTar() {
  await downloadMultiple(Array.from(selectedFiles.value), "tar");
  selectedFiles.value = new Set();
}

function editSelectedFiles() {
  // TODO: Implement bulk edit
  console.log("Editing selected files:", Array.from(selectedFiles.value));
}

function editFile(fileId: string) {
  // TODO: Implement single file edit
  console.log("Editing file:", fileId);
}

function toggleSelectAll() {
  if (selectedFiles.value.size === filteredFiles.value.length) {
    selectedFiles.value = new Set();
  } else {
    selectedFiles.value = new Set(filteredFiles.value.map((f) => f.fileId));
  }
}

const allSelected = computed(() => {
  return (
    filteredFiles.value.length > 0 &&
    selectedFiles.value.size === filteredFiles.value.length
  );
});
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-0">
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
          {{ error.message || "Failed to load files" }}
        </p>
      </div>

      <template v-else>
        <!-- Upload and Download Actions -->
        <div class="flex justify-end items-center gap-2 mb-4">
          <input
            ref="fileInputRef"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            class="hidden"
            @change="handleFileChange"
          />
          <div class="flex items-center">
            <Button
              @click="downloadSelectedAsZip"
              :disabled="selectedFiles.size === 0"
              class="rounded-r-none"
            >
              <Download :size="16" class="mr-2" />
              Download
            </Button>
            <div
              class="h-8 w-px bg-neutral-200 dark:bg-neutral-700"
              :class="selectedFiles.size === 0 ? 'opacity-50' : 'opacity-100'"
            ></div>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  :disabled="selectedFiles.size === 0"
                  class="rounded-l-none px-2"
                >
                  <ChevronDown :size="16" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="downloadSelectedAsZip">
                  <FileArchive :size="16" class="mr-2" />
                  Download as .zip
                </DropdownMenuItem>
                <DropdownMenuItem @click="downloadSelectedAsTar">
                  <FileArchive :size="16" class="mr-2" />
                  Download as .tar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button
            @click="editSelectedFiles"
            :disabled="selectedFiles.size === 0"
            class="flex items-center gap-2"
          >
            <Pencil :size="16" />
            Edit
          </Button>
          <Button @click="handleUploadClick" class="flex items-center gap-2">
            <Upload :size="16" />
            Upload
          </Button>
        </div>

        <!-- Search and Filters -->
        <div
          class="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center mb-6"
        >
          <div class="relative flex-1">
            <Search
              :size="16"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <Input
              v-model="searchQuery"
              placeholder="Search by name..."
              class="pl-10"
            />
          </div>

          <!-- Status Filter -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" class="justify-between min-w-[160px]">
                {{
                  statusFilters.find((f) => f.value === filterStatus)?.label ||
                  "Any Status"
                }}
                <ChevronDown :size="16" class="ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-[160px]">
              <DropdownMenuItem
                v-for="filter in statusFilters"
                :key="filter.value"
                @click="selectStatusFilter(filter.value)"
              >
                {{ filter.label }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <!-- Sorting -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" class="justify-between min-w-[180px]">
                {{
                  sortingOptions.find((o) => o.value === selectedSorting)
                    ?.label || "Sort by"
                }}
                <ChevronDown :size="16" class="ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-[180px]">
              <DropdownMenuItem
                v-for="option in sortingOptions"
                :key="option.value"
                @click="selectSorting(option.value)"
              >
                {{ option.label }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <!-- Files Table -->
        <div
          v-if="filteredFiles.length > 0"
          class="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-12">
                  <Checkbox
                    :model-value="allSelected"
                    @update:model-value="toggleSelectAll"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead class="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="file in filteredFiles"
                :key="file.fileId"
                class="hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                <TableCell>
                  <Checkbox
                    :model-value="selectedFiles.has(file.fileId)"
                    @update:model-value="toggleFile(file.fileId)"
                  />
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded flex items-center justify-center bg-neutral-100 dark:bg-neutral-800"
                    >
                      <FileText
                        :size="16"
                        class="text-neutral-600 dark:text-neutral-400"
                      />
                    </div>
                    <p class="font-medium text-neutral-900 dark:text-white">
                      {{ file.displayName }}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <span class="text-sm text-neutral-600 dark:text-neutral-400">
                    {{ formatFileSize(file.fileSize) }}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge :class="getStatusColor(file.status)" variant="outline">
                    {{ file.status }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span class="text-sm text-neutral-600 dark:text-neutral-400">
                    {{ formatDate(file.updatedAt) }}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon" class="h-8 w-8">
                        <MoreVertical :size="16" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem @click="viewFile(file.fileId)">
                        <Eye :size="16" class="mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="editFile(file.fileId)">
                        <Pencil :size="16" class="mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="handleDownloadFile(file)">
                        <Download :size="16" class="mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        @click="handleDeleteFile(file.fileId)"
                        class="text-red-600 dark:text-red-400"
                      >
                        <Trash2 :size="16" class="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Empty State -->
        <Empty v-else class="py-12">
          <EmptyHeader>
            <EmptyTitle>No files found</EmptyTitle>
            <EmptyDescription>
              {{
                searchQuery || filterStatus !== "any"
                  ? "Try adjusting your search or filters"
                  : "Upload your first file to get started"
              }}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent v-if="!searchQuery && filterStatus === 'any'">
            <Button @click="handleUploadClick" class="flex items-center gap-2">
              <Upload :size="16" />
              Upload
            </Button>
          </EmptyContent>
        </Empty>
      </template>
    </div>
  </div>
</template>
