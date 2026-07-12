<script setup lang="ts">
import {
	ExternalLink,
	Webhook as WebhookIcon,
	Loader2,
	Plug,
	PlugZap,
} from "@lucide/vue";
import { toast } from "vue-sonner";
import type {
	Connection,
	Webhook,
	WebhookEvent,
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
	ConfigureIntegrationDialog,
	DisconnectIntegrationDialog,
	IntegrationsTable,
} from "#console/components/pages/integrations";
import {
	WebhooksTable,
	CreateWebhookDialog,
	DeleteWebhookDialog,
	EditWebhookDialog,
} from "#console/components/pages/webhooks";

const { t } = useI18n();

useHead({ title: "Integrations" });

definePageMeta({
	pageCategory: "Integrations",
});

// Use SDK composables
const {
	connections,
	isLoading: isLoadingConnections,
	updateConnectionAsync,
	deleteConnectionAsync,
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
const isConfigureIntegrationDialogOpen = ref(false);
const isDisconnectIntegrationDialogOpen = ref(false);
const selectedConnection = ref<Connection | null>(null);

function openConfigureIntegrationDialog(connectionId: string) {
	const connection = connections.value?.find((c) => c.id === connectionId);
	if (connection) {
		selectedConnection.value = connection;
		isConfigureIntegrationDialogOpen.value = true;
	}
}

function openDisconnectIntegrationDialog(connectionId: string) {
	const connection = connections.value?.find((c) => c.id === connectionId);
	if (connection) {
		selectedConnection.value = connection;
		isDisconnectIntegrationDialogOpen.value = true;
	}
}

async function handleUpdateIntegration(updates: UpdateConnection) {
	if (!selectedConnection.value) return;
	try {
		await updateConnectionAsync({
			connectionId: selectedConnection.value.id,
			updates,
		});
		isConfigureIntegrationDialogOpen.value = false;
		toast.success(t("integrations.toast.integrationUpdated"));
	} catch (error) {
		toast.error(t("integrations.toast.integrationUpdateFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}

async function handleDisconnectIntegration(connectionId: string) {
	try {
		await deleteConnectionAsync(connectionId);
		isDisconnectIntegrationDialogOpen.value = false;
		toast.success(t("integrations.toast.integrationDisconnected"));
	} catch (error) {
		toast.error(t("integrations.toast.integrationDisconnectFailed"), {
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
	return webhooks.value?.find((w) => w.webhookId === webhookId);
}

async function handleCreateWebhook(data: {
	displayName: string;
	url: string;
	status: "active" | "paused";
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
		toast.success(t("integrations.toast.webhookCreated"));
	} catch (error) {
		toast.error(t("integrations.toast.webhookCreateFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}

async function handleUpdateWebhook(data: {
	displayName: string;
	url: string;
	status: "active" | "paused";
	events: WebhookEvent[];
	headers?: Record<string, string>;
}) {
	if (!selectedWebhook.value) return;

	try {
		await updateWebhookAsync({
			webhookId: selectedWebhook.value.webhookId,
			updates: {
				displayName: data.displayName,
				url: data.url,
				status: data.status,
				events: data.events,
				headers: data.headers,
			},
		});
		isEditDialogOpen.value = false;
		toast.success(t("integrations.toast.webhookUpdated"));
	} catch (error) {
		toast.error(t("integrations.toast.webhookUpdateFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}

async function handleDeleteWebhook(webhookId: string) {
	try {
		await deleteWebhookAsync(webhookId);
		isDeleteDialogOpen.value = false;
		toast.success(t("integrations.toast.webhookDeleted"));
	} catch (error) {
		toast.error(t("integrations.toast.webhookDeleteFailed"), {
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
				? t("integrations.toast.webhookActivated")
				: t("integrations.toast.webhookDeactivated"),
		);
	} catch (error) {
		toast.error(t("integrations.toast.webhookUpdateFailed"), {
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
			toast.success(t("integrations.toast.webhookTestSuccess"), {
				description: t("integrations.toast.webhookTestSuccessDescription", {
					statusCode: result.statusCode,
					responseTimeMs: result.responseTimeMs,
				}),
			});
		} else {
			toast.error(t("integrations.toast.webhookTestFailed"), {
				description: t("integrations.toast.webhookTestFailedDescription", {
					statusCode: result.statusCode,
				}),
			});
		}
	} catch (error) {
		toast.error(t("integrations.toast.webhookTestFailed"), {
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
        <!-- Active Integrations -->
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
                    t("integrations.sections.connectedServices.title")
                  }}</CardTitle
                >
                <CardDescription class="text-sm">{{
                  t("integrations.sections.connectedServices.description", {
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
                  <NuxtLink to="/integrations/explore">
                    {{ t("integrations.actions.explore") }}
                  </NuxtLink>
                </Button>
                <Button
                  as-child
                  variant="outline"
                  size="sm"
                  class="font-normal"
                >
                  <NuxtLink to="/integrations/runs">
                    {{ t("integrations.actions.viewRuns") }}
                  </NuxtLink>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <IntegrationsTable
              :connections="connections"
              @configure="openConfigureIntegrationDialog"
              @disconnect="openDisconnectIntegrationDialog"
            />
          </CardContent>
          <CardFooter
            class="border-t border-border/50 pb-6 bg-muted/30 rounded-b-xl"
          >
            <p class="text-xs text-muted-foreground">
              {{ t("integrations.messages.integrationFooter") }}
              <a
                href="https://docs.nvisy.com/integrations"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-foreground hover:underline font-medium"
              >
                {{ t("integrations.messages.documentation") }}
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
                    t("integrations.sections.connectedServices.title")
                  }}</CardTitle
                >
                <CardDescription class="text-sm">{{
                  t("integrations.sections.connectedServices.description", {
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
                  <NuxtLink to="/integrations/explore">
                    <PlugZap :size="16" />
                    {{ t("integrations.actions.explore") }}
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
                      "integrations.sections.connectedServices.noIntegrationsTitle",
                    )
                  }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{
                    t(
                      "integrations.sections.connectedServices.noIntegrationsDescription",
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
              {{ t("integrations.messages.integrationFooter") }}
              <a
                href="https://docs.nvisy.com/integrations"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-foreground hover:underline font-medium"
              >
                {{ t("integrations.messages.documentation") }}
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
                  >{{ t("integrations.sections.webhooks.title") }}</CardTitle
                >
                <CardDescription class="text-sm">{{
                  t("integrations.sections.webhooks.description", {
                    count: webhooks?.length ?? 0,
                  })
                }}</CardDescription>
              </div>
              <CreateWebhookDialog
                v-model:open="isCreateDialogOpen"
                :is-loading="isCreatingWebhook"
                @create="handleCreateWebhook"
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
                  {{ t("integrations.sections.webhooks.noWebhooksTitle") }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{
                    t("integrations.sections.webhooks.noWebhooksDescription")
                  }}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter
            class="border-t border-border/50 pb-6 bg-muted/30 rounded-b-xl"
          >
            <p class="text-xs text-muted-foreground">
              {{ t("integrations.messages.webhookFooter") }}
              <a
                href="https://docs.nvisy.com/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-foreground hover:underline font-medium"
              >
                {{ t("integrations.messages.documentation") }}
                <ExternalLink :size="12" />
              </a>
            </p>
          </CardFooter>
        </Card>

        <!-- Dialogs -->
        <ConfigureIntegrationDialog
          v-model:open="isConfigureIntegrationDialogOpen"
          :connection="selectedConnection"
          :is-loading="isUpdating"
          @update="handleUpdateIntegration"
        />

        <DisconnectIntegrationDialog
          v-model:open="isDisconnectIntegrationDialogOpen"
          :connection="selectedConnection"
          :is-loading="isDeleting"
          @disconnect="handleDisconnectIntegration"
        />

        <EditWebhookDialog
          v-model:open="isEditDialogOpen"
          :webhook="selectedWebhook"
          @update="handleUpdateWebhook"
        />

        <DeleteWebhookDialog
          v-model:open="isDeleteDialogOpen"
          :webhook="selectedWebhook"
          @delete="handleDeleteWebhook"
        />
      </template>
    </div>
  </div>
</template>
