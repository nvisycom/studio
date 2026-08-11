<script setup lang="ts">
import type { PipelineRun, PipelineRunStatus } from "@nvisy/sdk/datatypes";
import {
	ArrowLeft,
	Loader2,
	Play,
	Clock,
	XCircle,
	CheckCircle2,
	CircleSlash,
	FileText,
	History,
	ExternalLink,
} from "@lucide/vue";
import { formatDuration } from "#console/utils/date";
import { Button } from "#console/components/ui/button";
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
	TableHeader,
	TableRow,
} from "#console/components/ui/table";
import DataTableHead from "#console/components/pages/DataTableHead.vue";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";
import { Badge } from "#console/components/ui/badge";

const { t } = useI18n();
const { relativeTime } = useRelativeTime();
const { wLink } = useWorkspaceLink();

useHead({ title: "Workflow Runs" });

definePageMeta({
	pageCategory: "header.category.workflows",
});

const { runs, isLoading } = useRuns();

const RUN_STATUSES: PipelineRunStatus[] = [
	"queued",
	"analyzing",
	"analyzed",
	"completed",
	"failed",
	"cancelled",
];

const statusFilter = ref<PipelineRunStatus | "all">("all");

const filteredRuns = computed(() => {
	const items = [...(runs.value ?? [])];
	const filtered =
		statusFilter.value === "all"
			? items
			: items.filter((run) => run.status === statusFilter.value);
	return filtered.sort(
		(a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
	);
});
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="mx-auto w-full max-w-6xl">
      <!-- Toolbar -->
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <Button as-child variant="outline" class="font-normal">
          <NuxtLink :to="wLink('/workflows')" class="flex items-center gap-2">
            <ArrowLeft :size="16" />
            {{ t("workflows.runs.backToWorkflows") }}
          </NuxtLink>
        </Button>

        <div class="flex-1" />

        <Select v-model="statusFilter">
          <SelectTrigger class="h-9 w-[160px] text-sm">
            <SelectValue :placeholder="t('workflows.runs.status')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" class="text-sm font-normal">
              {{ t("workflows.runs.allStatus") }}
            </SelectItem>
            <SelectItem
              v-for="s in RUN_STATUSES"
              :key="s"
              :value="s"
              class="text-sm font-normal"
            >
              {{ t(`workflows.runs.runStatus.${s}`) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card class="rounded-xl border-border/50 py-0 pt-6">
        <CardHeader>
          <CardTitle
            class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            {{ t("workflows.runs.title") }}
          </CardTitle>
          <CardDescription class="text-sm">
            {{ t("workflows.runs.runsFound", { count: filteredRuns.length }) }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <!-- Loading -->
          <div v-if="isLoading" class="flex items-center justify-center py-12">
            <Loader2 :size="24" class="animate-spin text-muted-foreground" />
          </div>

          <!-- Empty -->
          <div v-else-if="filteredRuns.length === 0" class="py-12">
            <div class="text-center">
              <div
                class="mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-muted/50"
              >
                <History class="size-5 text-muted-foreground" />
              </div>
              <p class="text-sm text-foreground mb-1">
                {{ t("workflows.runs.noRunsFound") }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ t("workflows.runs.noRunsDescription") }}
              </p>
            </div>
          </div>

          <Table v-else>
            <TableHeader>
              <TableRow>
                <DataTableHead>
                  {{ t("workflows.runs.pipeline") }}
                </DataTableHead>
                <DataTableHead>{{ t("workflows.runs.file") }}</DataTableHead>
                <DataTableHead>
                  {{ t("workflows.runs.trigger") }}
                </DataTableHead>
                <DataTableHead>
                  {{ t("workflows.runs.statusHeader") }}
                </DataTableHead>
                <DataTableHead>
                  {{ t("workflows.runs.started") }}
                </DataTableHead>
                <DataTableHead>
                  {{ t("workflows.runs.duration") }}
                </DataTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="run in filteredRuns" :key="run.id">
                <!-- Pipeline -->
                <TableCell>
                  <span class="font-mono text-xs text-foreground">
                    {{ run.pipelineSlug }}
                  </span>
                </TableCell>

                <!-- File -->
                <TableCell>
                  <div class="flex items-center gap-1.5 text-muted-foreground">
                    <FileText :size="14" />
                    <span class="font-mono text-xs">
                      {{ run.inputFileId.slice(0, 8) }}
                    </span>
                  </div>
                </TableCell>

                <!-- Trigger -->
                <TableCell>
                  <Badge variant="outline" class="font-normal">
                    {{ t(`workflows.runs.triggerType.${run.triggerType}`) }}
                  </Badge>
                </TableCell>

                <!-- Status -->
                <TableCell>
                  <div class="flex items-center gap-2">
                    <Play
                      v-if="run.status === 'analyzing'"
                      :size="14"
                      class="text-blue-500"
                    />
                    <Clock
                      v-else-if="run.status === 'queued' || run.status === 'analyzed'"
                      :size="14"
                      class="text-muted-foreground"
                    />
                    <CheckCircle2
                      v-else-if="run.status === 'completed'"
                      :size="14"
                      class="text-green-500"
                    />
                    <XCircle
                      v-else-if="run.status === 'failed'"
                      :size="14"
                      class="text-red-500"
                    />
                    <CircleSlash v-else :size="14" class="text-muted-foreground" />
                    <span class="text-sm capitalize">
                      {{ t(`workflows.runs.runStatus.${run.status}`) }}
                    </span>
                  </div>
                </TableCell>

                <!-- Started -->
                <TableCell class="text-sm text-muted-foreground">
                  {{ relativeTime(run.startedAt) }}
                </TableCell>

                <!-- Duration -->
                <TableCell class="text-sm text-muted-foreground">
                  {{ formatDuration(run.startedAt, run.completedAt) }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter
          class="border-t border-border/50 pb-6 bg-muted/30 rounded-b-xl"
        >
          <p class="text-xs text-muted-foreground">
            {{ t("workflows.runs.footer") }}
            <a
              href="https://docs.nvisy.com/pipelines"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-foreground hover:underline font-medium"
            >
              {{ t("workflows.learnMore") }}
              <ExternalLink :size="12" />
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>
