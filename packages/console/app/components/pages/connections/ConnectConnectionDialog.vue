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
import { Textarea } from "#console/components/ui/textarea";
import { Label } from "#console/components/ui/label";
import { Button } from "#console/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";

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
// Multiline credentials (e.g. a JSON key blob) span the full width; the rest
// flow through a two-column grid.
const gridFields = computed(() => fields.value.filter((f) => !f.multiline));
const fullFields = computed(() => fields.value.filter((f) => f.multiline));

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
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-xl gap-0 p-0">
      <!-- Provider header -->
      <DialogHeader
        class="flex-row items-center gap-3 space-y-0 border-b border-border/60 p-6"
      >
        <div
          class="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40"
        >
          <img
            v-if="providerIcon"
            :src="providerIcon"
            :alt="providerName"
            class="size-6 object-contain"
          />
        </div>
        <div class="min-w-0 space-y-1">
          <DialogTitle class="truncate text-base">
            {{ t("connections.dialogs.connect.title", { name: providerName }) }}
          </DialogTitle>
          <DialogDescription class="text-sm">
            {{ t("connections.dialogs.connect.description") }}
          </DialogDescription>
        </div>
      </DialogHeader>

      <div class="max-h-[62vh] space-y-6 overflow-y-auto p-6">
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
          <div class="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            <div
              v-for="field in gridFields"
              :key="field.key"
              class="space-y-1.5"
            >
              <Label class="text-sm font-normal">
                {{ t(`connections.dialogs.connect.fields.${field.labelKey}`) }}
                <span v-if="!field.required" class="text-muted-foreground">
                  · {{ t("connections.dialogs.connect.optional") }}
                </span>
              </Label>
              <Input
                v-model="credentials[field.key]"
                :type="field.secret ? 'password' : 'text'"
              />
            </div>
          </div>
          <div v-for="field in fullFields" :key="field.key" class="space-y-1.5">
            <Label class="text-sm font-normal">
              {{ t(`connections.dialogs.connect.fields.${field.labelKey}`) }}
              <span v-if="!field.required" class="text-muted-foreground">
                · {{ t("connections.dialogs.connect.optional") }}
              </span>
            </Label>
            <Textarea
              v-model="credentials[field.key]"
              rows="4"
              class="font-mono text-xs"
            />
          </div>
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
      </div>

      <DialogFooter class="border-t border-border/60 p-6">
        <Button variant="outline" @click="cancel">
          {{ t("connections.dialogs.connect.cancel") }}
        </Button>
        <Button :disabled="!isValid || isLoading" @click="submit">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("connections.dialogs.connect.submit") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
