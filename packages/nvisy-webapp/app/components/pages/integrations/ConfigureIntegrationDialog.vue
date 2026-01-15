<script setup lang="ts">
import type { Integration, UpdateIntegration } from "@nvisy/sdk/datatypes";
import { Loader2 } from "lucide-vue-next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

const { t } = useI18n();

interface Props {
	open?: boolean;
	integration?: Integration | null;
	isLoading?: boolean;
}

interface Emits {
	(e: "update:open", value: boolean): void;
	(e: "update", updates: UpdateIntegration): void;
}

const props = withDefaults(defineProps<Props>(), {
	open: false,
	integration: null,
	isLoading: false,
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
	integrationName.value = integration.integrationName;
	integrationDescription.value = integration.description;
	integrationActive.value = integration.isActive;
}

function handleOpenChange(open: boolean) {
	if (!open) {
		resetForm();
	}
	emit("update:open", open);
}

function resetForm() {
	integrationName.value = "";
	integrationDescription.value = "";
	integrationActive.value = true;
}

function updateIntegration() {
	if (!isFormValid.value || !props.integration) return;

	const updates: UpdateIntegration = {
		integrationName: integrationName.value,
		description: integrationDescription.value,
		isActive: integrationActive.value,
	};

	emit("update", updates);
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
          t("integrations.dialogs.configure.title", {
            name: integration?.integrationName,
          })
        }}</DialogTitle>
        <DialogDescription>
          {{ t("integrations.dialogs.configure.description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6 py-6">
        <!-- Integration Name -->
        <div>
          <label
            class="block text-sm font-medium text-neutral-900 dark:text-white mb-2"
          >
            {{ t("integrations.dialogs.configure.nameLabel") }}
          </label>
          <Input
            v-model="integrationName"
            :placeholder="t('integrations.dialogs.configure.namePlaceholder')"
            class="text-neutral-900 dark:text-white"
          />
        </div>

        <!-- Integration Description -->
        <div>
          <label
            class="block text-sm font-medium text-neutral-900 dark:text-white mb-2"
          >
            {{ t("integrations.dialogs.configure.descriptionLabel") }}
          </label>
          <Input
            v-model="integrationDescription"
            :placeholder="
              t('integrations.dialogs.configure.descriptionPlaceholder')
            "
            class="text-neutral-900 dark:text-white"
          />
        </div>

        <!-- Active Switch -->
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-neutral-900 dark:text-white">
              {{ t("integrations.dialogs.configure.activeLabel") }}
            </p>
            <p
              class="text-sm font-normal text-neutral-600 dark:text-neutral-400"
            >
              {{ t("integrations.dialogs.configure.activeDescription") }}
            </p>
          </div>
          <Switch v-model:checked="integrationActive" />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="cancel">
          {{ t("integrations.dialogs.configure.cancel") }}
        </Button>
        <Button
          @click="updateIntegration"
          :disabled="!isFormValid || isLoading"
        >
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("integrations.dialogs.configure.save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
