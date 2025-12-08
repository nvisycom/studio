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
	ShieldCheck,
	ShieldX,
	ChevronDown,
	File,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
	breadcrumbs: [{ label: "[project]" }, { label: "Documents" }],
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
	version: number;
	format: string;
}

const searchQuery = ref("");
const filterFormat = ref("any");
const filterStatus = ref("any");
const selectedSorting = ref("date-desc");

const documents = ref<Document[]>([
	{
		id: 1,
		icon: "pdf",
		originalName: "contract_final_v3.pdf",
		size: "2.4 MB",
		uploadedAt: "2024-01-20 10:30",
		uploadedBy: "John Doe",
		tags: ["Contract", "Legal"],
		verified: true,
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
		verified: true,
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
		verified: true,
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
		verified: true,
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
		version: 2,
		format: "pdf",
	},
]);

const formatFilters = [
	{ label: "Any Format", value: "any" },
	{ label: "PDF", value: "pdf" },
	{ label: "DOC", value: "doc" },
	{ label: "Text", value: "text" },
];

const statusFilters = [
	{ label: "Any Status", value: "any" },
	{ label: "Verified", value: "verified" },
	{ label: "Unverified", value: "unverified" },
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

	// Apply status filter
	if (filterStatus.value === "verified") {
		filtered = filtered.filter((doc) => doc.verified);
	} else if (filterStatus.value === "unverified") {
		filtered = filtered.filter((doc) => !doc.verified);
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

function selectFormatFilter(value: string) {
	filterFormat.value = value;
}

function selectStatusFilter(value: string) {
	filterStatus.value = value;
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
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-0">
    <div class="max-w-7xl mx-auto w-full">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
          Documents
        </h1>
        <p class="text-neutral-600 dark:text-neutral-400">
          Manage and track all your redacted documents
        </p>
      </div>

      <!-- Search and Filters -->
      <div class="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center mb-6">
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
              {{ formatFilters.find(f => f.value === filterFormat)?.label || 'Any Format' }}
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

        <!-- Status Filter -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="justify-between min-w-[160px]">
              {{ statusFilters.find(f => f.value === filterStatus)?.label || 'Any Status' }}
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
              {{ sortingOptions.find(o => o.value === selectedSorting)?.label || 'Sort by' }}
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

        <Button class="flex items-center gap-2">
          <Plus :size="16" />
          Upload Document
        </Button>
      </div>

      <!-- Documents Table -->
      <div v-if="filteredDocuments.length > 0" class="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-12"></TableHead>
              <TableHead>Original Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded At</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Version</TableHead>
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
                <span class="text-sm text-neutral-600 dark:text-neutral-400" :title="doc.uploadedAt">
                  {{ formatDate(doc.uploadedAt) }}
                </span>
              </TableCell>
              <TableCell>
                <span class="text-sm text-neutral-600 dark:text-neutral-400">
                  {{ doc.uploadedBy }}
                </span>
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
                <div class="flex items-center gap-1.5">
                  <component
                    :is="doc.verified ? ShieldCheck : ShieldX"
                    :size="14"
                    :class="doc.verified ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                  />
                  <span
                    class="text-xs font-medium"
                    :class="doc.verified ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                  >
                    {{ doc.verified ? 'Verified' : 'Unverified' }}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" class="text-xs">
                  v{{ doc.version }}
                </Badge>
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
                    <DropdownMenuItem @click="downloadDocument(doc.id)">
                      <Download :size="16" class="mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="deleteDocument(doc.id)" class="text-red-600 dark:text-red-400">
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
              searchQuery ||
              filterFormat !== 'any' ||
              filterStatus !== 'any'
                ? 'Try adjusting your search or filters'
                : 'Upload your first document to get started'
            }}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent v-if="!searchQuery && filterFormat === 'any' && filterStatus === 'any'">
          <Button class="flex items-center gap-2">
            <Plus :size="16" />
            Upload Document
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  </div>
</template>
