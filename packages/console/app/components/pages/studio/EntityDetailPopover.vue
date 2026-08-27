<script setup lang="ts">
import { Eye, EyeOff } from "@lucide/vue";
import type { TextEntityView } from "#console/composables/useTextEntities";
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
} from "#console/components/ui/popover";

/**
 * A small detail card shown below the focused entity chip: its label,
 * confidence, and location (byte range for text, cell for tabular). Anchored to
 * the chip element (`reference`) so it floats just beneath the highlight.
 *
 * One instance per view, driven by the shared active entity — not one popover
 * per chip.
 */
const props = defineProps<{
	entity: TextEntityView | null;
	/** The focused chip's DOM element, used as the floating anchor. */
	reference: HTMLElement | null;
	/** Whether the CSV's first row is a header (matches the table + audit list). */
	withHeaders?: boolean;
}>();

const emit = defineEmits<{
	/** The popover asks to close (outside click / Escape); the parent clears the
	 * active entity, which also drops the highlight ring. */
	close: [];
	/** Keep/redact toggle for this entity (suppress it from the redaction). */
	"toggle-suppress": [id: string];
}>();

const { t } = useI18n();

const open = computed(() => !!props.entity && !!props.reference);

// Keep (suppress) is offered for detected entities only — an entity the reviewer
// added lives in a separate list and is removed from its own panel section, not
// suppressed here.
const canSuppress = computed(() => !!props.entity && !props.entity.added);

function onOpenChange(next: boolean) {
	if (!next) emit("close");
}
const confidencePct = computed(() =>
	props.entity ? `${Math.round(props.entity.confidence * 100)}%` : "",
);

// "Detected by": the raw recognizer source. The pattern/model kind + name is
// surfaced separately by detectorRow, so this row shows the source itself.
const detectedBy = computed(() => props.entity?.source ?? "");

// The named pattern/model on its own row, labeled by kind, when present.
const detectorRow = computed(() => {
	const e = props.entity;
	if (!e?.detector || !e.detectorKind) return null;
	return {
		label:
			e.detectorKind === "pattern"
				? t("studio.audit.detail.pattern")
				: t("studio.audit.detail.model"),
		name: e.detector,
	};
});
const location = computed(() => {
	const e = props.entity;
	if (!e) return "";
	if (e.cell) {
		const n = e.cell.column + 1;
		const col =
			props.withHeaders && e.cell.columnName
				? t("studio.audit.colNamed", { n, name: e.cell.columnName })
				: t("studio.audit.colN", { n });
		// With a header row, data rows count from 1 (header is row 0); without,
		// every row counts, so the header-position row becomes row 1.
		const row = props.withHeaders ? e.cell.row : e.cell.row + 1;
		return t("studio.audit.cell", { column: col, row });
	}
	return t("studio.audit.bytes", { start: e.start, end: e.end });
});
</script>

<template>
  <Popover :open="open" @update:open="onOpenChange">
    <PopoverAnchor :reference="reference ?? undefined" />
    <PopoverContent
      side="bottom"
      align="start"
      :side-offset="6"
      class="w-64 p-0"
      @open-auto-focus.prevent
    >
      <div v-if="entity" class="p-3">
        <div class="flex items-center gap-2">
          <!-- Keep/redact toggle for a detected entity, leading the title. -->
          <button
            v-if="canSuppress"
            type="button"
            class="-ml-1 shrink-0 rounded p-1 hover:bg-muted-foreground/10"
            :class="entity.suppressed ? 'text-muted-foreground' : 'text-foreground/70'"
            :aria-label="
              entity.suppressed
                ? t('studio.audit.redactThis')
                : t('studio.audit.keep')
            "
            :title="
              entity.suppressed
                ? t('studio.audit.redactThis')
                : t('studio.audit.keep')
            "
            @click="emit('toggle-suppress', entity.id)"
          >
            <Eye v-if="entity.suppressed" :size="15" />
            <EyeOff v-else :size="15" />
          </button>
          <p class="min-w-0 flex-1 truncate font-mono text-sm font-medium text-foreground">
            {{ entity.label }}
          </p>
        </div>
        <dl class="mt-2 space-y-1.5 text-xs">
          <div class="flex justify-between gap-3">
            <dt class="shrink-0 text-muted-foreground">
              {{ t("studio.audit.detail.confidence") }}
            </dt>
            <dd class="font-medium tabular-nums text-foreground">
              {{ confidencePct }}
            </dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="shrink-0 text-muted-foreground">
              {{ t("studio.audit.detail.location") }}
            </dt>
            <dd class="truncate font-medium text-foreground">{{ location }}</dd>
          </div>
          <div v-if="detectedBy" class="flex justify-between gap-3">
            <dt class="shrink-0 text-muted-foreground">
              {{ t("studio.audit.detail.source") }}
            </dt>
            <dd class="truncate font-mono font-medium text-foreground">
              {{ detectedBy }}
            </dd>
          </div>
          <div v-if="detectorRow" class="flex justify-between gap-3">
            <dt class="shrink-0 text-muted-foreground">{{ detectorRow.label }}</dt>
            <dd class="truncate font-mono font-medium text-foreground">
              {{ detectorRow.name }}
            </dd>
          </div>
          <div v-if="entity.language" class="flex justify-between gap-3">
            <dt class="shrink-0 text-muted-foreground">
              {{ t("studio.audit.detail.language") }}
            </dt>
            <dd class="font-medium uppercase text-foreground">
              {{ entity.language }}
            </dd>
          </div>
        </dl>
      </div>
    </PopoverContent>
  </Popover>
</template>
