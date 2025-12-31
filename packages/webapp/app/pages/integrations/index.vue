<script setup lang="ts">
import {
  ExternalLink,
  Webhook as WebhookIcon,
  Loader2,
  Plug,
  PlugZap,
} from "lucide-vue-next";
import type { Integration, Webhook, UpdateIntegration } from "@nvisy/sdk";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  WebhooksTable,
  ConfigureIntegrationDialog,
  DisconnectIntegrationDialog,
  CreateWebhookDialog,
  DeleteWebhookDialog,
  EditWebhookDialog,
  IntegrationsTable,
} from "~/components/pages/integrations";

const { t } = useI18n();

definePageMeta({
  pageCategory: "Integrations",
});

// Use SDK composables
const {
  integrations,
  isLoading: isLoadingIntegrations,
  updateIntegrationAsync,
  deleteIntegrationAsync,
  isUpdating,
  isDeleting,
} = useIntegrations();

const {
  webhooks,
  isLoading: isLoadingWebhooks,
  createWebhookAsync,
  updateWebhookAsync,
  deleteWebhookAsync,
  isCreating: isCreatingWebhook,
} = useWebhooks();

// Integration dialogs
const isConfigureIntegrationDialogOpen = ref(false);
const isDisconnectIntegrationDialogOpen = ref(false);
const selectedIntegration = ref<Integration | null>(null);

function openConfigureIntegrationDialog(integrationId: string) {
  const integration = integrations.value?.find(
    (i) => i.integrationId === integrationId,
  );
  if (integration) {
    selectedIntegration.value = integration;
    isConfigureIntegrationDialogOpen.value = true;
  }
}

function openDisconnectIntegrationDialog(integrationId: string) {
  const integration = integrations.value?.find(
    (i) => i.integrationId === integrationId,
  );
  if (integration) {
    selectedIntegration.value = integration;
    isDisconnectIntegrationDialogOpen.value = true;
  }
}

async function handleUpdateIntegration(updates: UpdateIntegration) {
  if (!selectedIntegration.value) return;
  try {
    await updateIntegrationAsync({
      integrationId: selectedIntegration.value.integrationId,
      updates,
    });
    isConfigureIntegrationDialogOpen.value = false;
  } catch (error) {
    console.error("Failed to update integration:", error);
  }
}

async function handleDisconnectIntegration(integrationId: string) {
  try {
    await deleteIntegrationAsync(integrationId);
    isDisconnectIntegrationDialogOpen.value = false;
  } catch (error) {
    console.error("Failed to disconnect integration:", error);
  }
}

// Webhooks
const isCreateDialogOpen = ref(false);
const isEditDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const selectedWebhook = ref<Webhook | null>(null);

const eventCategories = [
  {
    id: "documents",
    name: t("integrations.events.documents.name"),
    events: [
      {
        key: "documents.uploaded",
        name: t("integrations.events.documents.documentsUploaded"),
        description: t("integrations.events.documents.documentsUploadedDesc"),
      },
      {
        key: "documents.downloaded",
        name: t("integrations.events.documents.documentsDownloaded"),
        description: t("integrations.events.documents.documentsDownloadedDesc"),
      },
      {
        key: "documents.redacted",
        name: t("integrations.events.documents.documentsRedacted"),
        description: t("integrations.events.documents.documentsRedactedDesc"),
      },
      {
        key: "documents.verified",
        name: t("integrations.events.documents.documentsVerified"),
        description: t("integrations.events.documents.documentsVerifiedDesc"),
      },
    ],
  },
  {
    id: "integrations",
    name: t("integrations.events.integrations.name"),
    events: [
      {
        key: "integrations.triggered",
        name: t("integrations.events.integrations.integrationTriggered"),
        description: t(
          "integrations.events.integrations.integrationTriggeredDesc",
        ),
      },
      {
        key: "integrations.succeeded",
        name: t("integrations.events.integrations.integrationSucceeded"),
        description: t(
          "integrations.events.integrations.integrationSucceededDesc",
        ),
      },
      {
        key: "integrations.failed",
        name: t("integrations.events.integrations.integrationFailed"),
        description: t(
          "integrations.events.integrations.integrationFailedDesc",
        ),
      },
    ],
  },
];

