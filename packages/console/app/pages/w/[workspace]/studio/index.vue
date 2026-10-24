<script setup lang="ts">
import { useEventListener } from "@vueuse/core";
import { SplitterPanel } from "reka-ui";
import { toast } from "vue-sonner";
import JSZip from "jszip";
import {
	Highlighter,
	Maximize2,
	Minimize2,
	PanelRightClose,
	PanelRightOpen,
} from "@lucide/vue";
import {
	StudioDocumentPreview,
	StudioAuditPanel,
	StudioAuditTable,
	StudioNewDetection,
	StudioDetectionSwitcher,
	StudioReview,
	StudioReviewFull,
	StudioAuditToolbar,
	EntityAuditModal,
} from "#console/components/pages/studio";
import { ExportToConnectionDialog } from "#console/components/pages/integrations";
import type { StudioEntityView } from "#console/composables/useStudioEntities";
import type { AudioTranscriptState } from "#console/components/pages/studio/preview/StudioAudioView.vue";
import { rendererFor } from "#console/components/pages/studio/preview/renderers";
import {
	ResizablePanelGroup,
	ResizablePanel,
	ResizableHandle,
} from "#console/components/ui/resizable";
import { Button } from "#console/components/ui/button";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "#console/components/ui/tabs";
import {
	HeaderSocket,
	StudioDocumentTabs,
} from "#console/components/layout/header";

const { t } = useI18n();

useHead({ title: "Studio" });

definePageMeta({
	pageCategory: "header.category.studio",
	// Hide the "Studio" breadcrumb so the open-file tabs get the full width.
	hideCategory: true,
});

// Use studio files store for persistent open files
const { activeFile, restoreSession } = useStudioDocuments();

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

// Cross-focus between the audit panel (list) and the document preview (inline
// highlights). The detected entities themselves come from the shared audit
// state below.
const activeEntityId = ref<string | null>(null);

// Whether a CSV's first row is a header. Shared so the audit list labels rows
// the same way the table renders them.
const withHeaders = ref(true);

// High-visibility highlights (persisted) — the audit toolbar toggles it; the
// document preview reads the same ref.
const { bold: highlightBold } = useStudioHighlight();

// Review count for the active document, shown as a badge on the Review tab (like
// the Audit tab's detection count). Shares its query cache with StudioReview, so
// the extra read is free.
const { reviews: documentReviews } = useDocumentReviews(
	computed(() => activeFile.value?.fileId ?? ""),
);

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
// shared between the detection bar (source + controls), the audit panel
// (results list), and the document preview (inline highlights).
// The active document's raw bytes, from the blob already loaded for preview.
// The on-device engine (offline) needs these; the server path ignores them.
async function documentBytes(): Promise<Uint8Array> {
	const url = activeFile.value?.contentUrl;
	if (!url) throw new Error("The document is not loaded yet.");
	return new Uint8Array(await (await fetch(url)).arrayBuffer());
}

const detection = useStudioDetection(
	() => activeFile.value?.fileId ?? null,
	() => documentText.value,
	() => docxParts.value,
	() => activeFile.value?.displayName ?? null,
	documentBytes,
);

// The inspector's two tabs: configuring a new detection, and the existing audit
// (pick + view a detection). On a file change, land on Audit when the file has
// detections to show, else on Detection so the user can run one — decided once
// when the FIRST file's detections resolve (the list loads async after open).
// After that the user owns the choice: switching files keeps the current panel
// tab rather than yanking back to Audit.
const panelTab = ref<"new" | "audit" | "review">("new");
let tabDecided = false;
watch(
	[() => activeFile.value?.fileId, () => detection.phase.value],
	([file, phase]) => {
		if (!tabDecided && file && phase !== "restoring") {
			tabDecided = true;
			panelTab.value = detection.detections.value.length ? "audit" : "new";
		}
	},
	{ immediate: true },
);
// Run a new detection, then switch to the Audit tab so its result shows.
function runNewDetection() {
	panelTab.value = "audit";
	detection.run();
}

// The full-screen audit toolbar's Run reuses whatever the Detect tab is
// configured with (labels or policies), so it shares the inspector's run gate.
function runFromAuditToolbar() {
	panelTab.value = "audit";
	detection.run();
}

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
	audit: detection.audit,
	documentBytes,
	entities: detection.entities,
	count: detection.count,
});

