<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Layers, Loader2, ChevronDown } from "lucide-vue-next";
import type { CreateWorkspace } from "@nvisy/sdk";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

const { t } = useI18n();
const open = defineModel<boolean>("open", { required: true });

const { createWorkspaceAsync, isCreating, createError } = useWorkspaces();

// Form state
const displayName = ref("");
const description = ref("");
const keepForDays = ref<string>("");
const autoCleanup = ref(true);
const requireApproval = ref(false);
const maxStorageGb = ref<string>("");
const enableComments = ref(true);

// Advanced settings
const advancedOpen = ref(false);

const isFormValid = computed(() => {
	return displayName.value.trim().length >= 3;
});

function resetForm() {
	displayName.value = "";
	description.value = "";
	keepForDays.value = "";
	autoCleanup.value = true;
	requireApproval.value = false;
	maxStorageGb.value = "";
	enableComments.value = true;
	advancedOpen.value = false;
}

// Reset form when modal closes
watch(open, (isOpen) => {
	if (!isOpen) {
		resetForm();
	}
});

async function createWorkspace() {
	// Convert days to seconds (1 day = 86400 seconds)
	const keepForSec = keepForDays.value
		? parseInt(keepForDays.value) * 86400
		: undefined;
	// Convert GB to MB (1 GB = 1024 MB)
	const maxStorageMb = maxStorageGb.value
		? parseInt(maxStorageGb.value) * 1024
		: undefined;

	const workspaceData: CreateWorkspace = {
		displayName: displayName.value.trim(),
		description: description.value.trim() || undefined,
		keepForSec: keepForSec,
		autoCleanup: autoCleanup.value,
		requireApproval: requireApproval.value,
		maxStorage: maxStorageMb,
		enableComments: enableComments.value,
	};

	try {
		await createWorkspaceAsync(workspaceData);
		open.value = false;
	} catch (error) {
		console.error("Failed to create workspace:", error);
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
            <!-- File Retention & Storage Limit -->
            <div class="grid grid-cols-2 gap-4">
              <div class="grid gap-2">
                <Label for="keep-for">{{
                  t("workspace.create.retentionLabel")
                }}</Label>
                <Input
                  id="keep-for"
                  v-model="keepForDays"
                  type="number"
                  min="1"
                  :placeholder="t('workspace.create.unlimited')"
                />
              </div>

              <div class="grid gap-2">
                <Label for="max-storage">{{
                  t("workspace.create.storageLabel")
                }}</Label>
                <Input
                  id="max-storage"
                  v-model="maxStorageGb"
                  type="number"
                  min="1"
                  max="1024"
                  :placeholder="t('workspace.create.unlimited')"
                />
              </div>
            </div>

            <!-- Toggle Options -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="space-y-0.5">
                  <Label for="auto-cleanup">{{
                    t("workspace.create.autoCleanupLabel")
                  }}</Label>
                  <p class="text-xs text-muted-foreground font-light">
                    {{ t("workspace.create.autoCleanupDescription") }}
                  </p>
                </div>
                <Switch id="auto-cleanup" v-model:checked="autoCleanup" />
              </div>

              <div class="flex items-center justify-between">
                <div class="space-y-0.5">
                  <Label for="require-approval">{{
                    t("workspace.create.requireApprovalLabel")
                  }}</Label>
                  <p class="text-xs text-muted-foreground font-light">
                    {{ t("workspace.create.requireApprovalDescription") }}
                  </p>
                </div>
                <Switch
                  id="require-approval"
                  v-model:checked="requireApproval"
                />
              </div>

              <div class="flex items-center justify-between">
                <div class="space-y-0.5">
                  <Label for="enable-comments">{{
                    t("workspace.create.enableCommentsLabel")
                  }}</Label>
                  <p class="text-xs text-muted-foreground font-light">
                    {{ t("workspace.create.enableCommentsDescription") }}
                  </p>
                </div>
                <Switch id="enable-comments" v-model:checked="enableComments" />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="open = false" class="cursor-pointer">
          {{ t("workspace.create.cancelButton") }}
        </Button>
        <Button
          @click="createWorkspace"
          :disabled="!isFormValid || isCreating"
          class="cursor-pointer"
        >
          <Loader2 v-if="isCreating" class="mr-2 h-4 w-4 animate-spin" />
          <Layers v-else :size="16" class="mr-2" />
          {{ t("workspace.create.submitButton") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
