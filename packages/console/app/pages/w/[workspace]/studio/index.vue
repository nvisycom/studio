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

// File type detection (drives which preview renderer to show). Keyed off the
// file's real `fileExtension` from the API, not its display name — a redacted
// file is named `report.csv.redacted`, so the name's suffix would misread it.
const fileExtension = computed(() => activeFile.value?.fileExtension ?? "");
const isImageFile = computed(() => isImageExtension(fileExtension.value));
const isTextFile = computed(() => isTextExtension(fileExtension.value));
const isDocxFile = computed(() => isDocxExtension(fileExtension.value));

const zoomLevel = ref(100);

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
	[() => activeFile.value?.contentUrl, isTextFile],
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
	[() => activeFile.value?.contentUrl, isDocxFile],
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

// Detection run + audit state for the active file, shared between the detection bar
// (pipeline + detection controls), the audit panel (results list), and the document
// preview (inline highlights).
const audit = useStudioAudit(
	() => activeFile.value?.fileId ?? null,
	() => documentText.value,
	() => docxParts.value,
	() => activeFile.value?.displayName ?? null,
);

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

function zoomIn() {
	if (zoomLevel.value < 200) zoomLevel.value += 10;
}
function zoomOut() {
	if (zoomLevel.value > 50) zoomLevel.value -= 10;
}

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
  <div class="absolute inset-0 overflow-hidden bg-muted/30 flex">
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
          :is-image="isImageFile"
          :is-text="isTextFile"
          :is-docx="isDocxFile"
          :zoom-level="zoomLevel"
          :chat-visible="!inspectorCollapsed"
          :entities="audit.highlightEntities.value"
          :active-entity-id="activeEntityId"
          :can-add="audit.phase.value === 'complete'"
          v-model:with-headers="withHeaders"
          @zoom-in="zoomIn"
          @zoom-out="zoomOut"
          @toggle-chat="toggleInspector"
          @focus-entity="focusEntity"
          @clear-entity="clearEntity"
          @add-entity="audit.addEntity($event)"
          @toggle-suppress="audit.toggleSuppress"
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
            v-model:selected-pipeline="audit.selectedPipeline.value"
            :pipelines="audit.pipelines.value"
            :phase="audit.phase.value"
            :can-run="audit.canRun.value"
            @run="audit.run"
          />
          <Tabs v-model="panelTab" class="border-b border-border/50 p-2">
            <TabsList class="w-full">
              <TabsTrigger value="audit" class="flex-1 gap-1.5">
                <ScanSearch :size="14" />
                {{ t("studio.audit.tabAudit") }}
                <span
                  v-if="audit.count.value"
                  class="rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums"
                >
                  {{ audit.count.value }}
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
              :phase="audit.phase.value"
              :entities="audit.entities.value"
              :categorized-groups="audit.categorizedGroups.value"
              :count="audit.count.value"
              :error-message="audit.errorMessage.value"
              :active-entity-id="activeEntityId"
              :with-headers="withHeaders"
              :redact-phase="audit.redactPhase.value"
              :can-redact="audit.canRedact.value"
              :redact-error="audit.redactError.value"
              :output="audit.output.value"
              :suppressed="audit.suppressed.value"
              :added="audit.added.value"
              :effective-redact-count="audit.effectiveRedactCount.value"
              @focus-entity="focusEntity"
              @redact="audit.redact"
              @download-output="audit.downloadRedacted"
              @toggle-suppress="audit.toggleSuppress"
              @remove-added="audit.removeAdded"
            />
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>
</template>
