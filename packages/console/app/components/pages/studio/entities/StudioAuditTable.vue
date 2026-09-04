<script setup lang="ts">
import {
	CornerUpRight,
	ScanSearch,
	Loader2,
	ChevronRight,
	Info,
} from "@lucide/vue";
import type {
	StudioCategorizedGroup,
	StudioEntityView,
} from "#console/composables/useStudioEntities";
import type {
	EntityCluster,
	CategorizedGroup,
} from "#console/composables/useEntities";
import type { StudioDetectionPhase } from "#console/composables/useStudioDetection";
import { Checkbox } from "#console/components/ui/checkbox";
import { formatTimecode } from "#console/utils/date";

/**
 * Full-screen review table for a completed detection's findings — the audit as a
 * readable, scannable ledger, shown when the audit takes the whole studio canvas.
 * The wide counterpart to {@link StudioAuditPanel} (the compact inspector list):
 * same data and redaction state, a denser layout built to review many findings at
 * once and act on them.
 *
 * A row is a finding cluster: a leading checkbox (checked = will be redacted; the
 * default), the label, the matched value, a confidence meter, and reveal-in-
 * document. Identical values collapse into one row with an occurrence count that
 * expands. Category headers carry a bulk checkbox to keep/redact a whole section.
 */
const { t } = useI18n();

const props = defineProps<{
	/** Detection lifecycle phase, driving which state the table shows. */
	phase: StudioDetectionPhase;
	/** Entities grouped into category → label → clusters (document order). */
	categorizedGroups: StudioCategorizedGroup[];
	/** Total entity count. */
	count: number;
	/** Failure message shown when the detection failed. */
	errorMessage?: string;
	/** Ids of entities the reviewer kept (suppressed), for rendering state. */
	suppressed?: Set<string>;
}>();

const emit = defineEmits<{
	/** Reveal a finding in the document (host exits full-screen, focuses it). */
	"reveal-entity": [id: string];
	/** Keep/redact toggle for one entity (suppress). */
	"toggle-suppress": [id: string];
	/** Open the full audit trail for an entity. */
	"view-details": [entity: StudioEntityView];
}>();

const isSuppressed = (id: string) => !!props.suppressed?.has(id);

// "Will redact" is the inverse of suppressed (kept). The checkbox reads as the
// action, so checked = redact.
const willRedact = (id: string) => !isSuppressed(id);

// Drive a set of entities to one redact/keep target (only toggling those that
// differ), so a cluster or a whole category moves together without flip-flopping.
function setRedact(entities: { id: string }[], redact: boolean) {
	for (const e of entities) {
		if (willRedact(e.id) !== redact) emit("toggle-suppress", e.id);
	}
}

// --- cluster state ------------------------------------------------------------
function clusterRedact(cluster: EntityCluster<StudioEntityView>): boolean {
	return cluster.items.some((e) => willRedact(e.id));
}
function clusterAllRedact(cluster: EntityCluster<StudioEntityView>): boolean {
	return cluster.items.every((e) => willRedact(e.id));
}
// Checkbox: checked when every occurrence will redact; indeterminate on a mix;
// toggling drives the whole cluster to redact unless it's already fully redacting.
function clusterChecked(
	cluster: EntityCluster<StudioEntityView>,
): boolean | "indeterminate" {
	if (clusterAllRedact(cluster)) return true;
	if (clusterRedact(cluster)) return "indeterminate";
	return false;
}
function toggleCluster(cluster: EntityCluster<StudioEntityView>) {
	setRedact(cluster.items, !clusterAllRedact(cluster));
}

// --- category state (bulk) ----------------------------------------------------
function categoryEntities(
	group: CategorizedGroup<StudioEntityView>,
): StudioEntityView[] {
	return group.labels.flatMap((l) => l.items);
}
function categoryChecked(
	group: CategorizedGroup<StudioEntityView>,
): boolean | "indeterminate" {
	const items = categoryEntities(group);
	const redacting = items.filter((e) => willRedact(e.id)).length;
	if (redacting === 0) return false;
	if (redacting === items.length) return true;
	return "indeterminate";
}
function toggleCategory(group: CategorizedGroup<StudioEntityView>) {
	const items = categoryEntities(group);
	const allRedact = items.every((e) => willRedact(e.id));
	setRedact(items, !allRedact);
}

