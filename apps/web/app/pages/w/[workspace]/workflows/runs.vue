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
} from "@lucide/vue";
import { formatDuration } from "#console/utils/date";
import { Button } from "#console/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
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
	"running",
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

      <Card class="rounded-xl border-border/50 py-0 pb-6 pt-6">
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
          <div
            v-else-if="filteredRuns.length === 0"
            class="py-12 text-center text-sm text-muted-foreground"
          >
            {{ t("workflows.runs.noRunsFound") }}
          </div>

          <Table v-else>
            <TableHeader>
              <TableRow>
                <TableHead class="text-xs font-normal uppercase tracking-wider">
                  {{ t("workflows.runs.pipeline") }}
                </TableHead>
                <TableHead class="text-xs font-normal uppercase tracking-wider">
                  {{ t("workflows.runs.file") }}
                </TableHead>
                <TableHead class="text-xs font-normal uppercase tracking-wider">
                  {{ t("workflows.runs.trigger") }}
                </TableHead>
                <TableHead class="text-xs font-normal uppercase tracking-wider">
                  {{ t("workflows.runs.statusHeader") }}
                </TableHead>
                <TableHead class="text-xs font-normal uppercase tracking-wider">
                  {{ t("workflows.runs.started") }}
                </TableHead>
                <TableHead class="text-xs font-normal uppercase tracking-wider">
                  {{ t("workflows.runs.duration") }}
                </TableHead>
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
                      v-if="run.status === 'running'"
                      :size="14"
                      class="text-blue-500"
                    />
                    <Clock
                      v-else-if="run.status === 'analyzed'"
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
      </Card>
    </div>
  </div>
</template>
