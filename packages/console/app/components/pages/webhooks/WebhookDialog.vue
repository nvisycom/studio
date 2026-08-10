<script setup lang="ts">
import type { Webhook } from "@nvisy/sdk/datatypes";
import type { WebhookFormPayload } from "#console/composables/useWebhookForm";
import { Webhook as WebhookIcon, Loader2, Plus, X } from "@lucide/vue";
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
	DialogTrigger,
} from "#console/components/ui/dialog";

const { t } = useI18n();

const open = defineModel<boolean>("open", { default: false });

const props = withDefaults(
	defineProps<{
		/** "create" shows the trigger button; "edit" populates from `webhook`. */
		mode: "create" | "edit";
		webhook?: Webhook | null;
		isLoading?: boolean;
	}>(),
	{ webhook: null, isLoading: false },
);

const emit = defineEmits<{
	submit: [data: WebhookFormPayload];
}>();

const {
	name,
	url,
	active,
	events,
	headers,
	urlError,
	addHeader,
	removeHeader,
	validateUrl,
	isFormValid,
	reset,
	populate,
	payload,
} = useWebhookForm();

/** i18n keys live under the mode-specific dialog namespace. */
const keys = computed(() => {
	const ns =
		props.mode === "create"
			? "connections.dialogs.createWebhook"
			: "connections.dialogs.editWebhook";
	return {
		title: `${ns}.title`,
		description: `${ns}.description`,
		cancel: `${ns}.cancel`,
		save: `${ns}.save`,
	};
});

/** Edit mode repopulates whenever the dialog opens with a webhook. */
watch(
	[() => props.webhook, open],
	([webhook, isOpen]) => {
		if (props.mode === "edit" && isOpen && webhook) populate(webhook);
	},
	{ immediate: true },
);

function handleOpenChange(value: boolean) {
	if (!value) reset();
	open.value = value;
}

function submit() {
	if (!isFormValid.value) return;
	if (props.mode === "edit" && !props.webhook) return;
	emit("submit", payload());
}

function cancel() {
	reset();
	open.value = false;
}

/** Unique checkbox ids per mode so create/edit can coexist in one tree. */
const eventId = (event: string) => `${props.mode}-${event}`;
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogTrigger v-if="mode === 'create'" as-child>
      <Button
        variant="outline"
        size="sm"
        class="flex items-center gap-2 font-normal"
      >
        <WebhookIcon :size="16" />
        {{ t("connections.actions.createWebhook") }}
      </Button>
    </DialogTrigger>

    <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ t(keys.title) }}</DialogTitle>
        <DialogDescription>{{ t(keys.description) }}</DialogDescription>
      </DialogHeader>

      <div class="space-y-6 py-6">
        <!-- Name -->
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

        <!-- URL -->
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
          <p v-if="urlError" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ urlError }}
          </p>
        </div>

        <!-- Custom headers -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label
              class="block text-sm font-medium text-neutral-900 dark:text-white"
            >
              {{ t("connections.forms.webhook.headersLabel") }}
            </label>
            <Button type="button" variant="outline" size="sm" @click="addHeader">
              <Plus :size="14" class="mr-1" />
              {{ t("connections.forms.webhook.addHeader") }}
            </Button>
          </div>
          <div v-if="headers.length > 0" class="space-y-2">
            <div
              v-for="(header, index) in headers"
              :key="header.id"
              class="flex items-center gap-2"
            >
              <Input
                v-model="header.key"
                :placeholder="t('connections.forms.webhook.headerKeyPlaceholder')"
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

        <!-- Events -->
        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="event in WEBHOOK_EVENTS"
            :key="event"
            class="flex items-center gap-2"
          >
            <Checkbox :id="eventId(event)" v-model="events[event]" />
            <label
              :for="eventId(event)"
              class="text-sm font-mono text-neutral-900 dark:text-white cursor-pointer"
            >
              {{ event }}
            </label>
          </div>
        </div>
      </div>

      <DialogFooter class="flex items-center justify-between sm:justify-between">
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
          <Button variant="outline" @click="cancel">{{ t(keys.cancel) }}</Button>
          <Button :disabled="!isFormValid || isLoading" @click="submit">
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ t(keys.save) }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
