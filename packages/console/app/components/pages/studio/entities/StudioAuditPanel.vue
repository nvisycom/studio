<script setup lang="ts">
import {
	ChevronRight,
	CornerUpRight,
	Download,
	Info,
	Loader2,
	Plus,
	ScanSearch,
	TriangleAlert,
	X,
} from "@lucide/vue";
import type { StudioDetectionPhase } from "#console/composables/useStudioDetection";
import type {
	RedactionOutput,
	StudioRedactPhase,
} from "#console/composables/useStudioRedaction";
import type {
	EntityCluster,
	CategorizedGroup,
} from "#console/composables/useEntities";
import type { TextEntityView } from "#console/composables/useTextEntities";
import type {
	StudioCategorizedGroup,
	StudioEntityView,
} from "#console/composables/useStudioEntities";
import { Button } from "#console/components/ui/button";
import { Checkbox } from "#console/components/ui/checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#console/components/ui/collapsible";

/**
 * The compact inspector audit list — the narrow-rail counterpart to
 * {@link StudioAuditTable} (the wide review), sharing its visual language: a
 * leading checkbox per row (checked = will be redacted, the default), a subtle
 * confidence, hover-revealed reveal/details actions, and identical values
 * collapsed into one row with an expandable occurrence count.
 *
 * Beyond the review table it also carries the reviewer's own function: a band for
 * entities added by hand, and the redaction footer (apply + download).
 */
const { t } = useI18n();

const props = defineProps<{
	/** The active file's id, or null when nothing is open. */
	fileId: string | null;
	/** Detection lifecycle phase, driving which state the list shows. */
	phase: StudioDetectionPhase;
	/** Detected entities (any modality), in document order. */
	entities: StudioEntityView[];
	/** Entities grouped into category → label → clusters. */
	categorizedGroups: StudioCategorizedGroup[];
	/** Total entity count. */
	count: number;
	/** Failure message shown when the detection failed. */
	errorMessage?: string;
	/** Entity currently focused (from a highlight click), for row highlighting. */
	activeEntityId?: string | null;
	/** Whether the open CSV treats row 0 as a header (affects tabular labels). */
	withHeaders?: boolean;
	/** Redaction lifecycle for the complete detection. */
	redactPhase?: StudioRedactPhase;
	/** Whether redaction can be applied right now (complete, not in flight). */
	canRedact?: boolean;
	/** Failure message shown when redaction failed. */
	redactError?: string;
	/** The redacted output produced by redaction, once done. */
	output?: RedactionOutput | null;
	/** Ids of entities the reviewer kept (suppressed), for rendering state. */
	suppressed?: Set<string>;
	/** Entities the reviewer added (text spans or image boxes), for the "added" band. */
	added?: StudioEntityView[];
	/** How many entities the redaction will actually redact (total minus kept). */
	effectiveRedactCount?: number;
}>();

const emit = defineEmits<{
	/** A row was clicked — focus its span in the document. */
	"focus-entity": [id: string];
	/** Open the full audit trail for an entity. */
	"view-details": [entity: StudioEntityView];
	/** Apply redaction to the complete detection. */
	redact: [];
	/** Download the redacted output file. */
	"download-output": [];
	/** Keep/redact toggle for one entity (suppress). */
	"toggle-suppress": [id: string];
	/** Remove a reviewer-added entity by its id. */
	"remove-added": [id: string];
}>();

const { labelName } = useLabels();

// --- redact/keep state (checkbox = will redact) -------------------------------
const isSuppressed = (id: string) => !!props.suppressed?.has(id);
// "Will redact" is the inverse of suppressed (kept); the checkbox reads as the
// action, so checked = redact.
const willRedact = (id: string) => !isSuppressed(id);

// Drive a set of entities to one redact/keep target (only toggling those that
// differ), so a cluster or a whole category moves together without flip-flopping.
function setRedact(items: { id: string }[], redact: boolean) {
	for (const e of items) {
		if (willRedact(e.id) !== redact) emit("toggle-suppress", e.id);
	}
}

function clusterAllRedact(cluster: EntityCluster<StudioEntityView>): boolean {
	return cluster.items.every((e) => willRedact(e.id));
}
function clusterAnyRedact(cluster: EntityCluster<StudioEntityView>): boolean {
	return cluster.items.some((e) => willRedact(e.id));
}
// Checkbox: checked when every occurrence will redact; indeterminate on a mix.
function clusterChecked(
	cluster: EntityCluster<StudioEntityView>,
): boolean | "indeterminate" {
	if (clusterAllRedact(cluster)) return true;
	if (clusterAnyRedact(cluster)) return "indeterminate";
	return false;
}
function toggleCluster(cluster: EntityCluster<StudioEntityView>) {
	setRedact(cluster.items, !clusterAllRedact(cluster));
}

