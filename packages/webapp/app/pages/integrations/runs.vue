<script setup lang="ts">
import { ref, computed } from "vue";
import {
  Search,
  ChevronDown,
  ArrowLeft,
  Eye,
  Copy,
  Check,
  MoreHorizontal,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { RunDetailsModal } from "~/components/pages/integrations";

definePageMeta({
  pageName: "Integrations",
});

interface IntegrationRun {
  id: string;
  integration: string;
  name: string;
  statusCode: number;
  startedAt: Date;
  duration: string;
}

const searchQuery = ref("");
const statusFilter = ref("all");
const dateRange = ref("24h");
const selectedRuns = ref<Set<string>>(new Set());
const isViewDetailsModalOpen = ref(false);
const selectedRunForDetails = ref<IntegrationRun | null>(null);

const runs = ref<IntegrationRun[]>([
  {
    id: "1",
    integration: "Dropbox",
    name: "Sync documents",
    statusCode: 200,
    startedAt: new Date("2024-01-20T10:30:00"),
    duration: "2m 15s",
  },
  {
    id: "2",
    integration: "Google Drive",
    name: "Import files",
    statusCode: 102,
    startedAt: new Date("2024-01-20T10:25:00"),
    duration: "5m 12s",
  },
  {
    id: "3",
    integration: "Slack",
    name: "Send notification",
    statusCode: 200,
    startedAt: new Date("2024-01-20T09:15:00"),
    duration: "0m 3s",
  },
  {
    id: "4",
    integration: "AWS S3",
    name: "Upload backup",
    statusCode: 500,
    startedAt: new Date("2024-01-20T08:45:00"),
    duration: "1m 32s",
  },
  {
    id: "5",
    integration: "Dropbox",
    name: "Download files",
    statusCode: 201,
    startedAt: new Date("2024-01-19T16:20:00"),
    duration: "3m 8s",
  },
]);

const statusFilters = [
  { label: "All Status", value: "all" },
  { label: "1xx - Informational", value: "1xx" },
  { label: "2xx - Success", value: "2xx" },
  { label: "3xx - Redirection", value: "3xx" },
  { label: "4xx - Client Error", value: "4xx" },
  { label: "5xx - Server Error", value: "5xx" },
];

const filteredRuns = computed(() => {
  let filtered = runs.value;

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (run) =>
        run.integration.toLowerCase().includes(query) ||
        run.name.toLowerCase().includes(query),
    );
  }

  if (statusFilter.value !== "all") {
    const statusCode = statusFilter.value.charAt(0);
    filtered = filtered.filter(
      (run) => Math.floor(run.statusCode / 100).toString() === statusCode,
    );
  }

  return filtered.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
});

function getStatusCodeColor(statusCode: number): string {
  if (statusCode >= 100 && statusCode < 200) {
    return "text-blue-600 dark:text-blue-400";
  } else if (statusCode >= 200 && statusCode < 300) {
    return "text-green-600 dark:text-green-400";
  } else if (statusCode >= 300 && statusCode < 400) {
    return "text-yellow-600 dark:text-yellow-400";
  } else if (statusCode >= 400 && statusCode < 500) {
    return "text-orange-600 dark:text-orange-400";
  } else if (statusCode >= 500) {
    return "text-red-600 dark:text-red-400";
  }
  return "text-neutral-600 dark:text-neutral-400";
}

function toggleRunSelection(runId: string) {
  if (selectedRuns.value.has(runId)) {
    selectedRuns.value.delete(runId);
  } else {
    selectedRuns.value.add(runId);
  }
}

function toggleAllRuns() {
  if (selectedRuns.value.size === filteredRuns.value.length) {
    selectedRuns.value.clear();
  } else {
    selectedRuns.value = new Set(filteredRuns.value.map((run) => run.id));
  }
}

const allSelected = computed(
  () =>
    filteredRuns.value.length > 0 &&
    selectedRuns.value.size === filteredRuns.value.length,
);

const logsCopied = ref(false);

function copyDetails() {
  const selectedRunsData = runs.value.filter((run) =>
    selectedRuns.value.has(run.id),
  );
  console.log("Copy details:", selectedRunsData);
}

function copyLogs() {
  const selectedRunsData = runs.value.filter((run) =>
    selectedRuns.value.has(run.id),
  );
  console.log("Copy logs:", selectedRunsData);
  logsCopied.value = true;
  setTimeout(() => {
    logsCopied.value = false;
  }, 2000);
}

