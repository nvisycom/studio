<script setup lang="ts">
import { Layers, Loader2, ChevronDown } from "@lucide/vue";
import type {
	CreateWorkspace,
	OcrPolicy,
	Retention,
} from "@nvisy/sdk/datatypes";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";
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

const { t } = useI18n();
const open = defineModel<boolean>("open", { required: true });

const { createWorkspaceAsync, isCreating, createError } = useWorkspaces();

// Form state
const displayName = ref("");
const description = ref("");
const requireApproval = ref(false);
const ocr = ref<OcrPolicy>("auto");

// Retention is modelled per target as a mode + day count (only "days" uses it).
type RetentionMode = Retention["mode"];
interface RetentionField {
	mode: RetentionMode;
	days: number;
}
const OCR_POLICIES: OcrPolicy[] = ["auto", "force", "never"];
const RETENTION_MODES: RetentionMode[] = ["forever", "days", "zeroDays"];
const RETENTION_TARGETS = [
	"auditLogs",
	"originalDocuments",
	"redactedDocuments",
] as const;
type RetentionTarget = (typeof RETENTION_TARGETS)[number];

function newRetentionField(): RetentionField {
	return { mode: "forever", days: 30 };
}
const retention = ref<Record<RetentionTarget, RetentionField>>({
	auditLogs: newRetentionField(),
	originalDocuments: newRetentionField(),
	redactedDocuments: newRetentionField(),
});
function fieldToRetention(f: RetentionField): Retention {
	return f.mode === "days" ? { mode: "days", days: f.days } : { mode: f.mode };
}

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
	retention.value = {
		auditLogs: newRetentionField(),
		originalDocuments: newRetentionField(),
		redactedDocuments: newRetentionField(),
	};
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
		// 0.17 nests these under a required settings object.
		settings: {
			ocr: ocr.value,
			requireApproval: requireApproval.value,
			retention: {
				auditLogs: fieldToRetention(retention.value.auditLogs),
				originalDocuments: fieldToRetention(retention.value.originalDocuments),
				redactedDocuments: fieldToRetention(retention.value.redactedDocuments),
			},
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
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{{ t("workspace.create.title") }}</DialogTitle>
        <DialogDescription>
          {{ t("workspace.create.description") }}
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="isFormValid && !isCreating && createWorkspace()">
        <div class="grid gap-5 py-4">
          <!-- Error Alert -->
          <Alert v-if="createError" variant="destructive">
            <AlertDescription>
              {{ createError.message || t("workspace.create.error") }}
            </AlertDescription>
          </Alert>

          <!-- Workspace Name -->
          <div class="grid gap-2">
            <Label for="display-name">
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
                <Switch
                  id="require-approval"
                  :model-value="requireApproval"
                  @update:model-value="requireApproval = $event"
                />
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
            <CollapsibleContent class="pt-4 space-y-2.5">
              <div
                v-for="target in RETENTION_TARGETS"
                :key="target"
                class="flex items-center justify-between gap-3"
              >
                <span class="text-sm text-muted-foreground">
                  {{
                    t(`settings.workspace.options.retention.targets.${target}`)
                  }}
                </span>
                <div class="flex items-center gap-2">
                  <Input
                    v-if="retention[target].mode === 'days'"
                    v-model.number="retention[target].days"
                    type="number"
                    min="1"
                    class="h-9 w-20"
                  />
                  <Select v-model="retention[target].mode">
                    <SelectTrigger class="h-9 w-[150px] shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="m in RETENTION_MODES"
                        :key="m"
                        :value="m"
                      >
                        {{
                          t(`settings.workspace.options.retention.modes.${m}`)
                        }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter>
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
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
