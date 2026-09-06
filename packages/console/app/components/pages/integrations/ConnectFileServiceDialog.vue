<script setup lang="ts">
import type { StartFileServiceOAuth } from "@nvisy/sdk/datatypes";
import type { FileProvider } from "#console/utils/connections";
import { Loader2, ExternalLink } from "@lucide/vue";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { Button } from "#console/components/ui/button";
import { DialogFooter } from "#console/components/ui/dialog";
import ProviderDialogShell from "./ProviderDialogShell.vue";

const { t } = useI18n();

const props = withDefaults(
	defineProps<{
		open?: boolean;
		/** The file-service provider being connected (drives the root hint copy). */
		provider: FileProvider | null;
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
	(e: "connect", request: StartFileServiceOAuth): void;
}>();

const displayName = ref("");
const root = ref("");

// Whether the provider scopes its root by folder id (Drive, OneDrive, Box) or
// path (Dropbox), so the hint tells the user what to paste. Drives which
// placeholder/help copy shows next to the optional folder field.
const rootByPath = computed(() => props.provider === "dropbox");

const isValid = computed(() => !!displayName.value.trim());

// Reset and seed the display name from the provider each time the dialog opens.
watch(
	() => props.open,
	(isOpen) => {
		if (isOpen) {
			displayName.value = props.providerName;
			root.value = "";
		}
	},
);

function handleOpenChange(open: boolean) {
	emit("update:open", open);
}

function submit() {
	if (!isValid.value) return;
	const request: StartFileServiceOAuth = {
		displayName: displayName.value.trim(),
		...(root.value.trim() ? { root: root.value.trim() } : {}),
	};
	emit("connect", request);
}

function cancel() {
	emit("update:open", false);
}
</script>

<template>
  <ProviderDialogShell
    :open="open"
    :title="t('connections.dialogs.fileService.title', { name: providerName })"
    :description="t('connections.dialogs.fileService.description')"
    :icon="providerIcon"
    :icon-alt="providerName"
    @update:open="handleOpenChange"
  >
    <!-- Connection name -->
    <div class="space-y-2">
      <Label required>
        {{ t("connections.dialogs.fileService.fields.displayName") }}
      </Label>
      <Input
        v-model="displayName"
        :placeholder="t('connections.dialogs.fileService.displayNamePlaceholder')"
      />
    </div>

    <!-- Optional sync folder -->
    <div class="space-y-2">
      <Label class="text-sm font-normal">
        {{ t("connections.dialogs.fileService.fields.root") }}
      </Label>
      <Input
        v-model="root"
        :placeholder="
          rootByPath
            ? t('connections.dialogs.fileService.rootPathPlaceholder')
            : t('connections.dialogs.fileService.rootIdPlaceholder')
        "
      />
      <p class="text-xs text-muted-foreground">
        {{ t("connections.dialogs.fileService.rootHint") }}
      </p>
    </div>

    <!-- What happens on connect -->
    <div
      class="flex items-start gap-2 rounded-md border border-border/60 bg-muted/30 p-3"
    >
      <ExternalLink :size="14" class="mt-0.5 shrink-0 text-muted-foreground" />
      <p class="text-xs text-muted-foreground">
        {{ t("connections.dialogs.fileService.redirectNote", { name: providerName }) }}
      </p>
    </div>

    <template #footer>
      <DialogFooter class="border-t border-border/60 p-6">
        <Button variant="outline" @click="cancel">
          {{ t("connections.dialogs.fileService.cancel") }}
        </Button>
        <Button :disabled="!isValid || isLoading" @click="submit">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("connections.dialogs.fileService.submit") }}
        </Button>
      </DialogFooter>
    </template>
  </ProviderDialogShell>
</template>
