<script setup lang="ts">
import { ref, computed } from "vue";
import {
	Search,
	Shield,
	Key,
	User,
	Mail,
	LogIn,
	LogOut,
	Settings,
	Trash2,
	Edit,
	ChevronDown,
	AlertCircle,
	CheckCircle,
	Info,
} from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuCheckboxItem,
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
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";

definePageMeta({
	breadcrumbs: [{ label: "[project]" }, { label: "Activity" }],
});

interface ActivityEvent {
	id: string;
	type:
		| "login"
		| "logout"
		| "password_change"
		| "email_change"
		| "2fa_enabled"
		| "2fa_disabled"
		| "token_created"
		| "token_deleted"
		| "profile_updated"
		| "account_created"
		| "failed_login";
	description: string;
	ipAddress: string;
	location: string;
	timestamp: Date;
	severity: "info" | "warning" | "success" | "error";
}

// Reactive state
const searchQuery = ref("");
const selectedTypeFilter = ref("All Events");
const selectedSorting = ref("date-desc");
const selectedRows = ref<Set<string>>(new Set());
const currentPage = ref(1);
const itemsPerPage = 10;

// Column visibility
const columnVisibility = ref({
	icon: true,
	event: true,
	location: true,
	ipAddress: true,
	time: true,
});

const typeFilters = [
	"All Events",
	"Authentication",
	"Security",
	"Profile",
	"API Tokens",
];

const sortingOptions = [
	{ label: "Date (Newest)", value: "date-desc" },
	{ label: "Date (Oldest)", value: "date-asc" },
	{ label: "Severity (High to Low)", value: "severity-desc" },
];

// Mock activity data
const activities = ref<ActivityEvent[]>([
	{
		id: "1",
		type: "login",
		description: "Signed in from Chrome on macOS",
		ipAddress: "192.168.1.100",
		location: "San Francisco, CA",
		timestamp: new Date("2024-01-20T10:30:00"),
		severity: "info",
	},
	{
		id: "2",
		type: "token_created",
		description: "Created API token 'Production API'",
		ipAddress: "192.168.1.100",
		location: "San Francisco, CA",
		timestamp: new Date("2024-01-20T09:15:00"),
		severity: "success",
	},
	{
		id: "3",
		type: "failed_login",
		description: "Failed login attempt",
		ipAddress: "203.0.113.45",
		location: "Unknown",
		timestamp: new Date("2024-01-19T22:30:00"),
		severity: "error",
	},
	{
		id: "4",
		type: "password_change",
		description: "Changed account password",
		ipAddress: "192.168.1.100",
		location: "San Francisco, CA",
		timestamp: new Date("2024-01-19T16:45:00"),
		severity: "warning",
	},
	{
		id: "5",
		type: "2fa_enabled",
		description: "Enabled two-factor authentication",
		ipAddress: "192.168.1.100",
		location: "San Francisco, CA",
		timestamp: new Date("2024-01-19T14:20:00"),
		severity: "success",
	},
	{
		id: "6",
		type: "profile_updated",
		description: "Updated display name",
		ipAddress: "192.168.1.100",
		location: "San Francisco, CA",
		timestamp: new Date("2024-01-18T11:10:00"),
		severity: "info",
	},
	{
		id: "7",
		type: "email_change",
		description: "Added new email address",
		ipAddress: "192.168.1.100",
		location: "San Francisco, CA",
		timestamp: new Date("2024-01-17T15:30:00"),
		severity: "warning",
	},
	{
		id: "8",
		type: "logout",
		description: "Signed out",
		ipAddress: "192.168.1.100",
		location: "San Francisco, CA",
		timestamp: new Date("2024-01-17T18:00:00"),
		severity: "info",
	},
	{
		id: "9",
		type: "token_deleted",
		description: "Deleted API token 'Old Token'",
		ipAddress: "192.168.1.100",
		location: "San Francisco, CA",
		timestamp: new Date("2024-01-16T09:45:00"),
		severity: "warning",
	},
	{
		id: "10",
		type: "login",
		description: "Signed in from Safari on iPhone",
		ipAddress: "192.168.1.105",
		location: "San Francisco, CA",
		timestamp: new Date("2024-01-15T20:15:00"),
		severity: "info",
	},
]);

