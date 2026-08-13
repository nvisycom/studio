<script setup lang="ts">
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

// Fired when the popover asks to close (outside click / Escape); the parent
// clears the active entity, which also drops the highlight ring.
const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();

const open = computed(() => !!props.entity && !!props.reference);

function onOpenChange(next: boolean) {
	if (!next) emit("close");
}
const confidencePct = computed(() =>
	props.entity ? `${Math.round(props.entity.confidence * 100)}%` : "",
);
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
      class="w-56 p-0"
      @open-auto-focus.prevent
    >
      <div v-if="entity" class="p-3">
        <p class="font-mono text-sm font-medium text-foreground">
          {{ entity.label }}
        </p>
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
          <div v-if="entity.source" class="flex justify-between gap-3">
            <dt class="shrink-0 text-muted-foreground">
              {{ t("studio.audit.detail.source") }}
            </dt>
            <dd class="truncate font-mono font-medium text-foreground">
              {{ entity.source }}
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
