<script setup lang="ts">
import type { Component } from "vue";
import type {
	Connection,
	ConnectionSync,
	SyncStatus,
} from "@nvisy/sdk/datatypes";
import type { VirtualColumn } from "#console/components/ui/virtual-table";
import {
	Loader2,
	Loader,
	CircleCheck,
	XCircle,
	CircleSlash,
	Clock,
	HardDrive,
	Ban,
	History,
} from "@lucide/vue";
import { formatDuration } from "#console/utils/date";
import { providerIcon } from "#console/utils/connections";
import { Button } from "#console/components/ui/button";
import { VirtualTable } from "#console/components/ui/virtual-table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";
import { HeaderSocket, SectionTabs } from "#console/components/layout/header";
import { toast } from "vue-sonner";

const { t } = useI18n();
const sectionTabs = useSectionTabs();
const { relativeTime } = useRelativeTime();

useHead({ title: "Connection Syncs" });

definePageMeta({
	pageCategory: "header.category.integrations",
	hideCategory: true,
});

const SYNC_STATUSES: SyncStatus[] = [
	"pending",
	"running",
	"completed",
	"failed",
	"cancelled",
];

// "all" maps to no status filter.
const statusFilter = ref<SyncStatus | "all">("all");
const status = computed<SyncStatus | undefined>(() =>
	statusFilter.value === "all" ? undefined : statusFilter.value,
);

const { syncs, isLoading, hasMore, loadMore, isLoadingMore, cancelSyncAsync } =
	useSyncs({ status });

// Resolve connection id -> connection for name + provider logo.
const { connections } = useConnections();
const connectionById = computed(() => {
	const map = new Map<string, Connection>();
	for (const c of connections.value ?? []) map.set(c.id, c);
	return map;
});

function connectionName(sync: ConnectionSync): string {
	return (
		connectionById.value.get(sync.connectionId)?.displayName ??
		sync.connectionId
	);
}
function connectionProvider(sync: ConnectionSync): string | undefined {
	return connectionById.value.get(sync.connectionId)?.provider;
}

