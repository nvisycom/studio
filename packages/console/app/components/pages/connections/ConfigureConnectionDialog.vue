<script setup lang="ts">
import type {
	Connection,
	SyncDeletionPolicy,
	UpdateConnection,
} from "@nvisy/sdk/datatypes";
import type { StorageProvider } from "#console/utils/connectionProviders";
import {
	STORAGE_PROVIDERS,
	providerIcon,
	providerLabel,
} from "#console/utils/connectionProviders";
import { ChevronDown, Loader2 } from "@lucide/vue";
import { Input } from "#console/components/ui/input";
import { Textarea } from "#console/components/ui/textarea";
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
		connection?: Connection | null;
		isLoading?: boolean;
	}>(),
	{ open: false, connection: null, isLoading: false },
);

const emit = defineEmits<{
	(e: "update:open", value: boolean): void;
	(e: "update", updates: UpdateConnection): void;
}>();

const DELETION_POLICIES: SyncDeletionPolicy[] = ["ignore", "delete"];

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
const gridFields = computed(() => fields.value.filter((f) => !f.multiline));
const fullFields = computed(() => fields.value.filter((f) => f.multiline));

const isValid = computed(() => displayName.value.trim().length > 0);

function populate(connection: Connection) {
	displayName.value = connection.displayName;
	deletionPolicy.value = connection.deletionPolicy;
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
		deletionPolicy: deletionPolicy.value,
		isActive: isActive.value,
	};

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
            v-if="connection && providerIcon(connection.provider)"
            :src="providerIcon(connection.provider)!"
            :alt="connection.provider"
            class="size-6 object-contain"
          />
        </div>
        <div class="min-w-0 space-y-1">
          <DialogTitle class="truncate text-base">
            {{
              t("connections.dialogs.configure.title", {
                name: connection?.displayName,
              })
            }}
          </DialogTitle>
          <DialogDescription class="text-sm">
            {{
              connection
                ? providerLabel(connection.provider)
                : t("connections.dialogs.configure.description")
            }}
          </DialogDescription>
        </div>
      </DialogHeader>

      <div class="max-h-[62vh] space-y-6 overflow-y-auto p-6">
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
          <template v-if="showCredentials">
            <div class="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              <div
                v-for="field in gridFields"
                :key="field.key"
                class="space-y-1.5"
              >
                <Label class="text-sm font-normal">
                  {{ t(`connections.dialogs.connect.fields.${field.labelKey}`) }}
                </Label>
                <Input
                  v-model="credentials[field.key]"
                  :type="field.secret ? 'password' : 'text'"
                />
              </div>
            </div>
            <div
              v-for="field in fullFields"
              :key="field.key"
              class="space-y-1.5"
            >
              <Label class="text-sm font-normal">
                {{ t(`connections.dialogs.connect.fields.${field.labelKey}`) }}
              </Label>
              <Textarea
                v-model="credentials[field.key]"
                rows="4"
                class="font-mono text-xs"
              />
            </div>
          </template>
        </section>
      </div>

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
    </DialogContent>
  </Dialog>
</template>