async function handleCreateWebhook(webhookData: {
  name: string;
  url: string;
  active: boolean;
  events: Record<string, boolean>;
}) {
  const events = Object.entries(webhookData.events)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => key);

  try {
    await createWebhookAsync({
      displayName: webhookData.name,
      url: webhookData.url,
      description: "",
      events,
    });
    isCreateDialogOpen.value = false;
  } catch (error) {
    console.error("Failed to create webhook:", error);
  }
}

async function handleUpdateWebhook(webhookData: {
  name: string;
  url: string;
  active: boolean;
  events: Record<string, boolean>;
}) {
  if (!selectedWebhook.value) return;

  const events = Object.entries(webhookData.events)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => key);

  try {
    await updateWebhookAsync({
      webhookId: selectedWebhook.value.webhookId,
      updates: {
        displayName: webhookData.name,
        url: webhookData.url,
        events,
      },
    });
    isEditDialogOpen.value = false;
  } catch (error) {
    console.error("Failed to update webhook:", error);
  }
}

async function handleDeleteWebhook(webhookId: string) {
  try {
    await deleteWebhookAsync(webhookId);
    isDeleteDialogOpen.value = false;
  } catch (error) {
    console.error("Failed to delete webhook:", error);
  }
}

function openEditDialog(webhook: Webhook) {
  selectedWebhook.value = webhook;
  isEditDialogOpen.value = true;
}

function openDeleteDialog(webhook: Webhook) {
  selectedWebhook.value = webhook;
  isDeleteDialogOpen.value = true;
}

