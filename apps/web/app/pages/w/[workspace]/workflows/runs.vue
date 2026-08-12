<script setup lang="ts">
import type { Component } from "vue";
import type {
	PipelineRunStatus,
	PipelineTriggerType,
} from "@nvisy/sdk/datatypes";
import type { RunsFilter } from "#console/composables/useRuns";
import {
	ArrowLeft,
	Loader2,
	Loader,
	Clock,
	XCircle,
	CircleCheck,
	CircleSlash,
	ClipboardCheck,
	History,
	ExternalLink,
} from "@lucide/vue";
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

const { pipelines } = usePipelines();

// Filters are applied server-side via listRuns/listPipelineRuns.
const ALL = "all";
const statusFilter = ref<PipelineRunStatus | typeof ALL>(ALL);
const pipelineFilter = ref<string>(ALL);
const triggerFilter = ref<PipelineTriggerType | typeof ALL>(ALL);

const runsFilter = computed<RunsFilter>(() => ({
	...(statusFilter.value !== ALL && { status: statusFilter.value }),
	...(triggerFilter.value !== ALL && { triggerType: triggerFilter.value }),
	...(pipelineFilter.value !== ALL && { pipelineSlug: pipelineFilter.value }),
}));

const { runs, isLoading } = useRuns(runsFilter);

const RUN_STATUSES: PipelineRunStatus[] = [
	"queued",
	"analyzing",
	"analyzed",
	"completed",
	"failed",
	"cancelled",
];

const TRIGGER_TYPES: PipelineTriggerType[] = ["user", "system"];

// Per-status presentation: icon + tint, following the run lifecycle.
//   queued     — enqueued, no worker yet          (waiting)
//   analyzing  — a worker is analyzing            (in progress)
//   analyzed   — detection done, awaiting review  (needs action → amber)
//   completed  — redaction applied, finished      (success → emerald)
//   failed / cancelled                            (error / muted)
const STATUS_META: Record<
	PipelineRunStatus,
	{ icon: Component; class: string; spin?: boolean }
> = {
	queued: { icon: Clock, class: "text-muted-foreground" },
	analyzing: { icon: Loader, class: "text-blue-500", spin: true },
	analyzed: { icon: ClipboardCheck, class: "text-amber-500" },
	completed: { icon: CircleCheck, class: "text-emerald-500" },
	failed: { icon: XCircle, class: "text-destructive" },
	cancelled: { icon: CircleSlash, class: "text-muted-foreground" },
};

// The API filters; we only ensure newest-first ordering.
const sortedRuns = computed(() =>
	[...(runs.value ?? [])].sort((a, b) =>
		b.startedAt.localeCompare(a.startedAt),
	),
);
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

        <!-- Pipeline filter -->
        <Select v-model="pipelineFilter">
          <SelectTrigger class="h-9 w-[170px] text-sm">
            <SelectValue :placeholder="t('workflows.runs.pipeline')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" class="text-sm font-normal">
              {{ t("workflows.runs.allPipelines") }}
            </SelectItem>
            <SelectItem
              v-for="p in pipelines ?? []"
              :key="p.slug"
              :value="p.slug"
              class="text-sm font-normal"
            >
              {{ p.displayName }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Trigger filter -->
        <Select v-model="triggerFilter">
          <SelectTrigger class="h-9 w-[150px] text-sm">
            <SelectValue :placeholder="t('workflows.runs.trigger')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" class="text-sm font-normal">
              {{ t("workflows.runs.allTriggers") }}
            </SelectItem>
            <SelectItem
              v-for="tt in TRIGGER_TYPES"
              :key="tt"
              :value="tt"
              class="text-sm font-normal"
            >
              {{ t(`workflows.runs.triggerType.${tt}`) }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Status filter -->
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
            {{ t("workflows.runs.runsFound", { count: sortedRuns.length }) }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <!-- Loading -->
          <div v-if="isLoading" class="flex items-center justify-center py-12">
            <Loader2 :size="24" class="animate-spin text-muted-foreground" />
          </div>

          <!-- Empty -->
          <div v-else-if="sortedRuns.length === 0" class="py-12">
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
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="run in sortedRuns" :key="run.id">
                <!-- Pipeline -->
                <TableCell>
                  <span class="font-mono text-xs text-foreground">
                    {{ run.pipelineSlug }}
                  </span>
                </TableCell>

                <!-- File -->
                <TableCell>
                  <span
                    class="font-mono text-xs text-muted-foreground"
                    :title="run.inputFileId"
                  >
                    {{ run.inputFileId.slice(0, 8) }}
                  </span>
                </TableCell>

                <!-- Trigger -->
                <TableCell>
                  <Badge variant="secondary" class="font-normal">
                    {{ t(`workflows.runs.triggerType.${run.triggerType}`) }}
                  </Badge>
                </TableCell>

                <!-- Status -->
                <TableCell>
                  <div class="flex items-center gap-2">
                    <component
                      :is="STATUS_META[run.status].icon"
                      :size="14"
                      :class="[
                        STATUS_META[run.status].class,
                        STATUS_META[run.status].spin && 'animate-spin',
                      ]"
                    />
                    <span class="text-sm">
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
