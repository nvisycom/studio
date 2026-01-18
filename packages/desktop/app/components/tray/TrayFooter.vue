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

      <!-- Center: Sync Status (clickable - opens files) -->
      <button
        class="flex items-center space-x-1.5 hover:text-foreground transition-colors"
        @click="goToFiles"
      >
        <RefreshCw
          class="w-3 h-3"
          :class="{ 'animate-spin': isSyncing }"
        />
        <span v-if="isSyncing">{{ $t('footer.syncing') }}</span>
        <span v-else-if="syncStatus.state === 'success'" class="text-green-600 dark:text-green-400">{{ $t('footer.synced') }}</span>
        <span v-else-if="syncStatus.state === 'error'" class="text-red-600 dark:text-red-400">{{ $t('footer.syncError') }}</span>
        <span v-else-if="lastSyncFormatted">{{ lastSyncFormatted }}</span>
        <span v-else>{{ $t('footer.notSynced') }}</span>
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
import { useActiveTab } from "~/composables/useActiveTab";
import { useAuth } from "~/composables/useAuth";
import { useSyncStatus } from "~/composables/useSyncStatus";

const activeTab = useActiveTab();
const { isAuthenticated } = useAuth();
const { syncStatus, isSyncing, formatLastSyncTime } = useSyncStatus();

// Computed last sync time
const _lastSyncFormatted = computed(() => formatLastSyncTime());

// Service status
const _serviceOnline = ref(true);

// Credits
const _credits = ref(1250);
const _creditsTotal = ref(5000);

// Storage
const _storageUsed = ref("2.4 GB");
const _storageTotal = ref("10 GB");

const _goToFiles = () => {
	activeTab.value = "files";
};

const _goToServices = () => {
	activeTab.value = "services";
};

const _goToSettings = () => {
	activeTab.value = "settings";
};
</script>
