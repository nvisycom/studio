<script setup lang="ts">
import { ref, computed } from "vue";
import { Plus } from "lucide-vue-next";
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
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "create", webhook: WebhookData): void;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
});

const emit = defineEmits<Emits>();

// Form data
const webhookName = ref("");
const webhookUrl = ref("");
const webhookActive = ref(true);
const webhookEvents = ref<Record<string, boolean>>({
  // Documents
  documentsUploaded: true,
  documentsDownloaded: true,
  documentsRedacted: true,
  documentsVerified: true,

  // Integrations
  integrationTriggered: true,
  integrationSucceeded: true,
  integrationFailed: true,
});

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
  // Reset all events to true by default
  Object.keys(webhookEvents.value).forEach((key) => {
    webhookEvents.value[key] = true;
  });
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

  // Reset form and close dialog
  resetForm();
  emit("update:open", false);
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
        <Plus :size="16" />
        New Webhook
      </Button>
    </DialogTrigger>

    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Create New Webhook</DialogTitle>
        <DialogDescription>
          Configure a new webhook endpoint to receive real-time notifications
          about events in your workspace.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6 py-6">
        <!-- Webhook Name -->
        <div>
          <label
            class="block text-sm font-medium text-neutral-900 dark:text-white mb-2"
          >
            Webhook Name
          </label>
          <Input
            v-model="webhookName"
            placeholder="Production API"
            class="text-neutral-900 dark:text-white"
          />
        </div>

        <!-- Webhook URL -->
        <div>
          <label
            class="block text-sm font-medium text-neutral-900 dark:text-white mb-2"
          >
            Endpoint URL
          </label>
          <Input
            v-model="webhookUrl"
            type="url"
            placeholder="https://your-app.com/webhooks"
            class="text-neutral-900 dark:text-white"
          />
        </div>

        <!-- Active Switch -->
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-neutral-900 dark:text-white">Active</p>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Enable this webhook to receive events
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
                    class="text-sm font-medium text-neutral-900 dark:text-white cursor-pointer"
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
        <Button variant="outline" @click="cancel"> Cancel </Button>
        <Button @click="saveWebhook" :disabled="!isFormValid">
          Create Webhook
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
