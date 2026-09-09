<script setup lang="ts">
import { Bot, Loader2, Compass } from "@lucide/vue";
import { toast } from "vue-sonner";
import type { Provider, UpdateProvider } from "@nvisy/sdk/datatypes";
import { Button } from "#console/components/ui/button";
import {
	ProvidersTable,
	ConfigureProviderDialog,
} from "#console/components/pages/integrations";
import { providerIcon, providerLabel } from "#console/utils/connections";
import { ConfirmDialog } from "#console/components/shared";
import { HeaderSocket, SectionTabs } from "#console/components/layout/header";

const { t } = useI18n();
const sectionTabs = useSectionTabs();
const { wLink } = useWorkspaceLink();

useHead({ title: "Providers" });

definePageMeta({
	pageCategory: "header.category.integrations",
	hideCategory: true,
});

const {
	providers,
	isLoading,
	error,
	refresh,
	updateProviderAsync,
	deleteProviderAsync,
	verifyProviderAsync,
	isUpdating,
	isDeleting,
} = useProviders();

const isConfigureDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const selectedProvider = ref<Provider | null>(null);

function findProviderById(providerId: string): Provider | undefined {
	return providers.value?.find((p) => p.id === providerId);
}

function openConfigureDialog(providerId: string) {
	const provider = findProviderById(providerId);
	if (provider) {
		selectedProvider.value = provider;
		isConfigureDialogOpen.value = true;
	}
}

function openDeleteDialog(providerId: string) {
	const provider = findProviderById(providerId);
	if (provider) {
		selectedProvider.value = provider;
		isDeleteDialogOpen.value = true;
	}
}

async function handleUpdateProvider(updates: UpdateProvider) {
	if (!selectedProvider.value) return;
	try {
		await updateProviderAsync({
			providerId: selectedProvider.value.id,
			updates,
		});
		isConfigureDialogOpen.value = false;
		toast.success(t("providers.toast.updated"));
	} catch (error) {
		toast.error(t("providers.toast.updateFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}

async function handleDeleteProvider(providerId: string) {
	try {
		await deleteProviderAsync(providerId);
		isDeleteDialogOpen.value = false;
		toast.success(t("providers.toast.deleted"));
	} catch (error) {
		toast.error(t("providers.toast.deleteFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}

async function handleToggleActive(provider: Provider) {
	try {
		await updateProviderAsync({
			providerId: provider.id,
			updates: { isActive: !provider.isActive },
		});
		toast.success(
			provider.isActive
				? t("providers.toast.disabled")
				: t("providers.toast.enabled"),
		);
	} catch (error) {
		toast.error(t("providers.toast.updateFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}

async function handleTestProvider(providerId: string) {
	try {
		const result = await verifyProviderAsync(providerId);
		if (result.reachable) {
			toast.success(t("providers.toast.testReachable"));
		} else {
			toast.error(t("providers.toast.testUnreachable"), {
				description: result.error,
			});
		}
	} catch (error) {
		toast.error(t("providers.toast.testFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}
</script>

<template>
  <!-- Fixed-height page so the table fills and scrolls (like /integrations). -->
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6 h-[calc(100vh-5.5rem)]">
    <div class="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 min-h-0">
      <!-- Section tabs in the app-header socket. -->
      <HeaderSocket>
        <SectionTabs :tabs="sectionTabs.integrations.value" />
      </HeaderSocket>

      <!-- Action row: count on the left, explore on the right. -->
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm text-muted-foreground">
          {{ t("providers.description", { count: providers?.length ?? 0 }) }}
        </p>
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

      <!-- Loading -->
      <div
        v-if="isLoading"
        class="flex flex-1 items-center justify-center py-12"
      >
        <Loader2 :size="24" class="animate-spin text-muted-foreground" />
      </div>

      <!-- Error: surface the failure with a retry, not an empty state. -->
      <div
        v-else-if="error"
        class="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center"
      >
        <p class="text-sm text-destructive">
          {{ error.message || t("providers.errors.loadFailed") }}
        </p>
        <Button variant="outline" size="sm" @click="refresh()">
          {{ t("common.errors.tryAgain") }}
        </Button>
      </div>

      <!-- Bare full-width table, filling the remaining height. -->
      <div v-else class="relative min-h-0 flex-1">
        <ProvidersTable
          :providers="providers ?? []"
          :empty="{
            icon: Bot,
            title: t('providers.empty.title'),
            description: t('providers.empty.description'),
          }"
          @configure="openConfigureDialog"
          @delete="openDeleteDialog"
          @test="handleTestProvider"
          @toggle-active="handleToggleActive"
        />
      </div>

      <!-- Dialogs -->
      <ConfigureProviderDialog
        v-model:open="isConfigureDialogOpen"
        :provider="selectedProvider"
        :is-loading="isUpdating"
        @update="handleUpdateProvider"
      />

      <ConfirmDialog
        v-model:open="isDeleteDialogOpen"
        :title="
          t('providers.dialogs.delete.title', {
            name: selectedProvider?.displayName,
          })
        "
        :description="t('providers.dialogs.delete.description')"
        :confirm-label="t('providers.dialogs.delete.confirm')"
        :cancel-label="t('providers.dialogs.delete.cancel')"
        :is-loading="isDeleting"
        @confirm="selectedProvider && handleDeleteProvider(selectedProvider.id)"
      >
        <template v-if="selectedProvider" #details>
          <div class="flex items-center gap-3">
            <div
              class="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40"
            >
              <img
                v-if="providerIcon(selectedProvider.provider)"
                :src="providerIcon(selectedProvider.provider)!"
                :alt="selectedProvider.provider"
                class="size-5 object-contain"
              />
              <Bot v-else :size="18" class="text-muted-foreground" />
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-foreground">
                {{ selectedProvider.displayName }}
              </p>
              <p class="truncate text-xs text-muted-foreground">
                {{ providerLabel(selectedProvider.provider) }}
              </p>
            </div>
          </div>
        </template>
      </ConfirmDialog>
    </div>
  </div>
</template>
