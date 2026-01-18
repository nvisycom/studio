<template>
  <div class="flex flex-col h-full w-full bg-background">
    <!-- Header (full width at top) -->
    <EditorHeader
      :open-tabs="openTabs"
      :active-tab-id="activeTabId"
      v-model:view-mode="viewMode"
      :always-on-top="alwaysOnTop"
      :sidebar-collapsed="sidebarCollapsed"
      @select-tab="activeTabId = $event"
      @close-tab="closeDocumentTab"
      @toggle-always-on-top="toggleAlwaysOnTop"
      @toggle-sidebar="sidebarCollapsed = !sidebarCollapsed"
    />

    <!-- Main content area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left sidebar: Files/Documents -->
      <EditorSidebar
        :documents="documents"
        :active-tab-id="activeTabId"
        :collapsed="sidebarCollapsed"
        @open-document="openDocument"
        @remove-document="removeDocument"
        @add-document="selectDocument"
      />

      <!-- Center + Right: Resizable panels -->
      <ResizablePanelGroup direction="horizontal" class="flex-1">
        <!-- Center: Document preview -->
        <ResizablePanel :default-size="65" :min-size="30">
          <EditorPreview
            :active-document="activeDocument"
            @add-document="selectDocument"
          />
        </ResizablePanel>

        <ResizableHandle with-handle />

        <!-- Right panel: Tools (Chat, etc.) -->
        <ResizablePanel :default-size="35" :min-size="20" :max-size="50">
          <EditorChat
            ref="chatRef"
            :messages="messages"
            :is-typing="isTyping"
            :view-mode="viewMode"
            @send-message="sendMessage"
            @edit-message="editMessage"
            @regenerate-message="regenerateMessage"
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>

    <!-- Footer -->
    <EditorFooter />
  </div>
</template>

<script setup lang="ts">
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/plugin-dialog";
import type EditorChat from "~/components/editor/EditorChat.vue";

definePageMeta({
	layout: "editor",
});

interface Document {
	name: string;
	path: string;
}

interface Message {
	id: number;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
	liked?: boolean;
	disliked?: boolean;
}

interface Tab {
	id: string;
	name: string;
	path: string;
}

// Refs
const chatRef = ref<InstanceType<typeof EditorChat>>();

// State
const isTyping = ref(false);
const _viewMode = ref<"chat" | "edit">("chat");
const alwaysOnTop = ref(false);
const _sidebarCollapsed = ref(false);

// Documents and tabs
const documents = ref<Document[]>([]);
const openTabs = ref<Tab[]>([]);
const activeTabId = ref<string | null>(null);

// Messages
const messages = ref<Message[]>([]);
let messageIdCounter = 0;

// Computed
const _activeDocument = computed(() => {
	if (!activeTabId.value) return null;
	return documents.value.find((d) => d.path === activeTabId.value) || null;
});

// Toggle always on top
const _toggleAlwaysOnTop = async () => {
	const appWindow = getCurrentWindow();
	alwaysOnTop.value = !alwaysOnTop.value;
	try {
		await appWindow.setAlwaysOnTop(alwaysOnTop.value);
	} catch (error) {
		console.error("Failed to set always on top:", error);
		// Revert state on error
		alwaysOnTop.value = !alwaysOnTop.value;
	}
};

// Sync window state on mount
onMounted(async () => {
	const appWindow = getCurrentWindow();
	try {
		// Ensure window state matches our initial state
		await appWindow.setAlwaysOnTop(alwaysOnTop.value);
	} catch (error) {
		console.error("Failed to sync window state:", error);
	}
});

// Select document from Finder
const _selectDocument = async () => {
	const selected = await open({
		multiple: true,
		filters: [
			{
				name: "Documents",
				extensions: ["pdf", "docx", "doc", "txt", "md", "rtf"],
			},
		],
	});

	if (selected) {
		const paths = Array.isArray(selected) ? selected : [selected];
		for (const path of paths) {
			if (!documents.value.find((d) => d.path === path)) {
				const name = path.split("/").pop() || path;
				documents.value.push({ name, path });
				openDocument({ name, path });
			}
		}
	}
};

// Open document in tab
const openDocument = (doc: Document) => {
	if (!openTabs.value.find((t) => t.id === doc.path)) {
		openTabs.value.push({ id: doc.path, name: doc.name, path: doc.path });
	}
	activeTabId.value = doc.path;
};

// Close document tab
const closeDocumentTab = (tabId: string) => {
	const index = openTabs.value.findIndex((t) => t.id === tabId);
	if (index !== -1) {
		openTabs.value.splice(index, 1);
		if (activeTabId.value === tabId) {
			activeTabId.value = openTabs.value[Math.max(0, index - 1)]?.id || null;
		}
	}
};

// Remove document
const _removeDocument = (doc: Document) => {
	documents.value = documents.value.filter((d) => d.path !== doc.path);
	closeDocumentTab(doc.path);
};

// Edit message - set input to message content
const _editMessage = (message: Message) => {
	chatRef.value?.setInputMessage(message.content);
};

// Regenerate message
const _regenerateMessage = async (message: Message) => {
	const index = messages.value.findIndex((m) => m.id === message.id);
	if (index > 0) {
		messages.value = messages.value.slice(0, index);
		isTyping.value = true;
		await new Promise((r) => setTimeout(r, 1500));
		isTyping.value = false;
		messages.value.push({
			id: messageIdCounter++,
			role: "assistant",
			content: "Regenerated response placeholder.",
			timestamp: new Date(),
		});
	}
};

// Send message
const _sendMessage = async (content: string) => {
	messages.value.push({
		id: messageIdCounter++,
		role: "user",
		content,
		timestamp: new Date(),
	});

	isTyping.value = true;
	await new Promise((r) => setTimeout(r, 1500));
	isTyping.value = false;

	messages.value.push({
		id: messageIdCounter++,
		role: "assistant",
		content: "This is a placeholder response. AI integration coming soon.",
		timestamp: new Date(),
	});
};
</script>
