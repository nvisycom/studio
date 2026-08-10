<script setup lang="ts">
import {
	ExternalLink,
	Webhook as WebhookIcon,
	Loader2,
	Plug,
	PlugZap,
	Compass,
	History,
	HardDrive,
} from "@lucide/vue";
import { toast } from "vue-sonner";
import type {
	Connection,
	Webhook,
	WebhookEvent,
	WebhookStatus,
	UpdateConnection,
} from "@nvisy/sdk/datatypes";
import { Button } from "#console/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";
import {
	ConfigureConnectionDialog,
	ConnectionsTable,
} from "#console/components/pages/connections";
import { providerIcon, providerLabel } from "#console/utils/connections";
import {
	WebhooksTable,
	WebhookDialog,
} from "#console/components/pages/webhooks";
import { ConfirmDialog } from "#console/components/common";

const { t } = useI18n();
const { wLink } = useWorkspaceLink();

useHead({ title: "Connections" });

definePageMeta({
	pageCategory: "header.category.integrations",
});

// Use SDK composables
const {
	connections,
	isLoading: isLoadingConnections,
	updateConnectionAsync,
	deleteConnectionAsync,
	startSyncAsync,
	verifyConnectionAsync,
	isUpdating,
	isDeleting,
} = useConnections();

const {
	webhooks,
	isLoading: isLoadingWebhooks,
	createWebhookAsync,
	updateWebhookAsync,
	deleteWebhookAsync,
	testWebhookAsync,
	isCreating: isCreatingWebhook,
} = useWebhooks();

// Connection dialogs
const isConfigureConnectionDialogOpen = ref(false);
const isDisconnectConnectionDialogOpen = ref(false);
const selectedConnection = ref<Connection | null>(null);

function openConfigureConnectionDialog(connectionId: string) {
	const connection = connections.value?.find((c) => c.id === connectionId);
	if (connection) {
		selectedConnection.value = connection;
		isConfigureConnectionDialogOpen.value = true;
	}
}

