<script setup lang="ts">
import type { PipelineRun } from "@nvisy/sdk/datatypes";
import {
	Search,
	ArrowLeft,
	Eye,
	Copy,
	Check,
	Loader2,
	Play,
	CheckCircle2,
	XCircle,
} from "@lucide/vue";
import { formatRelativeTime } from "#console/utils/date";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
	ContextMenuSeparator,
} from "#console/components/ui/context-menu";
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
import { Checkbox } from "#console/components/ui/checkbox";
import { Badge } from "#console/components/ui/badge";
import { RunDetailsModal } from "#console/components/pages/connections";

const { t } = useI18n();

useHead({ title: "Connection Runs" });

definePageMeta({
	pageCategory: "Integrations",
});

// Use SDK composable
const { runs, isLoading } = useRuns();

const searchQuery = ref("");
const statusFilter = ref("all");
const dateRange = ref("24h");
const isViewDetailsModalOpen = ref(false);
const selectedRunForDetails = ref<PipelineRun | null>(null);

const filteredRuns = computed(() => {
	let filtered = runs.value ?? [];

	if (searchQuery.value.trim()) {
		const query = searchQuery.value.toLowerCase();
		filtered = filtered.filter(
			(run) =>
				run.id.toLowerCase().includes(query) ||
				run.pipelineSlug.toLowerCase().includes(query) ||
				run.fileId.toLowerCase().includes(query),
		);
	}

	if (statusFilter.value !== "all") {
		filtered = filtered.filter((run) => run.status === statusFilter.value);
	}

	return filtered.sort(
		(a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
	);
});

const {
	selected: selectedRuns,
	allSelected,
	toggle: toggleRunSelection,
	toggleAll: toggleAllRuns,
} = useSelection({
	items: filteredRuns,
	getKey: (run) => run.id,
});

const logsCopied = ref(false);

function copyLogs() {
	// TODO: Implement copy logs to clipboard
	logsCopied.value = true;
	setTimeout(() => {
		logsCopied.value = false;
	}, 2000);
}

function viewRunDetails(run: PipelineRun) {
	selectedRunForDetails.value = run;
	isViewDetailsModalOpen.value = true;
}

function copyRunDetails(_run: PipelineRun) {
	// TODO: Implement copy run details to clipboard
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-6xl mx-auto w-full">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <Loader2 :size="24" class="animate-spin text-muted-foreground" />
      </div>

      <template v-else>
        <!-- Search and Filters -->
        <div class="flex items-center gap-3 mb-6 flex-wrap">
          <Button as-child variant="outline" class="font-normal">
            <NuxtLink to="/integrations" class="flex items-center gap-2">
              <ArrowLeft :size="16" />
              {{ t("connections.runs.backToConnections") }}
            </NuxtLink>
          </Button>

          <div class="flex-1 min-w-[200px]">
            <div class="relative">
              <Search
                :size="16"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                v-model="searchQuery"
                :placeholder="t('connections.runs.searchPlaceholder')"
                class="pl-10 h-9"
              />
            </div>
          </div>

          <Select v-model="statusFilter">
            <SelectTrigger class="w-[150px] h-9 text-sm">
              <SelectValue :placeholder="t('connections.runs.status')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" class="text-sm font-normal">{{
                t("connections.runs.allStatus")
              }}</SelectItem>
              <SelectItem value="running" class="text-sm font-normal">{{
                t("connections.runs.statusRunning")
              }}</SelectItem>
              <SelectItem value="analyzed" class="text-sm font-normal">{{
                t("connections.runs.statusAnalyzed")
              }}</SelectItem>
              <SelectItem value="completed" class="text-sm font-normal">{{
                t("connections.runs.statusCompleted")
              }}</SelectItem>
              <SelectItem value="failed" class="text-sm font-normal">{{
                t("connections.runs.statusFailed")
              }}</SelectItem>
              <SelectItem value="cancelled" class="text-sm font-normal">{{
                t("connections.runs.statusCancelled")
              }}</SelectItem>
            </SelectContent>
          </Select>

          <Select v-model="dateRange">
            <SelectTrigger class="w-[150px] h-9 text-sm">
              <SelectValue :placeholder="t('connections.runs.period')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h" class="text-sm font-normal">{{
                t("connections.runs.lastHour")
              }}</SelectItem>
              <SelectItem value="24h" class="text-sm font-normal">{{
                t("connections.runs.last24Hours")
              }}</SelectItem>
              <SelectItem value="7d" class="text-sm font-normal">{{
                t("connections.runs.last7Days")
              }}</SelectItem>
              <SelectItem value="30d" class="text-sm font-normal">{{
                t("connections.runs.last30Days")
              }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Runs Table -->
        <Card class="py-0 pt-6 pb-6 rounded-xl border-border/50">
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle
                  class="text-xs font-medium tracking-wide uppercase text-muted-foreground"
                  >{{ t("connections.runs.title") }}</CardTitle
                >
                <CardDescription class="text-sm">
                  {{ filteredRuns.length }}
                  {{
                    t("connections.runs.runsFound", {
                      count: filteredRuns.length,
                    })
                  }}
                  <span v-if="selectedRuns.size > 0">
                    · {{ selectedRuns.size }}
                    {{ t("connections.runs.selected") }}
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
                <Check v-if="logsCopied" :size="16" class="text-green-500" />
                <Copy v-else :size="16" />
                {{
                  logsCopied
                    ? t("connections.runs.copied")
                    : t("connections.runs.copyLogs")
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
                    class="uppercase text-xs font-normal tracking-wider"
                    >{{ t("connections.runs.runId") }}</TableHead
                  >
                  <TableHead
                    class="uppercase text-xs font-normal tracking-wider"
                    >{{ t("connections.runs.pipeline") }}</TableHead
                  >
                  <TableHead
                    class="uppercase text-xs font-normal tracking-wider"
                    >{{ t("connections.runs.trigger") }}</TableHead
                  >
                  <TableHead
                    class="w-[100px] uppercase text-xs font-normal tracking-wider"
                    >{{ t("connections.runs.statusHeader") }}</TableHead
                  >
                  <TableHead
                    class="uppercase text-xs font-normal tracking-wider"
                    >{{ t("connections.runs.started") }}</TableHead
                  >
                  <TableHead
                    class="w-[100px] uppercase text-xs font-normal tracking-wider"
                    >{{ t("connections.runs.duration") }}</TableHead
                  >
                </TableRow>
              </TableHeader>
              <TableBody>
                <ContextMenu v-for="run in filteredRuns" :key="run.id">
                  <ContextMenuTrigger as-child>
                    <TableRow
                      class="cursor-pointer"
                      @click="toggleRunSelection(run.id)"
                    >
                      <TableCell @click.stop>
                        <Checkbox
                          :model-value="selectedRuns.has(run.id)"
                          @update:model-value="toggleRunSelection(run.id)"
                        />
                      </TableCell>
                      <TableCell>
                        <code class="font-mono text-xs text-foreground">
                          {{ run.id.slice(0, 8) }}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <code class="font-mono text-xs text-muted-foreground">
                          {{ run.pipelineSlug.slice(0, 8) }}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" class="capitalize">
                          {{
                            t(`connections.runs.triggerType.${run.triggerType}`)
                          }}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div class="flex items-center gap-2">
                          <Play
                            v-if="run.status === 'running'"
                            :size="14"
                            class="text-blue-500"
                          />
                          <CheckCircle2
                            v-else-if="
                              run.status === 'analyzed' ||
                              run.status === 'completed'
                            "
                            :size="14"
                            class="text-green-500"
                          />
                          <XCircle
                            v-else-if="
                              run.status === 'failed' ||
                              run.status === 'cancelled'
                            "
                            :size="14"
                            class="text-red-500"
                          />
                          <span class="text-xs text-foreground capitalize">
                            {{ t(`connections.runs.status.${run.status}`) }}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell class="text-xs text-muted-foreground">
                        {{ formatRelativeTime(run.startedAt, t) }}
                      </TableCell>
                      <TableCell class="text-xs text-muted-foreground">
                        {{ formatDuration(run.startedAt, run.completedAt) }}
                      </TableCell>
                    </TableRow>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      class="cursor-pointer"
                      @click="viewRunDetails(run)"
                    >
                      <Eye :size="14" class="mr-2" />
                      {{ t("connections.runs.viewDetails") }}
                    </ContextMenuItem>
                    <ContextMenuItem
                      class="cursor-pointer"
                      @click="copyRunDetails(run)"
                    >
                      <Copy :size="14" class="mr-2" />
                      {{ t("connections.runs.copyLogs") }}
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              </TableBody>
            </Table>

            <div
              v-if="filteredRuns.length === 0"
              class="py-12 text-center text-sm text-muted-foreground"
            >
              {{ t("connections.runs.noRunsFound") }}
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
