<script setup lang="ts">
import type {
	CreateConnection,
	SyncDeletionPolicy,
	SyncMode,
} from "@nvisy/sdk/datatypes";
import type { StorageProvider } from "#console/utils/connectionProviders";
import {
	DELETION_POLICIES,
	STORAGE_PROVIDERS,
	SYNC_MODES,
} from "#console/utils/connectionProviders";
import { Loader2 } from "@lucide/vue";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
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
		provider: StorageProvider | null;
		/** Display label for the provider (from the explore card). */
		providerName?: string;
		/** Icon URL for the provider (from the explore card). */
		providerIcon?: string;
		isLoading?: boolean;
	}>(),
	{ open: false, isLoading: false, providerName: "", providerIcon: "" },
);

const emit = defineEmits<{
	(e: "update:open", value: boolean): void;
	(e: "connect", connection: CreateConnection): void;
}>();

// Common fields.
const displayName = ref("");
const syncMode = ref<SyncMode>("import");
const deletionPolicy = ref<SyncDeletionPolicy>("ignore");
const scheduleCron = ref("");
const rootPath = ref("");
// Provider credential values, keyed by field key.
const credentials = ref<Record<string, string>>({});

const fields = computed(() =>
	props.provider ? STORAGE_PROVIDERS[props.provider] : [],
);

const isValid = computed(() => {
	if (!props.provider) return false;
	if (!displayName.value.trim()) return false;
	return fields.value.every(
		(f) => !f.required || !!credentials.value[f.key]?.trim(),
	);
});

function reset() {
	displayName.value = "";
	syncMode.value = "import";
	deletionPolicy.value = "ignore";
	scheduleCron.value = "";
	rootPath.value = "";
	credentials.value = {};
}

// Reset the form whenever the dialog opens for a (possibly new) provider.
watch(
	() => props.open,
	(isOpen) => {
		if (isOpen) reset();
	},
);

function handleOpenChange(open: boolean) {
	emit("update:open", open);
}

function submit() {
	if (!isValid.value || !props.provider) return;

	// Only send credential fields that were filled in.
	const creds: Record<string, string> = {};
	for (const field of fields.value) {
		const value = credentials.value[field.key]?.trim();
		if (value) creds[field.key] = value;
	}

	const connection = {
		displayName: displayName.value.trim(),
		sync: {
			syncMode: syncMode.value,
			deletionPolicy: deletionPolicy.value,
			...(scheduleCron.value.trim()
				? { scheduleCron: scheduleCron.value.trim() }
				: {}),
		},
		config: {
			provider: props.provider,
			credentials: creds,
			...(rootPath.value.trim() ? { rootPath: rootPath.value.trim() } : {}),
		},
	} as CreateConnection;

	emit("connect", connection);
}

function cancel() {
	emit("update:open", false);
}
</script>

<template>
  <ProviderDialogShell
    :open="open"
    :title="t('connections.dialogs.connect.title', { name: providerName })"
    :description="t('connections.dialogs.connect.description')"
    :icon="providerIcon"
    :icon-alt="providerName"
    @update:open="handleOpenChange"
  >
    <!-- Connection name -->
    <div class="space-y-2">
      <Label>{{ t("connections.dialogs.connect.fields.displayName") }}</Label>
      <Input
        v-model="displayName"
        :placeholder="t('connections.dialogs.connect.displayNamePlaceholder')"
      />
    </div>

    <!-- Credentials -->
    <section class="space-y-3">
      <h3
        class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        {{ t("connections.dialogs.connect.sections.credentials") }}
      </h3>
      <CredentialFields
        v-model="credentials"
        :fields="fields"
        label-prefix="connections.dialogs.connect.fields"
        optional-key="connections.dialogs.connect.optional"
      />
    </section>

    <!-- Sync settings -->
        <section class="space-y-3">
          <h3
            class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            {{ t("connections.dialogs.connect.sections.sync") }}
          </h3>
          <div class="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label class="text-sm font-normal">
                {{ t("connections.dialogs.connect.fields.syncMode") }}
              </Label>
              <Select v-model="syncMode">
                <SelectTrigger class="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="mode in SYNC_MODES"
                    :key="mode"
                    :value="mode"
                  >
                    {{ t(`connections.dialogs.connect.syncModes.${mode}`) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1.5">
              <Label class="text-sm font-normal">
                {{ t("connections.dialogs.connect.fields.deletionPolicy") }}
              </Label>
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
                    {{
                      t(`connections.dialogs.connect.deletionPolicies.${policy}`)
                    }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1.5">
              <Label class="text-sm font-normal">
                {{ t("connections.dialogs.connect.fields.rootPath") }}
                <span class="text-muted-foreground">
                  · {{ t("connections.dialogs.connect.optional") }}
                </span>
              </Label>
              <Input
                v-model="rootPath"
                :placeholder="t('connections.dialogs.connect.rootPathPlaceholder')"
              />
            </div>
            <div class="space-y-1.5">
              <Label class="text-sm font-normal">
                {{ t("connections.dialogs.connect.fields.scheduleCron") }}
                <span class="text-muted-foreground">
                  · {{ t("connections.dialogs.connect.optional") }}
                </span>
              </Label>
              <Input
                v-model="scheduleCron"
                :placeholder="
                  t('connections.dialogs.connect.scheduleCronPlaceholder')
                "
                class="font-mono text-xs"
              />
            </div>
          </div>
        </section>

    <template #footer>
      <DialogFooter class="border-t border-border/60 p-6">
        <Button variant="outline" @click="cancel">
          {{ t("connections.dialogs.connect.cancel") }}
        </Button>
        <Button :disabled="!isValid || isLoading" @click="submit">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("connections.dialogs.connect.submit") }}
        </Button>
      </DialogFooter>
    </template>
  </ProviderDialogShell>
</template>
