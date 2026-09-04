<script setup lang="ts">
import { useEventListener } from "@vueuse/core";
import { SplitterPanel } from "reka-ui";
import JSZip from "jszip";
import {
	MessageSquare,
	ScanSearch,
	Maximize2,
	Minimize2,
	PanelRightClose,
	PanelRightOpen,
} from "@lucide/vue";
import {
	StudioDocumentPreview,
	StudioChatPanel,
	StudioAuditPanel,
	StudioAuditTable,
	StudioDetectionBar,
	EntityAuditModal,
} from "#console/components/pages/studio";
import type { StudioEntityView } from "#console/composables/useStudioEntities";
import type { AudioTranscriptState } from "#console/components/pages/studio/preview/StudioAudioView.vue";
import { rendererFor } from "#console/components/pages/studio/preview/renderers";
import {
	ResizablePanelGroup,
	ResizablePanel,
	ResizableHandle,
} from "#console/components/ui/resizable";
import { Tabs, TabsList, TabsTrigger } from "#console/components/ui/tabs";
import { Button } from "#console/components/ui/button";
import {
	HeaderSocket,
	StudioFileTabs,
} from "#console/components/layout/header";

const { t } = useI18n();

useHead({ title: "Studio" });

definePageMeta({
	pageCategory: "header.category.studio",
	// Hide the "Studio" breadcrumb so the open-file tabs get the full width.
	hideCategory: true,
});

// Use studio files store for persistent open files
const { activeFile, restoreSession } = useStudioFiles();

// After a refresh, re-open the tabs persisted for this workspace (client-only).
onMounted(() => {
	restoreSession();
});

// The renderer for the active file, resolved from the registry by the file's real
// `fileExtension` from the API (not its display name — a redacted file is named
// `report.csv.redacted`, so the name's suffix would misread it). This is the
// single source of truth for how the file is handled; the detection-source below
// keys off it, so a new format is one registry entry, not edits here.
const fileExtension = computed(() => activeFile.value?.fileExtension ?? "");
const renderer = computed(() => rendererFor(fileExtension.value) ?? null);
// Which content form detection needs for the active file (see the registry). The
// two fetches below arm off this, so adding a text-backed format needs no change
// here — its registry entry declaring `detectionSource: "text"` is enough.
const detectionSource = computed(
	() => renderer.value?.detectionSource ?? "none",
);

// Right-panel tabs: Chat (existing) and Audit (detection results).
const panelTab = ref<"chat" | "audit">("audit");

// Cross-focus between the audit panel (list) and the document preview (inline
// highlights). The detected entities themselves come from the shared audit
// state below.
const activeEntityId = ref<string | null>(null);

// Whether a CSV's first row is a header. Shared so the audit list labels rows
// the same way the table renders them.
const withHeaders = ref(true);

// The active file's flat text, read from its content blob. Shared with the
// audit panel so it can show each detection's matched value. Only text-backed
// files have usable content; others leave this null.
const documentText = ref<string | null>(null);
watch(
	[() => activeFile.value?.contentUrl, () => detectionSource.value === "text"],
	async ([url, isText]) => {
		documentText.value = null;
		if (!url || !isText) return;
		try {
			const text = await (await fetch(url)).text();
			// Ignore a stale response: the file may have changed while the fetch
			// was in flight, so only apply it if this URL is still the active one.
			if (activeFile.value?.contentUrl === url) documentText.value = text;
		} catch {
			if (activeFile.value?.contentUrl === url) documentText.value = null;
		}
	},
	{ immediate: true },
);

// DOCX part bytes (every zip entry), so the audit panel can slice each
// detection's matched value from its raw-source byte spans — including parts
// outside the visible body (e.g. hyperlink targets in `word/_rels/...`). DOCX
// has no flat text, so `documentText` stays null for it.
const docxParts = ref<Map<string, Uint8Array> | null>(null);
watch(
	[
		() => activeFile.value?.contentUrl,
		() => detectionSource.value === "docx-parts",
	],
	async ([url, isDocx]) => {
		docxParts.value = null;
		if (!url || !isDocx) return;
		try {
			const buffer = await (await fetch(url)).arrayBuffer();
			const zip = await JSZip.loadAsync(buffer);
			const parts = new Map<string, Uint8Array>();
			await Promise.all(
				Object.values(zip.files)
					.filter((f) => !f.dir)
					.map(async (f) => parts.set(f.name, await f.async("uint8array"))),
			);
			// Only apply if this URL is still the active one.
			if (activeFile.value?.contentUrl === url) docxParts.value = parts;
		} catch {
			if (activeFile.value?.contentUrl === url) docxParts.value = null;
		}
	},
	{ immediate: true },
);