async function cancelSync(sync: ConnectionSync) {
	try {
		await cancelSyncAsync({
			connectionId: sync.connectionId,
			syncId: sync.id,
		});
		toast.success(t("connections.runs.syncCancelled"));
	} catch (error) {
		toast.error(t("connections.runs.syncCancelFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}

const isCancellable = (sync: ConnectionSync) =>
	sync.status === "running" || sync.status === "pending";

function handleLoadMore() {
	if (hasMore.value && !isLoadingMore.value) loadMore();
}

// Per-status presentation: icon + tint.
const STATUS_META: Record<
	SyncStatus,
	{ icon: Component; class: string; spin?: boolean }
> = {
	pending: { icon: Clock, class: "text-muted-foreground" },
	running: { icon: Loader, class: "text-blue-500", spin: true },
	completed: { icon: CircleCheck, class: "text-emerald-500" },
	failed: { icon: XCircle, class: "text-destructive" },
	cancelled: { icon: CircleSlash, class: "text-muted-foreground" },
};

// Status comes from the API; fall back to a neutral icon if the backend ever
// adds a status the map doesn't cover, so one unknown cell can't blank the table.
const FALLBACK_STATUS_META = {
	icon: Clock,
	class: "text-muted-foreground",
	spin: false,
};
function statusMeta(status: SyncStatus) {
	return STATUS_META[status] ?? FALLBACK_STATUS_META;
}

const columns = computed<VirtualColumn<ConnectionSync>[]>(() => [
	{
		key: "connection",
		header: t("connections.runs.connection"),
		cell: () => ({ type: "custom" }),
	},
	{
		key: "trigger",
		header: t("connections.runs.trigger"),
		width: "130px",
		cell: (s) => ({
			type: "badge",
			label: t(`connections.runs.triggerType.${s.triggerType}`),
			variant: "outline",
		}),
	},
	{
		key: "status",
		header: t("connections.runs.statusHeader"),
		width: "180px",
		cell: () => ({ type: "custom" }),
	},
	{
		key: "records",
		header: t("connections.runs.records"),
		width: "100px",
		cell: (s) => ({
			type: "text",
			value: String(s.recordsSynced),
			muted: true,
		}),
	},
	{
		key: "started",
		header: t("connections.runs.started"),
		width: "140px",
		cell: (s) => ({
			type: "text",
			value: relativeTime(s.startedAt),
			muted: true,
		}),
	},
	{
		key: "duration",
		header: t("connections.runs.duration"),
		width: "120px",
		cell: (s) => ({
			type: "text",
			value: formatDuration(s.startedAt, s.completedAt),
			muted: true,
		}),
	},
	{
		key: "cancel",
		header: "",
		width: "40px",
		align: "right",
		cell: () => ({ type: "custom" }),
	},
]);
</script>

<template>
  <!-- Fixed-height page so the table fills and scrolls (like /files). -->
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6 h-[calc(100vh-5.5rem)]">
    <div class="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 min-h-0">
      <!-- Section tabs in the app-header socket. -->
      <HeaderSocket>
        <SectionTabs :tabs="sectionTabs.integrations.value" />
      </HeaderSocket>

      <!-- Filter toolbar: count on the left, status filter on the right. -->
      <div class="flex flex-wrap items-center gap-3">
        <p class="shrink-0 text-sm text-muted-foreground">
          {{ t("connections.runs.runsFound", { count: syncs.length }) }}
        </p>

        <div class="flex-1" />

        <Select v-model="statusFilter">
          <SelectTrigger class="h-9 w-[160px] text-sm">
            <SelectValue :placeholder="t('connections.runs.status')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" class="text-sm font-normal">
              {{ t("connections.runs.allStatus") }}
            </SelectItem>
            <SelectItem
              v-for="s in SYNC_STATUSES"
              :key="s"
              :value="s"
              class="text-sm font-normal"
            >
              {{ t(`connections.runs.syncStatus.${s}`) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="flex flex-1 items-center justify-center py-12">
        <Loader2 :size="24" class="animate-spin text-muted-foreground" />
      </div>

      <!-- Bare full-width table, filling the remaining height. -->
      <div v-else class="relative min-h-0 flex-1">
        <VirtualTable
          :rows="syncs"
          :columns="columns"
          :empty="{
            icon: History,
            title: t('connections.runs.noRunsFound'),
            description: t('connections.runs.noRunsDescription'),
          }"
          @load-more="handleLoadMore"
        >
            <!-- Connection + provider logo -->
            <template #cell-connection="{ row }">
              <div class="flex items-center gap-2.5">
                <div
                  class="flex size-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/40"
                >
                  <img
                    v-if="
                      connectionProvider(row) &&
                      providerIcon(connectionProvider(row)!)
                    "
                    :src="providerIcon(connectionProvider(row)!)!"
                    :alt="connectionProvider(row)"
                    class="size-4 object-contain"
                  />
                  <HardDrive v-else :size="14" class="text-muted-foreground" />
                </div>
                <span class="truncate text-sm font-medium">
                  {{ connectionName(row) }}
                </span>
              </div>
            </template>

            <!-- Status + optional error subtitle -->
            <template #cell-status="{ row }">
              <div class="flex items-center gap-2">
                <component
                  :is="statusMeta(row.status).icon"
                  :size="14"
                  :class="[
                    'shrink-0',
                    statusMeta(row.status).class,
                    statusMeta(row.status).spin && 'animate-spin',
                  ]"
                />
                <span class="text-sm">
                  {{ t(`connections.runs.syncStatus.${row.status}`) }}
                </span>
              </div>
              <p
                v-if="row.errorMessage"
                class="mt-0.5 truncate text-xs text-destructive"
                :title="row.errorMessage"
              >
                {{ row.errorMessage }}
              </p>
            </template>

            <!-- Cancel (running/pending only) -->
            <template #cell-cancel="{ row }">
              <Button
                v-if="isCancellable(row)"
                variant="ghost"
                size="icon"
                class="size-8"
                :aria-label="t('connections.runs.cancel')"
                @click.stop="cancelSync(row)"
              >
                <Ban :size="15" class="text-muted-foreground" />
              </Button>
            </template>
        </VirtualTable>
      </div>
    </div>
  </div>
</template>