function testWebhook(webhook: Webhook) {
  console.log("Testing webhook:", webhook);
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <!-- Loading State -->
      <div
        v-if="isLoadingIntegrations || isLoadingWebhooks"
        class="flex items-center justify-center py-12"
      >
        <Loader2 class="h-8 w-8 animate-spin text-neutral-400" />
      </div>

      <template v-else>
        <!-- Active Integrations -->
        <Card
          v-if="integrations && integrations.length > 0"
          class="mb-8 py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
        >
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle
                  class="text-sm font-light tracking-wider uppercase text-neutral-500 dark:text-neutral-400"
                  >{{
                    t("integrations.sections.connectedServices.title")
                  }}</CardTitle
                >
                <CardDescription class="font-light">{{
                  t("integrations.sections.connectedServices.description", {
                    count: integrations.length,
                  })
                }}</CardDescription>
              </div>
              <div class="flex items-center gap-2">
                <Button as-child variant="outline">
                  <NuxtLink to="/integrations/explore">
                    {{ t("integrations.actions.explore") }}
                  </NuxtLink>
                </Button>
                <Button as-child variant="outline">
                  <NuxtLink to="/integrations/runs">
                    {{ t("integrations.actions.viewRuns") }}
                  </NuxtLink>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <IntegrationsTable
              :integrations="integrations"
              @configure="openConfigureIntegrationDialog"
              @disconnect="openDisconnectIntegrationDialog"
            />
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
          >
            <p
              class="text-sm font-light text-neutral-600 dark:text-neutral-400"
            >
              {{ t("integrations.messages.integrationFooter") }}
              <a
                href="https://docs.nvisy.com/integrations"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-neutral-900 dark:text-white hover:underline font-medium"
              >
                {{ t("integrations.messages.documentation") }}
                <ExternalLink :size="12" />
              </a>
            </p>
          </CardFooter>
        </Card>

        <Card
          v-else
          class="mb-8 py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
        >
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle
                  class="text-sm font-light tracking-wider uppercase text-neutral-500 dark:text-neutral-400"
                  >{{
                    t("integrations.sections.connectedServices.title")
                  }}</CardTitle
                >
                <CardDescription class="font-light">{{
                  t("integrations.sections.connectedServices.description", {
                    count: 0,
                  })
                }}</CardDescription>
              </div>
              <div class="flex items-center gap-2">
                <Button as-child variant="outline">
                  <NuxtLink to="/integrations/explore">
                    <PlugZap :size="16" class="mr-2" />
                    {{ t("integrations.actions.explore") }}
                  </NuxtLink>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent class="py-12">
            <div class="text-center">
              <div
                class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
              >
                <Plug class="h-6 w-6 text-neutral-400 dark:text-neutral-500" />
              </div>
              <p
                class="font-normal text-neutral-700 dark:text-neutral-300 mb-1"
              >
                {{
                  t(
                    "integrations.sections.connectedServices.noIntegrationsTitle",
                  )
                }}
              </p>
              <p
                class="font-light text-sm text-neutral-500 dark:text-neutral-400"
              >
                {{
                  t(
                    "integrations.sections.connectedServices.noIntegrationsDescription",
                  )
                }}
              </p>
            </div>
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
          >
            <p
              class="text-sm font-light text-neutral-600 dark:text-neutral-400"
            >
              {{ t("integrations.messages.integrationFooter") }}
              <a
                href="https://docs.nvisy.com/integrations"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-neutral-900 dark:text-white hover:underline font-medium"
              >
                {{ t("integrations.messages.documentation") }}
                <ExternalLink :size="12" />
              </a>
            </p>
          </CardFooter>
        </Card>

        <!-- Webhook Endpoints Section -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
        >
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle
                  class="text-sm font-light tracking-wider uppercase text-neutral-500 dark:text-neutral-400"
                  >{{ t("integrations.sections.webhooks.title") }}</CardTitle
                >
                <CardDescription class="font-light">{{
                  t("integrations.sections.webhooks.description", {
                    count: webhooks?.length ?? 0,
                  })
                }}</CardDescription>
              </div>
              <CreateWebhookDialog
                v-model:open="isCreateDialogOpen"
                :event-categories="eventCategories"
                :is-loading="isCreatingWebhook"
                @create="handleCreateWebhook"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="webhooks && webhooks.length > 0">
              <WebhooksTable
                :webhooks="webhooks"
                @edit="openEditDialog"
                @delete="openDeleteDialog"
                @test="testWebhook"
              />
            </div>

            <div v-else class="py-12">
              <div class="text-center">
                <div
                  class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
                >
                  <WebhookIcon
                    class="h-6 w-6 text-neutral-400 dark:text-neutral-500"
                  />
                </div>
                <p
                  class="font-normal text-neutral-700 dark:text-neutral-300 mb-1"
                >
                  {{ t("integrations.sections.webhooks.noWebhooksTitle") }}
                </p>
                <p
                  class="font-light text-sm text-neutral-500 dark:text-neutral-400"
                >
                  {{
                    t("integrations.sections.webhooks.noWebhooksDescription")
                  }}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
          >
            <p
              class="text-sm font-light text-neutral-600 dark:text-neutral-400"
            >
              {{ t("integrations.messages.webhookFooter") }}
              <a
                href="https://docs.nvisy.com/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-neutral-900 dark:text-white hover:underline font-medium"
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
          :integration="selectedIntegration"
          :is-loading="isUpdating"
          @update="handleUpdateIntegration"
        />

        <DisconnectIntegrationDialog
          v-model:open="isDisconnectIntegrationDialogOpen"
          :integration="selectedIntegration"
          :is-loading="isDeleting"
          @disconnect="handleDisconnectIntegration"
        />

        <EditWebhookDialog
          v-model:open="isEditDialogOpen"
          :webhook="selectedWebhook"
          :event-categories="eventCategories"
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