// Applying a redaction completes the Detect → Audit → Review progression, so move
// to the Review tab once it lands (on the transition to `done`).
watch(
	() => redaction.redactPhase.value,
	(phase, prev) => {
		if (phase === "done" && prev !== "done") panelTab.value = "review";
	},
);

function focusEntity(id: string) {
	activeEntityId.value = activeEntityId.value === id ? null : id;
}
function clearEntity() {
	activeEntityId.value = null;
}

// Export the redacted output to a file-service connection. The redaction's
// output carries a real workspace file id, so it exports like any other file.
const { connections, exportFilesAsync, isExporting } = useConnections();
const exportDialogOpen = ref(false);

function openExportRedacted() {
	if (redaction.output.value) exportDialogOpen.value = true;
}

async function handleExportRedacted(connectionId: string) {
	// Export-to-connection is server-only: it needs a stored output file id, which
	// a local (offline) redaction — raw bytes — doesn't have.
	const out = redaction.output.value;
	const fileId = out?.kind === "server" ? out.fileId : null;
	if (!fileId) return;
	try {
		await exportFilesAsync({ connectionId, fileIds: [fileId] });
		exportDialogOpen.value = false;
		toast.success(t("documents.messages.exportStarted"));
	} catch {
		toast.error(t("documents.errors.exportFailed"));
	}
}

// The entity whose full audit trail the detail modal is showing, or null.
const auditModalEntity = ref<StudioEntityView | null>(null);

// Close the modal if its source moves out from under it: switching files or a
// fresh detection run makes the held entity stale, and its trail would then
// describe the wrong file or run. The modal's own close event covers the
// ordinary dismiss.
watch(
	[
		() => activeFile.value?.fileId,
		() => detection.detectionId.value,
		() => detection.phase.value,
	],
	() => {
		auditModalEntity.value = null;
	},
);

// Escape steps back out one level per press, and only when there's a level to
// close, so it doesn't swallow Escape meant for another overlay. The modal owns
// its own Escape (the Dialog closes on it), so skip while it's open — otherwise
// one press would both close the modal and exit the review beneath it.
useEventListener(document, "keydown", (e: KeyboardEvent) => {
	if (e.key !== "Escape") return;
	if (auditModalEntity.value) return;
	if (mainSurface.value === "fullscreen") mainSurface.value = "preview";
	else if (activeEntityId.value) clearEntity();
});

// The right-hand audit inspector is a resizable, collapsible split panel. The
// Splitter owns sizing (percent-based), keyboard resize, and — via
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

// Which surface fills the main (left) area: the file preview, or — in full-screen
// — a wide tabbed surface (Detect / Audit / Review) in its place. Only this pane
// swaps; the inspector collapses in full-screen (the wide surface has its own
// tabs). `fullScreenTab` is which tab the wide surface shows.
const mainSurface = ref<"preview" | "fullscreen">("preview");
// Full-screen shows either the audit review or the review discussion (Detect has
// no wide form). Switched from the floating bottom panel.
const fullScreenTab = ref<"audit" | "review">("audit");

// Full-screen carries its own tabs + controls, so the inspector would only
// duplicate them — collapse it on entering full-screen, restore it on exit.
watch(mainSurface, (surface) => {
	const panel = inspectorPanel.value;
	if (!panel) return;
	if (surface === "fullscreen") panel.collapse();
	else panel.expand();
});

// Open full-screen on the tab the user is already looking at — but Detect has no
// wide form, so from Detect we open on Audit.
function enterFullScreen() {
	fullScreenTab.value = panelTab.value === "review" ? "review" : "audit";
	mainSurface.value = "fullscreen";
}

