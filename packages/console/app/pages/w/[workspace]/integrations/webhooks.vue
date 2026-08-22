<script setup lang="ts">
import { Webhook as WebhookIcon, Loader2 } from "@lucide/vue";
import { toast } from "vue-sonner";
import type {
	Webhook,
	WebhookEvent,
	WebhookStatus,
} from "@nvisy/sdk/datatypes";
import {
	WebhooksTable,
	WebhookSheet,
} from "#console/components/pages/webhooks";
import { ConfirmDialog } from "#console/components/common";
import { HeaderSocket, SectionTabs } from "#console/components/layout/header";

const { t } = useI18n();
const sectionTabs = useSectionTabs();

useHead({ title: "Webhooks" });

definePageMeta({
	pageCategory: "header.category.integrations",
	hideCategory: true,
});

const {
	webhooks,
	isLoading,
	createWebhookAsync,
	updateWebhookAsync,
	deleteWebhookAsync,
	testWebhookAsync,
	isCreating: isCreatingWebhook,
} = useWebhooks();

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
			updates: { status: active ? "enabled" : "disabled" },
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
  <!-- Fixed-height page so the table fills and scrolls (like /files). -->
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6 h-[calc(100vh-5.5rem)]">
    <div class="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 min-h-0">
      <!-- Section tabs in the app-header socket. -->
      <HeaderSocket>
        <SectionTabs :tabs="sectionTabs.integrations.value" />
      </HeaderSocket>

      <!-- Action row: count on the left, create on the right. -->
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm text-muted-foreground">
          {{
            t("connections.sections.webhooks.description", {
              count: webhooks?.length ?? 0,
            })
          }}
        </p>
        <WebhookSheet
          v-model:open="isCreateDialogOpen"
          mode="create"
          :is-loading="isCreatingWebhook"
          @submit="handleCreateWebhook"
        />
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
        <WebhooksTable
          :webhooks="webhooks ?? []"
          :empty="{
            icon: WebhookIcon,
            title: t('connections.sections.webhooks.noWebhooksTitle'),
            description: t('connections.sections.webhooks.noWebhooksDescription'),
          }"
          @edit="openEditDialog"
          @delete="openDeleteDialog"
          @test="testWebhook"
          @toggle-status="toggleWebhookStatus"
        />
      </div>

      <!-- Dialogs -->
      <WebhookSheet
        v-model:open="isEditDialogOpen"
        mode="edit"
        :webhook="selectedWebhook"
        @submit="handleUpdateWebhook"
      />

      <ConfirmDialog
        v-model:open="isDeleteDialogOpen"
        :title="
          t('connections.dialogs.deleteWebhook.title', {
            name: selectedWebhook?.displayName,
          })
        "
        :description="t('connections.dialogs.deleteWebhook.description')"
        :confirm-label="t('connections.dialogs.deleteWebhook.confirm')"
        :cancel-label="t('connections.dialogs.deleteWebhook.cancel')"
        @confirm="selectedWebhook && handleDeleteWebhook(selectedWebhook.id)"
      >
        <template v-if="selectedWebhook" #details>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-foreground">
              {{ selectedWebhook.displayName }}
            </p>
            <p class="truncate font-mono text-xs text-muted-foreground">
              {{ selectedWebhook.url }}
            </p>
          </div>
        </template>
      </ConfirmDialog>
    </div>
  </div>
</template>