function openDisconnectConnectionDialog(connectionId: string) {
	const connection = connections.value?.find((c) => c.id === connectionId);
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

// Webhooks
const isCreateDialogOpen = ref(false);
const isEditDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const selectedWebhook = ref<Webhook | null>(null);

function findWebhookById(webhookId: string): Webhook | undefined {
	return webhooks.value?.find((w) => w.id === webhookId);
}

async function handleCreateWebhook(data: {
	displayName: string;
	url: string;
	status: WebhookStatus;
	events: WebhookEvent[];
	headers?: Record<string, string>;
}) {
	try {
		await createWebhookAsync({
			displayName: data.displayName,
			url: data.url,
			description: "",
			status: data.status,
			events: data.events,
			headers: data.headers,
		});
		isCreateDialogOpen.value = false;
		toast.success(t("connections.toast.webhookCreated"));
	} catch (error) {
		toast.error(t("connections.toast.webhookCreateFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}

async function handleUpdateWebhook(data: {
	displayName: string;
	url: string;
	status: WebhookStatus;
	events: WebhookEvent[];
	headers?: Record<string, string>;
}) {
	if (!selectedWebhook.value) return;

	try {
		await updateWebhookAsync({
			webhookId: selectedWebhook.value.id,
			updates: {
				displayName: data.displayName,
				url: data.url,
				status: data.status,
				events: data.events,
				headers: data.headers,
			},
		});
		isEditDialogOpen.value = false;
		toast.success(t("connections.toast.webhookUpdated"));
	} catch (error) {
		toast.error(t("connections.toast.webhookUpdateFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}

async function handleDeleteWebhook(webhookId: string) {
	try {
		await deleteWebhookAsync(webhookId);
		isDeleteDialogOpen.value = false;
		toast.success(t("connections.toast.webhookDeleted"));
	} catch (error) {
		toast.error(t("connections.toast.webhookDeleteFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}

function openEditDialog(webhookId: string) {
	const webhook = findWebhookById(webhookId);
	if (webhook) {
		selectedWebhook.value = webhook;
		isEditDialogOpen.value = true;
	}
}

function openDeleteDialog(webhookId: string) {
	const webhook = findWebhookById(webhookId);
	if (webhook) {
		selectedWebhook.value = webhook;
		isDeleteDialogOpen.value = true;
	}
}

async function toggleWebhookStatus(webhookId: string, active: boolean) {
	try {
		await updateWebhookAsync({
			webhookId,
			updates: {
				status: active ? "active" : "paused",
			},
		});
		toast.success(
			active
				? t("connections.toast.webhookActivated")
				: t("connections.toast.webhookDeactivated"),
		);
	} catch (error) {
		toast.error(t("connections.toast.webhookUpdateFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}

async function testWebhook(webhookId: string) {
	const webhook = findWebhookById(webhookId);
	if (!webhook) return;

	try {
		const result = await testWebhookAsync(webhookId);
		const isSuccess = result.statusCode >= 200 && result.statusCode < 300;

		if (isSuccess) {
			toast.success(t("connections.toast.webhookTestSuccess"), {
				description: t("connections.toast.webhookTestSuccessDescription", {
					statusCode: result.statusCode,
					responseTimeMs: result.responseTimeMs,
				}),
			});
		} else {
			toast.error(t("connections.toast.webhookTestFailed"), {
				description: t("connections.toast.webhookTestFailedDescription", {
					statusCode: result.statusCode,
				}),
			});
		}
	} catch (error) {
		toast.error(t("connections.toast.webhookTestFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-6xl mx-auto w-full">
      <!-- Loading State -->
      <div
        v-if="isLoadingConnections || isLoadingWebhooks"
        class="flex items-center justify-center py-12"
      >
        <Loader2 :size="24" class="animate-spin text-muted-foreground" />
      </div>

      <template v-else>
        <!-- Active Connections -->
        <Card
          v-if="connections && connections.length > 0"
          class="mb-8 py-0 pt-6 rounded-xl border-border/50"
        >
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle
                  class="text-xs font-medium tracking-wide uppercase text-muted-foreground"
                  >{{
                    t("connections.sections.connectedServices.title")
                  }}</CardTitle
                >
                <CardDescription class="text-sm">{{
                  t("connections.sections.connectedServices.description", {
                    count: connections.length,
                  })
                }}</CardDescription>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  as-child
                  variant="outline"
                  size="sm"
                  class="font-normal"
                >
                  <NuxtLink
                    :to="wLink('/integrations/explore')"
                    class="flex items-center gap-2"
                  >
                    <Compass :size="16" />
                    {{ t("connections.actions.explore") }}
                  </NuxtLink>
                </Button>
                <Button
                  as-child
                  variant="outline"
                  size="sm"
                  class="font-normal"
                >
                  <NuxtLink
                    :to="wLink('/integrations/runs')"
                    class="flex items-center gap-2"
                  >
                    <History :size="16" />
                    {{ t("connections.actions.viewRuns") }}
                  </NuxtLink>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ConnectionsTable
              :connections="connections"
              @configure="openConfigureConnectionDialog"
              @disconnect="openDisconnectConnectionDialog"
              @sync="handleSyncConnection"
              @test="handleTestConnection"
              @toggle-active="handleToggleActive"
            />
          </CardContent>
          <CardFooter
            class="border-t border-border/50 pb-6 bg-muted/30 rounded-b-xl"
          >
            <p class="text-xs text-muted-foreground">
              {{ t("connections.messages.connectionFooter") }}
              <a
                href="https://docs.nvisy.com/connections"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-foreground hover:underline font-medium"
              >
                {{ t("connections.messages.documentation") }}
                <ExternalLink :size="12" />
              </a>
            </p>
          </CardFooter>
        </Card>

        <Card v-else class="mb-8 py-0 pt-6 rounded-xl border-border/50">
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle
                  class="text-xs font-medium tracking-wide uppercase text-muted-foreground"
                  >{{
                    t("connections.sections.connectedServices.title")
                  }}</CardTitle
                >
                <CardDescription class="text-sm">{{
                  t("connections.sections.connectedServices.description", {
                    count: 0,
                  })
                }}</CardDescription>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  as-child
                  variant="outline"
                  size="sm"
                  class="font-normal"
                >
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
          </CardHeader>
          <CardContent>
            <div class="py-12">
              <div class="text-center">
                <div
                  class="mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-muted/50"
                >
                  <Plug class="size-5 text-muted-foreground" />
                </div>
                <p class="text-sm text-foreground mb-1">
                  {{
                    t(
                      "connections.sections.connectedServices.noIntegrationsTitle",
                    )
                  }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{
                    t(
                      "connections.sections.connectedServices.noIntegrationsDescription",
                    )
                  }}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter
            class="border-t border-border/50 pb-6 bg-muted/30 rounded-b-xl"
          >
            <p class="text-xs text-muted-foreground">
              {{ t("connections.messages.connectionFooter") }}
              <a
                href="https://docs.nvisy.com/connections"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-foreground hover:underline font-medium"
              >
                {{ t("connections.messages.documentation") }}
                <ExternalLink :size="12" />
              </a>
            </p>
          </CardFooter>
        </Card>

        <!-- Webhook Endpoints Section -->
        <Card class="py-0 pt-6 rounded-xl border-border/50">
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle
                  class="text-xs font-medium tracking-wide uppercase text-muted-foreground"
                  >{{ t("connections.sections.webhooks.title") }}</CardTitle
                >
                <CardDescription class="text-sm">{{
                  t("connections.sections.webhooks.description", {
                    count: webhooks?.length ?? 0,
                  })
                }}</CardDescription>
              </div>
              <WebhookDialog
                v-model:open="isCreateDialogOpen"
                mode="create"
                :is-loading="isCreatingWebhook"
                @submit="handleCreateWebhook"
              />
            </div>
          </CardHeader>
          <CardContent>
            <WebhooksTable
              v-if="webhooks && webhooks.length > 0"
              :webhooks="webhooks"
              @edit="openEditDialog"
              @delete="openDeleteDialog"
              @test="testWebhook"
              @toggle-status="toggleWebhookStatus"
            />
            <div v-else class="py-12">
              <div class="text-center">
                <div
                  class="mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-muted/50"
                >
                  <WebhookIcon class="size-5 text-muted-foreground" />
                </div>
                <p class="text-sm text-foreground mb-1">
                  {{ t("connections.sections.webhooks.noWebhooksTitle") }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{
                    t("connections.sections.webhooks.noWebhooksDescription")
                  }}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter
            class="border-t border-border/50 pb-6 bg-muted/30 rounded-b-xl"
          >
            <p class="text-xs text-muted-foreground">
              {{ t("connections.messages.webhookFooter") }}
              <a
                href="https://docs.nvisy.com/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-foreground hover:underline font-medium"
              >
                {{ t("connections.messages.documentation") }}
                <ExternalLink :size="12" />
              </a>
            </p>
          </CardFooter>
        </Card>

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
            selectedConnection &&
              handleDisconnectConnection(selectedConnection.id)
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

        <WebhookDialog
          v-model:open="isEditDialogOpen"
          mode="edit"
          :webhook="selectedWebhook"
          @submit="handleUpdateWebhook"
        />

        <ConfirmDialog
          v-model:open="isDeleteDialogOpen"
          :title="t('connections.dialogs.deleteWebhook.title')"
          :description="t('connections.dialogs.deleteWebhook.description')"
          :confirm-label="t('connections.dialogs.deleteWebhook.confirm')"
          :cancel-label="t('connections.dialogs.deleteWebhook.cancel')"
          @confirm="selectedWebhook && handleDeleteWebhook(selectedWebhook.id)"
        >
          <template #details>
            <div
              class="p-4 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
            >
              <p
                class="text-sm text-neutral-900 dark:text-white font-medium mb-1"
              >
                {{ selectedWebhook?.displayName }}
              </p>
              <p
                class="text-xs text-neutral-500 dark:text-neutral-500 font-mono truncate"
              >
                {{ selectedWebhook?.url }}
              </p>
            </div>
          </template>
        </ConfirmDialog>
      </template>
    </div>
  </div>
</template>
