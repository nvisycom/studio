<script setup lang="ts">
import type {
	Connection,
	SyncDeletionPolicy,
	UpdateConnection,
} from "@nvisy/sdk/datatypes";
import type { StorageProvider } from "#console/utils/connections";
import {
	DELETION_POLICIES,
	STORAGE_PROVIDERS,
	providerIcon,
	providerLabel,
} from "#console/utils/connections";
import { ChevronDown, Loader2 } from "@lucide/vue";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { Switch } from "#console/components/ui/switch";
import { Button } from "#console/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";
import { DialogFooter } from "#console/components/ui/dialog";
import ProviderDialogShell from "./ProviderDialogShell.vue";
import CredentialFields from "./CredentialFields.vue";

const { t } = useI18n();

const props = withDefaults(
	defineProps<{
		open?: boolean;
		connection?: Connection | null;
		isLoading?: boolean;
	}>(),
	{ open: false, connection: null, isLoading: false },
);

const emit = defineEmits<{
	(e: "update:open", value: boolean): void;
	(e: "update", updates: UpdateConnection): void;
}>();

const displayName = ref("");
const deletionPolicy = ref<SyncDeletionPolicy>("ignore");
const isActive = ref(true);
const showCredentials = ref(false);
const credentials = ref<Record<string, string>>({});

const providerTag = computed(
	() => (props.connection?.provider ?? null) as StorageProvider | null,
);
const fields = computed(() =>
	providerTag.value ? (STORAGE_PROVIDERS[providerTag.value] ?? []) : [],
);

const isValid = computed(() => displayName.value.trim().length > 0);

function populate(connection: Connection) {
	displayName.value = connection.displayName;
	deletionPolicy.value = connection.sync?.deletionPolicy ?? "ignore";
	isActive.value = connection.isActive;
	showCredentials.value = false;
	credentials.value = {};
}

watch(
	() => props.open,
	(isOpen) => {
		if (isOpen && props.connection) populate(props.connection);
	},
	{ immediate: true },
);

function handleOpenChange(open: boolean) {
	emit("update:open", open);
}

function submit() {
	if (!isValid.value || !props.connection) return;

	const updates: UpdateConnection = {
		displayName: displayName.value.trim(),
		isActive: isActive.value,
	};

	// Sync settings are nested under `sync` (0.15). Only send when the
	// connection already syncs — preserve its mode, update the deletion policy.
	const existingSync = props.connection.sync;
	if (existingSync) {
		updates.sync = {
			syncMode: existingSync.syncMode,
			deletionPolicy: deletionPolicy.value,
			...(existingSync.scheduleCron
				? { scheduleCron: existingSync.scheduleCron }
				: {}),
		};
	}

	// Only include credentials if the user opened the section and filled fields.
	if (showCredentials.value && providerTag.value) {
		const creds: Record<string, string> = {};
		for (const field of fields.value) {
			const value = credentials.value[field.key]?.trim();
			if (value) creds[field.key] = value;
		}
		if (Object.keys(creds).length > 0) {
			updates.config = {
				provider: providerTag.value,
				credentials: creds,
			} as UpdateConnection["config"];
		}
	}

	emit("update", updates);
}

function cancel() {
	emit("update:open", false);
}
</script>

<template>
  <ProviderDialogShell
    :open="open"
    :title="
      t('connections.dialogs.configure.title', {
        name: connection?.displayName,
      })
    "
    :description="
      connection
        ? providerLabel(connection.provider)
        : t('connections.dialogs.configure.description')
    "
    :icon="connection ? providerIcon(connection.provider) : null"
    :icon-alt="connection?.provider"
    @update:open="handleOpenChange"
  >
    <!-- Connection name -->
    <div class="space-y-2">
      <Label>{{ t("connections.dialogs.configure.nameLabel") }}</Label>
      <Input
        v-model="displayName"
        :placeholder="t('connections.dialogs.configure.namePlaceholder')"
      />
    </div>

    <!-- Deletion policy -->
    <div class="space-y-2">
      <Label>{{ t("connections.dialogs.connect.fields.deletionPolicy") }}</Label>
      <Select v-model="deletionPolicy">
        <SelectTrigger class="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="policy in DELETION_POLICIES"
            :key="policy"
            :value="policy"
          >
            {{ t(`connections.dialogs.connect.deletionPolicies.${policy}`) }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Update credentials (collapsible) -->
    <section v-if="fields.length" class="space-y-3">
      <button
        type="button"
        class="flex w-full items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
        @click="showCredentials = !showCredentials"
      >
        {{ t("connections.dialogs.configure.updateCredentials") }}
        <ChevronDown
          :size="14"
          class="transition-transform"
          :class="{ 'rotate-180': showCredentials }"
        />
      </button>
      <p v-if="!showCredentials" class="text-xs text-muted-foreground">
        {{ t("connections.dialogs.configure.credentialsHint") }}
      </p>
      <CredentialFields
        v-if="showCredentials"
        v-model="credentials"
        :fields="fields"
        label-prefix="connections.dialogs.connect.fields"
        optional-key="connections.dialogs.connect.optional"
      />
    </section>

    <template #footer>
      <DialogFooter
        class="items-center justify-between border-t border-border/60 p-6 sm:justify-between"
      >
        <div class="flex items-center gap-2">
          <Switch v-model="isActive" />
          <span class="text-sm text-muted-foreground">
            {{
              isActive
                ? t("connections.table.status.active")
                : t("connections.table.status.paused")
            }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" @click="cancel">
            {{ t("connections.dialogs.configure.cancel") }}
          </Button>
          <Button :disabled="!isValid || isLoading" @click="submit">
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ t("connections.dialogs.configure.save") }}
          </Button>
        </div>
      </DialogFooter>
    </template>
  </ProviderDialogShell>
</template>