// Detection run + audit state for the active file (the long-running "job"),
// shared between the detection bar (pipeline + controls), the audit panel
// (results list), and the document preview (inline highlights).
const detection = useStudioDetection(
	() => activeFile.value?.fileId ?? null,
	() => documentText.value,
	() => docxParts.value,
	() => activeFile.value?.displayName ?? null,
);

// Audio transcript state for the audio view. Resolved once a detection completes
// for an audio file, by fetching its enrichment intermediates:
//   - hidden      — no completed detection yet (the panel isn't shown).
//   - unavailable — no intermediates (endpoint 404s, or body is null): the
//     transcript was never generated or has been removed.
//   - empty       — a transcript exists but has no speech segments.
//   - ready       — the transcript, with segments.
// The panel explains each empty case rather than silently disappearing.
const { getIntermediates } = useDetections();
const audioTranscriptState = ref<AudioTranscriptState>({ kind: "hidden" });
watch(
	[
		() => detection.detectionId.value,
		() => detection.phase.value,
		() => detectionSource.value === "transcript",
	],
	async ([detectionId, phase, isAudio]) => {
		audioTranscriptState.value = { kind: "hidden" };
		if (!detectionId || phase !== "complete" || !isAudio) return;
		try {
			const set = await getIntermediates(detectionId);
			// Guard against a stale response (the file/detection may have changed).
			if (detection.detectionId.value !== detectionId) return;
			const body = soleArtifactPart(set);
			if (body?.modality !== "audio") {
				// 404 -> null set, or a 200 with no audio artifact: not available.
				audioTranscriptState.value = { kind: "unavailable" };
				return;
			}
			const hasSpeech = body.artifact.segments.some(
				(s) => s.text.trim().length > 0,
			);
			audioTranscriptState.value = hasSpeech
				? { kind: "ready", transcript: body.artifact }
				: { kind: "empty" };
		} catch {
			// A real error (not a 404 — that's mapped to null): treat as unavailable
			// rather than surfacing a failure for an optional enhancement.
			if (detection.detectionId.value === detectionId)
				audioTranscriptState.value = { kind: "unavailable" };
		}
	},
	{ immediate: true },
);

// OCR layout for the image preview's optional overlay, fetched from the same
// intermediates endpoint once a detection completes for an image file. Optional,
// like the audio transcript: null when there are no intermediates.
const imageOcr = ref<ImageLayout | null>(null);
watch(
	[
		() => detection.detectionId.value,
		() => detection.phase.value,
		() => detectionSource.value === "image-ocr",
	],
	async ([detectionId, phase, isImage]) => {
		imageOcr.value = null;
		if (!detectionId || phase !== "complete" || !isImage) return;
		try {
			const set = await getIntermediates(detectionId);
			if (detection.detectionId.value !== detectionId) return;
			const body = soleArtifactPart(set);
			imageOcr.value =
				body?.modality === "image" ? toImageLayout(body.artifact) : null;
		} catch {
			if (detection.detectionId.value === detectionId) imageOcr.value = null;
		}
	},
	{ immediate: true },
);

// Reviewer edits + applying redactions to the complete detection. Takes the
// detection's state as input; resets itself whenever the detection changes.
const redaction = useStudioRedaction({
	phase: detection.phase,
	detectionId: detection.detectionId,
	detectionFileName: detection.detectionFileName,
	entities: detection.entities,
	count: detection.count,
});

function focusEntity(id: string) {
	activeEntityId.value = activeEntityId.value === id ? null : id;
}
function clearEntity() {
	activeEntityId.value = null;
}
// Escape steps back out: leave full-screen audit, then clear an entity selection
// — one level per press, and only when there's a level to close, so it doesn't
// swallow Escape meant for another overlay.
useEventListener(document, "keydown", (e: KeyboardEvent) => {
	if (e.key !== "Escape") return;
	if (mainSurface.value === "audit") mainSurface.value = "preview";
	else if (activeEntityId.value) clearEntity();
});

// The right-hand inspector (Audit / Chat) is a resizable, collapsible split
// panel. The Splitter owns sizing (percent-based), keyboard resize, and — via
// `auto-save-id` — persisting the layout across reloads; we only hold a ref to
// drive collapse from the document toolbar's toggle and a flag to flip its icon.
// Typed against reka-ui's SplitterPanel (our ResizablePanel wrapper forwards its
// ref to it), which exposes collapse()/expand()/isCollapsed.
const inspectorPanel = ref<InstanceType<typeof SplitterPanel> | null>(null);
const inspectorCollapsed = ref(false);

