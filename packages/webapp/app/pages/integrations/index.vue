<script setup lang="ts">
import { ref } from "vue";
const { t } = useI18n();
import { Github, Slack, Database, ExternalLink, Plus } from "lucide-vue-next";
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
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	WebhooksTable,
	ConfigureIntegrationDialog,
	DisconnectIntegrationDialog,
	CreateWebhookDialog,
	DeleteWebhookDialog,
	EditWebhookDialog,
	IntegrationsTable,
} from "~/components/pages/integrations";

definePageMeta({
	pageName: "Integrations",
});

// Mock active integrations
const activeIntegrations = ref([
	{
		id: 1,
		name: "GitHub",
		description: "Repository sync enabled",
		icon: Github,
		color: "bg-gray-900",
		status: "active",
		connectedAt: "2 weeks ago",
	},
	{
		id: 2,
		name: "Slack",
		description: "Workspace: Acme Inc",
		icon: Slack,
		color: "bg-purple-600",
		status: "active",
		connectedAt: "1 month ago",
	},
	{
		id: 3,
		name: "PostgreSQL",
		description: "Database: production",
		icon: Database,
		color: "bg-blue-600",
		status: "active",
		connectedAt: "3 days ago",
	},
]);

// Integration dialogs
const isConfigureIntegrationDialogOpen = ref(false);
const isDisconnectIntegrationDialogOpen = ref(false);
const selectedIntegration = ref<(typeof activeIntegrations.value)[0] | null>(
	null,
);

function openConfigureIntegrationDialog(id: number) {
	const integration = activeIntegrations.value.find((i) => i.id === id);
	if (integration) {
		selectedIntegration.value = integration;
		isConfigureIntegrationDialogOpen.value = true;
	}
}

function openDisconnectIntegrationDialog(id: number) {
	const integration = activeIntegrations.value.find((i) => i.id === id);
	if (integration) {
		selectedIntegration.value = integration;
		isDisconnectIntegrationDialogOpen.value = true;
	}
}

function handleUpdateIntegration(integrationData: any) {
	if (!selectedIntegration.value) return;

	const integrationIndex = activeIntegrations.value.findIndex(
		(i) => i.id === selectedIntegration.value?.id,
	);
	if (integrationIndex !== -1) {
		const integration = activeIntegrations.value[integrationIndex];
		if (integration) {
			integration.name = integrationData.name;
			integration.description = integrationData.description;
			integration.status = integrationData.active ? "active" : "inactive";
		}
	}

	console.log("Updated integration:", selectedIntegration.value);
}

function handleDisconnectIntegration(integrationId: number) {
	activeIntegrations.value = activeIntegrations.value.filter(
		(i) => i.id !== integrationId,
	);
	console.log("Disconnected integration:", integrationId);
}

// Webhooks
interface Webhook {
	id: string;
	name: string;
	url: string;
	status: "active" | "inactive";
	events: string[];
	createdAt: Date;
	lastDelivery: Date;
}

interface WebhookData {
	name: string;
	url: string;
	active: boolean;
	events: Record<string, boolean>;
}

const isCreateDialogOpen = ref(false);
const isEditDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const selectedWebhook = ref<Webhook | null>(null);

const eventCategories = [
	{
		id: "documents",
		name: "Documents",
		events: [
			{
				key: "documentsUploaded",
				name: "Document Uploaded",
				description: "When a new document is uploaded to your project",
			},
			{
				key: "documentsDownloaded",
				name: "Document Downloaded",
				description: "When a document is downloaded from your project",
			},
			{
				key: "documentsRedacted",
				name: "Document Redacted",
				description: "When a document is successfully redacted",
			},
			{
				key: "documentsVerified",
				name: "Document Verified",
				description: "When a document passes verification checks",
			},
		],
	},
	{
		id: "integrations",
		name: "Integrations",
		events: [
			{
				key: "integrationTriggered",
				name: "Integration Triggered",
				description: "When an integration workflow is started",
			},
			{
				key: "integrationSucceeded",
				name: "Integration Succeeded",
				description: "When an integration completes successfully",
			},
			{
				key: "integrationFailed",
				name: "Integration Failed",
				description: "When an integration encounters errors or failures",
			},
		],
	},
];

const existingWebhooks = ref<Webhook[]>([
	{
		id: "1",
		name: "Production API",
		url: "https://api.production.com/webhooks",
		status: "active",
		events: ["documentsUploaded", "documentsRedacted", "integrationFailed"],
		createdAt: new Date("2024-01-10"),
		lastDelivery: new Date("2024-01-20"),
	},
	{
		id: "2",
		name: "Slack Notifications",
		url: "https://hooks.slack.com/services/xxx/yyy/zzz",
		status: "active",
		events: ["integrationFailed", "documentsVerified"],
		createdAt: new Date("2024-01-15"),
		lastDelivery: new Date("2024-01-19"),
	},
	{
		id: "3",
		name: "Analytics Webhook",
		url: "https://analytics.myapp.com/webhook",
		status: "inactive",
		events: ["documentsUploaded", "documentsDownloaded"],
		createdAt: new Date("2024-01-05"),
		lastDelivery: new Date("2024-01-18"),
	},
]);

