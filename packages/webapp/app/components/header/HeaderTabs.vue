<script setup lang="ts">
import { computed } from "vue";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StudioFileTabs from "./StudioFileTabs.vue";
import {
	Settings,
	Key,
	Bell,
	Shield,
	BarChart3,
	Cpu,
	FileSearch,
	Plug,
	Library,
	Receipt,
	FileText,
	Workflow,
	PenTool,
	LayoutTemplate,
	FolderOpen,
	Users,
	ShieldCheck,
	MessageSquare,
	Database,
	CreditCard,
	PlayCircle,
} from "lucide-vue-next";

const route = useRoute();

// Check if current route should show tabs
const showIntegrationTabs = computed(() =>
	route.path.startsWith("/integrations"),
);

const showPipelinesTabs = computed(() => route.path.startsWith("/pipelines"));

const showDocumentsTabs = computed(() => route.path.startsWith("/documents"));

const showSettingsTabs = computed(() => route.path.startsWith("/settings"));

const showAnalyticsTabs = computed(() => route.path.startsWith("/analytics"));

const showBillingTabs = computed(() => route.path.startsWith("/billing"));

const showMembersTabs = computed(() => route.path.startsWith("/members"));

const showKnowledgeTabs = computed(() => route.path.startsWith("/knowledge"));

const currentIntegrationTab = computed(() =>
	route.path === "/integrations/explore" ? "library" : "active",
);

const currentMembersTab = computed(() => {
	if (route.path === "/members/permissions") return "permissions";
	return "members";
});

const currentPipelinesTab = computed(() =>
	route.path === "/pipelines/templates" ? "templates" : "pipelines",
);

const currentDocumentsTab = computed(() => {
	if (route.path === "/documents/studio") return "studio";
	return "files";
});

const currentSettingsTab = computed(() => {
	if (route.path === "/settings/tokens") return "tokens";
	if (route.path === "/settings/notifications") return "notifications";
	if (route.path === "/settings/security") return "security";
	return "general";
});

const currentAnalyticsTab = computed(() => {
	if (route.path === "/analytics/ai") return "ai";
	if (route.path.startsWith("/analytics/logs")) return "logs";
	return "overview";
});

const currentBillingTab = computed(() => {
	if (route.path.startsWith("/billing/invoices")) return "invoices";
	if (route.path.startsWith("/billing/method")) return "method";
	return "plan";
});

const currentIntegrationTabValue = computed(() => {
	if (route.path === "/integrations/explore") return "explore";
	if (route.path === "/integrations/runs") return "runs";
	return "connections";
});

const currentKnowledgeTab = computed(() =>
	route.path === "/knowledge/corpus" ? "corpus" : "chat",
);
</script>

