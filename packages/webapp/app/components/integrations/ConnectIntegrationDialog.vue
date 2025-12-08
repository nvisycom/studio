<script setup lang="ts">
import { ref, watch } from "vue";
import Button from "@/components/ui/button/Button.vue";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { LucideIcon } from "lucide-vue-next";

interface Integration {
	id: number;
	name: string;
	description: string;
	icon: LucideIcon;
	color: string;
	status: string;
	category: string;
	tags: string[];
}

interface Props {
	open?: boolean;
	integration?: Integration | null;
}

interface Emits {
	(e: "update:open", value: boolean): void;
	(e: "connect", integrationId: number, config: Record<string, string>): void;
}

const props = withDefaults(defineProps<Props>(), {
	open: false,
	integration: null,
});

const emit = defineEmits<Emits>();

const apiKey = ref("");
const apiSecret = ref("");
const webhookUrl = ref("");

// Watch for dialog open/close to reset form
watch(
	() => props.open,
	(isOpen) => {
		if (!isOpen) {
			apiKey.value = "";
			apiSecret.value = "";
			webhookUrl.value = "";
		}
	},
);

function handleOpenChange(open: boolean) {
	emit("update:open", open);
}

function confirmConnect() {
	if (!props.integration) return;

	const config = {
		apiKey: apiKey.value,
		apiSecret: apiSecret.value,
		webhookUrl: webhookUrl.value,
	};

	emit("connect", props.integration.id, config);
	emit("update:open", false);
}

function cancel() {
	emit("update:open", false);
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Connect {{ integration?.name }}</DialogTitle>
        <DialogDescription>
          Configure your {{ integration?.name }} integration to start automating your workflows.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label for="apiKey">API Key</Label>
          <Input
            id="apiKey"
            v-model="apiKey"
            type="password"
            placeholder="Enter your API key"
            autocomplete="off"
          />
        </div>

        <div class="space-y-2">
          <Label for="apiSecret">API Secret</Label>
          <Input
            id="apiSecret"
            v-model="apiSecret"
            type="password"
            placeholder="Enter your API secret"
            autocomplete="off"
          />
        </div>

        <div class="space-y-2">
          <Label for="webhookUrl">
            Webhook URL
            <span class="text-xs text-neutral-500 dark:text-neutral-400 font-normal ml-1">(Optional)</span>
          </Label>
          <Input
            id="webhookUrl"
            v-model="webhookUrl"
            type="url"
            placeholder="https://your-webhook-url.com"
          />
        </div>

        <div class="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
          <p class="text-sm text-blue-900 dark:text-blue-100">
            <span class="font-medium">Need help?</span> Visit our
            <a href="#" class="underline hover:no-underline">documentation</a>
            to learn how to get your API credentials.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          @click="cancel"
        >
          Cancel
        </Button>
        <Button
          :disabled="!apiKey || !apiSecret"
          @click="confirmConnect"
        >
          Connect Integration
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