// Computed filtered activities
const filteredActivities = computed(() => {
	let filtered = activities.value;

	// Apply search filter
	if (searchQuery.value.trim()) {
		const query = searchQuery.value.toLowerCase();
		filtered = filtered.filter(
			(activity) =>
				activity.description.toLowerCase().includes(query) ||
				activity.type.toLowerCase().includes(query) ||
				activity.location.toLowerCase().includes(query) ||
				activity.ipAddress.includes(query),
		);
	}

	// Apply type filter
	if (selectedTypeFilter.value !== "All Events") {
		const typeMap: Record<string, string[]> = {
			Authentication: ["login", "logout", "failed_login"],
			Security: [
				"password_change",
				"2fa_enabled",
				"2fa_disabled",
				"failed_login",
			],
			Profile: ["profile_updated", "email_change", "account_created"],
			"API Tokens": ["token_created", "token_deleted"],
		};
		const types = typeMap[selectedTypeFilter.value] || [];
		filtered = filtered.filter((activity) => types.includes(activity.type));
	}

	// Sort the results
	if (selectedSorting.value === "date-asc") {
		filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
	} else if (selectedSorting.value === "severity-desc") {
	} else {
		// date-desc (default)
		filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
	}

	return filtered;
});

// Paginated activities
const paginatedActivities = computed(() => {
	const start = (currentPage.value - 1) * itemsPerPage;
	const end = start + itemsPerPage;
	return filteredActivities.value.slice(start, end);
});

const totalPages = computed(() => {
	return Math.ceil(filteredActivities.value.length / itemsPerPage);
});

const isAllSelected = computed(() => {
	return (
		paginatedActivities.value.length > 0 &&
		paginatedActivities.value.every((activity) =>
			selectedRows.value.has(activity.id),
		)
	);
});

const isSomeSelected = computed(() => {
	return (
		paginatedActivities.value.some((activity) =>
			selectedRows.value.has(activity.id),
		) && !isAllSelected.value
	);
});

// Functions
function selectTypeFilter(filter: string) {
	selectedTypeFilter.value = filter;
	currentPage.value = 1;
}

function selectSorting(sorting: string) {
	selectedSorting.value = sorting;
}

function toggleAllRows() {
	if (isAllSelected.value) {
		paginatedActivities.value.forEach((activity) => {
			selectedRows.value.delete(activity.id);
		});
	} else {
		paginatedActivities.value.forEach((activity) => {
			selectedRows.value.add(activity.id);
		});
	}
}

function toggleRow(id: string) {
	if (selectedRows.value.has(id)) {
		selectedRows.value.delete(id);
	} else {
		selectedRows.value.add(id);
	}
}

function setPage(page: number) {
	if (page >= 1 && page <= totalPages.value) {
		currentPage.value = page;
	}
}

function getEventIcon(type: string) {
	const iconMap: Record<
		string,
		typeof LogIn | typeof LogOut | typeof Key | typeof Shield | typeof Edit
	> = {
		login: LogIn,
		logout: LogOut,
		password_change: Key,
		email_change: Mail,
		"2fa_enabled": Shield,
		"2fa_disabled": Shield,
		token_created: Key,
		token_deleted: Trash2,
		profile_updated: Edit,
		account_created: User,
		failed_login: AlertCircle,
	};
	return iconMap[type] || Settings;
}

function getSeverityColor(severity: string): string {
	switch (severity) {
		case "error":
			return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800";
		case "warning":
			return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800";
		case "success":
			return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800";
		case "info":
		default:
			return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800";
	}
}

function getSeverityIcon(severity: string) {
	switch (severity) {
		case "error":
			return AlertCircle;
		case "warning":
			return AlertCircle;
		case "success":
			return CheckCircle;
		case "info":
		default:
			return Info;
	}
}

