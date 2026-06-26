<script setup lang="ts">
import { ref, computed } from "vue";
import type { DateRange } from "reka-ui";
import type { Ref } from "vue";
import { getLocalTimeZone, today } from "@internationalized/date";
import {
	Download,
	Upload,
	Search,
	Filter,
	AlertCircle,
	Info,
	XCircle,
	Calendar,
} from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Badge } from "#console/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#console/components/ui/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";
import { Input } from "#console/components/ui/input";
import { Checkbox } from "#console/components/ui/checkbox";
import { Label } from "#console/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";
import { RangeCalendar } from "#console/components/ui/range-calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#console/components/ui/popover";

useHead({ title: "Logs" });

definePageMeta({
	pageCategory: "Analytics",
});

// Filters
const logLevel = ref("all");
const searchQuery = ref("");
const dateRange = ref("24h");
const viewType = ref("logs"); // "logs" or "traces"

// Check if on-premise deployment
const isOnPremise = ref(false); // TODO: Get this from config/environment

// Export modal
const isExportModalOpen = ref(false);
const start = today(getLocalTimeZone());
const end = start.add({ days: 7 });
const exportDateRange = ref({
	start,
	end,
}) as Ref<DateRange>;
const isCalendarOpen = ref(false);
const exportEventTypes = ref({
	info: true,
	warning: true,
	error: true,
});

const formattedExportDateRange = computed(() => {
	if (!exportDateRange.value.start || !exportDateRange.value.end) {
		return "Select date range";
	}

	const startDate = new Date(
		exportDateRange.value.start.year,
		exportDateRange.value.start.month - 1,
		exportDateRange.value.start.day,
	);
	const endDate = new Date(
		exportDateRange.value.end.year,
		exportDateRange.value.end.month - 1,
		exportDateRange.value.end.day,
	);

	const formatter = new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
});

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

function formatTimestamp(date: Date) {
	return new Intl.DateTimeFormat("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	}).format(date);
}

function openExportModal() {
	isExportModalOpen.value = true;
}

function handleExport(_format: "csv" | "json") {
	// TODO: Implement actual export functionality
	isExportModalOpen.value = false;
}

function importLogs() {
	// TODO: Implement actual import functionality
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-0">
    <div class="w-full">
      <!-- Search and Filters -->
      <div class="flex items-center gap-4 mb-6 flex-wrap">
        <!-- Logs/Traces Toggle -->
        <div class="flex border border-border/50 rounded-md overflow-hidden">
          <button
            @click="viewType = 'logs'"
            :class="[
              'px-4 py-2 text-sm font-medium transition-colors',
              viewType === 'logs'
                ? 'bg-foreground text-background'
                : 'bg-background text-muted-foreground hover:bg-muted/50',
            ]"
          >
            Logs
          </button>
          <button
            @click="viewType = 'traces'"
            :class="[
              'px-4 py-2 text-sm font-medium transition-colors border-l border-border/50',
              viewType === 'traces'
                ? 'bg-foreground text-background'
                : 'bg-background text-muted-foreground hover:bg-muted/50',
            ]"
          >
            Traces
          </button>
        </div>

        <div class="flex-1 min-w-[200px]">
          <div class="relative">
            <Search
              class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
            />
            <Input
              v-model="searchQuery"
              placeholder="Search logs..."
              class="pl-10 h-9"
            />
          </div>
        </div>

        <Select v-model="logLevel">
          <SelectTrigger class="w-[150px] h-9">
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
          <SelectTrigger class="w-[150px] h-9">
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

      <!-- Logs Table -->
      <Card class="py-0 pt-6 pb-6 rounded-xl border-border/50">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle class="text-sm font-medium">Activity Logs</CardTitle>
              <CardDescription class="text-xs text-muted-foreground">
                {{ filteredLogs.length }} log{{
                  filteredLogs.length !== 1 ? "s" : ""
                }}
                found
              </CardDescription>
            </div>
            <div class="flex gap-2">
              <Button
                @click="importLogs"
                variant="outline"
                size="sm"
                :disabled="!isOnPremise"
              >
                <Upload :size="16" class="mr-2" />
                Import
              </Button>
              <Button @click="openExportModal" variant="outline" size="sm">
                <Download :size="16" class="mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                  <span class="text-xs text-muted-foreground">
                    {{ log.level.toLowerCase() }}
                  </span>
                </TableCell>
                <TableCell class="max-w-md truncate">
                  {{ log.message }}
                </TableCell>
                <TableCell class="font-mono text-xs text-muted-foreground">
                  {{ log.endpoint }}
                </TableCell>
                <TableCell class="text-xs text-muted-foreground">
                  {{ log.duration }}
                </TableCell>
                <TableCell>
                  <span class="font-mono text-xs text-foreground">
                    {{ log.status }}
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div
            v-if="filteredLogs.length === 0"
            class="py-12 text-center text-muted-foreground text-sm"
          >
            No logs found matching your filters
          </div>
        </CardContent>
      </Card>

      <!-- Export Modal -->
      <Dialog v-model:open="isExportModalOpen">
        <DialogContent class="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Export Logs</DialogTitle>
            <DialogDescription>
              Configure export settings for your logs
            </DialogDescription>
          </DialogHeader>

          <div class="space-y-6 py-4">
            <!-- Date Range -->
            <div class="space-y-2">
              <Label class="text-sm font-medium">Date Range</Label>
              <Popover v-model:open="isCalendarOpen">
                <PopoverTrigger as-child>
                  <Button
                    variant="outline"
                    class="w-full justify-start text-left font-normal h-9"
                  >
                    <Calendar :size="16" class="mr-2 text-muted-foreground" />
                    {{ formattedExportDateRange }}
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0" align="start">
                  <RangeCalendar v-model="exportDateRange" />
                </PopoverContent>
              </Popover>
            </div>

            <!-- Event Types -->
            <div class="space-y-2">
              <Label class="text-sm font-medium">Event Types</Label>
              <div class="space-y-2">
                <div class="flex items-center space-x-2">
                  <Checkbox
                    id="export-info"
                    v-model:checked="exportEventTypes.info"
                  />
                  <label
                    for="export-info"
                    class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Info
                  </label>
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox
                    id="export-warning"
                    v-model:checked="exportEventTypes.warning"
                  />
                  <label
                    for="export-warning"
                    class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Warning
                  </label>
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox
                    id="export-error"
                    v-model:checked="exportEventTypes.error"
                  />
                  <label
                    for="export-error"
                    class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Error
                  </label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="isExportModalOpen = false">
              Cancel
            </Button>
            <Button @click="handleExport('json')" variant="outline">
              <Download :size="16" class="mr-2" />
              Export as JSON
            </Button>
            <Button @click="handleExport('csv')">
              <Download :size="16" class="mr-2" />
              Export as CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>
