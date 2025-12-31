<script setup lang="ts">
import { ref, watch, computed } from "vue";
import type { Integration } from "@nvisy/sdk";
import { AlertCircle, Loader2 } from "lucide-vue-next";
import Button from "@/components/ui/button/Button.vue";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
	(e: "disconnect", integrationId: string): void;
}

const props = withDefaults(defineProps<Props>(), {
	open: false,
	integration: null,
	isLoading: false,
});

const emit = defineEmits<Emits>();

const confirmationInput = ref("");

// Watch for dialog open/close to reset input
watch(
	() => props.open,
	(isOpen) => {
		if (!isOpen) {
			confirmationInput.value = "";
		}
	},
);

const canDisconnect = computed(() => {
	return confirmationInput.value === props.integration?.integrationName;
});

function handleOpenChange(open: boolean) {
	emit("update:open", open);
}

function confirmDisconnect() {
	if (!props.integration || !canDisconnect.value) return;
	emit("disconnect", props.integration.integrationId);
}

function cancel() {
	emit("update:open", false);
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{
          t("integrations.dialogs.disconnect.title", {
            name: integration?.integrationName,
          })
        }}</DialogTitle>
        <DialogDescription>
          {{ t("integrations.dialogs.disconnect.description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div
          class="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800"
        >
          <AlertCircle
            class="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
          />
          <div class="space-y-1">
            <p class="text-sm font-medium text-amber-900 dark:text-amber-100">
              {{ t("integrations.dialogs.disconnect.warningTitle") }}
            </p>
            <p class="text-sm font-light text-amber-700 dark:text-amber-300">
              {{ t("integrations.dialogs.disconnect.warningDescription") }}
            </p>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="confirmation">
            {{
              t("integrations.dialogs.disconnect.confirmationLabel", {
                name: integration?.integrationName,
              })
            }}
          </Label>
          <Input
            id="confirmation"
            v-model="confirmationInput"
            :placeholder="
              t('integrations.dialogs.disconnect.confirmationPlaceholder')
            "
            autocomplete="off"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="cancel">
          {{ t("integrations.dialogs.disconnect.cancel") }}
        </Button>
        <Button
          variant="destructive"
          :disabled="!canDisconnect || isLoading"
          @click="confirmDisconnect"
        >
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("integrations.dialogs.disconnect.confirm") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
