<script setup lang="ts">
import { Tabs, TabsList, TabsTrigger } from "#console/components/ui/tabs";
import FilesHeaderControls from "./FilesHeaderControls.vue";
import StudioFileTabs from "./StudioFileTabs.vue";
import {
	Settings,
	Key,
	User,
	Bell,
	BarChart3,
	Cpu,
	FileSearch,
	Plug,
	Compass,
	Database,
	History,
	Workflow,
	ShieldCheck,
	LayoutTemplate,
} from "@lucide/vue";

const route = useRoute();
const { t } = useI18n();
const { wLink } = useWorkspaceLink();

// Workspace feature routes live under /w/{slug}/... — match tabs against the
// path with that prefix stripped so the checks stay slug-agnostic. Non-scoped
// routes (/account/...) pass through unchanged.
const subPath = computed(() => route.path.replace(/^\/w\/[^/]+/, "") || "/");

// Check if current route should show tabs
const showConnectionTabs = computed(() =>
	subPath.value.startsWith("/integrations"),
);

// Workflows pages show workflow tabs
const showWorkflowsTabs = computed(() =>
	subPath.value.startsWith("/workflows"),
);

// Studio pages show file tabs only (not navigation tabs)
const showStudioTabs = computed(() => subPath.value.startsWith("/studio"));

// Files page shows its controls (search, filters, view toggle, upload).
const showFilesControls = computed(() => subPath.value.startsWith("/files"));

const showSettingsTabs = computed(() => subPath.value.startsWith("/settings"));

const showAccountTabs = computed(() => route.path.startsWith("/account"));

const showAnalyticsTabs = computed(() =>
	subPath.value.startsWith("/analytics"),
);

const showPoliciesTabs = computed(() => subPath.value.startsWith("/policies"));

const currentPoliciesTab = computed(() => {
	if (subPath.value.startsWith("/policies/templates")) return "templates";
	return "policies";
});

const currentSettingsTab = computed(() => {
	if (subPath.value === "/settings/data") return "data";
	if (subPath.value === "/settings/notifications") return "notifications";
	return "general";
});

const currentAccountTab = computed(() => {
	if (route.path === "/account/tokens") return "tokens";
	if (route.path === "/account/general") return "general";
	return "general";
});

const currentAnalyticsTab = computed(() => {
	if (subPath.value === "/analytics/ai") return "ai";
	if (subPath.value.startsWith("/analytics/logs")) return "logs";
	return "overview";
});

const currentConnectionTabValue = computed(() => {
	if (subPath.value === "/integrations/explore") return "explore";
	if (subPath.value === "/integrations/runs") return "runs";
	return "connections";
});

const currentWorkflowsTab = computed(() => {
	if (subPath.value === "/workflows/runs") return "runs";
	return "workflows";
});

const isStudioPage = computed(() => subPath.value === "/studio");

// Computed to check if any tabs are visible
const hasVisibleTabs = computed(() => {
	return (
		showConnectionTabs.value ||
		showWorkflowsTabs.value ||
		showStudioTabs.value ||
		showFilesControls.value ||
		showSettingsTabs.value ||
		showAccountTabs.value ||
		showAnalyticsTabs.value ||
		showPoliciesTabs.value
	);
});

// Expose for parent component
defineExpose({
	hasVisibleTabs,
});
</script>

<template>
  <!-- Connection Tabs -->
  <Tabs v-if="showConnectionTabs" :model-value="currentConnectionTabValue">
    <TabsList>
      <TabsTrigger value="connections" as-child>
        <NuxtLink :to="wLink('/integrations')" class="flex items-center gap-2">
          <Plug :size="16" />
          {{ t("header.tabs.connections.connections") }}
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="explore" as-child>
        <NuxtLink :to="wLink('/integrations/explore')" class="flex items-center gap-2">
          <Compass :size="16" />
          {{ t("header.tabs.connections.explore") }}
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="runs" as-child>
        <NuxtLink :to="wLink('/integrations/runs')" class="flex items-center gap-2">
          <History :size="16" />
          {{ t("header.tabs.connections.runs") }}
        </NuxtLink>
      </TabsTrigger>
    </TabsList>
  </Tabs>

  <!-- Workflows Tabs -->
  <Tabs v-else-if="showWorkflowsTabs" :model-value="currentWorkflowsTab">
    <TabsList>
      <TabsTrigger value="workflows" as-child>
        <NuxtLink :to="wLink('/workflows')" class="flex items-center gap-2">
          <Workflow :size="16" />
          {{ t("header.tabs.workflows.index") }}
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="runs" as-child>
        <NuxtLink :to="wLink('/workflows/runs')" class="flex items-center gap-2">
          <History :size="16" />
          {{ t("header.tabs.workflows.runs") }}
        </NuxtLink>
      </TabsTrigger>
    </TabsList>
  </Tabs>

  <!-- Policies Tabs -->
  <Tabs v-else-if="showPoliciesTabs" :model-value="currentPoliciesTab">
    <TabsList>
      <TabsTrigger value="policies" as-child>
        <NuxtLink :to="wLink('/policies')" class="flex items-center gap-2">
          <ShieldCheck :size="16" />
          {{ t("header.tabs.policies.index") }}
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="templates" as-child>
        <NuxtLink
          :to="wLink('/policies/templates')"
          class="flex items-center gap-2"
        >
          <LayoutTemplate :size="16" />
          {{ t("header.tabs.policies.templates") }}
        </NuxtLink>
      </TabsTrigger>
    </TabsList>
  </Tabs>

  <!-- Studio File Tabs (shown on all studio pages including chat) -->
  <StudioFileTabs v-else-if="showStudioTabs" />

  <!-- Files controls (search, filters, view toggle, upload) -->
  <FilesHeaderControls v-else-if="showFilesControls" />

  <!-- Settings Tabs (Workspace Settings) -->
  <Tabs v-else-if="showSettingsTabs" :model-value="currentSettingsTab">
    <TabsList>
      <TabsTrigger value="general" as-child>
        <NuxtLink :to="wLink('/settings/general')" class="flex items-center gap-2">
          <Settings :size="16" />
          {{ t("header.tabs.settings.general") }}
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="data" as-child>
        <NuxtLink :to="wLink('/settings/data')" class="flex items-center gap-2">
          <Database :size="16" />
          {{ t("header.tabs.settings.data") }}
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="notifications" as-child>
        <NuxtLink :to="wLink('/settings/notifications')" class="flex items-center gap-2">
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
        <NuxtLink :to="wLink('/analytics')" class="flex items-center gap-2">
          <BarChart3 :size="16" />
          {{ t("header.tabs.analytics.overview") }}
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="ai" as-child>
        <NuxtLink :to="wLink('/analytics/ai')" class="flex items-center gap-2">
          <Cpu :size="16" />
          {{ t("header.tabs.analytics.ai") }}
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="logs" as-child>
        <NuxtLink :to="wLink('/analytics/logs')" class="flex items-center gap-2">
          <FileSearch :size="16" />
          {{ t("header.tabs.analytics.logs") }}
        </NuxtLink>
      </TabsTrigger>
    </TabsList>
  </Tabs>
</template>
