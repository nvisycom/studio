<script setup lang="ts">
import type { LlmConfig, Provider, UpdateProvider } from "@nvisy/sdk/datatypes";
import type { LlmProvider } from "#console/utils/connections";
import {
	LLM_PROVIDERS,
	providerIcon,
	providerLabel,
} from "#console/utils/connections";
import { ChevronDown, Loader2 } from "@lucide/vue";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { Switch } from "#console/components/ui/switch";
import { Button } from "#console/components/ui/button";
import { DialogFooter } from "#console/components/ui/dialog";
import ProviderDialogShell from "./ProviderDialogShell.vue";

const { t } = useI18n();

const props = withDefaults(
	defineProps<{
		open?: boolean;
		provider?: Provider | null;
		isLoading?: boolean;
	}>(),
	{ open: false, provider: null, isLoading: false },
);

const emit = defineEmits<{
	(e: "update:open", value: boolean): void;
	(e: "update", updates: UpdateProvider): void;
}>();

const displayName = ref("");
const isActive = ref(true);
// Editing credentials is opt-in: the stored key is never shown, and a config
// update replaces the whole stored config, so we only send one when the user
// deliberately re-enters the fields.
const showCredentials = ref(false);
const apiKey = ref("");
const baseUrl = ref("");
const defaultModel = ref("");

const providerTag = computed(
	() => (props.provider?.provider ?? null) as LlmProvider | null,
);
const meta = computed(() =>
	providerTag.value ? (LLM_PROVIDERS[providerTag.value] ?? null) : null,
);

const isValid = computed(() => displayName.value.trim().length > 0);

function populate(provider: Provider) {
	displayName.value = provider.displayName;
	isActive.value = provider.isActive;
	showCredentials.value = false;
	apiKey.value = "";
	baseUrl.value = "";
	defaultModel.value = "";
}

watch(
	() => props.open,
	(isOpen) => {
		if (isOpen && props.provider) populate(props.provider);
	},
	{ immediate: true },
);

function handleOpenChange(open: boolean) {
	emit("update:open", open);
}

// Build a full LlmConfig from the re-entered fields (a config update replaces
// the stored one wholesale, so every required field must be present).
function buildConfig(tag: LlmProvider): LlmConfig | null {
	const base = baseUrl.value.trim();
	const model = defaultModel.value.trim();
	const key = apiKey.value.trim();
	if (tag === "ollama") {
		if (!base) return null;
		return {
			provider: "ollama",
			baseUrl: base,
			...(model ? { defaultModel: model } : {}),
		};
	}
	if (!key) return null;
	return {
		provider: tag,
		apiKey: key,
		...(base ? { baseUrl: base } : {}),
		...(model ? { defaultModel: model } : {}),
	};
}

function submit() {
	if (!isValid.value || !props.provider) return;

	const updates: UpdateProvider = {
		displayName: displayName.value.trim(),
		isActive: isActive.value,
	};

	if (showCredentials.value && providerTag.value) {
		const config = buildConfig(providerTag.value);
		if (config) updates.config = config;
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
      t('providers.dialogs.configure.title', { name: provider?.displayName })
    "
    :description="
      provider
        ? providerLabel(provider.provider)
        : t('providers.dialogs.configure.description')
    "
    :icon="provider ? providerIcon(provider.provider) : null"
    :icon-alt="provider?.provider"
    @update:open="handleOpenChange"
  >
    <!-- Provider name -->
    <div class="space-y-2">
      <Label required>{{ t("providers.dialogs.configure.nameLabel") }}</Label>
      <Input
        v-model="displayName"
        :placeholder="t('providers.dialogs.configure.namePlaceholder')"
      />
    </div>

    <!-- Update credentials (collapsible) -->
    <section class="space-y-3">
      <button
        type="button"
        class="flex w-full items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
        @click="showCredentials = !showCredentials"
      >
        {{ t("providers.dialogs.configure.updateCredentials") }}
        <ChevronDown
          :size="14"
          class="transition-transform"
          :class="{ 'rotate-180': showCredentials }"
        />
      </button>
      <p v-if="!showCredentials" class="text-xs text-muted-foreground">
        {{ t("providers.dialogs.configure.credentialsHint") }}
      </p>
      <template v-if="showCredentials">
        <div v-if="meta?.needsApiKey" class="space-y-1.5">
          <Label class="text-sm font-normal">
            {{ t("connections.dialogs.llm.apiKey") }}
          </Label>
          <Input
            v-model="apiKey"
            type="password"
            :placeholder="t('connections.dialogs.llm.apiKeyPlaceholder')"
          />
        </div>
        <div class="space-y-1.5">
          <Label class="text-sm font-normal">
            {{ t("connections.dialogs.llm.baseUrl") }}
          </Label>
          <Input
            v-model="baseUrl"
            :placeholder="
              providerTag === 'ollama'
                ? 'http://localhost:11434'
                : t('connections.dialogs.llm.baseUrlPlaceholder')
            "
          />
        </div>
        <div class="space-y-1.5">
          <Label class="text-sm font-normal">
            {{ t("connections.dialogs.llm.defaultModel") }}
          </Label>
          <Input
            v-model="defaultModel"
            :placeholder="t('connections.dialogs.llm.defaultModelPlaceholder')"
          />
        </div>
      </template>
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
            {{ t("providers.dialogs.configure.cancel") }}
          </Button>
          <Button :disabled="!isValid || isLoading" @click="submit">
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ t("providers.dialogs.configure.save") }}
          </Button>
        </div>
      </DialogFooter>
    </template>
  </ProviderDialogShell>
</template>
