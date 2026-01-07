export type SyncState = "idle" | "syncing" | "success" | "error";

interface SyncStatus {
  state: SyncState;
  lastSyncTime: Date | null;
  pendingUploads: number;
  pendingDownloads: number;
  error: string | null;
}

const syncStatus = ref<SyncStatus>({
  state: "idle",
  lastSyncTime: null,
  pendingUploads: 0,
  pendingDownloads: 0,
  error: null,
});

export function useSyncStatus() {
  const isSyncing = computed(() => syncStatus.value.state === "syncing");
  const hasPendingItems = computed(
    () => syncStatus.value.pendingUploads > 0 || syncStatus.value.pendingDownloads > 0
  );

  const startSync = () => {
    syncStatus.value.state = "syncing";
    syncStatus.value.error = null;
  };

  const completeSync = () => {
    syncStatus.value.state = "success";
    syncStatus.value.lastSyncTime = new Date();
    syncStatus.value.pendingUploads = 0;
    syncStatus.value.pendingDownloads = 0;

    // Reset to idle after 2 seconds
    setTimeout(() => {
      if (syncStatus.value.state === "success") {
        syncStatus.value.state = "idle";
      }
    }, 2000);
  };

  const failSync = (error: string) => {
    syncStatus.value.state = "error";
    syncStatus.value.error = error;

    // Reset to idle after 5 seconds
    setTimeout(() => {
      if (syncStatus.value.state === "error") {
        syncStatus.value.state = "idle";
      }
    }, 5000);
  };

  const setPendingUploads = (count: number) => {
    syncStatus.value.pendingUploads = count;
  };

  const setPendingDownloads = (count: number) => {
    syncStatus.value.pendingDownloads = count;
  };

  const formatLastSyncTime = (): string | null => {
    if (!syncStatus.value.lastSyncTime) return null;

    const now = new Date();
    const diff = now.getTime() - syncStatus.value.lastSyncTime.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return {
    syncStatus: readonly(syncStatus),
    isSyncing,
    hasPendingItems,
    startSync,
    completeSync,
    failSync,
    setPendingUploads,
    setPendingDownloads,
    formatLastSyncTime,
  };
}
