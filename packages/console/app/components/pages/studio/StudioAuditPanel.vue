<script setup lang="ts">
import type { Audit, PipelineRun } from "@nvisy/sdk/datatypes";
import {
	Loader2,
	Play,
	RotateCcw,
	ScanSearch,
	TriangleAlert,
} from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";
import type { TextEntityView } from "#console/composables/useTextEntities";

const { t } = useI18n();

const props = defineProps<{
	/** The active file's id, or null when nothing is open. */
	fileId: string | null;
	/** Entity currently focused (from a highlight click), for row highlighting. */
	activeEntityId?: string | null;
}>();

const emit = defineEmits<{
	/** Detected entities, surfaced so the document overlay can highlight them. */
	"update:entities": [entities: TextEntityView[]];
	/** A row was clicked — focus its span in the document. */
	"focus-entity": [id: string];
}>();

const { pipelines } = usePipelines();
const { runDetection, findLatestRunForFile, getDetections } = useRuns();

const selectedPipeline = ref<string>("");
// Default to the first pipeline once they load.
watch(pipelines, (list) => {
	if (!selectedPipeline.value && list?.length) {
		selectedPipeline.value = list[0]!.slug;
	}
});

type Phase = "idle" | "restoring" | "running" | "analyzed" | "failed";
const phase = ref<Phase>("idle");
// True when the shown audit came from a prior run (restored on file open)
// rather than a run started in this session.
const restored = ref(false);
const runStatus = ref<PipelineRun["status"] | null>(null);
const audit = ref<Audit | null>(null);
const errorMessage = ref("");

const { entities, groups, count } = useTextEntities(audit);
// Surface entities to the parent whenever they change.
watch(entities, (list) => emit("update:entities", list), { immediate: true });

const canRun = computed(
	() =>
		!!props.fileId &&
		!!selectedPipeline.value &&
		phase.value !== "running" &&
		phase.value !== "restoring",
);

async function run() {
	if (!props.fileId || !selectedPipeline.value) return;
	phase.value = "running";
	runStatus.value = "queued";
	restored.value = false;
	errorMessage.value = "";
	audit.value = null;
	try {
		const result = await runDetection(
			selectedPipeline.value,
			{ fileId: props.fileId },
			(status) => {
				runStatus.value = status;
			},
		);
		audit.value = result.audit;
		phase.value = "analyzed";
	} catch (err) {
		phase.value = "failed";
		errorMessage.value = getErrorMessage(err, t("studio.audit.runFailed"));
	}
}

// On file change, clear the old audit and try to restore the file's most recent
// run — its detections still live on the server even if the tab was closed.
watch(
	() => props.fileId,
	async (fileId) => {
		phase.value = "idle";
		runStatus.value = null;
		restored.value = false;
		errorMessage.value = "";
		audit.value = null;
		if (!fileId) return;

		phase.value = "restoring";
		try {
			const latest = await findLatestRunForFile(fileId);
			// Bail if the user switched files while this was in flight, or the run
			// state moved on (a fresh run may have started here meanwhile).
			if (props.fileId !== fileId || phase.value !== "restoring") return;
			if (!latest) {
				phase.value = "idle";
				return;
			}
			const restoredAudit = await getDetections(latest.id);
			if (props.fileId !== fileId || phase.value !== "restoring") return;
			audit.value = restoredAudit;
			runStatus.value = latest.status;
			restored.value = true;
			phase.value = "analyzed";
			if (pipelines.value?.some((p) => p.slug === latest.pipelineSlug)) {
				selectedPipeline.value = latest.pipelineSlug;
			}
		} catch {
			// Restore is best-effort; fall back to the idle state.
			if (props.fileId === fileId && phase.value === "restoring") {
				phase.value = "idle";
			}
		}
	},
	{ immediate: true },
);

