<script setup lang="ts">
import {
	ScanText,
	Brain,
	Layers,
	Swords,
	Flag,
	SlidersHorizontal,
	Wand2,
	EyeOff,
	Pencil,
	Circle,
} from "@lucide/vue";
import type { Component } from "vue";
import type { StudioEntityView } from "#console/composables/useStudioEntities";
import {
	Dialog,
	DialogScrollContent,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";

/**
 * A modal showing one entity's full audit trail — the tamper-evident, hash-linked
 * DAG of every event in its life: each recognition (pattern/model), fusion,
 * conflict/contest, calibration, refinement, the reviewer's manual overrides, and
 * the final redaction. Opened from the audit review when a reviewer wants the
 * detail behind a finding. Open when `entity` is non-null.
 */
const props = defineProps<{
	/** The entity whose trail to show, or null when the modal is closed. */
	entity: StudioEntityView | null;
}>();

const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();
const { labelName } = useLabels();

const open = computed(() => !!props.entity);
function onOpenChange(next: boolean) {
	if (!next) emit("close");
}

// Events oldest-first (birth → redaction), so the trail reads top-to-bottom in
// the order things happened. The SDK already orders them, but sort by timestamp
// defensively.
const events = computed(() => {
	const list = props.entity?.audit ?? [];
	return [...list].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
});

const confidencePct = (c: number) => `${Math.round(c * 100)}%`;

// Per-event kind: an icon + a human label + a one-line detail. The four
// modalities share this event shape, so this reads the common surface.
const KIND_ICON: Record<string, Component> = {
	pattern: ScanText,
	model: Brain,
	deduplication: Layers,
	conflict: Swords,
	contested: Flag,
	calibration: SlidersHorizontal,
	refinement: Wand2,
	redaction: EyeOff,
	selection: EyeOff,
	manual: Pencil,
};
function kindIcon(kind: string): Component {
	return KIND_ICON[kind] ?? Circle;
}
function kindLabel(kind: string): string {
	const key = `studio.audit.trail.kind.${kind}`;
	const localized = t(key);
	return localized === key ? kind : localized;
}

// A one-line detail for an event, by kind — the salient fact (pattern name, model,
// competing label, operator, the reviewer's rationale). Best-effort: the audit
// detail is broadly typed, so read narrowly and guarded.
// biome-ignore lint/suspicious/noExplicitAny: audit detail is a broad tagged union; we read a narrow, guarded slice per kind.
function eventDetail(kind: string, detail: any): string {
	switch (kind) {
		case "pattern":
			return detail?.pattern?.name ?? "";
		case "model":
			return [detail?.model?.name, detail?.model?.version]
				.filter(Boolean)
				.join(" ");
		case "deduplication":
			return detail?.strategy ?? "";
		case "conflict":
		case "contested":
			return detail?.competing_label
				? t("studio.audit.trail.competing", {
						label: labelName(detail.competing_label),
						confidence: confidencePct(detail.competing_confidence ?? 0),
					})
				: "";
		case "calibration":
			return detail?.factor != null ? `×${detail.factor}` : "";
		case "redaction":
		case "selection": {
			const op = detail?.operator;
			const opName = op ? [op.name, op.version].filter(Boolean).join(" ") : "";
			const cited =
				detail?.attribution?.kind === "cited"
					? `${detail.attribution.authority} ${detail.attribution.citation}`
					: detail?.attribution?.kind === "freeform"
						? detail.attribution.name
						: "";
			return [opName, cited].filter(Boolean).join(" · ");
		}
		case "manual":
			return detail?.intent
				? t(`studio.audit.trail.intent.${detail.intent}`)
				: "";
		default:
			return "";
	}
}

// Absolute + short relative time for each event.
function eventTime(ts: string): string {
	const d = new Date(ts);
	return Number.isNaN(d.getTime()) ? ts : d.toLocaleString();
}
</script>

<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogScrollContent class="max-w-lg">
      <!-- Header hierarchy: the value is the title (what's being inspected), the
           label a small eyebrow above it. Confidence isn't repeated here — every
           trail event below carries its own. The "kept" badge stays: it's the
           current review decision, not a per-event fact. -->
      <DialogHeader class="space-y-1 border-b border-border/60 pb-3">
        <span
          class="block font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground/80"
        >
          {{ entity ? labelName(entity.label) : "" }}
        </span>
        <div class="flex items-start gap-2 pr-6">
          <DialogTitle
            v-if="entity"
            class="block min-w-0 break-words text-left text-xl font-semibold tracking-tight text-foreground"
          >
            {{ entity.text }}
          </DialogTitle>
          <span
            v-if="entity?.suppressed"
            class="mt-1 shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
          >
            {{ t("studio.audit.trail.kept") }}
          </span>
        </div>
      </DialogHeader>

      <!-- The trail: a vertical timeline, oldest first. -->
      <ol
        v-if="events.length"
        class="relative space-y-4 pt-3 before:absolute before:bottom-2 before:left-[11px] before:top-4 before:w-px before:bg-border"
      >
        <li
          v-for="(event, i) in events"
          :key="event.hash ?? i"
          class="relative flex gap-3 pl-0"
        >
          <span
            class="relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground"
          >
            <component :is="kindIcon(event.kind.kind)" :size="13" />
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex items-baseline justify-between gap-2">
              <span class="text-sm font-medium text-foreground">
                {{ kindLabel(event.kind.kind) }}
              </span>
              <span
                class="shrink-0 text-[11px] tabular-nums text-muted-foreground/70"
              >
                {{ confidencePct(event.confidence) }}
              </span>
            </div>
            <p
              v-if="eventDetail(event.kind.kind, event.kind.detail)"
              class="truncate text-xs text-muted-foreground"
            >
              {{ eventDetail(event.kind.kind, event.kind.detail) }}
            </p>
            <p class="mt-0.5 text-[11px] text-muted-foreground/60">
              {{ event.source }} · {{ eventTime(event.timestamp) }}
            </p>
          </div>
        </li>
      </ol>

      <p v-else class="py-4 text-center text-sm text-muted-foreground">
        {{ t("studio.audit.trail.empty") }}
      </p>
    </DialogScrollContent>
  </Dialog>
</template>
