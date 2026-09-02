<script setup lang="ts">
import { useEventListener } from "@vueuse/core";
import { SplitterPanel } from "reka-ui";
import JSZip from "jszip";
import { MessageSquare, ScanSearch } from "@lucide/vue";
import {
	StudioDocumentPreview,
	StudioChatPanel,
	StudioAuditPanel,
	StudioDetectionBar,
} from "#console/components/pages/studio";
import type { AudioTranscriptState } from "#console/components/pages/studio/preview/StudioAudioView.vue";
import { rendererFor } from "#console/components/pages/studio/preview/renderers";
import {
	ResizablePanelGroup,
	ResizablePanel,
	ResizableHandle,
} from "#console/components/ui/resizable";
import { Tabs, TabsList, TabsTrigger } from "#console/components/ui/tabs";
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
			const body = set?.body;
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
			const body = set?.body;
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
// Escape clears the entity selection — but only when one is active, so it
// doesn't swallow Escape meant for another open overlay (chat input, dialog).
useEventListener(document, "keydown", (e: KeyboardEvent) => {
	if (e.key === "Escape" && activeEntityId.value) clearEntity();
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
      <!-- Document canvas -->
      <ResizablePanel :min-size="30" class="min-w-0">
        <StudioDocumentPreview
          :content-url="activeFile?.contentUrl || null"
          :display-name="activeFile?.displayName || ''"
          :file-extension="fileExtension"
          :is-loading="activeFile?.isLoading || false"
          :chat-visible="!inspectorCollapsed"
          :text-entities="redaction.highlightTextEntities.value"
          :active-entity-id="activeEntityId"
          :can-add="detection.phase.value === 'complete'"
          :audio-transcript-state="audioTranscriptState"
          :image-entities="redaction.highlightImageEntities.value"
          :image-ocr="imageOcr"
          :audio-entities="redaction.highlightAudioEntities.value"
          v-model:with-headers="withHeaders"
          @toggle-chat="toggleInspector"
          @focus-entity="focusEntity"
          @clear-entity="clearEntity"
          @add-text-entity="redaction.addTextEntity($event)"
          @add-image-entity="redaction.addImageEntity($event)"
          @add-audio-entity="redaction.addAudioEntity($event)"
          @retag-audio-span="redaction.retagAudioSpan"
          @toggle-suppress="redaction.toggleSuppress"
        />
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
          <Tabs v-model="panelTab" class="border-b border-border/50 p-2">
            <TabsList class="w-full">
              <TabsTrigger value="audit" class="flex-1 gap-1.5">
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
              :file-id="activeFile?.fileId || null"
              :phase="detection.phase.value"
              :entities="detection.entities.value"
              :categorized-groups="detection.categorizedGroups.value"
              :count="detection.count.value"
              :error-message="detection.errorMessage.value"
              :active-entity-id="activeEntityId"
              :with-headers="withHeaders"
              :redact-phase="redaction.redactPhase.value"
              :can-redact="redaction.canRedact.value"
              :redact-error="redaction.redactError.value"
              :output="redaction.output.value"
              :suppressed="redaction.suppressed.value"
              :added="redaction.addedEntities.value"
              :effective-redact-count="redaction.effectiveRedactCount.value"
              @focus-entity="focusEntity"
              @redact="redaction.redact"
              @download-output="redaction.downloadRedacted"
              @toggle-suppress="redaction.toggleSuppress"
              @remove-added="redaction.removeAdded"
            />
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>
</template>
