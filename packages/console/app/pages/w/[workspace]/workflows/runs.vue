<script setup lang="ts">
import type {
	PipelineRun,
	PipelineRunStatus,
	PipelineTriggerType,
} from "@nvisy/sdk/datatypes";
import type { RunsFilter } from "#console/composables/useRuns";
import {
	ArrowLeft,
	Loader2,
	History,
	ScanSearch,
	FileJson,
	FileSpreadsheet,
	PanelRightOpen,
} from "@lucide/vue";
import type { RowAction } from "#console/components/pages/RowActions.vue";
import type { VirtualColumn } from "#console/components/ui/virtual-table";
import { EntityAvatar, FilePicker } from "#console/components/common";
import { RunDetailSheet } from "#console/components/pages/runs";
import { personLabel } from "#console/utils/naming";
import { toast } from "vue-sonner";
import { Button } from "#console/components/ui/button";
import { VirtualTable } from "#console/components/ui/virtual-table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";

const { t } = useI18n();
const { relativeTime } = useRelativeTime();
const { wLink } = useWorkspaceLink();
const { resolveAvatarUrl } = useAvatarUrl();
const { openFile } = useStudioFiles();

// Run-detail sheet: opened from a row click or the "See details" action.
const detailRun = ref<PipelineRun | null>(null);
const isDetailOpen = ref(false);
function openDetails(run: PipelineRun) {
	detailRun.value = run;
	isDetailOpen.value = true;
}

// Open a run's source document in the studio for review. `openFile` fetches the
// file into a tab; surface a failure rather than let it reject unhandled.
function openInStudio(fileId: string) {
	openFile(fileId).catch((error) => {
		toast.error(t("workflows.runs.openInStudioFailed"), {
			description: getErrorMessage(error, t("common.errors.tryAgain")),
		});
	});
	navigateTo(wLink("/studio"));
}

// A stable base name for an exported audit: the source file (sans extension)
// plus the short run id, so multiple runs of one file don't collide. The CSV
// export is delivered as a zip archive (entities.csv, provenance.csv,
// reviews.csv), so its download is named `.zip`, not `.csv`.
function auditFileName(
	run: (typeof sortedRuns.value)[number],
	format: "json" | "csv",
): string {
	const base = (run.inputFileName || run.inputFileId).replace(/\.[^.]+$/, "");
	const ext = format === "csv" ? "zip" : "json";
	return `${base}-audit-${run.id.slice(0, 8)}.${ext}`;
}

async function downloadRunAudit(
	run: (typeof sortedRuns.value)[number],
	format: "json" | "csv",
) {
	try {
		await downloadAudit(run.id, format, auditFileName(run, format));
	} catch (error) {
		toast.error(t("workflows.runs.auditDownloadFailed"), {
			description: getErrorMessage(error, t("common.errors.tryAgain")),
		});
	}
}

function rowActions(run: (typeof sortedRuns.value)[number]): RowAction[] {
	return [
		{
			key: "details",
			label: t("workflows.runs.seeDetails"),
			icon: PanelRightOpen,
			select: () => openDetails(run),
		},
		{
			key: "studio",
			label: t("workflows.runs.openInStudio"),
			icon: ScanSearch,
			select: () => openInStudio(run.inputFileId),
		},
		{
			key: "audit-json",
			label: t("workflows.runs.downloadAuditJson"),
			icon: FileJson,
			separatorBefore: true,
			select: () => downloadRunAudit(run, "json"),
		},
		{
			key: "audit-csv",
			label: t("workflows.runs.downloadAuditCsv"),
			icon: FileSpreadsheet,
			select: () => downloadRunAudit(run, "csv"),
		},
	];
}

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
const fileFilter = ref<string | null>(null);

const runsFilter = computed<RunsFilter>(() => ({
	...(statusFilter.value !== ALL && { status: statusFilter.value }),
	...(triggerFilter.value !== ALL && { triggerType: triggerFilter.value }),
	...(pipelineFilter.value !== ALL && { pipelineSlug: pipelineFilter.value }),
	...(fileFilter.value && { fileId: fileFilter.value }),
}));

const { runs, isLoading, downloadAudit } = useRuns(runsFilter);

const RUN_STATUSES: PipelineRunStatus[] = [
	"queued",
	"analyzing",
	"analyzed",
	"completed",
	"failed",
	"cancelled",
];

const TRIGGER_TYPES: PipelineTriggerType[] = ["user", "system"];

// The API filters; we only ensure newest-first ordering.
const sortedRuns = computed(() =>
	[...(runs.value ?? [])].sort((a, b) =>
		b.startedAt.localeCompare(a.startedAt),
	),
);

const columns = computed<VirtualColumn<(typeof sortedRuns.value)[number]>[]>(
	() => [
		{
			key: "pipeline",
			header: t("workflows.runs.pipeline"),
			cell: (r) => ({ type: "text", value: r.pipelineSlug, mono: true }),
		},
		{
			key: "file",
			header: t("workflows.runs.file"),
			cell: (r) => ({
				type: "primary",
				title: r.inputFileName || r.inputFileId,
				// The redacted output, once the run produced one.
				subtitle: r.outputFileName ?? undefined,
				maxWidth: "max-w-xs",
			}),
		},
		{
			key: "triggeredBy",
			header: t("workflows.runs.triggeredBy"),
			width: "180px",
			cell: (r) => ({
				type: "avatar",
				name: personLabel(r.triggeredBy),
				src: resolveAvatarUrl(r.triggeredBy.avatarUrl),
			}),
		},
		{
			key: "status",
			header: t("workflows.runs.statusHeader"),
			width: "140px",
			cell: (r) => ({
				type: "badge",
				label: t(`workflows.runs.runStatus.${r.status}`),
				variant: r.status === "failed" ? "destructive" : "secondary",
			}),
		},
		{
			key: "started",
			header: t("workflows.runs.started"),
			width: "140px",
			cell: (r) => ({
				type: "text",
				value: relativeTime(r.startedAt),
				muted: true,
			}),
		},
	],
);
</script>

<template>
  <!-- Fixed-height page so the table fills and scrolls (like /files). -->
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6 h-[calc(100vh-5.5rem)]">
    <div class="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 min-h-0">
      <!-- Title + count. -->
      <div>
        <h1 class="text-lg font-semibold text-foreground">
          {{ t("workflows.runs.title") }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ t("workflows.runs.runsFound", { count: sortedRuns.length }) }}
        </p>
      </div>

      <!-- Filter toolbar. -->
      <div class="flex flex-wrap items-center gap-3">
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

        <!-- File filter -->
        <FilePicker v-model="fileFilter" class="w-[190px]" />

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

      <!-- Loading -->
      <div
        v-if="isLoading"
        class="flex flex-1 items-center justify-center py-12"
      >
        <Loader2 :size="24" class="animate-spin text-muted-foreground" />
      </div>

      <!-- Bare full-width table, filling the remaining height. -->
      <div v-else class="relative min-h-0 flex-1">
        <VirtualTable
          :rows="sortedRuns"
          :columns="columns"
          :row-actions="rowActions"
          :menu-label="t('workflows.runs.menu')"
          :empty="{
            icon: History,
            title: t('workflows.runs.noRunsFound'),
            description: t('workflows.runs.noRunsDescription'),
          }"
          @row-click="openDetails"
        />
      </div>
    </div>

    <RunDetailSheet
      v-model:open="isDetailOpen"
      :run="detailRun"
      @open-in-studio="openInStudio"
      @download-audit="(_runId, format) => detailRun && downloadRunAudit(detailRun, format)"
    />
  </div>
</template>