function formatTimestamp(date: Date): string {
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

function formatFullTimestamp(date: Date): string {
	return date.toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-0">
      <div class="max-w-7xl mx-auto w-full">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
          Account Activity
        </h1>
        <p class="text-neutral-600 dark:text-neutral-400">
          View your recent account activity and security events
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
            placeholder="Search activity..."
            class="pl-10"
          />
        </div>

        <!-- Type Filter -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="justify-between min-w-[160px]">
              {{ selectedTypeFilter }}
              <ChevronDown :size="16" class="ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-[160px]">
            <DropdownMenuItem
              v-for="filter in typeFilters"
              :key="filter"
              @click="selectTypeFilter(filter)"
            >
              {{ filter }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- Sorting -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="justify-between min-w-[180px]">
              {{
                sortingOptions.find((o) => o.value === selectedSorting)?.label ||
                "Sort by"
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

        <!-- Column Visibility -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="ml-auto">
              Columns <ChevronDown class="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              v-model:checked="columnVisibility.event"
            >
              Event
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              v-model:checked="columnVisibility.location"
            >
              Location
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              v-model:checked="columnVisibility.ipAddress"
            >
              IP Address
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              v-model:checked="columnVisibility.time"
            >
              Time
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <!-- Activity List -->
      <div v-if="filteredActivities.length > 0" class="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-12">
                <Checkbox
                  :checked="isAllSelected || (isSomeSelected ? 'indeterminate' : false)"
                  @update:checked="toggleAllRows"
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead v-if="columnVisibility.icon" class="w-12"></TableHead>
              <TableHead v-if="columnVisibility.event">Event</TableHead>
              <TableHead v-if="columnVisibility.location">Location</TableHead>
              <TableHead v-if="columnVisibility.ipAddress">IP Address</TableHead>
              <TableHead v-if="columnVisibility.time">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="activity in paginatedActivities"
              :key="activity.id"
              class="hover:bg-neutral-50 dark:hover:bg-neutral-900"
              :data-state="selectedRows.has(activity.id) && 'selected'"
            >
              <TableCell>
                <Checkbox
                  :checked="selectedRows.has(activity.id)"
                  @update:checked="toggleRow(activity.id)"
                  aria-label="Select row"
                />
              </TableCell>
              <TableCell v-if="columnVisibility.icon">
                <div
                  class="p-2 rounded-lg"
                  :class="getSeverityColor(activity.severity)"
                >
                  <component :is="getEventIcon(activity.type)" :size="16" />
                </div>
              </TableCell>
              <TableCell v-if="columnVisibility.event">
                <p class="font-medium text-neutral-900 dark:text-white">
                  {{ activity.description }}
                </p>
              </TableCell>
              <TableCell v-if="columnVisibility.location">
                <span class="text-sm text-neutral-600 dark:text-neutral-400">
                  {{ activity.location }}
                </span>
              </TableCell>
              <TableCell v-if="columnVisibility.ipAddress">
                <code
                  class="text-sm text-neutral-600 dark:text-neutral-400 font-mono"
                >
                  {{ activity.ipAddress }}
                </code>
              </TableCell>
              <TableCell v-if="columnVisibility.time">
                <span
                  class="text-sm text-neutral-600 dark:text-neutral-400"
                  :title="formatFullTimestamp(activity.timestamp)"
                >
                  {{ formatTimestamp(activity.timestamp) }}
                </span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Empty State -->
      <Empty v-else class="py-12">
        <EmptyHeader>
          <EmptyTitle>No activity found</EmptyTitle>
          <EmptyDescription>
            {{
              searchQuery ||
              selectedTypeFilter !== "All Events"
                ? "Try adjusting your search or filters"
                : "Your account activity will appear here"
            }}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      <!-- Pagination -->
      <div v-if="filteredActivities.length > 0" class="flex items-center justify-between py-4">
        <div class="flex-1 text-sm text-neutral-500 dark:text-neutral-400">
          {{ selectedRows.size }} of {{ filteredActivities.length }} row(s) selected.
        </div>
        <Pagination
          v-slot="{ page }"
          :total-items="filteredActivities.length"
          :items-per-page="itemsPerPage"
          :page="currentPage"
          @update:page="setPage"
        >
          <PaginationContent v-slot="{ items }">
            <PaginationPrevious />

            <template v-for="(item, index) in items" :key="index">
              <PaginationItem
                v-if="item.type === 'page'"
                :value="item.value"
                :is-active="item.value === page"
              >
                {{ item.value }}
              </PaginationItem>
              <PaginationEllipsis v-else :index="index" />
            </template>

            <PaginationNext />
          </PaginationContent>
        </Pagination>
      </div>

      </div>
  </div>
</template>
