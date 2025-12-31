<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { Webhook } from "@nvisy/sdk";
import { Loader2 } from "lucide-vue-next";
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
  webhook?: Webhook | null;
  eventCategories: EventCategory[];
  isLoading?: boolean;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "update", webhook: WebhookData): void;
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
const webhookEvents = ref<Record<string, boolean>>({});

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
  webhookActive.value = webhook.status === "active";

  // Initialize all events to false
  const events: Record<string, boolean> = {};
  props.eventCategories.forEach((category) => {
    category.events.forEach((event) => {
      events[event.key] = false;
    });
  });

  // Set selected events to true
  webhook.events.forEach((eventKey) => {
    if (events.hasOwnProperty(eventKey)) {
      events[eventKey] = true;
    }
  });

  webhookEvents.value = events;
}

function handleOpenChange(open: boolean) {
  emit("update:open", open);
}

function resetForm() {
  webhookName.value = "";
  webhookUrl.value = "";
  webhookActive.value = true;
  webhookEvents.value = {};
}

function updateWebhook() {
  if (!isFormValid.value || !props.webhook) return;

  const webhookData: WebhookData = {
    name: webhookName.value,
    url: webhookUrl.value,
    active: webhookActive.value,
    events: { ...webhookEvents.value },
  };

  emit("update", webhookData);
}

function cancel() {
  resetForm();
  emit("update:open", false);
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-2xl">
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
          <h4 class="text-sm font-medium text-neutral-900 dark:text-white mb-4">
            {{ t("integrations.forms.webhook.eventsLabel") }}
          </h4>
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
              <div class="space-y-3">
                <div
                  v-for="event in category.events"
                  :key="event.key"
                  class="flex items-start gap-3"
                >
                  <Checkbox
                    v-model:checked="webhookEvents[event.key]"
                    class="mt-0.5"
                  />
                  <div class="flex-1 min-w-0">
                    <label
                      class="text-sm font-normal text-neutral-900 dark:text-white cursor-pointer"
                    >
                      {{ event.name }}
                    </label>
                    <p
                      class="text-xs font-light text-neutral-600 dark:text-neutral-400 mt-1"
                    >
                      {{ event.description }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="cancel">
          {{ t("integrations.dialogs.editWebhook.cancel") }}
        </Button>
        <Button @click="updateWebhook" :disabled="!isFormValid || isLoading">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("integrations.dialogs.editWebhook.save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