// --- category bulk state ------------------------------------------------------
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
	setRedact(items, !items.every((e) => willRedact(e.id)));
}

// --- expand duplicate occurrences --------------------------------------------
const expanded = ref<Set<string>>(new Set());
function toggleExpand(key: string) {
	const next = new Set(expanded.value);
	if (next.has(key)) next.delete(key);
	else next.add(key);
	expanded.value = next;
}

// How many entities the "Apply" button will redact (excludes kept ones).
const applyCount = computed(() => props.effectiveRedactCount ?? props.count);

/**
 * Label a tabular entity's cell. With headers on, use the column name (when the
 * recognizer supplied one) and count data rows from 1; with headers off, there
 * is no header, so show the column number and count every row including row 0.
 */
function cellLabel(cell: NonNullable<TextEntityView["cell"]>): string {
	const n = cell.column + 1;
	const column =
		props.withHeaders && cell.columnName
			? t("studio.audit.colNamed", { n, name: cell.columnName })
			: t("studio.audit.colN", { n });
	const row = props.withHeaders ? cell.row : cell.row + 1;
	return t("studio.audit.cell", { column, row });
}

/**
 * Localized display name for a catalog category, falling back to the raw id for
 * a custom/unknown category the locale map doesn't cover, and to "Uncategorized"
 * when the label has no category.
 */
function categoryName(category: string | null): string {
	if (!category) return t("studio.audit.uncategorized");
	const key = `studio.audit.categories.${category}`;
	const name = t(key);
	return name === key ? category : name;
}

const confidencePct = (c: number) => `${Math.round(c * 100)}%`;

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

/**
 * A short location descriptor for an entity, by modality: a tabular cell, a text
 * byte range, an audio time span, or empty for an image entity (its box has no
 * compact text form).
 */
function locationLabel(entity: StudioEntityView): string {
	if (entity.modality === "image") return "";
	if (entity.modality === "audio") {
		return t("studio.audit.timeSpan", {
			start: formatTimecode(entity.span.start),
			end: formatTimecode(entity.span.end),
		});
	}
	if (entity.cell) return cellLabel(entity.cell);
	return t("studio.audit.bytes", { start: entity.start, end: entity.end });
}

/** The primary label for an added-entity row: its matched text when it has one
 * (text spans), else a modality descriptor (a drawn image region / an audio span
 * carry no text value). */
function addedValueLabel(entity: StudioEntityView): string {
	if (entity.text) return entity.text;
	if (entity.modality === "audio")
		return t("studio.audit.timeSpan", {
			start: formatTimecode(entity.span.start),
			end: formatTimecode(entity.span.end),
		});
	return t("studio.audit.imageRegion");
}

// Whether an entity can be located in the document/image/audio (highlighted +
// focused). Text entities detected only in metadata (e.g. a DOCX hyperlink target)
// can't; their value still shows but the row isn't clickable. Image and audio
// entities always have a box/span, so they're always locatable.
const isLocatable = (e: StudioEntityView) =>
	e.modality === "image" || e.modality === "audio" || e.locatable !== false;
// A cluster is locatable when its representative occurrence is.
const clusterLocatable = (cluster: EntityCluster<StudioEntityView>) =>
	isLocatable(cluster.lead);

// A collapsed cluster reads as active when any of its occurrences is focused.
function clusterActiveClass(cluster: EntityCluster<StudioEntityView>): string {
	return cluster.items.some((e) => e.id === props.activeEntityId)
		? "bg-muted"
		: "hover:bg-muted/40";
}
</script>

