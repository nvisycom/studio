<script setup lang="ts">
import type { Audit, Detection } from "@nvisy/sdk/datatypes";
import {
	Check,
	Cog,
	Copy,
	ExternalLink,
	FileJson,
	FileSpreadsheet,
	ScanSearch,
	User,
} from "@lucide/vue";
import { toast } from "vue-sonner";
import { Badge } from "#console/components/ui/badge";
import { Button } from "#console/components/ui/button";
import { EntityAvatar } from "#console/components/common";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "#console/components/ui/sheet";
import { formatDateTime, formatDuration } from "#console/utils/date";
import { personLabel } from "#console/utils/naming";

const { t } = useI18n();

const props = defineProps<{ detection: Detection | null }>();
const open = defineModel<boolean>("open", { required: true });

const emit = defineEmits<{
	"open-in-studio": [fileId: string];
	"download-audit": [detectionId: string, format: "json" | "csv"];
}>();

const { getAnalysis } = useDetections();
const { resolveAvatarUrl } = useAvatarUrl();

/** Title falls back to the file id when the display name was pruned. */
const inputFileLabel = computed(() =>
	props.detection
		? props.detection.inputFileName || props.detection.inputFileId
		: "",
);

const triggeredByAvatar = computed(() =>
	resolveAvatarUrl(props.detection?.triggeredBy.avatarUrl),
);

const tags = computed<string[]>(() => props.detection?.metadata.tags ?? []);

/** Analysis is only available once the detection is complete. */
const hasDetection = computed(() => props.detection?.status === "complete");

const audit = ref<Audit | null>(null);
const auditLoading = ref(false);
const auditFailed = ref(false);

const { count } = useTextEntities(audit);

/** Fetch the analysis once the sheet opens for a complete detection. */
watch(
	[open, () => props.detection],
	async ([isOpen, detection]) => {
		audit.value = null;
		auditFailed.value = false;
		auditLoading.value = false;
		if (!isOpen || !detection) return;
		if (detection.status !== "complete") return;

		auditLoading.value = true;
		try {
			const result = await getAnalysis(detection.id);
			// Ignore a stale response: the sheet may have moved to another detection
			// while this was in flight.
			if (props.detection?.id !== detection.id) return;
			audit.value = result;
		} catch {
			if (props.detection?.id === detection.id) auditFailed.value = true;
		} finally {
			if (props.detection?.id === detection.id) auditLoading.value = false;
		}
	},
	{ immediate: true },
);

const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | undefined;

async function copyDetectionId() {
	if (!props.detection) return;
	try {
		await navigator.clipboard.writeText(props.detection.id);
	} catch {
		// Clipboard access can be denied (insecure context, permission) — tell the
		// user rather than silently failing.
		toast.error(t("workflows.detections.detail.copyFailed"));
		return;
	}
	copied.value = true;
	toast(t("workflows.detections.detail.copied"));
	clearTimeout(copyTimer);
	copyTimer = setTimeout(() => {
		copied.value = false;
	}, 1500);
}

onBeforeUnmount(() => clearTimeout(copyTimer));

function openInStudio() {
	if (props.detection) emit("open-in-studio", props.detection.inputFileId);
}

