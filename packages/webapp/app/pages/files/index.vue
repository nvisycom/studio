<script setup lang="ts">
import { ref, computed } from "vue";
import {
	Search,
	Plus,
	FileText,
	Download,
	Eye,
	Trash2,
	MoreVertical,
	ChevronDown,
	File,
	Upload,
	FileArchive,
	Pencil,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import EntityAvatar from "@/components/common/EntityAvatar.vue";
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

definePageMeta({
	pageCategory: "Files",
});

interface Document {
	id: number;
	icon: string;
	originalName: string;
	size: string;
	uploadedAt: string;
	uploadedBy: string;
	tags: string[];
	verified: boolean;
	indexed: boolean;
	version: number;
	format: string;
}

const searchQuery = ref("");
const filterFormat = ref("any");
const selectedSorting = ref("date-desc");
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedDocuments = ref<Set<number>>(new Set());

const documents = ref<Document[]>([
	{
		id: 1,
		icon: "pdf",
		originalName: "contract_final_v3.pdf",
		size: "2.4 MB",
		uploadedAt: "2024-01-20 10:30",
		uploadedBy: "John Doe",
		tags: ["Contract", "Legal"],
		verified: false,
		indexed: true,
		version: 3,
		format: "pdf",
	},
	{
		id: 2,
		icon: "pdf",
		originalName: "financial_report_2024.pdf",
		size: "1.8 MB",
		uploadedAt: "2024-01-20 09:15",
		uploadedBy: "Jane Smith",
		tags: ["Finance", "Report"],
		verified: false,
		indexed: true,
		version: 1,
		format: "pdf",
	},
	{
		id: 3,
		icon: "pdf",
		originalName: "legal_document.pdf",
		size: "3.2 MB",
		uploadedAt: "2024-01-19 14:20",
		uploadedBy: "Bob Johnson",
		tags: ["Legal"],
		verified: false,
		indexed: true,
		version: 1,
		format: "pdf",
	},
	{
		id: 4,
		icon: "doc",
		originalName: "employee_records.docx",
		size: "890 KB",
		uploadedAt: "2024-01-19 11:45",
		uploadedBy: "Alice Brown",
		tags: ["HR", "Records"],
		verified: false,
		indexed: true,
		version: 2,
		format: "doc",
	},
	{
		id: 5,
		icon: "txt",
		originalName: "meeting_notes.txt",
		size: "45 KB",
		uploadedAt: "2024-01-18 16:00",
		uploadedBy: "John Doe",
		tags: ["Meeting", "Notes"],
		verified: false,
		indexed: true,
		version: 1,
		format: "text",
	},
	{
		id: 6,
		icon: "pdf",
		originalName: "proposal_draft.pdf",
		size: "4.1 MB",
		uploadedAt: "2024-01-18 09:30",
		uploadedBy: "Jane Smith",
		tags: ["Proposal", "Sales"],
		verified: false,
		indexed: true,
		version: 2,
		format: "pdf",
	},
]);

const formatFilters = [
	{ label: "Any Format", value: "any" },
	{ label: ".pdf", value: "pdf" },
	{ label: ".doc / .docx", value: "doc" },
	{ label: ".txt", value: "text" },
];

const sortingOptions = [
	{ label: "Date (Newest)", value: "date-desc" },
	{ label: "Date (Oldest)", value: "date-asc" },
	{ label: "Name (A-Z)", value: "name-asc" },
	{ label: "Name (Z-A)", value: "name-desc" },
	{ label: "Size (Largest)", value: "size-desc" },
	{ label: "Size (Smallest)", value: "size-asc" },
];

const filteredDocuments = computed(() => {
	let filtered = documents.value;

	// Apply search filter
	if (searchQuery.value.trim()) {
		const query = searchQuery.value.toLowerCase();
		filtered = filtered.filter(
			(doc) =>
				doc.originalName.toLowerCase().includes(query) ||
				doc.uploadedBy.toLowerCase().includes(query) ||
				doc.tags.some((tag) => tag.toLowerCase().includes(query)),
		);
	}

	// Apply format filter
	if (filterFormat.value !== "any") {
		filtered = filtered.filter((doc) => doc.format === filterFormat.value);
	}

	// Sort the results
	filtered = [...filtered].sort((a, b) => {
		switch (selectedSorting.value) {
			case "date-asc":
				return (
					new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
				);
			case "date-desc":
				return (
					new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
				);
			case "name-asc":
				return a.originalName.localeCompare(b.originalName);
			case "name-desc":
				return b.originalName.localeCompare(a.originalName);
			case "size-asc":
				return parseFloat(a.size) - parseFloat(b.size);
			case "size-desc":
				return parseFloat(b.size) - parseFloat(a.size);
			default:
				return 0;
		}
	});

	return filtered;
});

function viewDocument(docId: number) {
	console.log("Viewing document:", docId);
}

function downloadDocument(docId: number) {
	console.log("Downloading document:", docId);
}

function deleteDocument(docId: number) {
	console.log("Deleting document:", docId);
}

function handleUploadClick() {
	fileInputRef.value?.click();
}

function handleFileChange(event: Event) {
	const target = event.target as HTMLInputElement;
	const files = target.files;
	if (files && files.length > 0) {
		console.log(
			"Uploading files:",
			Array.from(files).map((f) => f.name),
		);
		// Here you would implement the actual upload logic
		// For now, just log the file names
	}
}

function selectFormatFilter(value: string) {
	filterFormat.value = value;
}

function selectSorting(value: string) {
	selectedSorting.value = value;
}

function getFileIcon(format: string) {
	return FileText;
}

function formatDate(dateStr: string): string {
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

function getFormatColor(format: string): string {
	switch (format) {
		case "pdf":
			return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300";
		case "doc":
			return "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300";
		case "text":
			return "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300";
		default:
			return "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300";
	}
}

function toggleDocument(docId: number) {
	const newSet = new Set(selectedDocuments.value);
	if (newSet.has(docId)) {
		newSet.delete(docId);
	} else {
		newSet.add(docId);
	}
	selectedDocuments.value = newSet;
}

function downloadSelectedAsZip() {
	console.log(
		"Downloading selected documents as ZIP:",
		Array.from(selectedDocuments.value),
	);
}

function downloadSelectedAsTar() {
	console.log(
		"Downloading selected documents as TAR:",
		Array.from(selectedDocuments.value),
	);
}

function editSelectedDocuments() {
	console.log(
		"Editing selected documents:",
		Array.from(selectedDocuments.value),
	);
}

function editDocument(docId: number) {
	console.log("Editing document:", docId);
}

function toggleSelectAll() {
	if (selectedDocuments.value.size === filteredDocuments.value.length) {
		selectedDocuments.value = new Set();
	} else {
		selectedDocuments.value = new Set(filteredDocuments.value.map((d) => d.id));
	}
}

const allSelected = computed(() => {
	return (
		filteredDocuments.value.length > 0 &&
		selectedDocuments.value.size === filteredDocuments.value.length
	);
});
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-0">
    <div class="max-w-7xl mx-auto w-full">
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
            :disabled="selectedDocuments.size === 0"
            class="rounded-r-none"
          >
            <Download :size="16" class="mr-2" />
            Download
          </Button>
          <div
            class="h-8 w-px bg-neutral-200 dark:bg-neutral-700"
            :class="selectedDocuments.size === 0 ? 'opacity-50' : 'opacity-100'"
          ></div>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                :disabled="selectedDocuments.size === 0"
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
          @click="editSelectedDocuments"
          :disabled="selectedDocuments.size === 0"
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

        <!-- Format Filter -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="justify-between min-w-[160px]">
              {{
                formatFilters.find((f) => f.value === filterFormat)?.label ||
                "Any Format"
              }}
              <ChevronDown :size="16" class="ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-[160px]">
            <DropdownMenuItem
              v-for="filter in formatFilters"
              :key="filter.value"
              @click="selectFormatFilter(filter.value)"
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

      <!-- Documents Table -->
      <div
        v-if="filteredDocuments.length > 0"
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
              <TableHead class="w-12"></TableHead>
              <TableHead>Original Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead class="w-[80px]">Indexed</TableHead>
              <TableHead class="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="doc in filteredDocuments"
              :key="doc.id"
              class="hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              <TableCell>
                <Checkbox
                  :model-value="selectedDocuments.has(doc.id)"
                  @update:model-value="toggleDocument(doc.id)"
                />
              </TableCell>
              <TableCell>
                <div
                  class="w-8 h-8 rounded flex items-center justify-center"
                  :class="getFormatColor(doc.format)"
                >
                  <component :is="getFileIcon(doc.format)" :size="16" />
                </div>
              </TableCell>
              <TableCell>
                <p class="font-medium text-neutral-900 dark:text-white">
                  {{ doc.originalName }}
                </p>
              </TableCell>
              <TableCell>
                <span class="text-sm text-neutral-600 dark:text-neutral-400">
                  {{ doc.size }}
                </span>
              </TableCell>
              <TableCell>
                <div class="inline-flex items-center gap-2">
                  <EntityAvatar :name="doc.uploadedBy" size="sm" />
                  <div class="flex flex-col">
                    <span class="text-sm font-medium">{{
                      doc.uploadedBy
                    }}</span>
                    <span
                      class="text-xs text-neutral-500 dark:text-neutral-400"
                    >
                      {{ doc.uploadedAt }}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div class="flex flex-wrap gap-1">
                  <Badge
                    v-for="tag in doc.tags"
                    :key="tag"
                    variant="outline"
                    class="text-xs"
                  >
                    {{ tag }}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <Switch :checked="doc.indexed" disabled />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" class="h-8 w-8">
                      <MoreVertical :size="16" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="viewDocument(doc.id)">
                      <Eye :size="16" class="mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="editDocument(doc.id)">
                      <Pencil :size="16" class="mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="downloadDocument(doc.id)">
                      <Download :size="16" class="mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      @click="deleteDocument(doc.id)"
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
          <EmptyTitle>No documents found</EmptyTitle>
          <EmptyDescription>
            {{
              searchQuery || filterFormat !== "any"
                ? "Try adjusting your search or filters"
                : "Upload your first document to get started"
            }}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent v-if="!searchQuery && filterFormat === 'any'">
          <Button @click="handleUploadClick" class="flex items-center gap-2">
            <Upload :size="16" />
            Upload
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  </div>
</template>
