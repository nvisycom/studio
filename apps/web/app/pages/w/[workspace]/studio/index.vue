<script setup lang="ts">
import { useEventListener } from "@vueuse/core";
import { GripVertical, MessageSquare, ScanSearch } from "@lucide/vue";
import {
	StudioDocumentPreview,
	StudioChatPanel,
	StudioAuditPanel,
} from "#console/components/pages/studio";
import { Tabs, TabsList, TabsTrigger } from "#console/components/ui/tabs";
import type { TextEntityView } from "#console/composables/useTextEntities";

const { t } = useI18n();

useHead({ title: "Studio" });

definePageMeta({
	pageCategory: "header.category.studio",
});

// Use studio files store for persistent open files
const { activeFile, restoreSession } = useStudioFiles();

// After a refresh, re-open the tabs persisted for this workspace (client-only).
onMounted(() => {
	restoreSession();
});

// File type detection
const fileExtension = computed(() => {
	const fileName = activeFile.value?.displayName || "";
	const ext = fileName.split(".").pop()?.toLowerCase() || "";
	return ext;
});

const isImageFile = computed(() => {
	const imageExtensions = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"];
	return imageExtensions.includes(fileExtension.value);
});

const isTextFile = computed(() => {
	const textExtensions = [
		"txt",
		"md",
		"log",
		"csv",
		"json",
		"xml",
		"yaml",
		"yml",
	];
	return textExtensions.includes(fileExtension.value);
});

const zoomLevel = ref(100);

// Right-panel tabs: Chat (existing) and Audit (detection results).
const panelTab = ref<"chat" | "audit">("chat");

// Detected entities + cross-focus, shared between the audit panel (list) and
// the document preview (inline highlights).
const entities = ref<TextEntityView[]>([]);
const activeEntityId = ref<string | null>(null);

function focusEntity(id: string) {
	activeEntityId.value = activeEntityId.value === id ? null : id;
}

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
        :zoom-level="zoomLevel"
        :chat-visible="chatVisible"
        :entities="entities"
        :active-entity-id="activeEntityId"
        @zoom-in="zoomIn"
        @zoom-out="zoomOut"
        @toggle-chat="toggleChat"
        @focus-entity="focusEntity"
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

      <!-- Tabbed panel: Chat | Audit -->
      <div
        v-if="chatVisible || isAnimating"
        class="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-background"
      >
        <Tabs v-model="panelTab" class="border-b border-border/50 p-2">
          <TabsList class="w-full">
            <TabsTrigger value="chat" class="flex-1 gap-1.5">
              <MessageSquare :size="14" />
              {{ t("studio.audit.tabChat") }}
            </TabsTrigger>
            <TabsTrigger value="audit" class="flex-1 gap-1.5">
              <ScanSearch :size="14" />
              {{ t("studio.audit.tabAudit") }}
              <span
                v-if="entities.length"
                class="rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums"
              >
                {{ entities.length }}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div v-show="panelTab === 'chat'" class="min-h-0 flex-1 overflow-hidden">
          <StudioChatPanel />
        </div>
        <div v-show="panelTab === 'audit'" class="min-h-0 flex-1 overflow-hidden">
          <StudioAuditPanel
            :file-id="activeFile?.fileId || null"
            :active-entity-id="activeEntityId"
            @update:entities="entities = $event"
            @focus-entity="focusEntity"
          />
        </div>
      </div>
    </div>
  </div>
</template>
