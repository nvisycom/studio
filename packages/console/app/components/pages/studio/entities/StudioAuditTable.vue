<script setup lang="ts">
import { Eye, EyeOff, CornerUpRight, ScanSearch, Loader2 } from "@lucide/vue";
import type {
	StudioCategorizedGroup,
	StudioEntityView,
} from "#console/composables/useStudioEntities";
import type { EntityCluster } from "#console/composables/useEntities";
import type { StudioDetectionPhase } from "#console/composables/useStudioDetection";
import { formatTimecode } from "#console/utils/date";

/**
 * Full-screen review table for a completed detection's findings — the audit as
 * a readable label → value report, shown when the audit takes the whole studio
 * canvas (the file hidden). It's the wide counterpart to {@link StudioAuditPanel}
 * (the compact inspector list): same data and redaction state, a layout built
 * for reading many findings at once rather than a narrow rail.
 *
 * Each row is one finding: its label, its matched value, confidence, a keep/redact
 * toggle, and "reveal in document" — so most findings are judgeable here without
 * opening the file, and the file is one click away for the rest.
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
}>();

const isSuppressed = (id: string) => !!props.suppressed?.has(id);

// A cluster reads as kept only when every occurrence is; toggling drives them all
// to one target (keep unless already fully kept), matching the compact panel.
function clusterSuppressed(cluster: EntityCluster<StudioEntityView>): boolean {
	return cluster.items.every((e) => isSuppressed(e.id));
}
function toggleClusterSuppress(cluster: EntityCluster<StudioEntityView>) {
	const target = !clusterSuppressed(cluster);
	for (const e of cluster.items) {
		if (isSuppressed(e.id) !== target) emit("toggle-suppress", e.id);
	}
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
 * The value a finding shows in the table. Text/tabular entities carry their
 * matched value; an audio span shows its timecodes; an image region has no text
 * value, so it names itself.
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
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Checking / empty / error states, else the findings table. -->
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

      <!-- Findings, grouped by category. The layout stays report-like: a row is
           label → value, with the actions (keep, reveal) and metadata (confidence,
           occurrences) held back until the row is hovered/focused, so a resting
           screen reads like a clean list rather than a data grid. A kept row stays
           visibly struck through, since that's a decision, not chrome. -->
      <div v-else class="mx-auto max-w-5xl px-8 py-10">
        <section
          v-for="group in categorizedGroups"
          :key="group.category ?? '__uncat__'"
          class="mb-10 last:mb-0"
        >
          <h2
            class="mb-2 flex items-baseline gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70"
          >
            {{ categoryName(group.category) }}
            <span class="font-normal tabular-nums">{{ group.count }}</span>
          </h2>

          <div class="divide-y divide-border/50">
            <template v-for="labelGroup in group.labels" :key="labelGroup.label">
              <div
                v-for="cluster in labelGroup.clusters"
                :key="cluster.lead.id"
                class="group/row flex items-center gap-5 py-4"
                :class="clusterSuppressed(cluster) ? 'opacity-55' : ''"
              >
                <!-- Label -->
                <span
                  class="w-36 shrink-0 truncate font-mono text-xs uppercase tracking-wide text-muted-foreground"
                  :title="labelGroup.name"
                >
                  {{ labelGroup.name }}
                </span>

                <!-- Value: the finding a reviewer reads. Truncates on its own so a
                     long value never pushes the ×N count or the actions off. -->
                <div class="flex min-w-0 flex-1 items-baseline gap-2">
                  <span
                    class="min-w-0 truncate text-lg text-foreground"
                    :class="
                      clusterSuppressed(cluster) ? 'line-through decoration-1' : ''
                    "
                    :title="findingValue(cluster.lead)"
                  >
                    {{ findingValue(cluster.lead) }}
                  </span>
                  <span
                    v-if="cluster.items.length > 1"
                    class="shrink-0 text-xs tabular-nums text-muted-foreground/70"
                    :title="t('studio.audit.occurrences', { n: cluster.items.length })"
                  >
                    ×{{ cluster.items.length }}
                  </span>
                </div>

                <!-- Right cluster: confidence (always) + actions (on hover/focus).
                     Reserves its width so rows don't shift when actions appear. -->
                <div class="flex shrink-0 items-center gap-1">
                  <span
                    class="w-9 text-right text-xs tabular-nums text-muted-foreground/70"
                  >
                    {{ confidencePct(cluster.lead.confidence) }}
                  </span>

                  <button
                    type="button"
                    class="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted-foreground/10 hover:text-foreground"
                    :class="
                      clusterSuppressed(cluster)
                        ? ''
                        : 'opacity-0 focus-visible:opacity-100 group-hover/row:opacity-100'
                    "
                    :title="
                      clusterSuppressed(cluster)
                        ? t('studio.audit.redactThis')
                        : t('studio.audit.keep')
                    "
                    :aria-label="
                      clusterSuppressed(cluster)
                        ? t('studio.audit.redactThis')
                        : t('studio.audit.keep')
                    "
                    @click="toggleClusterSuppress(cluster)"
                  >
                    <Eye v-if="clusterSuppressed(cluster)" :size="15" />
                    <EyeOff v-else :size="15" />
                  </button>

                  <button
                    type="button"
                    class="rounded p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted-foreground/10 hover:text-foreground focus-visible:opacity-100 group-hover/row:opacity-100"
                    :title="t('studio.audit.revealInDocument')"
                    :aria-label="t('studio.audit.revealInDocument')"
                    @click="emit('reveal-entity', cluster.lead.id)"
                  >
                    <CornerUpRight :size="15" />
                  </button>
                </div>
              </div>
            </template>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
