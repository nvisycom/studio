<script setup lang="ts">
import type { Connection, UpdateConnection } from "@nvisy/sdk/datatypes";
import { Loader2 } from "@lucide/vue";
import { Input } from "#console/components/ui/input";
import { Button } from "#console/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";

const { t } = useI18n();

interface Props {
	open?: boolean;
	connection?: Connection | null;
	isLoading?: boolean;
}

interface Emits {
	(e: "update:open", value: boolean): void;
	(e: "update", updates: UpdateConnection): void;
}

const props = withDefaults(defineProps<Props>(), {
	open: false,
	connection: null,
	isLoading: false,
});

const emit = defineEmits<Emits>();

// Form data
const connectionName = ref("");

// Computed validation
const isFormValid = computed(() => {
	return connectionName.value.trim().length > 0;
});

// Watch for connection prop changes to populate form
watch(
	() => props.connection,
	(newConnection) => {
		if (newConnection && props.open) {
			populateForm(newConnection);
		}
	},
	{ immediate: true },
);

watch(
	() => props.open,
	(isOpen) => {
		if (isOpen && props.connection) {
			populateForm(props.connection);
		}
	},
);

// Functions
function populateForm(connection: Connection) {
	connectionName.value = connection.displayName;
}

function handleOpenChange(open: boolean) {
	if (!open) {
		resetForm();
	}
	emit("update:open", open);
}

function resetForm() {
	connectionName.value = "";
}

function updateConnection() {
	if (!isFormValid.value || !props.connection) return;

	const updates: UpdateConnection = {
		displayName: connectionName.value,
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
          t("connections.dialogs.configure.title", {
            name: connection?.displayName,
          })
        }}</DialogTitle>
        <DialogDescription>
          {{ t("connections.dialogs.configure.description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6 py-6">
        <!-- Connection Name -->
        <div>
          <label
            class="block text-sm font-medium text-neutral-900 dark:text-white mb-2"
          >
            {{ t("connections.dialogs.configure.nameLabel") }}
          </label>
          <Input
            v-model="connectionName"
            :placeholder="t('connections.dialogs.configure.namePlaceholder')"
            class="text-neutral-900 dark:text-white"
          />
        </div>

        <!-- Provider (read-only) -->
        <div v-if="connection">
          <label
            class="block text-sm font-medium text-neutral-900 dark:text-white mb-2"
          >
            {{ t("connections.dialogs.configure.providerLabel") }}
          </label>
          <p class="text-sm text-neutral-600 dark:text-neutral-400 capitalize">
            {{ connection.provider }}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="cancel">
          {{ t("connections.dialogs.configure.cancel") }}
        </Button>
        <Button
          @click="updateConnection"
          :disabled="!isFormValid || isLoading"
        >
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("connections.dialogs.configure.save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
