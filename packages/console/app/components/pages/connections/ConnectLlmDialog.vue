<script setup lang="ts">
import type { CreateConnection, LlmConfig } from "@nvisy/sdk/datatypes";
import type { LlmProvider } from "#console/utils/connectionProviders";
import { LLM_PROVIDERS } from "#console/utils/connectionProviders";
import { Loader2 } from "@lucide/vue";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { Button } from "#console/components/ui/button";
import { DialogFooter } from "#console/components/ui/dialog";
import ProviderDialogShell from "./ProviderDialogShell.vue";

const { t } = useI18n();

const props = withDefaults(
	defineProps<{
		open?: boolean;
		provider: LlmProvider | null;
		isLoading?: boolean;
	}>(),
	{ open: false, isLoading: false },
);

const emit = defineEmits<{
	(e: "update:open", value: boolean): void;
	(e: "connect", connection: CreateConnection): void;
}>();

const meta = computed(() =>
	props.provider ? LLM_PROVIDERS[props.provider] : null,
);

const displayName = ref("");
const apiKey = ref("");
const baseUrl = ref("");
const defaultModel = ref("");

const isValid = computed(() => {
	if (!props.provider || !meta.value) return false;
	if (!displayName.value.trim()) return false;
	if (meta.value.needsApiKey && !apiKey.value.trim()) return false;
	if (meta.value.baseUrlRequired && !baseUrl.value.trim()) return false;
	return true;
});

function reset() {
	displayName.value = "";
	apiKey.value = "";
	baseUrl.value = "";
	defaultModel.value = "";
}

// Reset whenever the dialog opens for a (possibly new) provider.
watch(
	() => props.open,
	(open) => {
		if (open) reset();
	},
);

function handleOpenChange(open: boolean) {
	emit("update:open", open);
}

function submit() {
	if (!isValid.value || !props.provider) return;

	const base = baseUrl.value.trim();
	const model = defaultModel.value.trim();
	const key = apiKey.value.trim();

	// Assemble the provider-specific LlmConfig arm.
	let config: LlmConfig;
	if (props.provider === "ollama") {
		config = {
			provider: "ollama",
			baseUrl: base,
			...(model ? { defaultModel: model } : {}),
		};
	} else {
		config = {
			provider: props.provider,
			credentials: { apiKey: key },
			...(base ? { baseUrl: base } : {}),
			...(model ? { defaultModel: model } : {}),
		};
	}

	emit("connect", {
		displayName: displayName.value.trim(),
		config,
	} as CreateConnection);
}
</script>

<template>
  <ProviderDialogShell
    :open="open"
    :title="t('connections.dialogs.connect.title', { name: meta?.product ?? '' })"
    :description="t('connections.dialogs.llm.description')"
    :icon="meta?.icon"
    :icon-alt="meta?.product"
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

    <!-- API key (hosted providers only) -->
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

    <!-- Base URL -->
    <div class="space-y-1.5">
      <Label class="text-sm font-normal">
        {{ t("connections.dialogs.llm.baseUrl") }}
        <span v-if="!meta?.baseUrlRequired" class="text-muted-foreground">
          · {{ t("connections.dialogs.connect.optional") }}
        </span>
      </Label>
      <Input
        v-model="baseUrl"
        :placeholder="
          provider === 'ollama'
            ? 'http://localhost:11434'
            : t('connections.dialogs.llm.baseUrlPlaceholder')
        "
      />
    </div>

    <!-- Default model -->
    <div class="space-y-1.5">
      <Label class="text-sm font-normal">
        {{ t("connections.dialogs.llm.defaultModel") }}
        <span class="text-muted-foreground">
          · {{ t("connections.dialogs.connect.optional") }}
        </span>
      </Label>
      <Input
        v-model="defaultModel"
        :placeholder="t('connections.dialogs.llm.defaultModelPlaceholder')"
      />
    </div>

    <template #footer>
      <DialogFooter class="border-t border-border/60 p-6">
        <Button variant="outline" @click="handleOpenChange(false)">
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