<template>
  <!-- Integration Tabs -->
  <Tabs v-if="showIntegrationTabs" :model-value="currentIntegrationTabValue">
    <TabsList>
      <TabsTrigger value="connections" as-child>
        <NuxtLink to="/integrations" class="flex items-center gap-2">
          <Plug :size="16" />
          Connections
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="explore" as-child>
        <NuxtLink to="/integrations/explore" class="flex items-center gap-2">
          <Library :size="16" />
          Explore
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="runs" as-child>
        <NuxtLink to="/integrations/runs" class="flex items-center gap-2">
          <PlayCircle :size="16" />
          Runs
        </NuxtLink>
      </TabsTrigger>
    </TabsList>
  </Tabs>

  <!-- Pipelines Tabs -->
  <Tabs v-else-if="showPipelinesTabs" :model-value="currentPipelinesTab">
    <TabsList>
      <TabsTrigger value="pipelines" as-child>
        <NuxtLink to="/pipelines" class="flex items-center gap-2">
          <Workflow :size="16" />
          Active
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="templates" as-child>
        <NuxtLink to="/pipelines/templates" class="flex items-center gap-2">
          <LayoutTemplate :size="16" />
          Templates
        </NuxtLink>
      </TabsTrigger>
    </TabsList>
  </Tabs>

  <!-- Documents Tabs -->
  <template v-else-if="showDocumentsTabs">
    <!-- Main Documents Tabs (Files/Studio) -->
    <Tabs :model-value="currentDocumentsTab">
      <TabsList>
        <TabsTrigger value="files" as-child>
          <NuxtLink to="/documents" class="flex items-center gap-2">
            <FolderOpen :size="16" />
            Files
          </NuxtLink>
        </TabsTrigger>
        <TabsTrigger value="studio" as-child>
          <NuxtLink to="/documents/studio" class="flex items-center gap-2">
            <PenTool :size="16" />
            Studio
          </NuxtLink>
        </TabsTrigger>
      </TabsList>
    </Tabs>

    <!-- Studio File Tabs -->
    <div
      v-if="route.path === '/documents/studio'"
      class="flex items-center gap-1 ml-2"
    >
      <StudioFileTabs />
    </div>
  </template>

  <!-- Members Tabs -->
  <Tabs v-else-if="showMembersTabs" :model-value="currentMembersTab">
    <TabsList>
      <TabsTrigger value="members" as-child>
        <NuxtLink to="/members" class="flex items-center gap-2">
          <Users :size="16" />
          Members
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="permissions" as-child>
        <NuxtLink to="/members/permissions" class="flex items-center gap-2">
          <ShieldCheck :size="16" />
          Permissions
        </NuxtLink>
      </TabsTrigger>
    </TabsList>
  </Tabs>

  <!-- Knowledge Tabs -->
  <Tabs v-else-if="showKnowledgeTabs" :model-value="currentKnowledgeTab">
    <TabsList>
      <TabsTrigger value="chat" as-child>
        <NuxtLink to="/knowledge" class="flex items-center gap-2">
          <MessageSquare :size="16" />
          Chat
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="corpus" as-child>
        <NuxtLink to="/knowledge/corpus" class="flex items-center gap-2">
          <Database :size="16" />
          Corpus
        </NuxtLink>
      </TabsTrigger>
    </TabsList>
  </Tabs>

  <!-- Settings Tabs -->
  <Tabs v-else-if="showSettingsTabs" :model-value="currentSettingsTab">
    <TabsList>
      <TabsTrigger value="general" as-child>
        <NuxtLink to="/settings" class="flex items-center gap-2">
          <Settings :size="16" />
          General
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="tokens" as-child>
        <NuxtLink to="/settings/tokens" class="flex items-center gap-2">
          <Key :size="16" />
          Tokens
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="notifications" as-child>
        <NuxtLink to="/settings/notifications" class="flex items-center gap-2">
          <Bell :size="16" />
          Notifications
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="security" as-child>
        <NuxtLink to="/settings/security" class="flex items-center gap-2">
          <Shield :size="16" />
          Security
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
          Overview
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="ai" as-child>
        <NuxtLink to="/analytics/ai" class="flex items-center gap-2">
          <Cpu :size="16" />
          AI
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="logs" as-child>
        <NuxtLink to="/analytics/logs" class="flex items-center gap-2">
          <FileSearch :size="16" />
          Logs
        </NuxtLink>
      </TabsTrigger>
    </TabsList>
  </Tabs>

  <!-- Billing Tabs -->
  <Tabs v-else-if="showBillingTabs" :model-value="currentBillingTab">
    <TabsList>
      <TabsTrigger value="plan" as-child>
        <NuxtLink to="/billing" class="flex items-center gap-2">
          <CreditCard :size="16" />
          Plan
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="method" as-child>
        <NuxtLink to="/billing/method" class="flex items-center gap-2">
          <Receipt :size="16" />
          Method
        </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="invoices" as-child>
        <NuxtLink to="/billing/invoices" class="flex items-center gap-2">
          <FileText :size="16" />
          Invoices
        </NuxtLink>
      </TabsTrigger>
    </TabsList>
  </Tabs>
</template>
