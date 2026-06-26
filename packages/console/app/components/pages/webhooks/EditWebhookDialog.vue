<script setup lang="ts">
import type { Webhook, WebhookEvent } from "@nvisy/sdk/datatypes";
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

const { t } = useI18n();

// All available webhook events from SDK
const WEBHOOK_EVENTS: WebhookEvent[] = [
	"document:created",
	"document:updated",
	"document:deleted",
	"file:created",
	"file:updated",
	"file:deleted",
	"member:added",
	"member:updated",
	"member:deleted",
	"integration:created",
	"integration:updated",
	"integration:deleted",
	"integration:synced",
	"integration:desynced",
];

interface Header {
	key: string;
	value: string;
}

interface Props {
	open?: boolean;
	webhook?: Webhook | null;
	isLoading?: boolean;
}

interface Emits {
	(e: "update:open", value: boolean): void;
	(
		e: "update",
		data: {
			displayName: string;
			url: string;
			status: "active" | "paused";
			events: WebhookEvent[];
			headers: Record<string, string>;
		},
	): void;
}

const props = withDefaults(defineProps<Props>(), {
	open: false,
	webhook: null,
	isLoading: false,
});

const emit = defineEmits<Emits>();

// Form data
const webhookName = ref("");
const webhookUrl = ref("");
const webhookActive = ref(true);
const webhookDisabled = ref(false);
const webhookEvents = ref<Record<WebhookEvent, boolean>>(
	Object.fromEntries(WEBHOOK_EVENTS.map((e) => [e, false])) as Record<
		WebhookEvent,
		boolean
	>,
);
const webhookHeaders = ref<Header[]>([]);
const urlError = ref("");

// URL validation
function isValidUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return parsed.protocol === "https:" || parsed.protocol === "http:";
	} catch {
		return false;
	}
}

function validateUrl() {
	if (webhookUrl.value.trim() && !isValidUrl(webhookUrl.value)) {
		urlError.value = t("integrations.forms.webhook.urlError");
	} else {
		urlError.value = "";
	}
}

// Header management
function addHeader() {
	webhookHeaders.value.push({ key: "", value: "" });
}

function removeHeader(index: number) {
	webhookHeaders.value.splice(index, 1);
}

// Computed validation
const selectedEvents = computed(() =>
	WEBHOOK_EVENTS.filter((e) => webhookEvents.value[e]),
);

const headersObject = computed(() => {
	const headers: Record<string, string> = {};
	for (const header of webhookHeaders.value) {
		if (header.key.trim()) {
			headers[header.key.trim()] = header.value;
		}
	}
	return headers;
});

const isFormValid = computed(() => {
	const urlValid =
		webhookUrl.value.trim().length > 0 && isValidUrl(webhookUrl.value);
	return (
		urlValid &&
		webhookName.value.trim().length > 0 &&
		selectedEvents.value.length > 0
	);
});

// Watch for webhook prop changes to populate form
watch(
	() => props.webhook,
	(newWebhook) => {
		if (newWebhook && props.open) {
			populateForm(newWebhook);
		}
	},
	{ immediate: true },
);

watch(
	() => props.open,
	(isOpen) => {
		if (isOpen && props.webhook) {
			populateForm(props.webhook);
		}
	},
);

// Functions
function populateForm(webhook: Webhook) {
	webhookName.value = webhook.displayName;
	webhookUrl.value = webhook.url;
	webhookDisabled.value = webhook.status === "disabled";
	webhookActive.value = webhook.status === "active";

	// Reset all events to false first, then set selected ones to true
	for (const event of WEBHOOK_EVENTS) {
		webhookEvents.value[event] = false;
	}

	for (const eventKey of webhook.events) {
		const key = eventKey as WebhookEvent;
		if (WEBHOOK_EVENTS.includes(key)) {
			webhookEvents.value[key] = true;
		}
	}

	// Populate headers from webhook
	if (webhook.headers && typeof webhook.headers === "object") {
		webhookHeaders.value = Object.entries(
			webhook.headers as Record<string, string>,
		).map(([key, value]) => ({ key, value }));
	} else {
		webhookHeaders.value = [];
	}
}

function handleOpenChange(open: boolean) {
	if (!open) {
		resetForm();
	}
	emit("update:open", open);
}

function resetForm() {
	webhookName.value = "";
	webhookUrl.value = "";
	webhookActive.value = true;
	webhookDisabled.value = false;
	webhookEvents.value = Object.fromEntries(
		WEBHOOK_EVENTS.map((e) => [e, false]),
	) as Record<WebhookEvent, boolean>;
	webhookHeaders.value = [];
	urlError.value = "";
}

function updateWebhook() {
	if (!isFormValid.value || !props.webhook) return;

	emit("update", {
		displayName: webhookName.value,
		url: webhookUrl.value,
		status: webhookActive.value ? "active" : "paused",
		events: selectedEvents.value,
		headers: headersObject.value,
	});
}

function cancel() {
	resetForm();
	emit("update:open", false);
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{
          t("integrations.dialogs.editWebhook.title")
        }}</DialogTitle>
        <DialogDescription>
          {{ t("integrations.dialogs.editWebhook.description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6 py-6">
        <!-- Webhook Name -->
        <div>
          <label
            class="block text-sm font-medium text-neutral-900 dark:text-white mb-2"
          >
            {{ t("integrations.forms.webhook.nameLabel") }}
          </label>
          <Input
            v-model="webhookName"
            :placeholder="t('integrations.forms.webhook.namePlaceholder')"
            class="text-neutral-900 dark:text-white"
          />
        </div>

        <!-- Webhook URL -->
        <div>
          <label
            class="block text-sm font-medium text-neutral-900 dark:text-white mb-2"
          >
            {{ t("integrations.forms.webhook.urlLabel") }}
          </label>
          <Input
            v-model="webhookUrl"
            type="url"
            :placeholder="t('integrations.forms.webhook.urlPlaceholder')"
            class="text-neutral-900 dark:text-white"
            @blur="validateUrl"
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
              {{ t("integrations.forms.webhook.headersLabel") }}
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              @click="addHeader"
            >
              <Plus :size="14" class="mr-1" />
              {{ t("integrations.forms.webhook.addHeader") }}
            </Button>
          </div>
          <div v-if="webhookHeaders.length > 0" class="space-y-2">
            <div
              v-for="(header, index) in webhookHeaders"
              :key="index"
              class="flex items-center gap-2"
            >
              <Input
                v-model="header.key"
                :placeholder="
                  t('integrations.forms.webhook.headerKeyPlaceholder')
                "
                class="flex-1 font-mono text-sm"
              />
              <Input
                v-model="header.value"
                :placeholder="
                  t('integrations.forms.webhook.headerValuePlaceholder')
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
            {{ t("integrations.forms.webhook.noHeaders") }}
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
              <Checkbox :id="`edit-${event}`" v-model="webhookEvents[event]" />
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
          <Switch v-model="webhookActive" :disabled="webhookDisabled" />
          <span class="text-sm text-neutral-600 dark:text-neutral-400">
            {{
              webhookActive
                ? t("integrations.forms.webhook.enabledLabel")
                : t("integrations.forms.webhook.disabledLabel")
            }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" @click="cancel">
            {{ t("integrations.dialogs.editWebhook.cancel") }}
          </Button>
          <Button @click="updateWebhook" :disabled="!isFormValid || isLoading">
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ t("integrations.dialogs.editWebhook.save") }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