const confidencePct = (c: number) => `${Math.round(c * 100)}%`;
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Run controls -->
    <div class="space-y-2.5 border-b border-border/50 bg-muted/30 p-3">
      <div class="flex items-center gap-2">
        <Select
          v-model="selectedPipeline"
          :disabled="phase === 'running'"
        >
          <SelectTrigger class="h-9 min-w-0 flex-1 text-sm">
            <SelectValue :placeholder="t('studio.audit.pipelinePlaceholder')" />
          </SelectTrigger>
          <SelectContent>
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

        <Button
          size="icon"
          class="size-9 shrink-0"
          :disabled="!canRun"
          :title="
            phase === 'analyzed' ? t('studio.audit.runAgain') : t('studio.audit.run')
          "
          @click="run"
        >
          <Loader2 v-if="phase === 'running'" :size="16" class="animate-spin" />
          <RotateCcw v-else-if="phase === 'analyzed'" :size="16" />
          <Play v-else :size="16" />
        </Button>
      </div>

      <!-- Status line -->
      <p
        v-if="phase === 'restoring'"
        class="flex items-center gap-1.5 px-0.5 text-xs text-muted-foreground"
      >
        <Loader2 :size="12" class="animate-spin" />
        {{ t("studio.audit.restoring") }}
      </p>
      <p
        v-else-if="phase === 'running'"
        class="px-0.5 text-xs text-muted-foreground"
      >
        {{ t(`studio.audit.status.${runStatus ?? "queued"}`) }}
      </p>
      <p
        v-else-if="phase === 'analyzed'"
        class="px-0.5 text-xs text-muted-foreground"
      >
        {{ t("studio.audit.found", { count }) }}
        <span v-if="restored">· {{ t("studio.audit.fromLastRun") }}</span>
      </p>
    </div>

    <!-- Body -->
    <div class="min-h-0 flex-1 overflow-y-auto">
      <!-- Error -->
      <div
        v-if="phase === 'failed'"
        class="m-3 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3"
      >
        <TriangleAlert :size="16" class="mt-0.5 shrink-0 text-destructive" />
        <p class="text-xs text-destructive">{{ errorMessage }}</p>
      </div>

      <!-- Restoring a previous run -->
      <div
        v-else-if="phase === 'restoring'"
        class="flex h-full items-center justify-center"
      >
        <Loader2 :size="24" class="animate-spin text-muted-foreground" />
      </div>

      <!-- Idle / no file -->
      <div
        v-else-if="phase === 'idle'"
        class="flex h-full flex-col items-center justify-center px-6 text-center"
      >
        <div
          class="mb-3 flex size-10 items-center justify-center rounded-lg bg-muted/50"
        >
          <ScanSearch :size="20" class="text-muted-foreground" />
        </div>
        <p class="mb-1 text-sm text-foreground">
          {{ fileId ? t("studio.audit.idleTitle") : t("studio.audit.noFile") }}
        </p>
        <p class="text-xs text-muted-foreground">
          {{ fileId ? t("studio.audit.idleHint") : t("studio.audit.noFileHint") }}
        </p>
      </div>

      <!-- Empty (analyzed, nothing found) -->
      <div
        v-else-if="phase === 'analyzed' && count === 0"
        class="flex h-full flex-col items-center justify-center px-6 text-center"
      >
        <p class="mb-1 text-sm text-foreground">
          {{ t("studio.audit.emptyTitle") }}
        </p>
        <p class="text-xs text-muted-foreground">
          {{ t("studio.audit.emptyHint") }}
        </p>
      </div>

      <!-- Grouped entity list -->
      <template v-else-if="phase === 'analyzed'">
        <div v-for="group in groups" :key="group.label">
          <div
            class="flex items-center gap-2 px-3 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            <span class="font-mono normal-case tracking-normal">
              {{ group.label }}
            </span>
            <span class="ml-auto font-semibold">{{ group.items.length }}</span>
          </div>
          <button
            v-for="entity in group.items"
            :key="entity.id"
            type="button"
            class="flex w-full items-center gap-2.5 border-l-2 px-3 py-2 text-left transition-colors hover:bg-muted/40"
            :class="
              activeEntityId === entity.id
                ? 'border-foreground bg-muted'
                : 'border-transparent'
            "
            @click="emit('focus-entity', entity.id)"
          >
            <span
              class="h-5 w-2 shrink-0 rounded-sm bg-muted-foreground/40"
            />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-xs text-muted-foreground">
                {{ t("studio.audit.bytes", { start: entity.start, end: entity.end }) }}
              </span>
            </span>
            <span
              class="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground"
            >
              {{ confidencePct(entity.confidence) }}
            </span>
          </button>
        </div>
      </template>
    </div>

    <!-- Apply redaction (deferred: detection only for now) -->
    <div
      v-if="phase === 'analyzed' && count > 0"
      class="border-t border-border/50 bg-muted/30 p-3"
    >
      <Button variant="outline" size="sm" class="w-full" disabled>
        {{ t("studio.audit.apply") }}
      </Button>
    </div>
  </div>
</template>
