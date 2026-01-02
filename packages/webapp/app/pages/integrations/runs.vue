<script setup lang="ts">
import { ref, computed } from "vue";
import type { IntegrationRun } from "@nvisy/sdk/datatypes";
import {
	Search,
	ArrowLeft,
	Eye,
	Copy,
	Check,
	MoreHorizontal,
	Loader2,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const { t } = useI18n();

definePageMeta({
	pageCategory: "Integrations",
});

// Use SDK composable
const { runs, isLoading } = useRuns();
const { integrations } = useIntegrations();

const searchQuery = ref("");
const statusFilter = ref("all");
const dateRange = ref("24h");
const selectedRuns = ref<Set<string>>(new Set());
const isViewDetailsModalOpen = ref(false);
const selectedRunForDetails = ref<IntegrationRun | null>(null);

const filteredRuns = computed(() => {
	let filtered = runs.value ?? [];

	if (searchQuery.value.trim()) {
		const query = searchQuery.value.toLowerCase();
		filtered = filtered.filter((run) => {
			const integration = integrations.value?.find(
				(i) => i.integrationId === run.integrationId,
			);
			return (
				integration?.integrationName.toLowerCase().includes(query) ||
				run.id.toLowerCase().includes(query)
			);
		});
	}

	if (statusFilter.value !== "all") {
		filtered = filtered.filter((run) => {
			const statusCode = run.statusCode ?? 0;
			const statusPrefix = statusFilter.value.charAt(0);
			return Math.floor(statusCode / 100).toString() === statusPrefix;
		});
	}

	return filtered.sort(
		(a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
	);
});

function getIntegrationName(integrationId: string | null | undefined): string {
	if (!integrationId) return t("integrations.runs.unknown");
	const integration = integrations.value?.find(
		(i) => i.integrationId === integrationId,
	);
	return integration?.integrationName ?? t("integrations.runs.unknown");
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

function copyLogs() {
	const selectedRunsData = (runs.value ?? []).filter((run) =>
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

function formatDate(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const hours = Math.floor(diff / (1000 * 60 * 60));
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (hours < 1) return t("integrations.time.justNow");
	if (hours < 24) return t("integrations.time.hoursAgo", { hours });
	if (days === 1) return t("integrations.time.daysAgo", { days: 1 });
	if (days < 7) return t("integrations.time.daysAgo", { days });

	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function formatDuration(
	startedAt: string,
	completedAt: string | null | undefined,
): string {
	if (!completedAt) return "-";
	const start = new Date(startedAt).getTime();
	const end = new Date(completedAt).getTime();
	const diff = end - start;
	const minutes = Math.floor(diff / 60000);
	const seconds = Math.floor((diff % 60000) / 1000);
	return `${minutes}m ${seconds}s`;
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <Loader2 class="h-8 w-8 animate-spin text-neutral-400" />
      </div>

      <template v-else>
        <!-- Search and Filters -->
        <div class="flex items-center gap-3 mb-6 flex-wrap">
          <Button as-child variant="outline" class="font-light">
            <NuxtLink to="/integrations" class="flex items-center gap-2">
              <ArrowLeft :size="16" />
              {{ t("integrations.runs.backToConnections") }}
            </NuxtLink>
          </Button>

          <div class="flex-1 min-w-[200px]">
            <div class="relative">
              <Search
              :size="16"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <Input
                v-model="searchQuery"
                :placeholder="t('integrations.runs.searchPlaceholder')"
                class="pl-10 font-light"
              />
            </div>
          </div>

          <Select v-model="statusFilter">
            <SelectTrigger class="w-[150px] font-light">
              <SelectValue :placeholder="t('integrations.runs.status')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{{
                t("integrations.runs.allStatus")
              }}</SelectItem>
              <SelectItem value="1xx"
                >1xx - {{ t("integrations.runs.informational") }}</SelectItem
              >
              <SelectItem value="2xx"
                >2xx - {{ t("integrations.runs.success") }}</SelectItem
              >
              <SelectItem value="3xx"
                >3xx - {{ t("integrations.runs.redirection") }}</SelectItem
              >
              <SelectItem value="4xx"
                >4xx - {{ t("integrations.runs.clientError") }}</SelectItem
              >
              <SelectItem value="5xx"
                >5xx - {{ t("integrations.runs.serverError") }}</SelectItem
              >
            </SelectContent>
          </Select>

          <Select v-model="dateRange">
            <SelectTrigger class="w-[150px] font-light">
              <SelectValue :placeholder="t('integrations.runs.period')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">{{
                t("integrations.runs.lastHour")
              }}</SelectItem>
              <SelectItem value="24h">{{
                t("integrations.runs.last24Hours")
              }}</SelectItem>
              <SelectItem value="7d">{{
                t("integrations.runs.last7Days")
              }}</SelectItem>
              <SelectItem value="30d">{{
                t("integrations.runs.last30Days")
              }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Runs Table -->
        <Card class="py-0 pt-6 pb-6 rounded-xl">
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle
                  class="text-sm font-light tracking-wider uppercase text-neutral-500 dark:text-neutral-400"
                  >{{ t("integrations.runs.title") }}</CardTitle
                >
                <CardDescription>
                  {{ filteredRuns.length }}
                  {{
                    t("integrations.runs.runsFound", {
                      count: filteredRuns.length,
                    })
                  }}
                  <span v-if="selectedRuns.size > 0">
                    · {{ selectedRuns.size }}
                    {{ t("integrations.runs.selected") }}
                  </span>
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                @click="copyLogs"
                :disabled="selectedRuns.size === 0"
                class="flex items-center gap-2 font-light"
              >
                <Check v-if="logsCopied" :size="16" class="text-green-500" />
                <Copy v-else :size="16" />
                {{
                  logsCopied
                    ? t("integrations.runs.copied")
                    : t("integrations.runs.copyLogs")
                }}
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
                  <TableHead
                    class="uppercase text-xs font-light tracking-wider"
                    >{{ t("integrations.runs.name") }}</TableHead
                  >
                  <TableHead
                    class="uppercase text-xs font-light tracking-wider"
                    >{{ t("integrations.runs.integration") }}</TableHead
                  >
                  <TableHead
                    class="w-[100px] uppercase text-xs font-light tracking-wider"
                    >{{ t("integrations.runs.statusHeader") }}</TableHead
                  >
                  <TableHead
                    class="uppercase text-xs font-light tracking-wider"
                    >{{ t("integrations.runs.started") }}</TableHead
                  >
                  <TableHead
                    class="w-[100px] uppercase text-xs font-light tracking-wider"
                    >{{ t("integrations.runs.duration") }}</TableHead
                  >
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
                    <p class="font-normal text-neutral-900 dark:text-white">
                      {{ run.id.slice(0, 8) }}...
                    </p>
                  </TableCell>
                  <TableCell>
                    <span
                      class="text-sm font-light text-neutral-600 dark:text-neutral-400"
                    >
                      {{ getIntegrationName(run.integrationId) }}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div
                      v-if="run.status === 'running'"
                      class="flex items-center gap-2"
                    >
                      <Spinner class="h-3 w-3" />
                      <span
                        class="font-mono text-xs text-neutral-900 dark:text-white"
                      >
                        {{ run.statusCode ?? "-" }}
                      </span>
                    </div>
                    <span
                      v-else
                      class="font-mono text-xs text-neutral-900 dark:text-white"
                    >
                      {{ run.statusCode ?? "-" }}
                    </span>
                  </TableCell>
                  <TableCell
                    class="text-xs font-light text-neutral-600 dark:text-neutral-400"
                  >
                    {{ formatDate(run.startedAt) }}
                  </TableCell>
                  <TableCell
                    class="text-xs font-light text-neutral-600 dark:text-neutral-400"
                  >
                    {{ formatDuration(run.startedAt, run.completedAt) }}
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
                          {{ t("integrations.runs.viewDetails") }}
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="copyRunDetails(run)">
                          <Copy :size="16" class="mr-2" />
                          {{ t("integrations.runs.copyLogs") }}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div
              v-if="filteredRuns.length === 0"
              class="py-12 text-center font-light text-neutral-500"
            >
              {{ t("integrations.runs.noRunsFound") }}
            </div>
          </CardContent>
        </Card>

        <!-- Run Details Modal -->
        <RunDetailsModal
          v-model:open="isViewDetailsModalOpen"
          :run="selectedRunForDetails"
        />
      </template>
    </div>
  </div>
</template>
