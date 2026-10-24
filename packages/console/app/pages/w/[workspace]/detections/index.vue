<script setup lang="ts">
import type { WorkspaceDetection, DetectionStatus } from "@nvisy/sdk/datatypes";
import type { DetectionsFilter } from "#console/composables/studio/useDetections";
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
import { DocumentPicker } from "#console/components/shared";
import { DetectionDetailSheet } from "#console/components/pages/detections";
import { HeaderSocket, SectionTabs } from "#console/components/layout/header";
import { personLabel } from "#console/utils/naming";
import { toast } from "vue-sonner";
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
const sectionTabs = useSectionTabs();
const { wLink } = useWorkspaceLink();
const { resolveAvatarUrl } = useAvatarUrl();
const { openDocument } = useStudioDocuments();

// Detection-detail sheet: opened from a row click or the "See details" action.
const detailDetection = ref<WorkspaceDetection | null>(null);
const isDetailOpen = ref(false);
function openDetails(detection: WorkspaceDetection) {
	detailDetection.value = detection;
	isDetailOpen.value = true;
}

// Open a detection's source document in the studio for review. `openDocument`
// fetches the file into a tab; surface a failure rather than let it reject
// unhandled.
function openInStudio(fileId: string) {
	openDocument(fileId).catch((error) => {
		toast.error(t("detections.openInStudioFailed"), {
			description: getErrorMessage(error, t("common.errors.tryAgain")),
		});
	});
	navigateTo(wLink("/studio"));
}

// A stable base name for an exported audit: the source file (sans extension)
// plus the short detection id, so multiple detections of one file don't collide.
// The CSV export is delivered as a zip archive (entities.csv, provenance.csv,
// reviews.csv), so its download is named `.zip`, not `.csv`.
function auditFileName(
	detection: (typeof sortedDetections.value)[number],
	format: "json" | "csv",
): string {
	const base = (
		detection.inputDocumentName || detection.inputDocumentId
	).replace(/\.[^.]+$/, "");
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
		toast.error(t("detections.auditDownloadFailed"), {
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
			label: t("detections.seeDetails"),
			icon: PanelRightOpen,
			select: () => openDetails(detection),
		},
		{
			key: "studio",
			label: t("detections.openInStudio"),
			icon: ScanSearch,
			select: () => openInStudio(detection.inputDocumentId),
		},
		{
			key: "audit-json",
			label: t("detections.downloadAuditJson"),
			icon: FileJson,
			separatorBefore: true,
			select: () => downloadDetectionAudit(detection, "json"),
		},
		{
			key: "audit-csv",
			label: t("detections.downloadAuditCsv"),
			icon: FileSpreadsheet,
			select: () => downloadDetectionAudit(detection, "csv"),
		},
	];
}

useHead({ title: "Detections" });

definePageMeta({
	pageCategory: "header.category.detections",
	hideCategory: true,
});

// Filters are applied server-side via listDetections (status, document, policy).
const ALL = "all";
const statusFilter = ref<DetectionStatus | typeof ALL>(ALL);
const fileFilter = ref<string | null>(null);

const detectionsFilter = computed<DetectionsFilter>(() => ({
	...(statusFilter.value !== ALL && { status: statusFilter.value }),
	...(fileFilter.value && { documentId: fileFilter.value }),
}));

const { detections, isLoading, downloadAudit } =
	useDetections(detectionsFilter);

const DETECTION_STATUSES: DetectionStatus[] = [
	"pending",
	"executing",
	"complete",
	"failed",
];

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
		key: "file",
		header: t("detections.file"),
		cell: (r) => ({
			type: "primary",
			title: r.inputDocumentName || r.inputDocumentId,
			maxWidth: "max-w-sm",
		}),
	},
	{
		key: "triggeredBy",
		header: t("detections.triggeredBy"),
		width: "180px",
		cell: (r) => ({
			type: "avatar",
			name: personLabel(r.triggeredBy),
			src: resolveAvatarUrl(r.triggeredBy.avatarUrl),
		}),
	},
	{
		key: "status",
		header: t("detections.statusHeader"),
		width: "140px",
		cell: (r) => ({
			type: "badge",
			label: t(`detections.detectionStatus.${r.status}`),
			variant: r.status === "failed" ? "destructive" : "secondary",
		}),
	},
	{
		key: "started",
		header: t("detections.started"),
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
        <SectionTabs :tabs="sectionTabs.observability.value" />
      </HeaderSocket>

      <!-- Filter toolbar. -->
      <div class="flex flex-wrap items-center gap-3">
        <p class="shrink-0 text-sm text-muted-foreground">
          {{ t("detections.runsFound", { count: sortedDetections.length }) }}
        </p>

        <div class="flex-1" />

        <!-- File filter -->
        <DocumentPicker v-model="fileFilter" class="w-[190px]" />

        <!-- Status filter -->
        <Select v-model="statusFilter">
          <SelectTrigger class="h-9 w-[160px] text-sm">
            <SelectValue :placeholder="t('detections.status')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" class="text-sm font-normal">
              {{ t("detections.allStatus") }}
            </SelectItem>
            <SelectItem
              v-for="s in DETECTION_STATUSES"
              :key="s"
              :value="s"
              class="text-sm font-normal"
            >
              {{ t(`detections.detectionStatus.${s}`) }}
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
          :menu-label="t('detections.menu')"
          :empty="{
            icon: History,
            title: t('detections.noRunsFound'),
            description: t('detections.noRunsDescription'),
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
