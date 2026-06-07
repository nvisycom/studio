<script setup lang="ts">
import { computed } from "vue";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StudioFileTabs from "./StudioFileTabs.vue";
import EditorWorkflowTabs from "./EditorWorkflowTabs.vue";
import {
	Settings,
	Key,
	User,
	Bell,
	BarChart3,
	Cpu,
	FileSearch,
	Plug,
	Library,
	Database,
	PlayCircle,
	FolderOpen,
	Workflow,
} from "@lucide/vue";

const route = useRoute();
const { t } = useI18n();

// Check if current route should show tabs
const showIntegrationTabs = computed(() =>
	route.path.startsWith("/integrations"),
);

const showFilesTabs = computed(() => route.path.startsWith("/files"));

// Workflows pages show workflow tabs
const showWorkflowsTabs = computed(() => route.path.startsWith("/workflows"));

// Studio pages show file tabs only (not navigation tabs)
const showStudioTabs = computed(() => route.path.startsWith("/studio"));

// Editor pages show workflow tabs
const showEditorTabs = computed(() => route.path.startsWith("/editor"));

const showSettingsTabs = computed(() => route.path.startsWith("/settings"));

const showAccountTabs = computed(() => route.path.startsWith("/account"));

const showAnalyticsTabs = computed(() => route.path.startsWith("/analytics"));

const currentIntegrationTab = computed(() =>
	route.path === "/integrations/explore" ? "library" : "active",
);

const currentSettingsTab = computed(() => {
	if (route.path === "/settings/notifications") return "notifications";
	return "general";
});

const currentAccountTab = computed(() => {
	if (route.path === "/account/tokens") return "tokens";
	if (route.path === "/account/general") return "general";
	return "general";
});

const currentAnalyticsTab = computed(() => {
	if (route.path === "/analytics/ai") return "ai";
	if (route.path.startsWith("/analytics/logs")) return "logs";
	return "overview";
});

const currentIntegrationTabValue = computed(() => {
	if (route.path === "/integrations/explore") return "explore";
	if (route.path === "/integrations/runs") return "runs";
	return "connections";
});

const currentFilesTab = computed(() => {
	if (route.path === "/files/corpus") return "corpus";
	return "files";
});

const currentWorkflowsTab = computed(() => {
	if (route.path === "/workflows/runs") return "runs";
	return "workflows";
});

const isStudioPage = computed(() => route.path === "/studio");

// Computed to check if any tabs are visible
const hasVisibleTabs = computed(() => {
	return (
		showIntegrationTabs.value ||
		showFilesTabs.value ||
		showWorkflowsTabs.value ||
		showStudioTabs.value ||
		showEditorTabs.value ||
		showSettingsTabs.value ||
		showAccountTabs.value ||
		showAnalyticsTabs.value
	);
});

// Expose for parent component
defineExpose({
	hasVisibleTabs,
});
</script>

<template>
  <!-- Integration Tabs -->
  <Tabs v-if="showIntegrationTabs" :model-value="currentIntegrationTabValue">
    <TabsList>
      <TabsTrigger value="connections" as-child>
        <NuxtLink to="/integrations" class="flex items-center gap-2">
          <Plug :size="16" />
          {{ t("header.tabs.integrations.connections") }}
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="explore" as-child>
        <NuxtLink to="/integrations/explore" class="flex items-center gap-2">
          <Library :size="16" />
          {{ t("header.tabs.integrations.explore") }}
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="runs" as-child>
        <NuxtLink to="/integrations/runs" class="flex items-center gap-2">
          <PlayCircle :size="16" />
          {{ t("header.tabs.integrations.runs") }}
        </NuxtLink>
      </TabsTrigger>
    </TabsList>
  </Tabs>

  <!-- Files Tabs -->
  <Tabs v-else-if="showFilesTabs" :model-value="currentFilesTab">
    <TabsList>
      <TabsTrigger value="files" as-child>
        <NuxtLink to="/files" class="flex items-center gap-2">
          <FolderOpen :size="16" />
          {{ t("header.tabs.files.index") }}
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="corpus" as-child>
        <NuxtLink to="/files/corpus" class="flex items-center gap-2">
          <Database :size="16" />
          {{ t("header.tabs.files.corpus") }}
        </NuxtLink>
      </TabsTrigger>
    </TabsList>
  </Tabs>

  <!-- Workflows Tabs -->
  <Tabs v-else-if="showWorkflowsTabs" :model-value="currentWorkflowsTab">
    <TabsList>
      <TabsTrigger value="workflows" as-child>
        <NuxtLink to="/workflows" class="flex items-center gap-2">
          <Workflow :size="16" />
          {{ t("header.tabs.workflows.index") }}
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="runs" as-child>
        <NuxtLink to="/workflows/runs" class="flex items-center gap-2">
          <PlayCircle :size="16" />
          {{ t("header.tabs.workflows.runs") }}
        </NuxtLink>
      </TabsTrigger>
    </TabsList>
  </Tabs>

  <!-- Studio File Tabs (shown on all studio pages including chat) -->
  <StudioFileTabs v-else-if="showStudioTabs" />

  <!-- Editor Workflow Tabs -->
  <EditorWorkflowTabs v-else-if="showEditorTabs" />

  <!-- Settings Tabs (Workspace Settings) -->
  <Tabs v-else-if="showSettingsTabs" :model-value="currentSettingsTab">
    <TabsList>
      <TabsTrigger value="general" as-child>
        <NuxtLink to="/settings/general" class="flex items-center gap-2">
          <Settings :size="16" />
          {{ t("header.tabs.settings.general") }}
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="notifications" as-child>
        <NuxtLink to="/settings/notifications" class="flex items-center gap-2">
          <Bell :size="16" />
          {{ t("header.tabs.settings.notifications") }}
        </NuxtLink>
      </TabsTrigger>
    </TabsList>
  </Tabs>

  <!-- Account Tabs (User Account Settings) -->
  <Tabs v-else-if="showAccountTabs" :model-value="currentAccountTab">
    <TabsList>
      <TabsTrigger value="general" as-child>
        <NuxtLink to="/account/general" class="flex items-center gap-2">
          <User :size="16" />
          {{ t("header.tabs.account.general") }}
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="tokens" as-child>
        <NuxtLink to="/account/tokens" class="flex items-center gap-2">
          <Key :size="16" />
          {{ t("header.tabs.account.tokens") }}
        </NuxtLink>
      </TabsTrigger>
    </TabsList>
  </Tabs>

  <!-- Analytics Tabs -->
  <Tabs v-else-if="showAnalyticsTabs" :model-value="currentAnalyticsTab">
    <TabsList>
      <TabsTrigger value="overview" as-child>
        <NuxtLink to="/analytics" class="flex items-center gap-2">
          <BarChart3 :size="16" />
          {{ t("header.tabs.analytics.overview") }}
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="ai" as-child>
        <NuxtLink to="/analytics/ai" class="flex items-center gap-2">
          <Cpu :size="16" />
          {{ t("header.tabs.analytics.ai") }}
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="logs" as-child>
        <NuxtLink to="/analytics/logs" class="flex items-center gap-2">
          <FileSearch :size="16" />
          {{ t("header.tabs.analytics.logs") }}
        </NuxtLink>
      </TabsTrigger>
    </TabsList>
  </Tabs>
</template>
