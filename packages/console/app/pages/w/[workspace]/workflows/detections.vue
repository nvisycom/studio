<script setup lang="ts">
import type {
	Detection,
	DetectionStatus,
	PipelineTriggerType,
} from "@nvisy/sdk/datatypes";
import type { DetectionsFilter } from "#console/composables/useDetections";
import {
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
import { DetectionDetailSheet } from "#console/components/pages/detections";
import { personLabel } from "#console/utils/naming";
import { toast } from "vue-sonner";
import { Button } from "#console/components/ui/button";
import { VirtualTable } from "#console/components/ui/virtual-table";
import { HeaderSocket, SectionTabs } from "#console/components/layout/header";
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

// Detection-detail sheet: opened from a row click or the "See details" action.
const detailDetection = ref<Detection | null>(null);
const isDetailOpen = ref(false);
function openDetails(detection: Detection) {
	detailDetection.value = detection;
	isDetailOpen.value = true;
}

// Open a detection's source document in the studio for review. `openFile` fetches the
// file into a tab; surface a failure rather than let it reject unhandled.
function openInStudio(fileId: string) {
	openFile(fileId).catch((error) => {
		toast.error(t("workflows.detections.openInStudioFailed"), {
			description: getErrorMessage(error, t("common.errors.tryAgain")),
		});
	});
	navigateTo(wLink("/studio"));
}

// A stable base name for an exported audit: the source file (sans extension)
// plus the short detection id, so multiple detections of one file don't collide. The CSV
// export is delivered as a zip archive (entities.csv, provenance.csv,
// reviews.csv), so its download is named `.zip`, not `.csv`.
function auditFileName(
	detection: (typeof sortedDetections.value)[number],
	format: "json" | "csv",
): string {
	const base = (detection.inputFileName || detection.inputFileId).replace(
		/\.[^.]+$/,
		"",
	);
	const ext = format === "csv" ? "zip" : "json";
	return `${base}-audit-${detection.id.slice(0, 8)}.${ext}`;
}

async function downloadDetectionAudit(
	detection: (typeof sortedDetections.value)[number],
	format: "json" | "csv",
) {
	try {
		await downloadAudit(detection.id, format, auditFileName(detection, format));
	} catch (error) {
		toast.error(t("workflows.detections.auditDownloadFailed"), {
			description: getErrorMessage(error, t("common.errors.tryAgain")),
		});
	}
}

function rowActions(
	detection: (typeof sortedDetections.value)[number],
): RowAction[] {
	return [
		{
			key: "details",
			label: t("workflows.detections.seeDetails"),
			icon: PanelRightOpen,
			select: () => openDetails(detection),
		},
		{
			key: "studio",
			label: t("workflows.detections.openInStudio"),
			icon: ScanSearch,
			select: () => openInStudio(detection.inputFileId),
		},
		{
			key: "audit-json",
			label: t("workflows.detections.downloadAuditJson"),
			icon: FileJson,
			separatorBefore: true,
			select: () => downloadDetectionAudit(detection, "json"),
		},
		{
			key: "audit-csv",
			label: t("workflows.detections.downloadAuditCsv"),
			icon: FileSpreadsheet,
			select: () => downloadDetectionAudit(detection, "csv"),
		},
	];
}

useHead({ title: "Detections" });

definePageMeta({
	pageCategory: "header.category.workflows",
	hideCategory: true,
});

const sectionTabs = useSectionTabs();

const { pipelines } = usePipelines();

// Filters are applied server-side via listDetections/listPipelineDetections.
const ALL = "all";
const statusFilter = ref<DetectionStatus | typeof ALL>(ALL);
const pipelineFilter = ref<string>(ALL);
const triggerFilter = ref<PipelineTriggerType | typeof ALL>(ALL);
const fileFilter = ref<string | null>(null);

const detectionsFilter = computed<DetectionsFilter>(() => ({
	...(statusFilter.value !== ALL && { status: statusFilter.value }),
	...(triggerFilter.value !== ALL && { triggerType: triggerFilter.value }),
	...(pipelineFilter.value !== ALL && { pipelineSlug: pipelineFilter.value }),
	...(fileFilter.value && { fileId: fileFilter.value }),
}));

const { detections, isLoading, downloadAudit } =
	useDetections(detectionsFilter);

const DETECTION_STATUSES: DetectionStatus[] = [
	"pending",
	"executing",
	"complete",
	"failed",
];

const TRIGGER_TYPES: PipelineTriggerType[] = ["user", "system"];

// The API filters; we only ensure newest-first ordering.
const sortedDetections = computed(() =>
	[...(detections.value ?? [])].sort((a, b) =>
		b.startedAt.localeCompare(a.startedAt),
	),
);

const columns = computed<
	VirtualColumn<(typeof sortedDetections.value)[number]>[]
>(() => [
	{
		key: "pipeline",
		header: t("workflows.detections.pipeline"),
		cell: (r) => ({ type: "text", value: r.pipelineSlug, mono: true }),
	},
	{
		key: "file",
		header: t("workflows.detections.file"),
		cell: (r) => ({
			type: "primary",
			title: r.inputFileName || r.inputFileId,
			maxWidth: "max-w-xs",
		}),
	},
	{
		key: "triggeredBy",
		header: t("workflows.detections.triggeredBy"),
		width: "180px",
		cell: (r) => ({
			type: "avatar",
			name: personLabel(r.triggeredBy),
			src: resolveAvatarUrl(r.triggeredBy.avatarUrl),
		}),
	},
	{
		key: "status",
		header: t("workflows.detections.statusHeader"),
		width: "140px",
		cell: (r) => ({
			type: "badge",
			label: t(`workflows.detections.detectionStatus.${r.status}`),
			variant: r.status === "failed" ? "destructive" : "secondary",
		}),
	},
	{
		key: "started",
		header: t("workflows.detections.started"),
		width: "140px",
		cell: (r) => ({
			type: "text",
			value: relativeTime(r.startedAt),
			muted: true,
		}),
	},
]);
</script>

<template>
  <!-- Fixed-height page so the table fills and scrolls (like /files). -->
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6 h-[calc(100vh-5.5rem)]">
    <div class="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 min-h-0">
      <!-- Section tabs in the app-header socket. -->
      <HeaderSocket>
        <SectionTabs :tabs="sectionTabs.workflows.value" />
      </HeaderSocket>

      <!-- Filter toolbar. -->
      <div class="flex flex-wrap items-center gap-3">
        <p class="shrink-0 text-sm text-muted-foreground">
          {{ t("workflows.detections.runsFound", { count: sortedDetections.length }) }}
        </p>

        <div class="flex-1" />

        <!-- Pipeline filter -->
        <Select v-model="pipelineFilter">
          <SelectTrigger class="h-9 w-[170px] text-sm">
            <SelectValue :placeholder="t('workflows.detections.pipeline')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" class="text-sm font-normal">
              {{ t("workflows.detections.allPipelines") }}
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
            <SelectValue :placeholder="t('workflows.detections.trigger')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" class="text-sm font-normal">
              {{ t("workflows.detections.allTriggers") }}
            </SelectItem>
            <SelectItem
              v-for="tt in TRIGGER_TYPES"
              :key="tt"
              :value="tt"
              class="text-sm font-normal"
            >
              {{ t(`workflows.detections.triggerType.${tt}`) }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Status filter -->
        <Select v-model="statusFilter">
          <SelectTrigger class="h-9 w-[160px] text-sm">
            <SelectValue :placeholder="t('workflows.detections.status')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" class="text-sm font-normal">
              {{ t("workflows.detections.allStatus") }}
            </SelectItem>
            <SelectItem
              v-for="s in DETECTION_STATUSES"
              :key="s"
              :value="s"
              class="text-sm font-normal"
            >
              {{ t(`workflows.detections.detectionStatus.${s}`) }}
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
          :rows="sortedDetections"
          :columns="columns"
          :row-actions="rowActions"
          :menu-label="t('workflows.detections.menu')"
          :empty="{
            icon: History,
            title: t('workflows.detections.noRunsFound'),
            description: t('workflows.detections.noRunsDescription'),
          }"
          @row-click="openDetails"
        />
      </div>
    </div>

    <DetectionDetailSheet
      v-model:open="isDetailOpen"
      :detection="detailDetection"
      @open-in-studio="openInStudio"
      @download-audit="(_id, format) => detailDetection && downloadDetectionAudit(detailDetection, format)"
    />
  </div>
</template>
