<template>
  <div class="flex flex-col h-full overflow-auto p-3">
    <!-- Auth Screen -->
    <TrayAuth v-if="!isAuthenticated" @authenticated="handleAuthenticated" />

    <!-- Main Content -->
    <template v-else>
      <TrayFiles v-if="activeTab === 'files'" />
      <TrayIntegrations v-else-if="activeTab === 'integrations'" />
      <TrayServices v-else-if="activeTab === 'services'" />
      <TraySettings v-else-if="activeTab === 'settings'" />
      <TrayAbout v-else-if="activeTab === 'about'" class="flex-1" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useActiveTab } from "~/composables/useActiveTab";
import { useAuth } from "~/composables/useAuth";
import { useKeyboardShortcuts } from "~/composables/useKeyboardShortcuts";

const _activeTab = useActiveTab();
const { isAuthenticated, authenticate } = useAuth();
const { registerShortcuts, unregisterShortcuts } = useKeyboardShortcuts();

// Register keyboard shortcuts
onMounted(() => {
	registerShortcuts();
});

onUnmounted(() => {
	unregisterShortcuts();
});

const _handleAuthenticated = (baseUrl: string, apiToken: string) => {
	authenticate(baseUrl, apiToken);
};

definePageMeta({
	layout: "tray",
	title: "Nvisy",
});

useHead({
	title: "Nvisy",
});
</script>
