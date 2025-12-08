<script setup lang="ts">
import { ref, computed, watch } from "vue";
import Input from "@/components/ui/input/Input.vue";
import Button from "@/components/ui/button/Button.vue";
import Switch from "@/components/ui/switch/Switch.vue";
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
	connectedAt: string;
}

interface IntegrationData {
	name: string;
	description: string;
	active: boolean;
	// Add any other integration-specific configuration fields
}

interface Props {
	open?: boolean;
	integration?: Integration | null;
}

interface Emits {
	(e: "update:open", value: boolean): void;
	(e: "update", integration: IntegrationData): void;
}

const props = withDefaults(defineProps<Props>(), {
	open: false,
	integration: null,
});

const emit = defineEmits<Emits>();

// Form data
const integrationName = ref("");
const integrationDescription = ref("");
const integrationActive = ref(true);

// Computed validation
const isFormValid = computed(() => {
	return (
		integrationName.value.trim().length > 0 &&
		integrationDescription.value.trim().length > 0
	);
});

// Watch for integration prop changes to populate form
watch(
	() => props.integration,
	(newIntegration) => {
		if (newIntegration && props.open) {
			populateForm(newIntegration);
		}
	},
	{ immediate: true },
);

watch(
	() => props.open,
	(isOpen) => {
		if (isOpen && props.integration) {
			populateForm(props.integration);
		}
	},
);

// Functions
function populateForm(integration: Integration) {
	integrationName.value = integration.name;
	integrationDescription.value = integration.description;
	integrationActive.value = integration.status === "active";
}

function handleOpenChange(open: boolean) {
	emit("update:open", open);
}

function resetForm() {
	integrationName.value = "";
	integrationDescription.value = "";
	integrationActive.value = true;
}

function updateIntegration() {
	if (!isFormValid.value || !props.integration) return;

	const integrationData: IntegrationData = {
		name: integrationName.value,
		description: integrationDescription.value,
		active: integrationActive.value,
	};

	emit("update", integrationData);
	emit("update:open", false);
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
        <DialogTitle>Configure Integration</DialogTitle>
        <DialogDescription>
          Update the integration settings and configuration.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6 py-6">
        <!-- Integration Name -->
        <div>
          <label class="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
            Integration Name
          </label>
          <Input
            v-model="integrationName"
            placeholder="My Integration"
            class="text-neutral-900 dark:text-white"
          />
        </div>

        <!-- Integration Description -->
        <div>
          <label class="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
            Description
          </label>
          <Input
            v-model="integrationDescription"
            placeholder="What does this integration do?"
            class="text-neutral-900 dark:text-white"
          />
        </div>

        <!-- Active Switch -->
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-neutral-900 dark:text-white">Active</p>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Enable this integration to sync data and automate workflows
            </p>
          </div>
          <Switch v-model:checked="integrationActive" />
        </div>

        <!-- Additional integration-specific settings can be added here -->
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          @click="cancel"
        >
          Cancel
        </Button>
        <Button
          @click="updateIntegration"
          :disabled="!isFormValid"
        >
          Update Integration
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