function toggleInspector() {
	const panel = inspectorPanel.value;
	if (!panel) return;
	if (panel.isCollapsed) panel.expand();
	else panel.collapse();
}

// Which surface fills the main (left) area: the file preview, or the wide audit
// review. Only this pane swaps between modes — the sidebar (detection bar + tabs
// + chat) is one persistent panel throughout, so chat and its size are never
// rebuilt. Reviewing the audit big on the left is what "full-screen" means here.
const mainSurface = ref<"preview" | "audit">("preview");
// The audit review is only reachable once a detection has completed with findings
// — otherwise there's nothing to review. This gates the swap control and reverts
// to the preview if the findings go away (file switch, re-run).
const canReview = computed(
	() => detection.phase.value === "complete" && detection.count.value > 0,
);
watch(canReview, (ok) => {
	if (!ok) mainSurface.value = "preview";
});
// While the audit is the main surface, the sidebar hides its Audit tab (no point
// showing audit twice), so move an audit-focused sidebar off to Chat.
watch(mainSurface, (surface) => {
	if (surface === "audit" && panelTab.value === "audit")
		panelTab.value = "chat";
});

// Revealing an entity from the audit review steps back to the preview, focused on
// that entity, so the reviewer sees it in the document.
function revealEntity(id: string) {
	mainSurface.value = "preview";
	activeEntityId.value = id;
}

// The entity whose full audit trail the detail modal is showing, or null.
const auditModalEntity = ref<StudioEntityView | null>(null);

// The audit panel's props, shared verbatim by the split-view and full-screen
// renders so the two never drift; only `layout` and the event wiring differ.
const auditProps = computed(() => ({
	fileId: activeFile.value?.fileId || null,
	phase: detection.phase.value,
	entities: detection.entities.value,
	categorizedGroups: detection.categorizedGroups.value,
	count: detection.count.value,
	errorMessage: detection.errorMessage.value,
	activeEntityId: activeEntityId.value,
	withHeaders: withHeaders.value,
	redactPhase: redaction.redactPhase.value,
	canRedact: redaction.canRedact.value,
	redactError: redaction.redactError.value,
	output: redaction.output.value,
	suppressed: redaction.suppressed.value,
	added: redaction.addedEntities.value,
	effectiveRedactCount: redaction.effectiveRedactCount.value,
}));
</script>