// Revealing an entity from the wide audit table steps back to the preview, focused
// on that entity, so the reviewer sees it in the document.
function revealEntity(id: string) {
	mainSurface.value = "preview";
	activeEntityId.value = id;
}

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
      <StudioDocumentTabs />
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
            <!-- Full-screen: a wide surface showing the Audit table or the Review
                 discussion. Switching between the two happens on the floating
                 bottom panel (not a top tab bar); the inspector is collapsed. -->
            <div
              v-if="mainSurface === 'fullscreen'"
              class="absolute inset-0 bg-background"
            >
              <!-- Audit (wide): the table + floating run/redact toolbar. -->
              <template v-if="fullScreenTab === 'audit'">
                <StudioAuditTable
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
                <div
                  class="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-6"
                >
                  <StudioAuditToolbar
                    class="pointer-events-auto"
                    :phase="detection.phase.value"
                    :can-run="detection.canRun.value"
                    :redact-phase="redaction.redactPhase.value"
                    :can-redact="redaction.canRedact.value"
                    :redact-error="redaction.redactError.value"
                    :output="redaction.output.value"
                    :count="detection.count.value"
                    :effective-redact-count="redaction.effectiveRedactCount.value"
                    @run="runFromAuditToolbar"
                    @redact="redaction.redact"
                    @download-output="redaction.downloadRedacted"
                    @export-output="openExportRedacted"
                  />
                </div>
              </template>

              <!-- Review (wide): the full-size review layout. -->
              <StudioReviewFull
                v-else
                class="absolute inset-0"
                :document-id="activeFile?.fileId ?? null"
                :document-name="activeFile?.displayName ?? null"
                :detection-id="detection.detectionId.value"
              />
            </div>
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

          <!-- Floating controls, bottom-right, over whichever surface. In
               full-screen it switches Audit / Review; otherwise it toggles the
               inspector. Enter/exit full-screen is always available. -->
          <div
            v-if="activeFile"
            class="absolute bottom-6 right-6 z-20 flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white p-0.5 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
          >
            <!-- Full-screen: Audit / Review switch. -->
            <template v-if="mainSurface === 'fullscreen'">
              <Button
                v-for="tab in (['audit', 'review'] as const)"
                :key="tab"
                variant="ghost"
                size="sm"
                class="h-7 gap-1.5 px-3 font-normal"
                :class="
                  fullScreenTab === tab
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground'
                "
                @click="fullScreenTab = tab"
              >
                {{
                  tab === "audit"
                    ? t("studio.detections.auditTab")
                    : t("studio.detections.reviewTab")
                }}
                <span
                  v-if="tab === 'audit' && detection.detections.value.length"
                  class="rounded-full bg-foreground/10 px-1.5 text-[10px] font-semibold leading-4 text-foreground/70"
                >
                  {{ detection.detections.value.length }}
                </span>
                <span
                  v-else-if="tab === 'review' && documentReviews.length"
                  class="rounded-full bg-foreground/10 px-1.5 text-[10px] font-semibold leading-4 text-foreground/70"
                >
                  {{ documentReviews.length }}
                </span>
              </Button>
              <div class="mx-0.5 h-5 w-px bg-border" />
            </template>

            <!-- Preview: show/hide the inspector. -->
            <Button
              v-else
              variant="ghost"
              size="icon"
              class="size-7"
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

            <!-- Enter / exit full-screen (always). -->
            <Button
              variant="ghost"
              size="icon"
              class="size-7"
              :aria-label="
                mainSurface === 'fullscreen'
                  ? t('studio.fullScreen.exit')
                  : t('studio.fullScreen.enter')
              "
              @click="
                mainSurface === 'fullscreen'
                  ? (mainSurface = 'preview')
                  : enterFullScreen()
              "
            >
              <Minimize2 v-if="mainSurface === 'fullscreen'" :size="14" />
              <Maximize2 v-else :size="14" />
            </Button>
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle with-handle />

      <!-- Inspector: the detection controls above the audit review. Collapses to
           nothing when the toolbar toggle hides it. (The assistant chat is the
           global right rail now, not a tab here.) -->
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
        <!-- Two tabs: the existing audit (pick which detection to view + its
             entities) and configuring a new detection. -->
        <Tabs
          v-model="panelTab"
          class="flex h-full min-w-0 flex-col overflow-hidden gap-0"
        >
          <TabsList class="h-9 w-full shrink-0 gap-0 rounded-none border-b border-border/50 bg-transparent p-0">
            <TabsTrigger
              value="new"
              class="h-9 flex-1 rounded-none border-0 border-b-2 border-transparent bg-transparent text-muted-foreground shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              {{ t("studio.detections.detectTab") }}
            </TabsTrigger>
            <TabsTrigger
              value="audit"
              class="h-9 flex-1 gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent text-muted-foreground shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              {{ t("studio.detections.auditTab") }}
              <span
                v-if="detection.detections.value.length"
                class="rounded-full bg-foreground/10 px-1.5 text-[10px] font-semibold leading-4 text-foreground/70"
              >
                {{ detection.detections.value.length }}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="review"
              class="h-9 flex-1 gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent text-muted-foreground shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              {{ t("studio.detections.reviewTab") }}
              <span
                v-if="documentReviews.length"
                class="rounded-full bg-foreground/10 px-1.5 text-[10px] font-semibold leading-4 text-foreground/70"
              >
                {{ documentReviews.length }}
              </span>
            </TabsTrigger>
          </TabsList>

          <!-- Audit: the detection switcher + the selected detection's entities. -->
          <TabsContent
            value="audit"
            class="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div
              v-if="detection.detections.value.length"
              class="flex shrink-0 items-center gap-2 border-b px-2 py-1.5"
            >
              <div class="min-w-0 flex-1">
                <StudioDetectionSwitcher
                  :detections="detection.detections.value"
                  :selected-detection-id="detection.selectedDetectionId.value"
                  @select="detection.loadDetection"
                />
              </div>
              <!-- Highlight visibility: subtle underline vs. a bold fill. A
                   labelled toggle, not a bare icon, so it reads as a control. -->
              <!-- Fixed variant (always `outline`) so toggling the state doesn't
                   add/remove a border and resize the button; on/off reads from the
                   fill + icon colour only. -->
              <Button
                variant="outline"
                size="sm"
                class="h-8 shrink-0 gap-1.5 px-2.5 font-normal"
                :class="highlightBold ? 'bg-secondary' : ''"
                :aria-pressed="highlightBold"
                :title="t('studio.audit.highlight.hint')"
                @click="highlightBold = !highlightBold"
              >
                <Highlighter
                  :size="15"
                  :class="
                    highlightBold ? 'text-primary' : 'text-muted-foreground'
                  "
                />
                <span class="text-sm">{{ t("studio.audit.highlight.label") }}</span>
              </Button>
            </div>
            <div class="min-h-0 flex-1 overflow-hidden">
              <StudioAuditPanel
                v-bind="auditProps"
                @focus-entity="focusEntity"
                @view-details="auditModalEntity = $event"
                @redact="redaction.redact"
                @download-output="redaction.downloadRedacted"
                @export-output="openExportRedacted"
                @toggle-suppress="redaction.toggleSuppress"
                @remove-added="redaction.removeAdded"
              />
            </div>
          </TabsContent>

          <!-- New detection: one source (labels / policies) + scope. -->
          <TabsContent
            value="new"
            class="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <StudioNewDetection
              v-model:source="detection.newSource.value"
              v-model:labels="detection.newLabels.value"
              v-model:policy-ids="detection.newPolicyIds.value"
              v-model:countries="detection.newCountries.value"
              v-model:languages="detection.newLanguages.value"
              :policies="detection.policies.value"
              :phase="detection.phase.value"
              :can-run="detection.canRun.value"
              @run="runNewDetection"
            />
          </TabsContent>

          <!-- Review: the document's review discussion + sign-off (the third
               step after Detect and Audit). -->
          <TabsContent
            value="review"
            class="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <StudioReview
              :document-id="activeFile?.fileId ?? null"
              :document-name="activeFile?.displayName ?? null"
              :detection-id="detection.detectionId.value"
            />
          </TabsContent>
        </Tabs>
      </ResizablePanel>
    </ResizablePanelGroup>

    <!-- The full audit trail for a finding, opened from the review table. -->
    <EntityAuditModal
      :entity="auditModalEntity"
      @close="auditModalEntity = null"
    />

    <!-- Export the redacted output to a cloud file-service connection. -->
    <ExportToConnectionDialog
      v-model:open="exportDialogOpen"
      :file-ids="redaction.output.value?.kind === 'server' ? [redaction.output.value.fileId] : []"
      :connections="connections ?? []"
      :is-loading="isExporting"
      @export="handleExportRedacted"
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
