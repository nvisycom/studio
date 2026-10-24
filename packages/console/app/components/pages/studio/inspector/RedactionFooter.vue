<script setup lang="ts">
import {
	ArrowUpFromLine,
	Download,
	Loader2,
	Scissors,
	TriangleAlert,
} from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import type { StudioDetectionPhase } from "#console/composables/studio/useStudioDetection";
import type {
	RedactionOutput,
	StudioRedactPhase,
} from "#console/composables/studio/useStudioRedaction";

/**
 * The redaction action bar, always pinned to the bottom of the Audit tab (like
 * the Detect tab's Run and the Review tab's CTA). Apply redaction on a completed
 * detection, then download or export the redacted output. Until there's a
 * completed detection with something to redact, the primary button is disabled.
 */
const props = defineProps<{
	/** The detection lifecycle phase, so the bar can disable itself until a
	 *  detection has completed. */
	phase?: StudioDetectionPhase;
	/** Redaction lifecycle for the complete detection. */
	redactPhase?: StudioRedactPhase;
	/** Whether redaction can be applied right now (complete, not in flight). */
	canRedact?: boolean;
	/** Failure message shown when redaction failed. */
	redactError?: string;
	/** The redacted output produced by redaction, once done. */
	output?: RedactionOutput | null;
	/** Total entity count. */
	count: number;
	/** How many entities the redaction will actually redact (total minus kept). */
	effectiveRedactCount?: number;
}>();

const emit = defineEmits<{
	/** Apply redaction to the complete detection. */
	redact: [];
	/** Download the redacted output file. */
	"download-output": [];
	/** Export the redacted output file to a file-service connection. */
	"export-output": [];
}>();

const { t } = useI18n();

// How many entities the "Apply" button will redact (excludes kept ones).
const applyCount = computed(() => props.effectiveRedactCount ?? props.count);

// There's something to redact only once a detection has completed with at least
// one entity to act on; until then the primary button stays present but disabled.
const hasRedactable = computed(
	() => props.phase === "complete" && applyCount.value > 0,
);

// The disabled primary's label reflects why it's not actionable: no detection yet
// vs. a completed detection with nothing to redact.
const idleLabel = computed(() =>
	props.phase === "complete"
		? t("studio.audit.nothingToRedact")
		: t("studio.audit.runFirst"),
);
</script>

<template>
  <div class="border-t border-border/50 bg-muted/30 p-3">
    <!-- Redaction failed: show why, keep the button available to retry. -->
    <p
      v-if="redactPhase === 'failed' && redactError"
      class="mb-2 flex items-start gap-1.5 text-xs text-destructive"
    >
      <TriangleAlert :size="13" class="mt-px shrink-0" />
      <span>{{ redactError }}</span>
    </p>

    <!-- Done: the redacted file is ready to download or export. -->
    <template v-if="redactPhase === 'done' && output">
      <div class="flex gap-2">
        <Button size="sm" class="flex-1" @click="emit('download-output')">
          <Download :size="15" />
          {{ t("studio.audit.downloadRedacted") }}
        </Button>
        <Button
          variant="outline"
          size="sm"
          :title="t('studio.audit.exportRedacted')"
          :aria-label="t('studio.audit.exportRedacted')"
          @click="emit('export-output')"
        >
          <ArrowUpFromLine :size="15" />
        </Button>
      </div>
      <p class="mt-1.5 truncate text-center text-[11px] text-muted-foreground">
        {{ output.fileName }}
      </p>
    </template>

    <!-- Idle / redacting / failed: apply (or retry) redaction. Styled like the
         "Run detection" primary button so the two steps read as a pair, and kept
         present-but-disabled until a detection has completed. The count reflects
         reviewer edits — kept (suppressed) entities are excluded. -->
    <Button
      v-else
      class="w-full gap-2"
      :disabled="!hasRedactable || !canRedact"
      @click="emit('redact')"
    >
      <Loader2
        v-if="redactPhase === 'redacting'"
        :size="16"
        class="animate-spin"
      />
      <Scissors v-else :size="16" />
      {{
        !hasRedactable
          ? idleLabel
          : redactPhase === "redacting"
            ? t("studio.audit.redacting")
            : redactPhase === "failed"
              ? t("studio.audit.retryRedaction")
              : applyCount < count
                ? t("studio.audit.applyCount", { n: applyCount, total: count })
                : t("studio.audit.apply")
      }}
    </Button>
  </div>
</template>