<template>
  <div class="flex h-full flex-col">
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

      <!-- Restoring a previous detection -->
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

      <!-- Empty (complete, nothing detected and nothing added) -->
      <div
        v-else-if="phase === 'complete' && count === 0 && !added?.length"
        class="flex h-full flex-col items-center justify-center px-6 text-center"
      >
        <p class="mb-1 text-sm text-foreground">
          {{ t("studio.audit.emptyTitle") }}
        </p>
        <p class="text-xs text-muted-foreground">
          {{ t("studio.audit.emptyHint") }}
        </p>
      </div>

      <!-- Two-tier entity list: category → label group → cluster rows. Each
           category is collapsible, expanded by default. Plus a band for entities
           the reviewer added by selecting text. -->
      <template v-else-if="phase === 'complete'">
        <!-- Added by the reviewer — mirrors a category section so it reads as one
             of the tiers, with a "+" marker instead of a category dot. -->
        <section v-if="added?.length">
          <div
            class="sticky top-0 z-10 flex w-full items-center gap-1.5 bg-muted/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur-sm"
          >
            <Plus :size="12" class="shrink-0 text-emerald-600 dark:text-emerald-500" />
            <span>{{ t("studio.audit.addedByYou") }}</span>
            <span
              class="ml-auto rounded-full bg-foreground/10 px-1.5 text-[10px] font-semibold leading-4 text-foreground/70"
            >
              {{ added.length }}
            </span>
          </div>
          <div class="px-2 py-1">
            <div
              v-for="item in added"
              :key="item.id"
              class="group/row flex items-center gap-2 rounded-md px-1 py-1.5 transition-colors"
              :class="
                activeEntityId === item.id ? 'bg-muted' : 'hover:bg-muted/40'
              "
            >
              <button
                type="button"
                class="min-w-0 flex-1 truncate text-left font-mono text-xs text-foreground"
                @click="emit('focus-entity', item.id)"
              >
                {{ addedValueLabel(item) }}
                <span class="ml-1 font-sans text-[11px] text-muted-foreground">
                  {{ labelName(item.label) }}
                </span>
              </button>
              <button
                type="button"
                class="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted-foreground/10 hover:text-foreground focus-visible:opacity-100 group-hover/row:opacity-100"
                :title="t('studio.audit.removeAdded')"
                :aria-label="t('studio.audit.removeAdded')"
                @click.stop="emit('remove-added', item.id)"
              >
                <X :size="13" />
              </button>
            </div>
          </div>
        </section>

        <Collapsible
          v-for="section in categorizedGroups"
          :key="section.category ?? '__uncategorized__'"
          as="section"
          default-open
          class="group/category"
        >
          <!-- Category header: a bulk redact/keep checkbox + a collapse trigger. -->
          <div
            class="sticky top-0 z-10 flex w-full items-center gap-2 bg-muted/50 px-3 py-1.5 backdrop-blur-sm"
          >
            <Checkbox
              :model-value="categoryChecked(section)"
              :aria-label="
                t('studio.audit.redactCategory', { name: categoryName(section.category) })
              "
              @update:model-value="toggleCategory(section)"
            />
            <CollapsibleTrigger
              class="flex min-w-0 flex-1 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronRight
                :size="11"
                class="shrink-0 transition-transform duration-200 group-data-[state=open]/category:rotate-90"
              />
              <span
                class="category-dot shrink-0"
                :data-category="section.category ?? undefined"
                aria-hidden="true"
              />
              <span class="truncate">{{ categoryName(section.category) }}</span>
              <span
                class="ml-auto rounded-full bg-foreground/10 px-1.5 text-[10px] font-semibold leading-4 text-foreground/70"
              >
                {{ section.count }}
              </span>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <div class="px-2 py-1">
              <template v-for="group in section.labels" :key="group.label">
                <template v-for="cluster in group.clusters" :key="cluster.key">
                  <!-- Cluster row: checkbox (will-redact) · label + value · info /
                       reveal actions · confidence or ×N. -->
                  <div
                    class="group/row flex items-center gap-2 rounded-md px-1 py-1.5 transition-colors"
                    :class="[
                      clusterActiveClass(cluster),
                      clusterAllRedact(cluster) ? '' : 'opacity-60',
                    ]"
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

                    <!-- Label + value, stacked for the narrow rail. Clicking the
                         value focuses it in the document (when locatable). -->
                    <button
                      type="button"
                      class="min-w-0 flex-1 text-left"
                      :class="clusterLocatable(cluster) ? '' : 'cursor-default'"
                      :disabled="!clusterLocatable(cluster)"
                      @click="clusterLocatable(cluster) && emit('focus-entity', cluster.lead.id)"
                    >
                      <span
                        class="block truncate font-mono text-[10px] uppercase tracking-wide text-muted-foreground"
                      >
                        {{ group.name }}
                        <span
                          v-if="!clusterLocatable(cluster)"
                          class="ml-1 rounded bg-muted-foreground/15 px-1 py-px font-medium normal-case"
                        >
                          {{ t("studio.audit.metadata") }}
                        </span>
                      </span>
                      <span
                        v-if="cluster.lead.text"
                        class="block truncate text-xs text-foreground"
                        :class="clusterAllRedact(cluster) ? '' : 'line-through'"
                      >
                        {{ cluster.lead.text }}
                      </span>
                      <span
                        v-else
                        class="block truncate text-xs text-foreground"
                        :class="clusterAllRedact(cluster) ? '' : 'line-through'"
                      >
                        {{ locationLabel(cluster.lead) }}
                      </span>
                    </button>

                    <!-- Details + reveal, hover-revealed. -->
                    <div
                      class="flex shrink-0 items-center opacity-0 transition-opacity focus-within:opacity-100 group-hover/row:opacity-100"
                    >
                      <button
                        type="button"
                        class="rounded p-1 text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
                        :title="t('studio.audit.viewDetails')"
                        :aria-label="t('studio.audit.viewDetails')"
                        @click.stop="emit('view-details', cluster.lead)"
                      >
                        <Info :size="13" />
                      </button>
                      <button
                        v-if="clusterLocatable(cluster)"
                        type="button"
                        class="rounded p-1 text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
                        :title="t('studio.audit.revealInDocument')"
                        :aria-label="t('studio.audit.revealInDocument')"
                        @click.stop="emit('focus-entity', cluster.lead.id)"
                      >
                        <CornerUpRight :size="13" />
                      </button>
                    </div>

                    <!-- ×N (expands) for a repeated value, else the confidence. -->
                    <button
                      v-if="cluster.items.length > 1"
                      type="button"
                      class="flex shrink-0 items-center gap-0.5 rounded px-1 text-[11px] tabular-nums text-muted-foreground transition-colors hover:bg-muted-foreground/10 hover:text-foreground"
                      :aria-expanded="expanded.has(cluster.key)"
                      :aria-label="t('studio.audit.occurrences', { n: cluster.items.length })"
                      @click.stop="toggleExpand(cluster.key)"
                    >
                      <ChevronRight
                        :size="11"
                        class="transition-transform"
                        :class="expanded.has(cluster.key) ? 'rotate-90' : ''"
                      />
                      ×{{ cluster.items.length }}
                    </button>
                    <span
                      v-else
                      class="shrink-0 text-[11px] tabular-nums text-muted-foreground/70"
                    >
                      {{ confidencePct(cluster.lead.confidence) }}
                    </span>
                  </div>

                  <!-- Expanded occurrences of this cluster. -->
                  <template v-if="expanded.has(cluster.key)">
                    <div
                      v-for="item in cluster.items"
                      :key="item.id"
                      class="group/occ flex items-center gap-2 rounded-md py-1 pl-6 pr-1 transition-colors"
                      :class="[
                        activeEntityId === item.id ? 'bg-muted' : '',
                        willRedact(item.id) ? '' : 'opacity-60',
                      ]"
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
                      <button
                        type="button"
                        class="min-w-0 flex-1 truncate text-left text-[11px] text-muted-foreground"
                        :class="[
                          willRedact(item.id) ? '' : 'line-through',
                          isLocatable(item) ? '' : 'cursor-default',
                        ]"
                        :disabled="!isLocatable(item)"
                        @click="isLocatable(item) && emit('focus-entity', item.id)"
                      >
                        {{ locationLabel(item) || findingValue(item) }}
                      </button>
                      <button
                        v-if="isLocatable(item)"
                        type="button"
                        class="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted-foreground/10 hover:text-foreground focus-visible:opacity-100 group-hover/occ:opacity-100"
                        :title="t('studio.audit.revealInDocument')"
                        :aria-label="t('studio.audit.revealInDocument')"
                        @click.stop="emit('focus-entity', item.id)"
                      >
                        <CornerUpRight :size="12" />
                      </button>
                    </div>
                  </template>
                </template>
              </template>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </template>
    </div>

    <!-- Redaction footer: apply redaction to the complete detection, then download the
         redacted output it produces. Shown whenever there's something to redact —
         detected entities, or ones the reviewer added even if none were detected. -->
    <div
      v-if="phase === 'complete' && (count > 0 || !!added?.length)"
      class="border-t border-border/50 bg-muted/30 p-3"
    >
      <!-- Redaction failed: show why, keep the button available to retry. -->
      <p
        v-if="redactPhase === 'failed' && redactError"
        class="mb-2 flex items-start gap-1.5 text-xs text-destructive"
      >
        <TriangleAlert :size="13" class="mt-px shrink-0" />
        <span>{{ redactError }}</span>
      </p>

      <!-- Done: the redacted file is ready to download. -->
      <template v-if="redactPhase === 'done' && output">
        <Button
          size="sm"
          class="w-full"
          @click="emit('download-output')"
        >
          <Download :size="15" />
          {{ t("studio.audit.downloadRedacted") }}
        </Button>
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
  </div>
</template>
