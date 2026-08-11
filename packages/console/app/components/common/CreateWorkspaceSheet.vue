<script setup lang="ts">
import { Layers, Loader2, ChevronDown } from "@lucide/vue";
import type { CreateWorkspace, OcrPolicy } from "@nvisy/sdk/datatypes";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "#console/components/ui/sheet";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#console/components/ui/collapsible";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { Textarea } from "#console/components/ui/textarea";
import { Switch } from "#console/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";
import { Alert, AlertDescription } from "#console/components/ui/alert";
import { RetentionFields } from "#console/components/common";
import { OCR_POLICIES } from "#console/utils/ocr";
import {
	defaultRetentionForm,
	formToRetention,
} from "#console/utils/retention";

const { t } = useI18n();
const open = defineModel<boolean>("open", { required: true });

const { createWorkspaceAsync, isCreating, createError } = useWorkspaces();

// Form state
const displayName = ref("");
const description = ref("");
const requireApproval = ref(false);
const ocr = ref<OcrPolicy>("auto");
const retention = ref(defaultRetentionForm());

// Collapsible sections
const advancedOpen = ref(false);
const retentionOpen = ref(false);

const isFormValid = computed(() => {
	return displayName.value.trim().length >= 3;
});

function resetForm() {
	displayName.value = "";
	description.value = "";
	requireApproval.value = false;
	ocr.value = "auto";
	retention.value = defaultRetentionForm();
	advancedOpen.value = false;
	retentionOpen.value = false;
}

// Reset form when modal closes
watch(open, (isOpen) => {
	if (!isOpen) {
		resetForm();
	}
});

async function createWorkspace() {
	const workspaceData: CreateWorkspace = {
		displayName: displayName.value.trim(),
		description: description.value.trim() || undefined,
		settings: {
			ocr: ocr.value,
			requireApproval: requireApproval.value,
			retention: formToRetention(retention.value),
		},
	};

	try {
		await createWorkspaceAsync(workspaceData);
		open.value = false;
	} catch {
		// Error surfaced reactively via createError in the template.
	}
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      side="right"
      class="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
    >
      <SheetHeader class="border-b border-border/50">
        <SheetTitle>{{ t("workspace.create.title") }}</SheetTitle>
        <SheetDescription>
          {{ t("workspace.create.description") }}
        </SheetDescription>
      </SheetHeader>

      <form
        class="flex min-h-0 flex-1 flex-col"
        @submit.prevent="isFormValid && !isCreating && createWorkspace()"
      >
        <div class="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
          <!-- Error Alert -->
          <Alert v-if="createError" variant="destructive">
            <AlertDescription>
              {{ createError.message || t("workspace.create.error") }}
            </AlertDescription>
          </Alert>

          <!-- Workspace Name -->
          <div class="grid gap-2">
            <Label for="display-name" required>
              {{ t("workspace.create.nameLabel") }}
            </Label>
            <Input
              id="display-name"
              v-model="displayName"
              :placeholder="t('workspace.create.namePlaceholder')"
              maxlength="100"
            />
          </div>

          <!-- Description -->
          <div class="grid gap-2">
            <Label for="description">{{
              t("workspace.create.descriptionLabel")
            }}</Label>
            <Textarea
              id="description"
              v-model="description"
              :placeholder="t('workspace.create.descriptionPlaceholder')"
              rows="2"
              maxlength="200"
            />
          </div>

          <!-- Advanced Settings -->
          <Collapsible v-model:open="advancedOpen" class="pt-2">
            <CollapsibleTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="flex items-center gap-2 px-0 hover:bg-transparent cursor-pointer"
              >
                <ChevronDown
                  :size="16"
                  class="transition-transform duration-200"
                  :class="{ 'rotate-180': advancedOpen }"
                />
                {{ t("workspace.create.advancedSettings") }}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent class="pt-4 space-y-5">
              <!-- Require Approval -->
              <div class="flex items-center justify-between gap-4">
                <div class="space-y-0.5">
                  <Label for="require-approval">{{
                    t("workspace.create.requireApprovalLabel")
                  }}</Label>
                  <p class="text-xs text-muted-foreground font-normal">
                    {{ t("workspace.create.requireApprovalDescription") }}
                  </p>
                </div>
                <Switch id="require-approval" v-model="requireApproval" />
              </div>

              <!-- OCR policy -->
              <div class="flex items-center justify-between gap-4">
                <Label class="font-normal">{{
                  t("settings.workspace.options.ocr.label")
                }}</Label>
                <Select v-model="ocr">
                  <SelectTrigger class="h-9 w-[160px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="p in OCR_POLICIES" :key="p" :value="p">
                      {{ t(`settings.workspace.options.ocr.policies.${p}`) }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </CollapsibleContent>
          </Collapsible>

          <!-- Retention -->
          <Collapsible v-model:open="retentionOpen">
            <CollapsibleTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="flex items-center gap-2 px-0 hover:bg-transparent cursor-pointer"
              >
                <ChevronDown
                  :size="16"
                  class="transition-transform duration-200"
                  :class="{ 'rotate-180': retentionOpen }"
                />
                {{ t("settings.workspace.options.retention.label") }}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent class="pt-4">
              <RetentionFields v-model:retention="retention" />
            </CollapsibleContent>
          </Collapsible>
        </div>

        <SheetFooter class="flex-row justify-end border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            @click="open = false"
            class="cursor-pointer"
          >
            {{ t("workspace.create.cancelButton") }}
          </Button>
          <Button
            type="submit"
            :disabled="!isFormValid || isCreating"
            class="cursor-pointer"
          >
            <Loader2 v-if="isCreating" class="mr-2 h-4 w-4 animate-spin" />
            <Layers v-else :size="16" class="mr-2" />
            {{ t("workspace.create.submitButton") }}
          </Button>
        </SheetFooter>
      </form>
    </SheetContent>
  </Sheet>
</template>