function viewRunDetails(run: IntegrationRun) {
  selectedRunForDetails.value = run;
  isViewDetailsModalOpen.value = true;
}

function copyRunDetails(run: IntegrationRun) {
  console.log("Copy run details:", run);
}

function formatDate(date: Date): string {
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
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <!-- Search and Filters -->
      <div class="flex items-center gap-3 mb-6 flex-wrap">
        <Button as-child>
          <NuxtLink to="/integrations" class="flex items-center gap-2">
            <ArrowLeft :size="16" />
            Back to Connections
          </NuxtLink>
        </Button>

        <div class="flex-1 min-w-[200px]">
          <div class="relative">
            <Search
              class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500"
            />
            <Input
              v-model="searchQuery"
              placeholder="Search runs..."
              class="pl-10"
            />
          </div>
        </div>

        <Select v-model="statusFilter">
          <SelectTrigger class="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="1xx">1xx - Informational</SelectItem>
            <SelectItem value="2xx">2xx - Success</SelectItem>
            <SelectItem value="3xx">3xx - Redirection</SelectItem>
            <SelectItem value="4xx">4xx - Client Error</SelectItem>
            <SelectItem value="5xx">5xx - Server Error</SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="dateRange">
          <SelectTrigger class="w-[150px]">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Last hour</SelectItem>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Runs Table -->
      <Card class="py-0 pt-6 pb-6 rounded-xl">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Integration Runs</CardTitle>
              <CardDescription>
                {{ filteredRuns.length }} run{{
                  filteredRuns.length !== 1 ? "s" : ""
                }}
                found
                <span v-if="selectedRuns.size > 0">
                  · {{ selectedRuns.size }} selected
                </span>
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              @click="copyLogs"
              :disabled="selectedRuns.size === 0"
              class="flex items-center gap-2"
            >
              <Check v-if="logsCopied" :size="16" />
              <Copy v-else :size="16" />
              {{ logsCopied ? "Copied!" : "Copy Logs" }}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[40px]">
                  <Checkbox
                    :model-value="allSelected"
                    @update:model-value="toggleAllRuns"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Integration</TableHead>
                <TableHead class="w-[100px]">Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead class="w-[100px]">Duration</TableHead>
                <TableHead class="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="run in filteredRuns" :key="run.id">
                <TableCell @click.stop>
                  <Checkbox
                    :model-value="selectedRuns.has(run.id)"
                    @update:model-value="toggleRunSelection(run.id)"
                  />
                </TableCell>
                <TableCell>
                  <p class="font-medium text-neutral-900 dark:text-white">
                    {{ run.name }}
                  </p>
                </TableCell>
                <TableCell>
                  <span class="text-sm text-neutral-600 dark:text-neutral-400">
                    {{ run.integration }}
                  </span>
                </TableCell>
                <TableCell>
                  <div
                    v-if="run.statusCode === 102"
                    class="flex items-center gap-2"
                  >
                    <Spinner class="h-3 w-3" />
                    <span
                      :class="getStatusCodeColor(run.statusCode)"
                      class="font-mono text-xs font-semibold"
                    >
                      {{ run.statusCode }}
                    </span>
                  </div>
                  <span
                    v-else
                    :class="getStatusCodeColor(run.statusCode)"
                    class="font-mono text-xs font-semibold"
                  >
                    {{ run.statusCode }}
                  </span>
                </TableCell>
                <TableCell
                  class="text-xs text-neutral-600 dark:text-neutral-400"
                >
                  {{ formatDate(run.startedAt) }}
                </TableCell>
                <TableCell
                  class="text-xs text-neutral-600 dark:text-neutral-400"
                >
                  {{ run.duration }}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
                        <MoreHorizontal :size="16" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem @click="viewRunDetails(run)">
                        <Eye :size="16" class="mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="copyRunDetails(run)">
                        <Copy :size="16" class="mr-2" />
                        Copy Logs
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div
            v-if="filteredRuns.length === 0"
            class="py-12 text-center text-neutral-500"
          >
            No runs found matching your filters
          </div>
        </CardContent>
      </Card>

      <!-- Run Details Modal -->
      <RunDetailsModal
        v-model:open="isViewDetailsModalOpen"
        :run="selectedRunForDetails"
      />
    </div>
  </div>
</template>
