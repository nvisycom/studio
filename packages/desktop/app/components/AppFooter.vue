<template>
  <footer v-if="isAuthenticated">
    <div class="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
      <!-- Left: Service Status (clickable - opens services) -->
      <button
        class="flex items-center space-x-1.5 hover:text-foreground transition-colors"
        @click="goToServices"
      >
        <div
          class="w-2 h-2 rounded-full"
          :class="serviceOnline ? 'bg-green-500' : 'bg-red-500'"
        />
        <span>{{ serviceOnline ? $t('footer.online') : $t('footer.offline') }}</span>
      </button>

      <!-- Right: Credits and Storage (clickable - opens settings) -->
      <div class="flex items-center space-x-4">
        <!-- Credits -->
        <button
          class="flex items-center space-x-1.5 hover:text-foreground transition-colors"
          @click="goToSettings"
        >
          <Zap class="w-3 h-3" />
          <span>{{ credits }} / {{ creditsTotal }}</span>
        </button>

        <!-- Storage -->
        <button
          class="flex items-center space-x-1.5 hover:text-foreground transition-colors"
          @click="goToSettings"
        >
          <HardDrive class="w-3 h-3" />
          <span>{{ storageUsed }} / {{ storageTotal }}</span>
        </button>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { Zap, HardDrive } from "lucide-vue-next";
import { useActiveTab } from "~/composables/useActiveTab";
import { useAuth } from "~/composables/useAuth";

const activeTab = useActiveTab();
const { isAuthenticated } = useAuth();

// Service status
const serviceOnline = ref(true);

// Credits
const credits = ref(1250);
const creditsTotal = ref(5000);

// Storage
const storageUsed = ref("2.4 GB");
const storageTotal = ref("10 GB");

const goToServices = () => {
  activeTab.value = 'services';
};

const goToSettings = () => {
  activeTab.value = 'settings';
};
</script>
