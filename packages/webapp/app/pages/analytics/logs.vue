<script setup lang="ts">
import { ref, computed } from "vue";
import {
	Download,
	Upload,
	Search,
	Filter,
	AlertCircle,
	Info,
	XCircle,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";

definePageMeta({
	pageName: "Analytics",
});

// Filters
const logLevel = ref("all");
const searchQuery = ref("");
const dateRange = ref("24h");
const viewType = ref("logs"); // "logs" or "traces"

// Check if on-premise deployment
const isOnPremise = ref(false); // TODO: Get this from config/environment

// Mock log data
const logs = ref([
	{
		id: "1",
		timestamp: new Date(Date.now() - 5 * 60000),
		level: "info",
		message: "API request processed successfully",
		endpoint: "/api/documents/analyze",
		duration: "245ms",
		status: 200,
	},
	{
		id: "2",
		timestamp: new Date(Date.now() - 12 * 60000),
		level: "warning",
		message: "Rate limit approaching threshold",
		endpoint: "/api/documents/process",
		duration: "89ms",
		status: 429,
	},
	{
		id: "3",
		timestamp: new Date(Date.now() - 18 * 60000),
		level: "error",
		message: "Failed to process document: Invalid format",
		endpoint: "/api/documents/upload",
		duration: "12ms",
		status: 400,
	},
	{
		id: "4",
		timestamp: new Date(Date.now() - 25 * 60000),
		level: "info",
		message: "User authentication successful",
		endpoint: "/api/auth/login",
		duration: "156ms",
		status: 200,
	},
	{
		id: "5",
		timestamp: new Date(Date.now() - 32 * 60000),
		level: "info",
		message: "Integration sync completed",
		endpoint: "/api/integrations/sync",
		duration: "3.2s",
		status: 200,
	},
	{
		id: "6",
		timestamp: new Date(Date.now() - 45 * 60000),
		level: "info",
		message: "Document processing initiated",
		endpoint: "/api/documents/process",
		duration: "67ms",
		status: 202,
	},
]);

const filteredLogs = computed(() => {
	let filtered = logs.value;

	if (logLevel.value !== "all") {
		filtered = filtered.filter((log) => log.level === logLevel.value);
	}

	if (searchQuery.value) {
		const query = searchQuery.value.toLowerCase();
		filtered = filtered.filter(
			(log) =>
				log.message.toLowerCase().includes(query) ||
				log.endpoint.toLowerCase().includes(query),
		);
	}

	return filtered;
});

function getLevelIcon(level: string) {
	switch (level) {
		case "error":
			return XCircle;
		case "warning":
			return AlertCircle;
		default:
			return Info;
	}
}

function getLevelClass(level: string) {
	switch (level) {
		case "error":
			return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300";
		case "warning":
			return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300";
		default:
			return "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300";
	}
}

function formatTimestamp(date: Date) {
	return new Intl.DateTimeFormat("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	}).format(date);
}

function exportLogs() {
	console.log(
		"Exporting logs for range:",
		dateRange.value,
		"level:",
		logLevel.value,
	);
	// TODO: Implement actual export functionality
}

function importLogs() {
	console.log("Importing logs");
	// TODO: Implement actual import functionality
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-7xl mx-auto w-full">
      <!-- Toolbar -->
      <div class="flex items-center gap-4 mb-6 flex-wrap">
        <!-- Logs/Traces Toggle -->
        <div class="flex border rounded-md overflow-hidden">
          <button
            @click="viewType = 'logs'"
            :class="[
              'px-4 py-2 text-sm font-medium transition-colors',
              viewType === 'logs'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800',
            ]"
          >
            Logs
          </button>
          <button
            @click="viewType = 'traces'"
            :class="[
              'px-4 py-2 text-sm font-medium transition-colors border-l',
              viewType === 'traces'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800',
            ]"
          >
            Traces
          </button>
        </div>

        <div class="flex-1 min-w-[200px]">
          <div class="relative">
            <Search
              class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500"
            />
            <Input
              v-model="searchQuery"
              placeholder="Search logs..."
              class="pl-10"
            />
          </div>
        </div>

        <Select v-model="logLevel">
          <SelectTrigger class="w-[150px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
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

        <div class="flex gap-2">
          <Button
            @click="importLogs"
            variant="outline"
            :disabled="!isOnPremise"
          >
            <Upload :size="16" class="mr-2" />
            Import
          </Button>
          <Button @click="exportLogs" variant="outline">
            <Download :size="16" class="mr-2" />
            Export
          </Button>
        </div>
      </div>

      <!-- Logs Table -->
      <Card class="rounded-xl border-neutral-200 dark:border-neutral-800">
        <CardContent class="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[100px]">Time</TableHead>
                <TableHead class="w-[100px]">Level</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead class="w-[100px]">Duration</TableHead>
                <TableHead class="w-[80px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="log in filteredLogs" :key="log.id">
                <TableCell class="font-mono text-xs">
                  {{ formatTimestamp(log.timestamp) }}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    :class="getLevelClass(log.level)"
                    class="flex items-center gap-1 w-fit"
                  >
                    <component :is="getLevelIcon(log.level)" :size="12" />
                    {{ log.level }}
                  </Badge>
                </TableCell>
                <TableCell class="max-w-md truncate">
                  {{ log.message }}
                </TableCell>
                <TableCell
                  class="font-mono text-xs text-neutral-600 dark:text-neutral-400"
                >
                  {{ log.endpoint }}
                </TableCell>
                <TableCell
                  class="text-xs text-neutral-600 dark:text-neutral-400"
                >
                  {{ log.duration }}
                </TableCell>
                <TableCell>
                  <span
                    :class="{
                      'text-green-600 dark:text-green-400':
                        log.status >= 200 && log.status < 300,
                      'text-yellow-600 dark:text-yellow-400':
                        log.status >= 400 && log.status < 500,
                      'text-red-600 dark:text-red-400': log.status >= 500,
                    }"
                    class="font-mono text-xs font-semibold"
                  >
                    {{ log.status }}
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div
            v-if="filteredLogs.length === 0"
            class="py-12 text-center text-neutral-500"
          >
            No logs found matching your filters
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
