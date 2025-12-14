<script setup lang="ts">
definePageMeta({
	pageName: "Support",
});

import { ref, computed } from "vue";
import { Search, Plus, ChevronDown } from "lucide-vue-next";
import Button from "@/components/ui/button/Button.vue";
import Input from "@/components/ui/input/Input.vue";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import Table from "@/components/ui/table/Table.vue";
import TableHeader from "@/components/ui/table/TableHeader.vue";
import TableBody from "@/components/ui/table/TableBody.vue";
import TableHead from "@/components/ui/table/TableHead.vue";
import TableRow from "@/components/ui/table/TableRow.vue";
import TableCell from "@/components/ui/table/TableCell.vue";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Reactive state
const searchQuery = ref("");
const statusFilter = ref("all");
const sortBy = ref("last-updated");

// Mock support cases data
const supportCases = ref([
	{
		id: "CASE-001",
		subject: "Document processing issue",
		status: "open",
		severity: "high",
		dateCreated: new Date("2024-01-15"),
		lastUpdated: new Date("2024-01-16"),
		description: "PDF files are not being processed correctly",
	},
	{
		id: "CASE-002",
		subject: "API integration help",
		status: "closed",
		severity: "medium",
		dateCreated: new Date("2024-01-10"),
		lastUpdated: new Date("2024-01-14"),
		description: "Need assistance with API endpoint configuration",
	},
	{
		id: "CASE-003",
		subject: "Billing question",
		status: "open",
		severity: "low",
		dateCreated: new Date("2024-01-12"),
		lastUpdated: new Date("2024-01-12"),
		description: "Question about subscription billing cycle",
	},
]);

// Filter and sorting options
const statusOptions = [
	{ label: "All Cases", value: "all" },
	{ label: "Open Cases", value: "open" },
	{ label: "Closed Cases", value: "closed" },
];

const sortOptions = [
	{ label: "Last Updated", value: "last-updated" },
	{ label: "Date Created", value: "date-created" },
	{ label: "Severity", value: "severity" },
];

// Computed filtered cases
const filteredCases = computed(() => {
	let filtered = supportCases.value.filter((supportCase) => {
		const matchesSearch =
			supportCase.subject
				.toLowerCase()
				.includes(searchQuery.value.toLowerCase()) ||
			supportCase.id.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
			supportCase.description
				.toLowerCase()
				.includes(searchQuery.value.toLowerCase());

		const matchesStatus =
			statusFilter.value === "all" || supportCase.status === statusFilter.value;

		return matchesSearch && matchesStatus;
	});

	// Apply sorting
	if (sortBy.value === "last-updated") {
		filtered.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
	} else if (sortBy.value === "date-created") {
		filtered.sort((a, b) => b.dateCreated.getTime() - a.dateCreated.getTime());
	} else if (sortBy.value === "severity") {
		const severityOrder: Record<string, number> = {
			high: 3,
			medium: 2,
			low: 1,
		};
		filtered.sort(
			(a, b) =>
				(severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0),
		);
	}

	return filtered;
});

// Functions
function createNewCase() {
	console.log("Creating new support case");
	// Here you would typically open a modal or navigate to a form
}

function selectStatus(status: string) {
	statusFilter.value = status;
}

function selectSort(sort: string) {
	sortBy.value = sort;
}

