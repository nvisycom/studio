<template>
  <footer class="h-7 flex-shrink-0 flex items-center justify-between px-3 border-t border-border/30 bg-background/80 backdrop-blur-sm text-xs text-muted-foreground">
    <!-- Left: Service Status + Sync Status -->
    <div class="flex items-center gap-3">
      <!-- Online Status -->
      <div class="flex items-center gap-1.5">
        <div
          class="w-1.5 h-1.5 rounded-full"
          :class="serviceOnline ? 'bg-green-500' : 'bg-red-500'"
        />
        <span>{{ serviceOnline ? $t('footer.online') : $t('footer.offline') }}</span>
      </div>

      <!-- Sync Status -->
      <div class="flex items-center gap-1.5">
        <RefreshCw
          class="w-3 h-3"
          :class="{ 'animate-spin': isSyncing }"
        />
        <span v-if="isSyncing">{{ $t('footer.syncing') }}</span>
        <span v-else-if="syncStatus.state === 'success'" class="text-green-600 dark:text-green-400">{{ $t('footer.synced') }}</span>
        <span v-else-if="syncStatus.state === 'error'" class="text-red-600 dark:text-red-400">{{ $t('footer.syncError') }}</span>
        <span v-else-if="lastSyncFormatted">{{ lastSyncFormatted }}</span>
        <span v-else>{{ $t('footer.notSynced') }}</span>
      </div>
    </div>

    <!-- Right: Credits -->
    <div class="flex items-center gap-1.5">
      <Zap class="w-3 h-3" />
      <span>{{ credits }} {{ $t('footer.credits') }}</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { RefreshCw, Zap } from "lucide-vue-next";
import { useSyncStatus } from "~/composables/useSyncStatus";

const { syncStatus, isSyncing, formatLastSyncTime } = useSyncStatus();

// Computed last sync time
const lastSyncFormatted = computed(() => formatLastSyncTime());

// Service status
const serviceOnline = ref(true);

// Credits
const credits = ref(1250);
</script>
