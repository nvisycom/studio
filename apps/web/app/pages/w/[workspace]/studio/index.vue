<script setup lang="ts">
import { useEventListener } from "@vueuse/core";
import JSZip from "jszip";
import { GripVertical, MessageSquare, ScanSearch } from "@lucide/vue";
import {
	StudioDocumentPreview,
	StudioChatPanel,
	StudioAuditPanel,
	StudioRunBar,
} from "#console/components/pages/studio";
import { Tabs, TabsList, TabsTrigger } from "#console/components/ui/tabs";

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

// File type detection (drives which preview renderer to show).
const isImageFile = computed(() =>
	isImageFileName(activeFile.value?.displayName ?? ""),
);
const isTextFile = computed(() =>
	isTextFileName(activeFile.value?.displayName ?? ""),
);
const isDocxFile = computed(() =>
	isDocxFileName(activeFile.value?.displayName ?? ""),
);

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

// Detection run + audit state for the active file, shared between the run bar
// (pipeline + run controls), the audit panel (results list), and the document
// preview (inline highlights).
const audit = useStudioAudit(
	() => activeFile.value?.fileId ?? null,
	() => documentText.value,
	() => docxParts.value,
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

// Chat panel state
const chatVisible = ref(true);
const chatWidth = ref(400);
const savedChatWidth = ref(400);
const isAnimating = ref(false);
const isResizing = ref(false);

const minChatWidth = 320;
const maxChatWidth = 800;

function zoomIn() {
	if (zoomLevel.value < 200) {
		zoomLevel.value += 10;
	}
}

function zoomOut() {
	if (zoomLevel.value > 50) {
		zoomLevel.value -= 10;
	}
}

function toggleChat() {
	if (isAnimating.value) return;

	isAnimating.value = true;

	if (chatVisible.value) {
		// Save current width before closing
		savedChatWidth.value = chatWidth.value;
		chatWidth.value = 0;
		setTimeout(() => {
			chatVisible.value = false;
			isAnimating.value = false;
		}, 300);
	} else {
		// Restore saved width
		chatVisible.value = true;
		nextTick(() => {
			chatWidth.value = savedChatWidth.value;
			setTimeout(() => {
				isAnimating.value = false;
			}, 300);
		});
	}
}

// Resize handling. useEventListener auto-removes on scope dispose, so a
// mid-drag unmount can't leak document listeners.
function startResize(e: MouseEvent) {
	if (isAnimating.value) return;

	isResizing.value = true;
	const startX = e.clientX;
	const startWidth = chatWidth.value;

	const stopMove = useEventListener(document, "mousemove", (ev: MouseEvent) => {
		const delta = startX - ev.clientX;
		chatWidth.value = Math.min(
			Math.max(startWidth + delta, minChatWidth),
			maxChatWidth,
		);
	});

	const stopUp = useEventListener(document, "mouseup", () => {
		isResizing.value = false;
		stopMove();
		stopUp();
	});
}
</script>

<template>
  <div class="absolute inset-0 overflow-hidden bg-muted/30 flex">
    <!-- Main Canvas Panel -->
    <div class="flex-1 min-w-0 h-full">
      <StudioDocumentPreview
        :content-url="activeFile?.contentUrl || null"
        :display-name="activeFile?.displayName || ''"
        :is-loading="activeFile?.isLoading || false"
        :is-image="isImageFile"
        :is-text="isTextFile"
        :is-docx="isDocxFile"
        :zoom-level="zoomLevel"
        :chat-visible="chatVisible"
        :entities="audit.entities.value"
        :active-entity-id="activeEntityId"
        v-model:with-headers="withHeaders"
        @zoom-in="zoomIn"
        @zoom-out="zoomOut"
        @toggle-chat="toggleChat"
        @focus-entity="focusEntity"
        @clear-entity="clearEntity"
      />
    </div>

    <!-- Chat Panel with Resize Handle -->
    <div
      class="h-full flex overflow-hidden"
      :class="{ 'transition-[width] duration-300 ease-in-out': !isResizing }"
      :style="{ width: chatVisible || isAnimating ? `${chatWidth}px` : '0px' }"
    >
      <!-- Resize Handle -->
      <div
        v-if="chatVisible"
        class="w-px h-full cursor-col-resize flex items-center justify-center bg-border relative after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 flex-shrink-0 group"
        @mousedown="startResize"
      >
        <div
          class="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border"
        >
          <GripVertical class="size-2.5" />
        </div>
      </div>

      <!-- Tabbed panel: Chat | Audit, with run controls above the tabs so
           they're shared across both tabs. -->
      <div
        v-if="chatVisible || isAnimating"
        class="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-background"
      >
        <StudioRunBar
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

        <div v-show="panelTab === 'chat'" class="min-h-0 flex-1 overflow-hidden">
          <StudioChatPanel />
        </div>
        <div v-show="panelTab === 'audit'" class="min-h-0 flex-1 overflow-hidden">
          <StudioAuditPanel
            :file-id="activeFile?.fileId || null"
            :phase="audit.phase.value"
            :entities="audit.entities.value"
            :categorized-groups="audit.categorizedGroups.value"
            :count="audit.count.value"
            :error-message="audit.errorMessage.value"
            :active-entity-id="activeEntityId"
            :with-headers="withHeaders"
            @focus-entity="focusEntity"
          />
        </div>
      </div>
    </div>
  </div>
</template>
