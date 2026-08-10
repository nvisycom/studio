<script setup lang="ts">
import type {
	Connection,
	ConnectionSync,
	SyncStatus,
} from "@nvisy/sdk/datatypes";
import {
	ArrowLeft,
	Loader2,
	Play,
	CheckCircle2,
	XCircle,
	CircleSlash,
	Clock,
	HardDrive,
	Ban,
} from "@lucide/vue";
import { formatDuration } from "#console/utils/date";
import { providerIcon } from "#console/utils/connectionProviders";
import { Button } from "#console/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#console/components/ui/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";
import { Badge } from "#console/components/ui/badge";
import { toast } from "vue-sonner";

const { t } = useI18n();
const { relativeTime } = useRelativeTime();
const { wLink } = useWorkspaceLink();

useHead({ title: "Connection Syncs" });

definePageMeta({
	pageCategory: "header.category.integrations",
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
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="mx-auto w-full max-w-6xl">
      <!-- Toolbar -->
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <Button as-child variant="outline" class="font-normal">
          <NuxtLink :to="wLink('/integrations')" class="flex items-center gap-2">
            <ArrowLeft :size="16" />
            {{ t("connections.runs.backToConnections") }}
          </NuxtLink>
        </Button>

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

      <Card class="rounded-xl border-border/50 py-0 pb-6 pt-6">
        <CardHeader>
          <CardTitle
            class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            {{ t("connections.runs.title") }}
          </CardTitle>
          <CardDescription class="text-sm">
            {{ t("connections.runs.runsFound", { count: syncs.length }) }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <!-- Loading -->
          <div
            v-if="isLoading"
            class="flex items-center justify-center py-12"
          >
            <Loader2 :size="24" class="animate-spin text-muted-foreground" />
          </div>

          <!-- Empty -->
          <div
            v-else-if="syncs.length === 0"
            class="py-12 text-center text-sm text-muted-foreground"
          >
            {{ t("connections.runs.noRunsFound") }}
          </div>

          <template v-else>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="text-xs font-normal uppercase tracking-wider">
                    {{ t("connections.runs.connection") }}
                  </TableHead>
                  <TableHead class="text-xs font-normal uppercase tracking-wider">
                    {{ t("connections.runs.trigger") }}
                  </TableHead>
                  <TableHead class="text-xs font-normal uppercase tracking-wider">
                    {{ t("connections.runs.statusHeader") }}
                  </TableHead>
                  <TableHead class="text-xs font-normal uppercase tracking-wider">
                    {{ t("connections.runs.records") }}
                  </TableHead>
                  <TableHead class="text-xs font-normal uppercase tracking-wider">
                    {{ t("connections.runs.started") }}
                  </TableHead>
                  <TableHead class="text-xs font-normal uppercase tracking-wider">
                    {{ t("connections.runs.duration") }}
                  </TableHead>
                  <TableHead class="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="sync in syncs" :key="sync.id">
                  <!-- Connection -->
                  <TableCell>
                    <div class="flex items-center gap-2.5">
                      <div
                        class="flex size-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/40"
                      >
                        <img
                          v-if="connectionProvider(sync) && providerIcon(connectionProvider(sync)!)"
                          :src="providerIcon(connectionProvider(sync)!)!"
                          :alt="connectionProvider(sync)"
                          class="size-4 object-contain"
                        />
                        <HardDrive
                          v-else
                          :size="14"
                          class="text-muted-foreground"
                        />
                      </div>
                      <span class="truncate text-sm font-medium">
                        {{ connectionName(sync) }}
                      </span>
                    </div>
                  </TableCell>

                  <!-- Trigger -->
                  <TableCell>
                    <Badge variant="outline" class="font-normal">
                      {{ t(`connections.runs.triggerType.${sync.triggerType}`) }}
                    </Badge>
                  </TableCell>

                  <!-- Status -->
                  <TableCell>
                    <div class="flex items-center gap-2">
                      <Play
                        v-if="sync.status === 'running'"
                        :size="14"
                        class="text-blue-500"
                      />
                      <Clock
                        v-else-if="sync.status === 'pending'"
                        :size="14"
                        class="text-muted-foreground"
                      />
                      <CheckCircle2
                        v-else-if="sync.status === 'completed'"
                        :size="14"
                        class="text-green-500"
                      />
                      <XCircle
                        v-else-if="sync.status === 'failed'"
                        :size="14"
                        class="text-red-500"
                      />
                      <CircleSlash
                        v-else
                        :size="14"
                        class="text-muted-foreground"
                      />
                      <span class="text-sm capitalize">
                        {{ t(`connections.runs.syncStatus.${sync.status}`) }}
                      </span>
                    </div>
                    <p
                      v-if="sync.errorMessage"
                      class="mt-0.5 truncate text-xs text-red-500"
                      :title="sync.errorMessage"
                    >
                      {{ sync.errorMessage }}
                    </p>
                  </TableCell>

                  <!-- Records -->
                  <TableCell class="text-sm text-muted-foreground">
                    {{ sync.recordsSynced }}
                  </TableCell>

                  <!-- Started -->
                  <TableCell class="text-sm text-muted-foreground">
                    {{ relativeTime(sync.startedAt) }}
                  </TableCell>

                  <!-- Duration -->
                  <TableCell class="text-sm text-muted-foreground">
                    {{ formatDuration(sync.startedAt, sync.completedAt) }}
                  </TableCell>

                  <!-- Cancel (running/pending only) -->
                  <TableCell class="text-right">
                    <Button
                      v-if="sync.status === 'running' || sync.status === 'pending'"
                      variant="ghost"
                      size="icon"
                      class="size-8"
                      :aria-label="t('connections.runs.cancel')"
                      @click="cancelSync(sync)"
                    >
                      <Ban :size="15" class="text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div v-if="hasMore" class="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                :disabled="isLoadingMore"
                @click="loadMore"
              >
                <Loader2
                  v-if="isLoadingMore"
                  :size="14"
                  class="mr-2 animate-spin"
                />
                {{ t("connections.runs.loadMore") }}
              </Button>
            </div>
          </template>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