// --- expand duplicate occurrences --------------------------------------------
const expanded = ref<Set<string>>(new Set());
function toggleExpand(key: string) {
	const next = new Set(expanded.value);
	if (next.has(key)) next.delete(key);
	else next.add(key);
	expanded.value = next;
}

const confidencePct = (c: number) => `${Math.round(c * 100)}%`;

/**
 * Localized category name, falling back to the raw id for a custom category and
 * to "Uncategorized" when the label has no category.
 */
function categoryName(category: string | null): string {
	if (!category) return t("studio.audit.uncategorized");
	const key = `studio.audit.categories.${category}`;
	const localized = t(key);
	return localized === key ? category : localized;
}

/**
 * The value a finding shows. Text/tabular carry their matched value; an audio
 * span shows its timecodes; an image region has no text value, so it names itself.
 */
function findingValue(entity: StudioEntityView): string {
	if (entity.text) return entity.text;
	if (entity.modality === "audio") {
		return t("studio.audit.timeSpan", {
			start: formatTimecode(entity.span.start),
			end: formatTimecode(entity.span.end),
		});
	}
	if (entity.modality === "image") return t("studio.audit.imageRegion");
	return "";
}

// Whether the finding has an on-page location. Text entities detected only in
// metadata (e.g. a DOCX hyperlink target) can't be located — their value shows
// but the row can't reveal in the document. Image/audio always have a box/span.
function isLocatable(entity: StudioEntityView): boolean {
	return (
		entity.modality === "image" ||
		entity.modality === "audio" ||
		entity.locatable !== false
	);
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="min-h-0 flex-1 overflow-y-auto">
      <!-- Detection failed -->
      <div
        v-if="phase === 'failed'"
        class="mx-auto mt-10 flex max-w-md items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-4"
      >
        <ScanSearch :size="16" class="mt-0.5 shrink-0 text-destructive" />
        <p class="text-sm text-destructive">{{ errorMessage }}</p>
      </div>

      <!-- Running -->
      <div
        v-else-if="phase === 'running'"
        class="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground"
      >
        <Loader2 :size="28" class="animate-spin" />
        <p class="text-sm">{{ t("studio.audit.running") }}</p>
      </div>

      <!-- Complete but nothing found -->
      <div
        v-else-if="phase === 'complete' && count === 0"
        class="flex h-full flex-col items-center justify-center gap-2 px-6 text-center"
      >
        <ScanSearch :size="28" class="text-muted-foreground opacity-40" />
        <p class="mb-1 text-sm text-foreground">
          {{ t("studio.audit.emptyTitle") }}
        </p>
        <p class="text-xs text-muted-foreground">
          {{ t("studio.audit.emptyHint") }}
        </p>
      </div>

      <!-- Findings, grouped by category. A tight ledger: checkbox (will-redact) ·
           label · value · confidence meter · reveal. Duplicates collapse to one row
           with a count that expands. -->
      <div v-else class="mx-auto max-w-4xl px-6 py-6">
        <section
          v-for="group in categorizedGroups"
          :key="group.category ?? '__uncat__'"
          class="mb-6 last:mb-0"
        >
          <!-- Category header + bulk redact/keep -->
          <div
            class="mb-1 flex items-center gap-2.5 border-b border-border/60 pb-1.5"
          >
            <Checkbox
              :model-value="categoryChecked(group)"
              :aria-label="t('studio.audit.redactCategory', { name: categoryName(group.category) })"
              @update:model-value="toggleCategory(group)"
            />
            <h2
              class="flex items-baseline gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
            >
              {{ categoryName(group.category) }}
              <span class="font-normal tabular-nums text-muted-foreground/60">
                {{ group.count }}
              </span>
            </h2>
          </div>

          <div class="divide-y divide-border/40">
            <template v-for="labelGroup in group.labels" :key="labelGroup.label">
              <template v-for="cluster in labelGroup.clusters" :key="cluster.lead.id">
                <!-- Cluster row -->
                <div
                  class="group/row flex items-center gap-3 py-2"
                  :class="clusterAllRedact(cluster) ? '' : 'opacity-60'"
                >
                  <Checkbox
                    :model-value="clusterChecked(cluster)"
                    :aria-label="
                      clusterAllRedact(cluster)
                        ? t('studio.audit.keep')
                        : t('studio.audit.redactThis')
                    "
                    @update:model-value="toggleCluster(cluster)"
                  />

                  <!-- Label — fixed column, wraps rather than truncating so long
                       names show in full. -->
                  <span
                    class="w-40 shrink-0 font-mono text-xs uppercase tracking-wide text-muted-foreground"
                  >
                    {{ labelGroup.name }}
                  </span>

                  <!-- Value (+ a metadata marker when it isn't in the visible
                       body, e.g. a DOCX hyperlink target — can't be revealed). The
                       badge sits after the value inside its own min-w-0 area, so it
                       never pushes the confidence column. -->
                  <div class="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      class="min-w-0 truncate text-sm text-foreground"
                      :class="clusterAllRedact(cluster) ? '' : 'line-through'"
                      :title="findingValue(cluster.lead)"
                    >
                      {{ findingValue(cluster.lead) }}
                    </span>
                    <span
                      v-if="!isLocatable(cluster.lead)"
                      class="shrink-0 rounded bg-muted-foreground/15 px-1 py-px text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      {{ t("studio.audit.metadata") }}
                    </span>
                  </div>

                  <!-- Occurrence count → expands -->
                  <button
                    v-if="cluster.items.length > 1"
                    type="button"
                    class="flex shrink-0 items-center gap-0.5 rounded px-1 text-xs tabular-nums text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    :aria-expanded="expanded.has(cluster.lead.id)"
                    :aria-label="t('studio.audit.occurrences', { n: cluster.items.length })"
                    @click="toggleExpand(cluster.lead.id)"
                  >
                    <ChevronRight
                      :size="12"
                      class="transition-transform"
                      :class="expanded.has(cluster.lead.id) ? 'rotate-90' : ''"
                    />
                    ×{{ cluster.items.length }}
                  </button>

                  <!-- Confidence -->
                  <span
                    class="w-9 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground/70"
                  >
                    {{ confidencePct(cluster.lead.confidence) }}
                  </span>

                  <!-- Details + reveal, revealed on hover/focus. -->
                  <div
                    class="flex shrink-0 items-center opacity-0 transition-opacity focus-within:opacity-100 group-hover/row:opacity-100"
                  >
                    <button
                      type="button"
                      class="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      :title="t('studio.audit.viewDetails')"
                      :aria-label="t('studio.audit.viewDetails')"
                      @click="emit('view-details', cluster.lead)"
                    >
                      <Info :size="14" />
                    </button>
                    <button
                      type="button"
                      class="rounded p-1 text-muted-foreground enabled:hover:bg-muted enabled:hover:text-foreground disabled:opacity-40"
                      :disabled="!isLocatable(cluster.lead)"
                      :title="t('studio.audit.revealInDocument')"
                      :aria-label="t('studio.audit.revealInDocument')"
                      @click="emit('reveal-entity', cluster.lead.id)"
                    >
                      <CornerUpRight :size="14" />
                    </button>
                  </div>
                </div>

                <!-- Expanded occurrences of this cluster -->
                <template v-if="expanded.has(cluster.lead.id)">
                  <div
                    v-for="item in cluster.items"
                    :key="item.id"
                    class="group/occ flex items-center gap-3 py-1.5 pl-7"
                    :class="willRedact(item.id) ? '' : 'opacity-60'"
                  >
                    <Checkbox
                      :model-value="willRedact(item.id)"
                      :aria-label="
                        willRedact(item.id)
                          ? t('studio.audit.keep')
                          : t('studio.audit.redactThis')
                      "
                      @update:model-value="setRedact([item], !willRedact(item.id))"
                    />
                    <span
                      class="min-w-0 flex-1 truncate text-xs text-muted-foreground"
                      :class="willRedact(item.id) ? '' : 'line-through'"
                    >
                      {{ findingValue(item) }}
                    </span>
                    <button
                      type="button"
                      class="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover/occ:opacity-100"
                      :title="t('studio.audit.revealInDocument')"
                      :aria-label="t('studio.audit.revealInDocument')"
                      @click="emit('reveal-entity', item.id)"
                    >
                      <CornerUpRight :size="13" />
                    </button>
                  </div>
                </template>
              </template>
            </template>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
