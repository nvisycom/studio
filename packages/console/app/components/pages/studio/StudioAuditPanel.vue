<script setup lang="ts">
import {
	ChevronLeft,
	ChevronRight,
	Download,
	Eye,
	EyeOff,
	Layers,
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
import type { EntityCluster } from "#console/composables/useEntities";
import type { TextEntityView } from "#console/composables/useTextEntities";
import type {
	StudioCategorizedGroup,
	StudioEntityView,
} from "#console/composables/useStudioEntities";
import { Button } from "#console/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#console/components/ui/collapsible";

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

// Keep/suppress helpers. A cluster groups identical occurrences; its toggle
// moves the whole cluster to one target state. Occurrences can be suppressed
// individually in expanded mode, so the cluster reads as suppressed only when
// *every* occurrence is, and toggling drives all to a single target (suppress
// unless already fully suppressed) — flipping each independently would leave a
// mixed cluster inconsistent.
const isSuppressed = (id: string) => !!props.suppressed?.has(id);
function clusterSuppressed(cluster: EntityCluster<StudioEntityView>): boolean {
	return cluster.items.every((e) => isSuppressed(e.id));
}
function toggleClusterSuppress(cluster: EntityCluster<StudioEntityView>) {
	const target = !clusterSuppressed(cluster);
	for (const e of cluster.items) {
		if (isSuppressed(e.id) !== target) emit("toggle-suppress", e.id);
	}
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

/** The entity's metadata line — location, detector/source, language — joined with
 * " · " so a separator only sits between two present fields (no leading "·" when,
 * e.g., an image entity has no location). */
function entityMetaLine(entity: StudioEntityView): string {
	const detector =
		entity.detectorKind === "pattern"
			? t("studio.audit.detectorPattern", { name: entity.detector })
			: entity.detectorKind === "model"
				? t("studio.audit.detectorModel", { name: entity.detector })
				: entity.source;
	return [locationLabel(entity), detector, entity.language]
		.filter(Boolean)
		.join(" · ");
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

// Collapse identical occurrences (same value + detector) into one row. On by
// default (a document usually repeats the same values); toggled from the
// header. Only worth offering when a group actually has duplicates.
const collapseDuplicates = ref(true);
const hasDuplicates = computed(() =>
	props.categorizedGroups.some((section) =>
		section.labels.some((group) =>
			group.clusters.some((cluster) => cluster.items.length > 1),
		),
	),
);

// Per-cluster "which occurrence is focused" index, so prev/next steps through
// the spans of a collapsed row. Keyed by the cluster's stable key.
const clusterIndex = ref<Record<string, number>>({});

function stepCluster(cluster: EntityCluster<StudioEntityView>, delta: number) {
	// Metadata-only entities have no in-document span to focus.
	if (!isLocatable(cluster.lead)) return;
	const total = cluster.items.length;
	const current = clusterIndex.value[cluster.key] ?? 0;
	const next = (current + delta + total) % total;
	clusterIndex.value = { ...clusterIndex.value, [cluster.key]: next };
	emit("focus-entity", cluster.items[next]!.id);
}

// A collapsed cluster reads as active when any of its occurrences is focused.
function clusterActive(cluster: EntityCluster<StudioEntityView>): boolean {
	return cluster.items.some((e) => e.id === props.activeEntityId);
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
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Toolbar: collapse-duplicates toggle. -->
    <div
      v-if="phase === 'complete' && hasDuplicates"
      class="flex items-center justify-end border-b border-border/50 bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
    >
      <button
        type="button"
        class="flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors hover:bg-muted"
        :class="collapseDuplicates ? 'text-foreground' : 'text-muted-foreground'"
        :title="t('studio.audit.collapseDuplicates')"
        @click="collapseDuplicates = !collapseDuplicates"
      >
        <Layers :size="12" />
        {{ t("studio.audit.collapseDuplicates") }}
      </button>
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

      <!-- Two-tier entity list: category → label → entities. Each category is
           collapsible, expanded by default. Plus a band for entities the
           reviewer added by selecting text. -->
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
          <!-- Rows indented under the header like a label group's rows. Clicking
               focuses the entity's highlight in the document, like detected rows. -->
          <div class="pl-3">
            <div
              v-for="item in added"
              :key="item.id"
              class="group/row flex w-full items-start gap-2 border-l py-1.5 pr-2 pl-3 transition-colors"
              :class="
                activeEntityId === item.id
                  ? 'border-foreground bg-muted'
                  : 'border-border/60 hover:bg-muted/40'
              "
            >
              <button
                type="button"
                class="min-w-0 flex-1 text-left"
                @click="emit('focus-entity', item.id)"
              >
                <!-- Value: the matched text for a text add, or the type for an image
                     region (a drawn box has no text value). -->
                <span class="block truncate font-mono text-xs text-foreground">
                  {{ addedValueLabel(item) }}
                </span>
                <span
                  class="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground"
                >
                  <span class="truncate">{{ labelName(item.label) }}</span>
                </span>
              </button>
              <button
                type="button"
                class="mt-0.5 shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted-foreground/10 hover:text-foreground focus-visible:opacity-100 group-hover/row:opacity-100"
                :title="t('studio.audit.removeAdded')"
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
          <!-- Category header (collapse trigger): a subtle band that owns the
               section boundary, so the tiers read top-down. -->
          <CollapsibleTrigger
            class="sticky top-0 z-10 flex w-full items-center gap-1.5 bg-muted/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
          >
            <ChevronRight
              :size="11"
              class="shrink-0 -ml-0.5 transition-transform duration-200 group-data-[state=open]/category:rotate-90"
            />
            <span
              class="category-dot shrink-0"
              :data-category="section.category ?? undefined"
              aria-hidden="true"
            />
            <span>
              {{ categoryName(section.category) }}
            </span>
            <span
              class="ml-auto rounded-full bg-foreground/10 px-1.5 text-[10px] font-semibold leading-4 text-foreground/70"
            >
              {{ section.count }}
            </span>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <!-- Label groups within the category, indented under the header. -->
            <div v-for="group in section.labels" :key="group.label" class="pl-3">
              <div
                class="flex items-center gap-2 px-2 pt-2 pb-0.5 text-xs font-medium text-foreground/80"
              >
                <span class="truncate">{{ group.name }}</span>
                <span class="ml-auto text-[11px] text-muted-foreground/70">
                  {{ group.items.length }}
                </span>
              </div>
              <!-- Collapsed: one row per cluster of identical occurrences. -->
              <template v-if="collapseDuplicates">
                <div
                  v-for="cluster in group.clusters"
                  :key="cluster.key"
                  class="group/row flex w-full items-start gap-2 border-l py-1.5 pr-2 pl-3 text-left transition-colors"
                  :class="[
                    clusterActive(cluster)
                      ? 'border-foreground bg-muted'
                      : 'border-border/60',
                    clusterSuppressed(cluster)
                      ? 'opacity-45'
                      : clusterLocatable(cluster)
                        ? 'hover:bg-muted/40'
                        : 'opacity-60',
                  ]"
                >
                  <button
                    type="button"
                    class="min-w-0 flex-1 text-left"
                    :class="clusterLocatable(cluster) ? '' : 'cursor-default'"
                    :disabled="!clusterLocatable(cluster)"
                    @click="stepCluster(cluster, 0)"
                  >
                    <span
                      v-if="cluster.lead.text"
                      class="block truncate font-mono text-xs text-foreground"
                    >
                      {{ cluster.lead.text }}
                    </span>
                    <span
                      class="flex items-center gap-1 truncate text-[11px] text-muted-foreground"
                      :class="{ 'mt-0.5': cluster.lead.text }"
                    >
                      <!-- Metadata-only marker: this value isn't in the visible
                           body (e.g. a hyperlink target), so it can't be located. -->
                      <span
                        v-if="!clusterLocatable(cluster)"
                        class="shrink-0 rounded bg-muted-foreground/15 px-1 py-px text-[10px] font-medium uppercase tracking-wide"
                      >
                        {{ t("studio.audit.metadata") }}
                      </span>
                      <span class="truncate">
                        <template v-if="cluster.lead.detectorKind === 'pattern'">
                          {{ t("studio.audit.detectorPattern", { name: cluster.lead.detector }) }}
                        </template>
                        <template v-else-if="cluster.lead.detectorKind === 'model'">
                          {{ t("studio.audit.detectorModel", { name: cluster.lead.detector }) }}
                        </template>
                        <template v-else-if="cluster.lead.source">
                          {{ cluster.lead.source }}
                        </template>
                        <template v-if="cluster.lead.language">
                          · {{ cluster.lead.language }}
                        </template>
                      </span>
                    </span>
                  </button>

                  <!-- Trailing controls, right-aligned as one cluster: the keep
                       toggle (hover-revealed) sits left of the occurrence stepper
                       or the confidence %, so it lines up with them. -->
                  <div class="mt-0.5 flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      class="rounded p-1 opacity-0 transition-opacity hover:bg-muted-foreground/10 focus-visible:opacity-100 group-hover/row:opacity-100"
                      :class="
                        clusterSuppressed(cluster)
                          ? 'text-muted-foreground opacity-100'
                          : 'text-foreground/70'
                      "
                      :aria-label="
                        clusterSuppressed(cluster)
                          ? t('studio.audit.redactThis')
                          : t('studio.audit.keep')
                      "
                      :title="
                        clusterSuppressed(cluster)
                          ? t('studio.audit.redactThis')
                          : t('studio.audit.keep')
                      "
                      @click.stop="toggleClusterSuppress(cluster)"
                    >
                      <Eye v-if="clusterSuppressed(cluster)" :size="14" />
                      <EyeOff v-else :size="14" />
                    </button>

                    <!-- Occurrence stepper for multi-occurrence clusters. -->
                    <span
                      v-if="cluster.items.length > 1"
                      class="flex items-center gap-0.5 text-[11px] text-muted-foreground"
                    >
                      <button
                        type="button"
                        class="rounded p-0.5 enabled:hover:bg-muted-foreground/10 disabled:cursor-default disabled:opacity-40"
                        :disabled="!clusterLocatable(cluster)"
                        :aria-label="t('studio.audit.prevOccurrence')"
                        @click.stop="stepCluster(cluster, -1)"
                      >
                        <ChevronLeft :size="13" />
                      </button>
                      <span class="tabular-nums">
                        {{ (clusterIndex[cluster.key] ?? 0) + 1 }}/{{ cluster.items.length }}
                      </span>
                      <button
                        type="button"
                        class="rounded p-0.5 enabled:hover:bg-muted-foreground/10 disabled:cursor-default disabled:opacity-40"
                        :disabled="!clusterLocatable(cluster)"
                        :aria-label="t('studio.audit.nextOccurrence')"
                        @click.stop="stepCluster(cluster, 1)"
                      >
                        <ChevronRight :size="13" />
                      </button>
                    </span>
                    <span
                      v-else
                      class="text-[11px] tabular-nums text-muted-foreground/70"
                    >
                      {{ confidencePct(cluster.lead.confidence) }}
                    </span>
                  </div>
                </div>
              </template>

              <!-- Expanded: one row per occurrence. -->
              <template v-else>
              <div
                v-for="entity in group.items"
                :key="entity.id"
                class="group/row flex w-full items-start gap-2 border-l py-1.5 pr-2 pl-3 text-left transition-colors"
                :class="[
                  activeEntityId === entity.id
                    ? 'border-foreground bg-muted'
                    : 'border-border/60',
                  isSuppressed(entity.id)
                    ? 'opacity-45'
                    : isLocatable(entity)
                      ? 'hover:bg-muted/40'
                      : 'opacity-60',
                ]"
              >
                <button
                  type="button"
                  class="min-w-0 flex-1 text-left"
                  :class="isLocatable(entity) ? '' : 'cursor-default'"
                  :disabled="!isLocatable(entity)"
                  @click="isLocatable(entity) && emit('focus-entity', entity.id)"
                >
                  <!-- The matched value, when we could slice it from the doc. -->
                  <span
                    v-if="entity.text"
                    class="block truncate font-mono text-xs text-foreground"
                  >
                    {{ entity.text }}
                  </span>
                  <!-- Meta line: location, then source and language. -->
                  <span
                    class="flex items-center gap-1 truncate text-[11px] text-muted-foreground"
                    :class="{ 'mt-0.5': entity.text }"
                  >
                    <span
                      v-if="!isLocatable(entity)"
                      class="shrink-0 rounded bg-muted-foreground/15 px-1 py-px text-[10px] font-medium uppercase tracking-wide"
                    >
                      {{ t("studio.audit.metadata") }}
                    </span>
                    <!-- Location · detector/source · language, joined so a
                         separator only appears between two present fields (an
                         image entity has no location, so no leading "·"). -->
                    <span class="truncate">
                      {{ entityMetaLine(entity) }}
                    </span>
                  </span>
                </button>

                <!-- Trailing controls: the keep toggle (hover-revealed) lined up
                     left of the confidence %, as one right-aligned cluster. -->
                <div class="mt-0.5 flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    class="rounded p-1 opacity-0 transition-opacity hover:bg-muted-foreground/10 focus-visible:opacity-100 group-hover/row:opacity-100"
                    :class="
                      isSuppressed(entity.id)
                        ? 'text-muted-foreground opacity-100'
                        : 'text-foreground/70'
                    "
                    :title="
                      isSuppressed(entity.id)
                        ? t('studio.audit.redactThis')
                        : t('studio.audit.keep')
                    "
                    @click.stop="emit('toggle-suppress', entity.id)"
                  >
                    <Eye v-if="isSuppressed(entity.id)" :size="14" />
                    <EyeOff v-else :size="14" />
                  </button>
                  <span class="text-[11px] tabular-nums text-muted-foreground/70">
                    {{ confidencePct(entity.confidence) }}
                  </span>
                </div>
              </div>
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
