<script setup lang="ts">
import type { Webhook } from "@nvisy/sdk/datatypes";
import type { WebhookFormPayload } from "#console/composables/useWebhookForm";
import { Webhook as WebhookIcon, Loader2, Plus, X } from "@lucide/vue";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { Button } from "#console/components/ui/button";
import { Checkbox } from "#console/components/ui/checkbox";
import { EnabledSwitch } from "#console/components/common";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "#console/components/ui/sheet";

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

/** Edit mode repopulates whenever the sheet opens with a webhook. */
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
  <Sheet :open="open" @update:open="handleOpenChange">
    <SheetTrigger v-if="mode === 'create'" as-child>
      <Button size="sm" class="flex items-center gap-2">
        <WebhookIcon :size="16" />
        {{ t("connections.actions.createWebhook") }}
      </Button>
    </SheetTrigger>

    <SheetContent
      side="right"
      class="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
    >
      <SheetHeader class="border-b border-border/50">
        <SheetTitle>{{ t(keys.title) }}</SheetTitle>
        <SheetDescription>{{ t(keys.description) }}</SheetDescription>
      </SheetHeader>

      <div class="flex-1 space-y-6 overflow-y-auto p-6">
        <!-- Name -->
        <div class="space-y-2">
          <Label for="webhook-name" required>
            {{ t("connections.forms.webhook.nameLabel") }}
          </Label>
          <Input
            id="webhook-name"
            v-model="name"
            :placeholder="t('connections.forms.webhook.namePlaceholder')"
          />
        </div>

        <!-- URL -->
        <div class="space-y-2">
          <Label for="webhook-url" required>
            {{ t("connections.forms.webhook.urlLabel") }}
          </Label>
          <Input
            id="webhook-url"
            v-model="url"
            type="url"
            :placeholder="t('connections.forms.webhook.urlPlaceholder')"
            @blur="validateUrl(t)"
          />
          <p v-if="urlError" class="text-sm text-destructive">
            {{ urlError }}
          </p>
        </div>

        <!-- Custom headers -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <Label>{{ t("connections.forms.webhook.headersLabel") }}</Label>
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
          <p v-else class="text-sm text-muted-foreground">
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
            <Label
              :for="eventId(event)"
              class="cursor-pointer font-mono text-sm font-normal"
            >
              {{ event }}
            </Label>
          </div>
        </div>
      </div>

      <SheetFooter
        class="flex-row items-center justify-between border-t border-border/50"
      >
        <EnabledSwitch v-model="active" />
        <div class="flex items-center gap-2">
          <Button variant="outline" @click="cancel">{{ t(keys.cancel) }}</Button>
          <Button :disabled="!isFormValid || isLoading" @click="submit">
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ t(keys.save) }}
          </Button>
        </div>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
