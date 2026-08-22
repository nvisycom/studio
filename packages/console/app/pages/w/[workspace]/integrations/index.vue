<script setup lang="ts">
import { Plug, Loader2, Compass, History, HardDrive } from "@lucide/vue";
import { toast } from "vue-sonner";
import type { Connection, UpdateConnection } from "@nvisy/sdk/datatypes";
import { Button } from "#console/components/ui/button";
import {
	ConfigureConnectionDialog,
	ConnectionsTable,
} from "#console/components/pages/connections";
import { providerIcon, providerLabel } from "#console/utils/connections";
import { ConfirmDialog } from "#console/components/common";
import { HeaderSocket, SectionTabs } from "#console/components/layout/header";

const { t } = useI18n();
const sectionTabs = useSectionTabs();
const { wLink } = useWorkspaceLink();

useHead({ title: "Connections" });

definePageMeta({
	pageCategory: "header.category.integrations",
	hideCategory: true,
});

const {
	connections,
	isLoading,
	updateConnectionAsync,
	deleteConnectionAsync,
	startSyncAsync,
	verifyConnectionAsync,
	isUpdating,
	isDeleting,
} = useConnections();

// Connection dialogs
const isConfigureConnectionDialogOpen = ref(false);
const isDisconnectConnectionDialogOpen = ref(false);
const selectedConnection = ref<Connection | null>(null);

function findConnectionById(connectionId: string): Connection | undefined {
	return connections.value?.find((c) => c.id === connectionId);
}

function openConfigureConnectionDialog(connectionId: string) {
	const connection = findConnectionById(connectionId);
	if (connection) {
		selectedConnection.value = connection;
		isConfigureConnectionDialogOpen.value = true;
	}
}

function openDisconnectConnectionDialog(connectionId: string) {
	const connection = findConnectionById(connectionId);
	if (connection) {
		selectedConnection.value = connection;
		isDisconnectConnectionDialogOpen.value = true;
	}
}

async function handleUpdateConnection(updates: UpdateConnection) {
	if (!selectedConnection.value) return;
	try {
		await updateConnectionAsync({
			connectionId: selectedConnection.value.id,
			updates,
		});
		isConfigureConnectionDialogOpen.value = false;
		toast.success(t("connections.toast.connectionUpdated"));
	} catch (error) {
		toast.error(t("connections.toast.connectionUpdateFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}

async function handleDisconnectConnection(connectionId: string) {
	try {
		await deleteConnectionAsync(connectionId);
		isDisconnectConnectionDialogOpen.value = false;
		toast.success(t("connections.toast.connectionDisconnected"));
	} catch (error) {
		toast.error(t("connections.toast.connectionDisconnectFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}

async function handleSyncConnection(connectionId: string) {
	try {
		await startSyncAsync(connectionId);
		toast.success(t("connections.toast.syncStarted"));
	} catch (error) {
		toast.error(t("connections.toast.syncFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}

async function handleToggleActive(connection: Connection) {
	try {
		await updateConnectionAsync({
			connectionId: connection.id,
			updates: { isActive: !connection.isActive },
		});
		toast.success(
			connection.isActive
				? t("connections.toast.connectionDisabled")
				: t("connections.toast.connectionEnabled"),
		);
	} catch (error) {
		toast.error(t("connections.toast.connectionUpdateFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}

async function handleTestConnection(connectionId: string) {
	try {
		const result = await verifyConnectionAsync(connectionId);
		if (result.reachable) {
			toast.success(t("connections.toast.testReachable"));
		} else {
			toast.error(t("connections.toast.testUnreachable"), {
				description: result.error,
			});
		}
	} catch (error) {
		toast.error(t("connections.toast.testFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}
</script>

<template>
  <!-- Fixed-height page so the table fills and scrolls (like /files). -->
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6 h-[calc(100vh-5.5rem)]">
    <div class="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 min-h-0">
      <!-- Section tabs in the app-header socket. -->
      <HeaderSocket>
        <SectionTabs :tabs="sectionTabs.integrations.value" />
      </HeaderSocket>

      <!-- Action row: count on the left, browse/history actions on the right. -->
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm text-muted-foreground">
          {{
            t("connections.sections.connectedServices.description", {
              count: connections?.length ?? 0,
            })
          }}
        </p>
        <div class="flex shrink-0 items-center gap-2">
          <Button as-child variant="outline" size="sm" class="font-normal">
            <NuxtLink
              :to="wLink('/integrations/runs')"
              class="flex items-center gap-2"
            >
              <History :size="16" />
              {{ t("connections.actions.viewRuns") }}
            </NuxtLink>
          </Button>
          <Button as-child size="sm">
            <NuxtLink
              :to="wLink('/integrations/explore')"
              class="flex items-center gap-2"
            >
              <Compass :size="16" />
              {{ t("connections.actions.explore") }}
            </NuxtLink>
          </Button>
        </div>
      </div>

      <!-- Loading -->
      <div
        v-if="isLoading"
        class="flex flex-1 items-center justify-center py-12"
      >
        <Loader2 :size="24" class="animate-spin text-muted-foreground" />
      </div>

      <!-- Bare full-width table, filling the remaining height. -->
      <div v-else class="relative min-h-0 flex-1">
        <ConnectionsTable
          :connections="connections ?? []"
          :empty="{
            icon: Plug,
            title: t('connections.sections.connectedServices.noIntegrationsTitle'),
            description: t(
              'connections.sections.connectedServices.noIntegrationsDescription',
            ),
          }"
          @configure="openConfigureConnectionDialog"
          @disconnect="openDisconnectConnectionDialog"
          @sync="handleSyncConnection"
          @test="handleTestConnection"
          @toggle-active="handleToggleActive"
        />
      </div>

      <!-- Dialogs -->
      <ConfigureConnectionDialog
        v-model:open="isConfigureConnectionDialogOpen"
        :connection="selectedConnection"
        :is-loading="isUpdating"
        @update="handleUpdateConnection"
      />

      <ConfirmDialog
        v-model:open="isDisconnectConnectionDialogOpen"
        :title="
          t('connections.dialogs.disconnect.title', {
            name: selectedConnection?.displayName,
          })
        "
        :description="t('connections.dialogs.disconnect.description')"
        :confirm-label="t('connections.dialogs.disconnect.confirm')"
        :cancel-label="t('connections.dialogs.disconnect.cancel')"
        :is-loading="isDeleting"
        @confirm="
          selectedConnection && handleDisconnectConnection(selectedConnection.id)
        "
      >
        <template v-if="selectedConnection" #details>
          <div class="flex items-center gap-3">
            <div
              class="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40"
            >
              <img
                v-if="providerIcon(selectedConnection.provider)"
                :src="providerIcon(selectedConnection.provider)!"
                :alt="selectedConnection.provider"
                class="size-5 object-contain"
              />
              <HardDrive v-else :size="18" class="text-muted-foreground" />
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-foreground">
                {{ selectedConnection.displayName }}
              </p>
              <p class="truncate text-xs text-muted-foreground">
                {{ providerLabel(selectedConnection.provider) }}
              </p>
            </div>
          </div>
        </template>
      </ConfirmDialog>
    </div>
  </div>
</template>
