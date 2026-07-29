<script setup lang="ts">
import type { Webhook } from "@nvisy/sdk/datatypes";
import { Loader2, Plus, X } from "@lucide/vue";
import { Input } from "#console/components/ui/input";
import { Button } from "#console/components/ui/button";
import { Checkbox } from "#console/components/ui/checkbox";
import { Switch } from "#console/components/ui/switch";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";
import type { WebhookFormPayload } from "#console/composables/useWebhookForm";

const { t } = useI18n();

const open = defineModel<boolean>("open", { default: false });

const props = withDefaults(
	defineProps<{
		webhook?: Webhook | null;
		isLoading?: boolean;
	}>(),
	{ webhook: null, isLoading: false },
);

const emit = defineEmits<{
	update: [data: WebhookFormPayload];
}>();

const {
	name,
	url,
	active,
	events,
	headers,
	headerIds,
	urlError,
	addHeader,
	removeHeader,
	validateUrl,
	isFormValid,
	reset,
	populate,
	payload,
} = useWebhookForm();

// Repopulate whenever the dialog opens with a webhook.
watch(
	[() => props.webhook, open],
	([webhook, isOpen]) => {
		if (isOpen && webhook) populate(webhook);
	},
	{ immediate: true },
);

function handleOpenChange(value: boolean) {
	if (!value) reset();
	open.value = value;
}

function updateWebhook() {
	if (!isFormValid.value || !props.webhook) return;
	emit("update", payload());
}

function cancel() {
	reset();
	open.value = false;
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{
          t("connections.dialogs.editWebhook.title")
        }}</DialogTitle>
        <DialogDescription>
          {{ t("connections.dialogs.editWebhook.description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6 py-6">
        <!-- Webhook Name -->
        <div>
          <label
            class="block text-sm font-medium text-neutral-900 dark:text-white mb-2"
          >
            {{ t("connections.forms.webhook.nameLabel") }}
          </label>
          <Input
            v-model="name"
            :placeholder="t('connections.forms.webhook.namePlaceholder')"
            class="text-neutral-900 dark:text-white"
          />
        </div>

        <!-- Webhook URL -->
        <div>
          <label
            class="block text-sm font-medium text-neutral-900 dark:text-white mb-2"
          >
            {{ t("connections.forms.webhook.urlLabel") }}
          </label>
          <Input
            v-model="url"
            type="url"
            :placeholder="t('connections.forms.webhook.urlPlaceholder')"
            class="text-neutral-900 dark:text-white"
            @blur="validateUrl(t)"
          />
          <p
            v-if="urlError"
            class="mt-1 text-sm text-red-600 dark:text-red-400"
          >
            {{ urlError }}
          </p>
        </div>

        <!-- Custom Headers -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label
              class="block text-sm font-medium text-neutral-900 dark:text-white"
            >
              {{ t("connections.forms.webhook.headersLabel") }}
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              @click="addHeader"
            >
              <Plus :size="14" class="mr-1" />
              {{ t("connections.forms.webhook.addHeader") }}
            </Button>
          </div>
          <div v-if="headers.length > 0" class="space-y-2">
            <div
              v-for="(header, index) in headers"
              :key="headerIds[index]"
              class="flex items-center gap-2"
            >
              <Input
                v-model="header.key"
                :placeholder="
                  t('connections.forms.webhook.headerKeyPlaceholder')
                "
                class="flex-1 font-mono text-sm"
              />
              <Input
                v-model="header.value"
                :placeholder="
                  t('connections.forms.webhook.headerValuePlaceholder')
                "
                class="flex-1 font-mono text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                @click="removeHeader(index)"
              >
                <X :size="16" />
              </Button>
            </div>
          </div>
          <p v-else class="text-sm text-neutral-500 dark:text-neutral-400">
            {{ t("connections.forms.webhook.noHeaders") }}
          </p>
        </div>

        <!-- Webhook Events -->
        <div>
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="event in WEBHOOK_EVENTS"
              :key="event"
              class="flex items-center gap-2"
            >
              <Checkbox :id="`edit-${event}`" v-model="events[event]" />
              <label
                :for="`edit-${event}`"
                class="text-sm font-mono text-neutral-900 dark:text-white cursor-pointer"
              >
                {{ event }}
              </label>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter
        class="flex items-center justify-between sm:justify-between"
      >
        <div class="flex items-center gap-2">
          <Switch v-model="active" />
          <span class="text-sm text-neutral-600 dark:text-neutral-400">
            {{
              active
                ? t("connections.forms.webhook.enabledLabel")
                : t("connections.forms.webhook.disabledLabel")
            }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" @click="cancel">
            {{ t("connections.dialogs.editWebhook.cancel") }}
          </Button>
          <Button @click="updateWebhook" :disabled="!isFormValid || isLoading">
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ t("connections.dialogs.editWebhook.save") }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