function handleCreateWebhook(webhookData: WebhookData) {
	const newWebhook: Webhook = {
		id: Date.now().toString(),
		name: webhookData.name,
		url: webhookData.url,
		status: webhookData.active ? "active" : "inactive",
		events: Object.entries(webhookData.events)
			.filter(([_, enabled]) => enabled)
			.map(([key, _]) => key),
		createdAt: new Date(),
		lastDelivery: new Date(),
	};

	existingWebhooks.value.push(newWebhook);
	console.log("Created webhook:", newWebhook);
}

function handleUpdateWebhook(webhookData: WebhookData) {
	if (!selectedWebhook.value) return;

	const webhookIndex = existingWebhooks.value.findIndex(
		(w) => w.id === selectedWebhook.value?.id,
	);
	if (webhookIndex !== -1) {
		const webhook = existingWebhooks.value[webhookIndex];
		if (webhook) {
			webhook.name = webhookData.name;
			webhook.url = webhookData.url;
			webhook.status = webhookData.active ? "active" : "inactive";
			webhook.events = Object.entries(webhookData.events)
				.filter(([_, enabled]) => enabled)
				.map(([key, _]) => key);
		}
	}

	console.log("Updated webhook:", selectedWebhook.value);
}

function handleDeleteWebhook(webhookId: string) {
	existingWebhooks.value = existingWebhooks.value.filter(
		(w) => w.id !== webhookId,
	);
	console.log("Deleted webhook:", webhookId);
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
      <!-- Active Integrations -->
      <Card
        v-if="activeIntegrations.length > 0"
        class="mb-8 py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
      >
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>{{
                t("integrations.sections.connectedServices.title")
              }}</CardTitle>
              <CardDescription>{{
                t("integrations.sections.connectedServices.description", {
                  count: activeIntegrations.length,
                })
              }}</CardDescription>
            </div>
            <div class="flex items-center gap-2">
              <Button as-child>
                <NuxtLink to="/integrations/explore">
                  {{ t("integrations.actions.explore") }}
                </NuxtLink>
              </Button>
              <Button as-child variant="outline">
                <NuxtLink to="/integrations/runs"> View Runs </NuxtLink>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <IntegrationsTable
            :integrations="activeIntegrations"
            @configure="openConfigureIntegrationDialog"
            @disconnect="openDisconnectIntegrationDialog"
          />
        </CardContent>
        <CardFooter
          class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
        >
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
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
        class="mb-8 pt-6 py-0 rounded-xl border-neutral-200 dark:border-neutral-800"
      >
        <CardContent class="py-12">
          <div class="text-center">
            <p class="text-neutral-600 dark:text-neutral-400 mb-4">
              {{
                t("integrations.sections.connectedServices.noIntegrationsTitle")
              }}
            </p>
            <Button as-child>
              <NuxtLink to="/integrations/explore">
                {{ t("integrations.actions.browse") }}
              </NuxtLink>
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Webhook Endpoints Section -->
      <Card
        class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
      >
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>{{
                t("integrations.sections.webhooks.title")
              }}</CardTitle>
              <CardDescription>{{
                t("integrations.sections.webhooks.description", {
                  count: existingWebhooks.length,
                })
              }}</CardDescription>
            </div>
            <CreateWebhookDialog
              v-model:open="isCreateDialogOpen"
              :event-categories="eventCategories"
              @create="handleCreateWebhook"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="existingWebhooks.length > 0">
            <WebhooksTable
              :webhooks="existingWebhooks"
              @edit="openEditDialog"
              @delete="openDeleteDialog"
              @test="testWebhook"
            />
          </div>

          <Empty v-else>
            <EmptyHeader>
              <EmptyTitle>{{
                t("integrations.sections.webhooks.noWebhooksTitle")
              }}</EmptyTitle>
              <EmptyDescription>
                {{ t("integrations.sections.webhooks.noWebhooksDescription") }}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                @click="isCreateDialogOpen = true"
                class="flex items-center gap-2"
              >
                <Plus :size="16" />
                {{ t("integrations.actions.createWebhook") }}
              </Button>
            </EmptyContent>
          </Empty>
        </CardContent>
        <CardFooter
          class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
        >
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
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
        @update="handleUpdateIntegration"
      />

      <DisconnectIntegrationDialog
        v-model:open="isDisconnectIntegrationDialogOpen"
        :integration="selectedIntegration"
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
    </div>
  </div>
</template>