function downloadAudit(format: "json" | "csv") {
	// The audit only exists once the detection is complete.
	if (props.detection && hasDetection.value)
		emit("download-audit", props.detection.id, format);
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      side="right"
      class="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
    >
      <template v-if="detection">
        <SheetHeader class="border-b border-border/50">
          <SheetTitle class="truncate">{{ inputFileLabel }}</SheetTitle>
          <SheetDescription class="font-mono">
            {{ detection.pipelineSlug }}
          </SheetDescription>
        </SheetHeader>

        <div class="flex-1 space-y-4 overflow-y-auto p-4">
          <!-- Detection summary — the headline for a complete detection -->
          <div
            v-if="hasDetection"
            class="flex items-center gap-2.5 rounded-lg border border-border/50 bg-muted/30 px-4 py-3"
          >
            <ScanSearch :size="18" class="shrink-0 text-muted-foreground" />
            <span v-if="auditLoading" class="text-sm text-muted-foreground">
              {{ t("workflows.detections.detail.detectionLoading") }}
            </span>
            <span v-else-if="auditFailed" class="text-sm text-muted-foreground">
              {{ t("workflows.detections.detail.detectionUnavailable") }}
            </span>
            <span v-else class="text-sm font-medium text-foreground">
              {{ t("workflows.detections.detail.detections", { count }) }}
            </span>
          </div>

          <!-- Detection — status, trigger, who -->
          <dl class="rounded-lg border border-border/50 text-sm">
            <div class="flex items-center justify-between gap-4 px-4 py-2.5">
              <dt class="text-muted-foreground">
                {{ t("workflows.detections.detail.status") }}
              </dt>
              <dd>
                <Badge :variant="detection.status === 'failed' ? 'destructive' : 'secondary'">
                  {{ t("workflows.detections.detectionStatus." + detection.status) }}
                </Badge>
              </dd>
            </div>
            <div
              class="flex items-center justify-between gap-4 border-t border-border/50 px-4 py-2.5"
            >
              <dt class="text-muted-foreground">
                {{ t("workflows.detections.detail.trigger") }}
              </dt>
              <dd class="flex items-center gap-1.5 font-medium text-foreground">
                <User
                  v-if="detection.triggerType === 'user'"
                  :size="14"
                  class="text-muted-foreground"
                />
                <Cog v-else :size="14" class="text-muted-foreground" />
                {{ t("workflows.detections.triggerType." + detection.triggerType) }}
              </dd>
            </div>
            <div
              class="flex items-center justify-between gap-4 border-t border-border/50 px-4 py-2.5"
            >
              <dt class="text-muted-foreground">
                {{ t("workflows.detections.triggeredBy") }}
              </dt>
              <dd class="flex min-w-0 items-center gap-2 font-medium text-foreground">
                <EntityAvatar
                  size="sm"
                  :name="personLabel(detection.triggeredBy)"
                  :src="triggeredByAvatar"
                />
                <span class="truncate">{{ personLabel(detection.triggeredBy) }}</span>
              </dd>
            </div>
          </dl>

          <!-- Timing -->
          <dl class="rounded-lg border border-border/50 text-sm">
            <div class="flex items-center justify-between gap-4 px-4 py-2.5">
              <dt class="text-muted-foreground">
                {{ t("workflows.detections.detail.started") }}
              </dt>
              <dd class="font-medium text-foreground">
                {{ formatDateTime(detection.startedAt) }}
              </dd>
            </div>
            <div
              class="flex items-center justify-between gap-4 border-t border-border/50 px-4 py-2.5"
            >
              <dt class="text-muted-foreground">
                {{ t("workflows.detections.detail.completed") }}
              </dt>
              <dd class="font-medium text-foreground">
                {{
                  detection.completedAt
                    ? formatDateTime(detection.completedAt)
                    : t("workflows.detections.detail.none")
                }}
              </dd>
            </div>
            <div
              class="flex items-center justify-between gap-4 border-t border-border/50 px-4 py-2.5"
            >
              <dt class="text-muted-foreground">
                {{ t("workflows.detections.detail.duration") }}
              </dt>
              <dd class="font-medium text-foreground">
                <template v-if="detection.completedAt">
                  {{ formatDuration(detection.startedAt, detection.completedAt) }}
                </template>
                <span v-else class="text-muted-foreground">
                  {{ t("workflows.detections.detail.running") }}
                </span>
              </dd>
            </div>
          </dl>

          <!-- Input file -->
          <dl class="rounded-lg border border-border/50 text-sm">
            <div class="flex items-center justify-between gap-4 px-4 py-2.5">
              <dt class="shrink-0 text-muted-foreground">
                {{ t("workflows.detections.detail.input") }}
              </dt>
              <dd class="min-w-0 truncate font-medium text-foreground">
                {{ inputFileLabel }}
              </dd>
            </div>
          </dl>

          <!-- Error -->
          <div
            v-if="detection.error"
            class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {{ detection.error }}
          </div>

          <!-- Identifiers & tags -->
          <dl class="rounded-lg border border-border/50 text-sm">
            <div class="flex items-center justify-between gap-4 px-4 py-2.5">
              <dt class="text-muted-foreground">
                {{ t("workflows.detections.detail.detectionId") }}
              </dt>
              <dd class="flex min-w-0 items-center gap-1.5">
                <span class="truncate font-mono text-xs text-foreground">
                  {{ detection.id }}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-6 shrink-0"
                  :aria-label="t('workflows.detections.detail.copy')"
                  @click="copyDetectionId"
                >
                  <Check v-if="copied" :size="14" class="text-emerald-500" />
                  <Copy v-else :size="14" />
                </Button>
              </dd>
            </div>
            <div
              v-if="tags.length"
              class="flex items-start justify-between gap-4 border-t border-border/50 px-4 py-2.5"
            >
              <dt class="shrink-0 text-muted-foreground">
                {{ t("workflows.detections.detail.tags") }}
              </dt>
              <dd class="flex flex-wrap justify-end gap-1">
                <Badge v-for="tag in tags" :key="tag" variant="secondary">
                  {{ tag }}
                </Badge>
              </dd>
            </div>
          </dl>
        </div>

        <SheetFooter class="border-t border-border/50">
          <Button class="w-full" @click="openInStudio">
            <ExternalLink :size="16" class="mr-2" />
            {{ t("workflows.detections.openInStudio") }}
          </Button>
          <!-- Audit download is only meaningful once the detection is complete. -->
          <div v-if="hasDetection" class="flex items-center gap-2">
            <Button
              variant="outline"
              class="flex-1"
              @click="downloadAudit('json')"
            >
              <FileJson :size="16" class="mr-2" />
              {{ t("workflows.detections.detail.downloadJson") }}
            </Button>
            <Button
              variant="outline"
              class="flex-1"
              @click="downloadAudit('csv')"
            >
              <FileSpreadsheet :size="16" class="mr-2" />
              {{ t("workflows.detections.detail.downloadCsv") }}
            </Button>
          </div>
        </SheetFooter>
      </template>
    </SheetContent>
  </Sheet>
</template>
