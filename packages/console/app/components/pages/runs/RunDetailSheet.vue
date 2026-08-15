<script setup lang="ts">
import type { Audit, PipelineRun } from "@nvisy/sdk/datatypes";
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

const props = defineProps<{ run: PipelineRun | null }>();
const open = defineModel<boolean>("open", { required: true });

const emit = defineEmits<{
	"open-in-studio": [fileId: string];
	"download-audit": [runId: string, format: "json" | "csv"];
}>();

const { getDetections } = useRuns();
const { resolveAvatarUrl } = useAvatarUrl();

/** Title falls back to the file id when the display name was pruned. */
const inputFileLabel = computed(() =>
	props.run ? props.run.inputFileName || props.run.inputFileId : "",
);

const triggeredByAvatar = computed(() =>
	resolveAvatarUrl(props.run?.triggeredBy.avatarUrl),
);

const tags = computed<string[]>(() => props.run?.metadata.tags ?? []);

/** Detection is only available once a run reaches analyzed/completed. */
const hasDetection = computed(
	() => props.run?.status === "analyzed" || props.run?.status === "completed",
);

const audit = ref<Audit | null>(null);
const auditLoading = ref(false);
const auditFailed = ref(false);

const { count } = useTextEntities(audit);

/** Fetch the audit once the sheet opens for a run that has one. */
watch(
	[open, () => props.run],
	async ([isOpen, run]) => {
		audit.value = null;
		auditFailed.value = false;
		auditLoading.value = false;
		if (!isOpen || !run) return;
		if (run.status !== "analyzed" && run.status !== "completed") return;

		auditLoading.value = true;
		try {
			audit.value = await getDetections(run.id);
		} catch {
			auditFailed.value = true;
		} finally {
			auditLoading.value = false;
		}
	},
	{ immediate: true },
);

const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | undefined;

async function copyRunId() {
	if (!props.run) return;
	await navigator.clipboard.writeText(props.run.id);
	copied.value = true;
	toast(t("workflows.runs.detail.copied"));
	clearTimeout(copyTimer);
	copyTimer = setTimeout(() => {
		copied.value = false;
	}, 1500);
}

onBeforeUnmount(() => clearTimeout(copyTimer));

function openInStudio() {
	if (props.run) emit("open-in-studio", props.run.inputFileId);
}