<template>
  <div class="absolute inset-0 overflow-hidden bg-background flex">
    <!-- Open-file tabs live in the app header via the socket. -->
    <HeaderSocket>
      <StudioFileTabs />
    </HeaderSocket>

    <!-- Document canvas + inspector, split by a resizable, collapsible divider.
         The Splitter persists its layout (`auto-save-id`) across reloads. -->
    <ResizablePanelGroup
      direction="horizontal"
      auto-save-id="studio-inspector"
      class="h-full"
    >
      <!-- Main area: the file preview, or — in the full audit review — the wide
           audit table in its place. Only this pane swaps between the two modes;
           the sidebar (right) is one persistent panel throughout, so the chat and
           its size are never rebuilt. The content cross-fades on the swap. -->
      <ResizablePanel :min-size="30" class="min-w-0">
        <div class="relative h-full">
          <Transition name="main-fade">
            <StudioAuditTable
              v-if="mainSurface === 'audit'"
              class="absolute inset-0"
              :phase="detection.phase.value"
              :categorized-groups="detection.categorizedGroups.value"
              :count="detection.count.value"
              :error-message="detection.errorMessage.value"
              :suppressed="redaction.suppressed.value"
              @reveal-entity="revealEntity"
              @toggle-suppress="redaction.toggleSuppress"
              @view-details="auditModalEntity = $event"
            />
            <StudioDocumentPreview
              v-else
              class="absolute inset-0"
              :content-url="activeFile?.contentUrl || null"
              :display-name="activeFile?.displayName || ''"
              :file-extension="fileExtension"
              :is-loading="activeFile?.isLoading || false"
              :text-entities="redaction.highlightTextEntities.value"
              :active-entity-id="activeEntityId"
              :can-add="detection.phase.value === 'complete'"
              :audio-transcript-state="audioTranscriptState"
              :image-entities="redaction.highlightImageEntities.value"
              :image-ocr="imageOcr"
              :audio-entities="redaction.highlightAudioEntities.value"
              v-model:with-headers="withHeaders"
              @focus-entity="focusEntity"
              @clear-entity="clearEntity"
              @add-text-entity="redaction.addTextEntity($event)"
              @add-image-entity="redaction.addImageEntity($event)"
              @add-audio-entity="redaction.addAudioEntity($event)"
              @retag-audio-span="redaction.retagAudioSpan"
              @toggle-suppress="redaction.toggleSuppress"
            />
          </Transition>

          <!-- One floating control stack at the main pane's bottom-right, over
               WHICHEVER surface (preview or audit review): expand/exit the audit
               review on top, show/hide the sidebar below. -->
          <div class="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
            <Button
              v-if="canReview || mainSurface === 'audit'"
              variant="ghost"
              size="sm"
              class="h-7 w-7 rounded-md border border-neutral-200 bg-white p-0 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
              :aria-label="
                mainSurface === 'audit'
                  ? t('studio.audit.collapse')
                  : t('studio.audit.expand')
              "
              @click="mainSurface = mainSurface === 'audit' ? 'preview' : 'audit'"
            >
              <Minimize2 v-if="mainSurface === 'audit'" :size="14" />
              <Maximize2 v-else :size="14" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="h-7 w-7 rounded-md border border-neutral-200 bg-white p-0 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
              :aria-label="
                inspectorCollapsed
                  ? t('studio.preview.showInspector')
                  : t('studio.preview.hideInspector')
              "
              @click="toggleInspector"
            >
              <PanelRightClose v-if="!inspectorCollapsed" :size="14" />
              <PanelRightOpen v-else :size="14" />
            </Button>
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle with-handle />

      <!-- Inspector: Audit / Chat, with shared detection controls above the tabs.
           Collapses to nothing when the toolbar toggle hides it. -->
      <ResizablePanel
        ref="inspectorPanel"
        :default-size="28"
        :min-size="20"
        :max-size="45"
        collapsible
        :collapsed-size="0"
        class="min-w-0 bg-background"
        @collapse="inspectorCollapsed = true"
        @expand="inspectorCollapsed = false"
      >
        <div class="flex h-full min-w-0 flex-col overflow-hidden">
          <StudioDetectionBar
            v-model:selected-pipeline="detection.selectedPipeline.value"
            :pipelines="detection.pipelines.value"
            :phase="detection.phase.value"
            :can-run="detection.canRun.value"
            @run="detection.run"
          />
          <!-- While the audit is the main surface it's shown there in full, so the
               sidebar Audit tab is disabled (not removed — the chrome stays put),
               and the active tab moves to Chat. -->
          <Tabs v-model="panelTab" class="border-b border-border/50 p-2">
            <TabsList class="w-full">
              <TabsTrigger
                value="audit"
                class="flex-1 gap-1.5"
                :disabled="mainSurface === 'audit'"
              >
                <ScanSearch :size="14" />
                {{ t("studio.audit.tabAudit") }}
                <span
                  v-if="detection.count.value"
                  class="rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums"
                >
                  {{ detection.count.value }}
                </span>
              </TabsTrigger>
              <TabsTrigger value="chat" class="flex-1 gap-1.5">
                <MessageSquare :size="14" />
                {{ t("studio.audit.tabChat") }}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div
            v-show="panelTab === 'chat'"
            class="min-h-0 flex-1 overflow-hidden"
          >
            <StudioChatPanel />
          </div>
          <div
            v-show="panelTab === 'audit'"
            class="min-h-0 flex-1 overflow-hidden"
          >
            <StudioAuditPanel
              v-bind="auditProps"
              @focus-entity="focusEntity"
              @view-details="auditModalEntity = $event"
              @redact="redaction.redact"
              @download-output="redaction.downloadRedacted"
              @toggle-suppress="redaction.toggleSuppress"
              @remove-added="redaction.removeAdded"
            />
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>

    <!-- The full audit trail for a finding, opened from the review table. -->
    <EntityAuditModal
      :entity="auditModalEntity"
      @close="auditModalEntity = null"
    />
  </div>
</template>

<style scoped>
/* The main area cross-fades when it swaps between the file preview and the audit
   review. Both are absolutely positioned in the pane, so they overlap during the
   fade rather than one collapsing the layout. */
.main-fade-enter-active,
.main-fade-leave-active {
  transition: opacity 200ms ease;
}
.main-fade-enter-from,
.main-fade-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .main-fade-enter-active,
  .main-fade-leave-active {
    transition: opacity 80ms ease;
  }
}
</style>
