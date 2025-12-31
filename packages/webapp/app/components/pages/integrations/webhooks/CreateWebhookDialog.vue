<script setup lang="ts">
import { ref, computed } from "vue";
import { Webhook, Loader2 } from "lucide-vue-next";
import Input from "@/components/ui/input/Input.vue";
import Button from "@/components/ui/button/Button.vue";
import Checkbox from "@/components/ui/checkbox/Checkbox.vue";
import Switch from "@/components/ui/switch/Switch.vue";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

const { t } = useI18n();

interface WebhookEvent {
	key: string;
	name: string;
	description: string;
}

interface EventCategory {
	id: string;
	name: string;
	events: WebhookEvent[];
}

interface WebhookData {
	name: string;
	url: string;
	active: boolean;
	events: Record<string, boolean>;
}

interface Props {
	open?: boolean;
	eventCategories: EventCategory[];
	isLoading?: boolean;
}

interface Emits {
	(e: "update:open", value: boolean): void;
	(e: "create", webhook: WebhookData): void;
}

const props = withDefaults(defineProps<Props>(), {
	open: false,
	isLoading: false,
});

const emit = defineEmits<Emits>();

// Form data
const webhookName = ref("");
const webhookUrl = ref("");
const webhookActive = ref(true);
const webhookEvents = ref<Record<string, boolean>>({});

// Initialize events from categories
function initializeEvents() {
	const events: Record<string, boolean> = {};
	props.eventCategories.forEach((category) => {
		category.events.forEach((event) => {
			events[event.key] = true;
		});
	});
	webhookEvents.value = events;
}

// Initialize on mount
initializeEvents();

// Computed validation
const hasSelectedEvents = computed(() => {
	return Object.values(webhookEvents.value).some(Boolean);
});

const isFormValid = computed(() => {
	return (
		webhookUrl.value.trim().length > 0 &&
		webhookName.value.trim().length > 0 &&
		hasSelectedEvents.value
	);
});

// Functions
function handleOpenChange(open: boolean) {
	emit("update:open", open);
}

function resetForm() {
	webhookName.value = "";
	webhookUrl.value = "";
	webhookActive.value = true;
	initializeEvents();
}

function saveWebhook() {
	if (!isFormValid.value) return;

	const webhookData: WebhookData = {
		name: webhookName.value,
		url: webhookUrl.value,
		active: webhookActive.value,
		events: { ...webhookEvents.value },
	};

	emit("create", webhookData);
}

function cancel() {
	resetForm();
	emit("update:open", false);
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogTrigger as-child>
      <Button size="sm" class="flex items-center gap-2">
        <Webhook :size="16" />
        {{ t("integrations.actions.createWebhook") }}
      </Button>
    </DialogTrigger>

    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{
          t("integrations.dialogs.createWebhook.title")
        }}</DialogTitle>
        <DialogDescription>
          {{ t("integrations.dialogs.createWebhook.description") }}
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
          />
        </div>

        <!-- Active Switch -->
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-neutral-900 dark:text-white">
              {{ t("integrations.forms.webhook.activeLabel") }}
            </p>
            <p
              class="text-sm font-light text-neutral-600 dark:text-neutral-400"
            >
              {{ t("integrations.forms.webhook.activeDescription") }}
            </p>
          </div>
          <Switch v-model:checked="webhookActive" />
        </div>

        <!-- Webhook Events -->
        <div>
          <div class="space-y-4 max-h-60 overflow-y-auto">
            <div v-for="category in eventCategories" :key="category.id">
              <div
                class="pb-2 border-b border-neutral-300 dark:border-neutral-600 mb-3"
              >
                <h5
                  class="text-sm font-medium text-neutral-900 dark:text-white"
                >
                  {{ category.name }}
                </h5>
              </div>
              <div class="grid grid-cols-2 gap-x-6 gap-y-3">
                <div
                  v-for="event in category.events"
                  :key="event.key"
                  class="flex items-center gap-2"
                >
                  <Checkbox v-model:checked="webhookEvents[event.key]" />
                  <label
                    class="text-sm font-normal text-neutral-900 dark:text-white cursor-pointer"
                  >
                    {{ event.name }}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="cancel">
          {{ t("integrations.dialogs.createWebhook.cancel") }}
        </Button>
        <Button @click="saveWebhook" :disabled="!isFormValid || isLoading">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("integrations.dialogs.createWebhook.save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