function formatDate(date: Date) {
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function getSeverityColor(severity: string) {
	switch (severity) {
		case "high":
			return "text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800";
		case "medium":
			return "text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800";
		case "low":
			return "text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800";
		default:
			return "text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700";
	}
}

function getStatusColor(status: string) {
	return status === "open"
		? "text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800"
		: "text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700";
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6 sm:py-8 lg:py-12">
    <!-- Header -->
    <div class="mb-8">
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1
            class="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-2"
          >
            Support Cases
          </h1>
          <p class="text-neutral-600 dark:text-neutral-400">
            Manage your support requests and get help from our team
          </p>
        </div>
        <!-- New Case Button -->
        <Button
          @click="createNewCase"
          class="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
        >
          <Plus :size="16" />
          Create New Case
        </Button>
      </div>
    </div>

    <!-- Filters and Search -->
    <div
      class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6"
    >
      <!-- Search Input -->
      <div class="relative flex-1 min-w-0">
        <Search
          :size="16"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <Input
          v-model="searchQuery"
          placeholder="Search cases..."
          class="pl-10"
        />
      </div>

      <!-- Filters Row -->
      <div class="flex gap-3 w-full sm:w-auto">
        <!-- Status Filter -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="outline"
              class="justify-between flex-1 sm:min-w-32 sm:flex-none"
            >
              {{
                statusOptions.find((o) => o.value === statusFilter)?.label ||
                "All Cases"
              }}
              <ChevronDown :size="16" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              v-for="option in statusOptions"
              :key="option.value"
              @click="selectStatus(option.value)"
            >
              {{ option.label }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- Sort -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="outline"
              class="justify-between flex-1 sm:min-w-36 sm:flex-none"
            >
              {{
                sortOptions.find((o) => o.value === sortBy)?.label || "Sort by"
              }}
              <ChevronDown :size="16" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              v-for="option in sortOptions"
              :key="option.value"
              @click="selectSort(option.value)"
            >
              {{ option.label }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Cases Table or Empty State -->
    <div
      class="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden"
    >
      <div v-if="filteredCases.length > 0" class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="whitespace-nowrap px-6">Case ID</TableHead>
              <TableHead class="whitespace-nowrap px-6">Subject</TableHead>
              <TableHead class="whitespace-nowrap px-6">Status</TableHead>
              <TableHead class="whitespace-nowrap px-6">Severity</TableHead>
              <TableHead class="whitespace-nowrap px-6 hidden sm:table-cell"
                >Created</TableHead
              >
              <TableHead class="whitespace-nowrap px-6 hidden lg:table-cell"
                >Last Updated</TableHead
              >
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="supportCase in filteredCases"
              :key="supportCase.id"
              class="hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer transition-colors"
            >
              <TableCell class="whitespace-nowrap px-6">
                <span
                  class="font-mono text-sm text-neutral-900 dark:text-white"
                >
                  {{ supportCase.id }}
                </span>
              </TableCell>
              <TableCell class="max-w-0 w-full px-6">
                <div class="min-w-0">
                  <p
                    class="font-medium text-neutral-900 dark:text-white truncate sm:whitespace-normal"
                  >
                    {{ supportCase.subject }}
                  </p>
                  <p
                    class="text-sm text-neutral-600 dark:text-neutral-400 mt-1 truncate sm:whitespace-normal"
                  >
                    {{ supportCase.description }}
                  </p>
                </div>
              </TableCell>
              <TableCell class="whitespace-nowrap px-6">
                <span
                  class="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium"
                  :class="getStatusColor(supportCase.status)"
                >
                  {{
                    supportCase.status.charAt(0).toUpperCase() +
                    supportCase.status.slice(1)
                  }}
                </span>
              </TableCell>
              <TableCell class="whitespace-nowrap px-6">
                <span
                  class="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium"
                  :class="getSeverityColor(supportCase.severity)"
                >
                  {{
                    supportCase.severity.charAt(0).toUpperCase() +
                    supportCase.severity.slice(1)
                  }}
                </span>
              </TableCell>
              <TableCell class="whitespace-nowrap px-6 hidden sm:table-cell">
                <span class="text-sm text-neutral-600 dark:text-neutral-400">
                  {{ formatDate(supportCase.dateCreated) }}
                </span>
              </TableCell>
              <TableCell class="whitespace-nowrap px-6 hidden lg:table-cell">
                <span class="text-sm text-neutral-600 dark:text-neutral-400">
                  {{ formatDate(supportCase.lastUpdated) }}
                </span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <Empty v-else class="py-16">
        <EmptyHeader>
          <EmptyTitle>No support cases found</EmptyTitle>
          <EmptyDescription>
            {{
              searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "You haven't created any support cases yet"
            }}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent v-if="!searchQuery && statusFilter === 'all'">
          <Button @click="createNewCase" class="flex items-center gap-2">
            <Plus :size="16" />
            Create Your First Case
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  </div>
</template>
