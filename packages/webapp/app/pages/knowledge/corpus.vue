<script setup lang="ts">
import { ref, computed } from "vue";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  FileText,
  Search,
  HardDrive,
  Zap,
  Files,
} from "lucide-vue-next";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

definePageMeta({
  pageName: "Knowledge",
});

interface CorpusDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  addedDate: Date;
  status: "indexed" | "processing" | "failed";
}

const searchQuery = ref("");
const statusFilter = ref("all");

const corpusDocuments = ref<CorpusDocument[]>([
  {
    id: "1",
    name: "Product Documentation",
    type: "PDF",
    size: "2.4 MB",
    addedDate: new Date("2024-01-15"),
    status: "indexed",
  },
  {
    id: "2",
    name: "FAQ Database",
    type: "TXT",
    size: "156 KB",
    addedDate: new Date("2024-01-20"),
    status: "indexed",
  },
  {
    id: "3",
    name: "Training Materials",
    type: "DOCX",
    size: "5.1 MB",
    addedDate: new Date("2024-01-22"),
    status: "indexed",
  },
]);

// Stats
const totalDocumentsSize = ref("251 MB");
const indexSize = ref("14.2 MB");
const totalSize = ref("265.2 MB");
const totalChunks = ref(2031);
const totalDocuments = ref(3);
const avgChunkSize = ref("6.5 KB");
const avgResponseTime = ref(124);
const cacheHitRate = ref(78);
const p95ResponseTime = ref(247);

const documentCount = computed(() => corpusDocuments.value.length);

function addDocument() {
  console.log("Adding new document to corpus");
}

function editDocument(docId: string) {
  console.log("Editing document:", docId);
}

function deleteDocument(docId: string) {
  console.log("Deleting document:", docId);
}

function getStatusColor(status: string) {
  switch (status) {
    case "indexed":
      return "text-green-600 dark:text-green-400";
    case "processing":
      return "text-yellow-600 dark:text-yellow-400";
    case "failed":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-neutral-600 dark:text-neutral-400";
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-6xl mx-auto w-full space-y-4">
      <!-- Stats Cards -->
      <div class="grid gap-6 grid-cols-3">
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium">Storage Usage</CardTitle>
            <HardDrive class="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ totalSize }}</div>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Files {{ totalDocumentsSize }} • Index {{ indexSize }}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium">Documents</CardTitle>
            <Files class="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ totalDocuments }}</div>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {{ totalChunks.toLocaleString() }} chunks • {{ avgChunkSize }} avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium">Performance</CardTitle>
            <Zap class="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ avgResponseTime }}ms</div>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              p95 {{ p95ResponseTime }}ms • {{ cacheHitRate }}% cache hit
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Main Card -->
      <Card
        class="overflow-hidden py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
      >
        <CardHeader>
          <div class="flex items-center justify-between mb-4">
            <div>
              <CardTitle>Knowledge Corpus</CardTitle>
              <CardDescription>
                {{ documentCount }} document{{
                  documentCount !== 1 ? "s" : ""
                }}
                in the index
              </CardDescription>
            </div>
            <Button @click="addDocument" size="sm">
              <Plus :size="16" class="mr-2" />
              Add Document
            </Button>
          </div>

          <!-- Search and Filters -->
          <div class="flex gap-2">
            <div class="relative flex-1">
              <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400"
              />
              <Input
                v-model="searchQuery"
                placeholder="Search documents..."
                class="pl-9"
              />
            </div>
            <Select v-model="statusFilter">
              <SelectTrigger class="w-[180px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="indexed">Indexed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead class="w-[100px]">Type</TableHead>
                <TableHead class="w-[120px]">Size</TableHead>
                <TableHead class="w-[140px]">Added</TableHead>
                <TableHead class="w-[120px]">Status</TableHead>
                <TableHead class="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="doc in corpusDocuments"
                :key="doc.id"
                class="hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                <TableCell>
                  <div class="flex items-center gap-2">
                    <FileText :size="16" class="text-neutral-400" />
                    <p class="font-medium text-neutral-900 dark:text-white">
                      {{ doc.name }}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <span class="text-sm text-neutral-600 dark:text-neutral-400">
                    {{ doc.type }}
                  </span>
                </TableCell>
                <TableCell>
                  <span class="text-sm text-neutral-600 dark:text-neutral-400">
                    {{ doc.size }}
                  </span>
                </TableCell>
                <TableCell>
                  <span class="text-sm text-neutral-600 dark:text-neutral-400">
                    {{ doc.addedDate.toLocaleDateString() }}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    class="text-sm capitalize font-medium"
                    :class="getStatusColor(doc.status)"
                  >
                    {{ doc.status }}
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
                      <DropdownMenuItem @click="editDocument(doc.id)">
                        <Pencil :size="16" class="mr-2" />
                        Edit
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
        </CardContent>
        <CardFooter
          class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
        >
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Documents are automatically indexed for intelligent search and
            retrieval.
          </p>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>
