<script setup lang="ts">
import { ref, computed } from "vue";
import {
  Play,
  Pause,
  MoreVertical,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ChevronDown,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

definePageMeta({
  pageName: "Pipelines",
});

interface Pipeline {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "failed";
  lastRun: Date;
  runsCount: number;
  successRate: string;
}

const searchQuery = ref("");
const statusFilter = ref("all");
const sortBy = ref("name-asc");

const pipelines = ref<Pipeline[]>([
  {
    id: "1",
    name: "Document Processing Pipeline",
    description: "Automated redaction and classification workflow",
    status: "active",
    lastRun: new Date(Date.now() - 15 * 60000),
    runsCount: 1234,
    successRate: "98.5%",
  },
  {
    id: "2",
    name: "Daily Report Generation",
    description: "Generate and distribute daily analytics reports",
    status: "active",
    lastRun: new Date(Date.now() - 2 * 3600000),
    runsCount: 456,
    successRate: "100%",
  },
  {
    id: "3",
    name: "Email Integration Sync",
    description: "Sync documents from email attachments",
    status: "paused",
    lastRun: new Date(Date.now() - 24 * 3600000),
    runsCount: 789,
    successRate: "95.2%",
  },
  {
    id: "4",
    name: "Archive Cleanup",
    description: "Remove old documents based on retention policy",
    status: "failed",
    lastRun: new Date(Date.now() - 6 * 3600000),
    runsCount: 234,
    successRate: "87.3%",
  },
]);

const statusFilters = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "failed", label: "Failed" },
];

const sortOptions = [
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "runs-desc", label: "Most Runs" },
  { value: "runs-asc", label: "Least Runs" },
];

const filteredPipelines = computed(() => {
  let filtered = pipelines.value;

  if (statusFilter.value !== "all") {
    filtered = filtered.filter((p) => p.status === statusFilter.value);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query),
    );
  }

  // Sort
  if (sortBy.value === "name-asc") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy.value === "name-desc") {
    filtered.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sortBy.value === "runs-desc") {
    filtered.sort((a, b) => b.runsCount - a.runsCount);
  } else if (sortBy.value === "runs-asc") {
    filtered.sort((a, b) => a.runsCount - b.runsCount);
  }

  return filtered;
});

function getStatusIcon(status: string) {
  switch (status) {
    case "active":
      return CheckCircle;
    case "failed":
      return XCircle;
    default:
      return Clock;
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300";
    case "failed":
      return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300";
    default:
      return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300";
  }
}

function formatTime(date: Date) {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function createPipeline() {
  console.log("Creating new pipeline");
  // TODO: Implement pipeline creation modal
}

function selectStatusFilter(value: string) {
  statusFilter.value = value;
}

function selectSortBy(value: string) {
  sortBy.value = value;
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-7xl mx-auto w-full">
      <!-- Pipelines Table -->
      <Card
        class="overflow-hidden py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
      >
        <CardHeader>
          <div class="flex items-center justify-between mb-4">
            <div>
              <CardTitle>Pipelines</CardTitle>
              <CardDescription>
                Manage automated workflows and data pipelines
              </CardDescription>
            </div>
            <Button @click="createPipeline">
              <Plus :size="16" class="mr-2" />
              New Pipeline
            </Button>
          </div>

          <!-- Search and Filters -->
          <div class="flex gap-3 items-center">
            <div class="relative flex-1">
              <Search
                :size="16"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <Input
                v-model="searchQuery"
                placeholder="Search pipelines..."
                class="pl-10 border-neutral-300 dark:border-neutral-700"
              />
            </div>

            <!-- Status Filter -->
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  variant="outline"
                  class="justify-between min-w-32 border-neutral-300 dark:border-neutral-700"
                >
                  {{
                    statusFilters.find((f) => f.value === statusFilter)?.label
                  }}
                  <ChevronDown :size="16" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  v-for="filter in statusFilters"
                  :key="filter.value"
                  @click="selectStatusFilter(filter.value)"
                >
                  {{ filter.label }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <!-- Sort By -->
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  variant="outline"
                  class="justify-between min-w-32 border-neutral-300 dark:border-neutral-700"
                >
                  {{ sortOptions.find((o) => o.value === sortBy)?.label }}
                  <ChevronDown :size="16" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  v-for="option in sortOptions"
                  :key="option.value"
                  @click="selectSortBy(option.value)"
                >
                  {{ option.label }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent class="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead class="w-[100px]">Status</TableHead>
                <TableHead class="w-[120px]">Last Run</TableHead>
                <TableHead class="w-[80px]">Runs</TableHead>
                <TableHead class="w-[100px]">Success Rate</TableHead>
                <TableHead class="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="pipeline in filteredPipelines"
                :key="pipeline.id"
              >
                <TableCell class="font-medium">
                  {{ pipeline.name }}
                </TableCell>
                <TableCell class="text-neutral-600 dark:text-neutral-400">
                  {{ pipeline.description }}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    :class="getStatusClass(pipeline.status)"
                    class="flex items-center gap-1 w-fit"
                  >
                    <component
                      :is="getStatusIcon(pipeline.status)"
                      :size="12"
                    />
                    {{ pipeline.status }}
                  </Badge>
                </TableCell>
                <TableCell
                  class="text-sm text-neutral-600 dark:text-neutral-400"
                >
                  {{ formatTime(pipeline.lastRun) }}
                </TableCell>
                <TableCell class="text-sm">
                  {{ pipeline.runsCount.toLocaleString() }}
                </TableCell>
                <TableCell class="text-sm font-medium">
                  {{ pipeline.successRate }}
                </TableCell>
                <TableCell class="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="sm">
                        <MoreVertical :size="16" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem v-if="pipeline.status === 'active'">
                        <Pause :size="16" class="mr-2" />
                        Pause
                      </DropdownMenuItem>
                      <DropdownMenuItem v-else>
                        <Play :size="16" class="mr-2" />
                        Resume
                      </DropdownMenuItem>
                      <DropdownMenuItem> View Details </DropdownMenuItem>
                      <DropdownMenuItem> Edit </DropdownMenuItem>
                      <DropdownMenuItem class="text-red-600 dark:text-red-400">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div
            v-if="filteredPipelines.length === 0"
            class="py-12 text-center text-neutral-500"
          >
            No pipelines found matching your filters
          </div>
        </CardContent>
        <CardFooter
          class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
        >
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Pipelines run automatically based on their configured schedules and
            triggers.
          </p>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>
