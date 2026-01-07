<template>
  <div class="flex flex-col h-full overflow-auto p-3">
    <!-- Auth Screen -->
    <ContentAuth v-if="!isAuthenticated" @authenticated="handleAuthenticated" />

    <!-- Main Content -->
    <template v-else>
      <ContentFiles v-if="activeTab === 'files'" />
      <ContentIntegrations v-else-if="activeTab === 'integrations'" />
      <ContentServices v-else-if="activeTab === 'services'" />
      <ContentSettings v-else-if="activeTab === 'settings'" />
      <ContentAbout v-else-if="activeTab === 'about'" class="flex-1" />
    </template>
  </div>
</template>

<script setup lang="ts">
import ContentAuth from "~/components/content/Auth.vue";
import ContentFiles from "~/components/content/Files.vue";
import ContentIntegrations from "~/components/content/Integrations.vue";
import ContentServices from "~/components/content/Services.vue";
import ContentSettings from "~/components/content/Settings.vue";
import ContentAbout from "~/components/content/About.vue";
import { useActiveTab } from "~/composables/useActiveTab";
import { useAuth } from "~/composables/useAuth";

const activeTab = useActiveTab();
const { isAuthenticated, authenticate } = useAuth();

const handleAuthenticated = (baseUrl: string, apiToken: string) => {
  authenticate(baseUrl, apiToken);
};

definePageMeta({
  title: "Nvisy",
});

useHead({
  title: "Nvisy",
});
</script>
