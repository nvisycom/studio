<script setup lang="ts">
import {
	ArrowUpFromLine,
	Download,
	Loader2,
	Play,
	RotateCcw,
} from "@lucide/vue";
import type { StudioDetectionPhase } from "#console/composables/useStudioDetection";
import type {
	RedactionOutput,
	StudioRedactPhase,
} from "#console/composables/useStudioRedaction";
import { Button } from "#console/components/ui/button";

/**
 * The floating controls bar for the full-screen audit review: a run/re-run
 * button on the left (reusing the Detect tab's configured source) and redaction
 * actions (apply, then download/export) on the right — all the inspector's
 * controls in one bar so the collapsed inspector isn't missed. Floats centered
 * at the bottom of the wide table.
 */
const props = defineProps<{
	phase: StudioDetectionPhase;
	canRun: boolean;
	redactPhase?: StudioRedactPhase;
	canRedact?: boolean;
	redactError?: string;
	output?: RedactionOutput | null;
	count: number;
	effectiveRedactCount?: number;
}>();

const emit = defineEmits<{
	run: [];
	redact: [];
	"download-output": [];
	"export-output": [];
}>();

const { t } = useI18n();

// How many entities the "Apply" button will redact (excludes kept ones).
const applyCount = computed(() => props.effectiveRedactCount ?? props.count);
// Redaction actions only apply once there's a completed detection to redact.
const showRedaction = computed(() => props.phase === "complete");
</script>

<template>
  <div
    class="flex items-center gap-2 rounded-xl border border-border/60 bg-background/95 p-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80"
  >
    <!-- Detection: run (or re-run) with the Detect tab's configured source. -->
    <Button
      size="sm"
      class="h-8 shrink-0"
      :disabled="!canRun"
      @click="emit('run')"
    >
      <Loader2 v-if="phase === 'running'" :size="16" class="animate-spin" />
      <RotateCcw v-else-if="phase === 'complete'" :size="16" />
      <Play v-else :size="16" />
      {{ phase === "complete" ? t("studio.audit.runAgain") : t("studio.audit.run") }}
    </Button>

    <!-- Redaction: apply, then download / export the output. -->
    <template v-if="showRedaction">
      <div class="mx-1 h-6 w-px shrink-0 bg-border/60" />
      <template v-if="redactPhase === 'done' && output">
        <Button
          size="sm"
          class="h-8 shrink-0"
          :title="output.fileName"
          @click="emit('download-output')"
        >
          <Download :size="15" />
          {{ t("studio.audit.download") }}
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="h-8 shrink-0"
          @click="emit('export-output')"
        >
          <ArrowUpFromLine :size="15" />
          {{ t("studio.audit.export") }}
        </Button>
      </template>
      <Button
        v-else
        size="sm"
        class="h-8 shrink-0"
        :disabled="!canRedact || applyCount === 0"
        @click="emit('redact')"
      >
        <Loader2
          v-if="redactPhase === 'redacting'"
          :size="15"
          class="animate-spin"
        />
        {{
          redactPhase === "redacting"
            ? t("studio.audit.redacting")
            : redactPhase === "failed"
              ? t("studio.audit.retryRedaction")
              : applyCount < count
                ? t("studio.audit.applyCount", { n: applyCount, total: count })
                : t("studio.audit.apply")
        }}
      </Button>
    </template>
  </div>
</template>