function downloadAudit(format: "json" | "csv") {
	if (props.run) emit("download-audit", props.run.id, format);
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      side="right"
      class="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
    >
      <template v-if="run">
        <SheetHeader class="border-b border-border/50">
          <SheetTitle class="truncate">{{ inputFileLabel }}</SheetTitle>
          <SheetDescription class="font-mono">
            {{ run.pipelineSlug }}
          </SheetDescription>
        </SheetHeader>

        <div class="flex-1 space-y-4 overflow-y-auto p-4">
          <!-- Detection summary — the headline for a finished run -->
          <div
            v-if="hasDetection"
            class="flex items-center gap-2.5 rounded-lg border border-border/50 bg-muted/30 px-4 py-3"
          >
            <ScanSearch :size="18" class="shrink-0 text-muted-foreground" />
            <span v-if="auditLoading" class="text-sm text-muted-foreground">
              {{ t("workflows.runs.detail.detectionLoading") }}
            </span>
            <span v-else-if="auditFailed" class="text-sm text-muted-foreground">
              {{ t("workflows.runs.detail.detectionUnavailable") }}
            </span>
            <span v-else class="text-sm font-medium text-foreground">
              {{ t("workflows.runs.detail.detections", { count }) }}
            </span>
          </div>

          <!-- Run — status, trigger, who -->
          <dl class="rounded-lg border border-border/50 text-sm">
            <div class="flex items-center justify-between gap-4 px-4 py-2.5">
              <dt class="text-muted-foreground">
                {{ t("workflows.runs.detail.status") }}
              </dt>
              <dd>
                <Badge :variant="run.status === 'failed' ? 'destructive' : 'secondary'">
                  {{ t("workflows.runs.runStatus." + run.status) }}
                </Badge>
              </dd>
            </div>
            <div
              class="flex items-center justify-between gap-4 border-t border-border/50 px-4 py-2.5"
            >
              <dt class="text-muted-foreground">
                {{ t("workflows.runs.detail.trigger") }}
              </dt>
              <dd class="flex items-center gap-1.5 font-medium text-foreground">
                <User
                  v-if="run.triggerType === 'user'"
                  :size="14"
                  class="text-muted-foreground"
                />
                <Cog v-else :size="14" class="text-muted-foreground" />
                {{ t("workflows.runs.triggerType." + run.triggerType) }}
              </dd>
            </div>
            <div
              class="flex items-center justify-between gap-4 border-t border-border/50 px-4 py-2.5"
            >
              <dt class="text-muted-foreground">
                {{ t("workflows.runs.triggeredBy") }}
              </dt>
              <dd class="flex min-w-0 items-center gap-2 font-medium text-foreground">
                <EntityAvatar
                  size="sm"
                  :name="personLabel(run.triggeredBy)"
                  :src="triggeredByAvatar"
                />
                <span class="truncate">{{ personLabel(run.triggeredBy) }}</span>
              </dd>
            </div>
          </dl>

          <!-- Timing -->
          <dl class="rounded-lg border border-border/50 text-sm">
            <div class="flex items-center justify-between gap-4 px-4 py-2.5">
              <dt class="text-muted-foreground">
                {{ t("workflows.runs.detail.started") }}
              </dt>
              <dd class="font-medium text-foreground">
                {{ formatDateTime(run.startedAt) }}
              </dd>
            </div>
            <div
              class="flex items-center justify-between gap-4 border-t border-border/50 px-4 py-2.5"
            >
              <dt class="text-muted-foreground">
                {{ t("workflows.runs.detail.completed") }}
              </dt>
              <dd class="font-medium text-foreground">
                {{
                  run.completedAt
                    ? formatDateTime(run.completedAt)
                    : t("workflows.runs.detail.none")
                }}
              </dd>
            </div>
            <div
              class="flex items-center justify-between gap-4 border-t border-border/50 px-4 py-2.5"
            >
              <dt class="text-muted-foreground">
                {{ t("workflows.runs.detail.duration") }}
              </dt>
              <dd class="font-medium text-foreground">
                <template v-if="run.completedAt">
                  {{ formatDuration(run.startedAt, run.completedAt) }}
                </template>
                <span v-else class="text-muted-foreground">
                  {{ t("workflows.runs.detail.running") }}
                </span>
              </dd>
            </div>
          </dl>

          <!-- Files -->
          <dl class="rounded-lg border border-border/50 text-sm">
            <div class="flex items-center justify-between gap-4 px-4 py-2.5">
              <dt class="shrink-0 text-muted-foreground">
                {{ t("workflows.runs.detail.input") }}
              </dt>
              <dd class="min-w-0 truncate font-medium text-foreground">
                {{ inputFileLabel }}
              </dd>
            </div>
            <div
              class="flex items-center justify-between gap-4 border-t border-border/50 px-4 py-2.5"
            >
              <dt class="shrink-0 text-muted-foreground">
                {{ t("workflows.runs.detail.output") }}
              </dt>
              <dd class="min-w-0 truncate font-medium text-foreground">
                {{ run.outputFileName || t("workflows.runs.detail.none") }}
              </dd>
            </div>
          </dl>

          <!-- Error -->
          <div
            v-if="run.error"
            class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {{ run.error }}
          </div>

          <!-- Identifiers & tags -->
          <dl class="rounded-lg border border-border/50 text-sm">
            <div class="flex items-center justify-between gap-4 px-4 py-2.5">
              <dt class="text-muted-foreground">
                {{ t("workflows.runs.detail.runId") }}
              </dt>
              <dd class="flex min-w-0 items-center gap-1.5">
                <span class="truncate font-mono text-xs text-foreground">
                  {{ run.id }}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-6 shrink-0"
                  :aria-label="t('workflows.runs.detail.copy')"
                  @click="copyRunId"
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
                {{ t("workflows.runs.detail.tags") }}
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
            {{ t("workflows.runs.openInStudio") }}
          </Button>
          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              class="flex-1"
              @click="downloadAudit('json')"
            >
              <FileJson :size="16" class="mr-2" />
              {{ t("workflows.runs.detail.downloadJson") }}
            </Button>
            <Button
              variant="outline"
              class="flex-1"
              @click="downloadAudit('csv')"
            >
              <FileSpreadsheet :size="16" class="mr-2" />
              {{ t("workflows.runs.detail.downloadCsv") }}
            </Button>
          </div>
        </SheetFooter>
      </template>
    </SheetContent>
  </Sheet>
</template>
