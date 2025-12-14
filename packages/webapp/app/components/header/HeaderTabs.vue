<script setup lang="ts">
import { computed } from "vue";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const route = useRoute();

// Check if current route should show tabs
const showIntegrationTabs = computed(() =>
	route.path.startsWith("/integrations"),
);

const showSettingsTabs = computed(() => route.path.startsWith("/settings"));

const showAnalyticsTabs = computed(() => route.path.startsWith("/analytics"));

const showBillingTabs = computed(() => route.path.startsWith("/billing"));

const currentIntegrationTab = computed(() =>
	route.path === "/integrations/library" ? "library" : "active",
);

const currentSettingsTab = computed(() => {
	if (route.path === "/settings/notifications") return "notifications";
	if (route.path === "/settings/security") return "security";
	return "general";
});

const currentAnalyticsTab = computed(() => {
	if (route.path === "/analytics/ai") return "ai";
	if (route.path.startsWith("/analytics/logs")) return "logs";
	return "overview";
});

const currentBillingTab = computed(() =>
	route.path.startsWith("/billing/invoices") ? "invoices" : "billing",
);
</script>

<template>
  <!-- Integration Tabs -->
  <Tabs v-if="showIntegrationTabs" :model-value="currentIntegrationTab">
    <TabsList>
      <TabsTrigger value="active" as-child>
        <NuxtLink to="/integrations"> Connected Integrations </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="library" as-child>
        <NuxtLink to="/integrations/library"> Integration Library </NuxtLink>
      </TabsTrigger>
    </TabsList>
  </Tabs>

  <!-- Settings Tabs -->
  <Tabs v-else-if="showSettingsTabs" :model-value="currentSettingsTab">
    <TabsList>
      <TabsTrigger value="general" as-child>
        <NuxtLink to="/settings"> General </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="notifications" as-child>
        <NuxtLink to="/settings/notifications"> Notifications </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="security" as-child>
        <NuxtLink to="/settings/security"> Security </NuxtLink>
      </TabsTrigger>
    </TabsList>
  </Tabs>

  <!-- Analytics Tabs -->
  <Tabs v-else-if="showAnalyticsTabs" :model-value="currentAnalyticsTab">
    <TabsList>
      <TabsTrigger value="overview" as-child>
        <NuxtLink to="/analytics"> Overview </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="ai" as-child>
        <NuxtLink to="/analytics/ai"> AI </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="logs" as-child>
        <NuxtLink to="/analytics/logs"> Logs </NuxtLink>
      </TabsTrigger>
    </TabsList>
  </Tabs>

  <!-- Billing Tabs -->
  <Tabs v-else-if="showBillingTabs" :model-value="currentBillingTab">
    <TabsList>
      <TabsTrigger value="billing" as-child>
        <NuxtLink to="/billing"> Billing </NuxtLink>
      </TabsTrigger>
      <TabsTrigger value="invoices" as-child>
        <NuxtLink to="/billing/invoices"> Invoices </NuxtLink>
      </TabsTrigger>
    </TabsList>
  </Tabs>
</template>
