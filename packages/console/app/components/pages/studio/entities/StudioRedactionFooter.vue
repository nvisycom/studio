<script setup lang="ts">
import { ArrowUpFromLine, Download, Loader2, TriangleAlert } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import type {
	RedactionOutput,
	StudioRedactPhase,
} from "#console/composables/useStudioRedaction";

/**
 * The redaction action bar for a completed detection: apply redaction, then
 * download or export the redacted output. Shared by the inspector audit panel
 * and the full-screen audit review so the two never drift.
 */
const props = defineProps<{
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

    <!-- Idle / redacting / failed: apply (or retry) redaction. The count
         reflects reviewer edits — kept (suppressed) entities are excluded. -->
    <Button
      v-else
      variant="outline"
      size="sm"
      class="w-full"
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
  </div>
</template>
