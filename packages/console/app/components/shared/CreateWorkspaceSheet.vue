<script setup lang="ts">
import { Loader2, ChevronDown } from "@lucide/vue";
import type { CreateWorkspace, RasterPolicy } from "@nvisy/sdk/datatypes";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";
import { Alert, AlertDescription } from "#console/components/ui/alert";
import { RetentionFields } from "#console/components/pages/settings";
import { RASTER_POLICIES } from "#console/utils/raster";
import {
	defaultRetentionForm,
	formToRetention,
} from "#console/utils/retention";
import { slugify } from "#console/utils/naming";

const { t } = useI18n();
const open = defineModel<boolean>("open", { required: true });

const { createWorkspaceAsync, isCreating, createError } = useWorkspaces();

// Form state
const displayName = ref("");
const slug = ref("");
const description = ref("");
const raster = ref<RasterPolicy>("auto");
const retention = ref(defaultRetentionForm());

// The slug is immutable and always derived from the workspace name.
watch(displayName, (value) => {
	slug.value = slugify(value);
});

// Collapsible sections
const advancedOpen = ref(false);
const retentionOpen = ref(false);

const isFormValid = computed(() => {
	return displayName.value.trim().length >= 3;
});

function resetForm() {
	displayName.value = "";
	slug.value = "";
	description.value = "";
	raster.value = "auto";
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
		...(slug.value && { slug: slug.value }),
		description: description.value.trim() || undefined,
		settings: {
			raster: raster.value,
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
      class="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
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
        <div class="flex-1 space-y-6 overflow-y-auto p-6">
          <!-- Error Alert -->
          <Alert v-if="createError" variant="destructive">
            <AlertDescription>
              {{ createError.message || t("workspace.create.error") }}
            </AlertDescription>
          </Alert>

          <!-- Workspace Name + Slug -->
          <div class="grid gap-5 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="display-name" required>
                {{ t("workspace.create.nameLabel") }}
              </Label>
              <Input
                id="display-name"
                v-model="displayName"
                data-testid="workspace-name"
                :placeholder="t('workspace.create.namePlaceholder')"
                maxlength="100"
              />
            </div>
            <div class="space-y-2">
              <Label for="workspace-slug">{{
                t("workspace.create.slugLabel")
              }}</Label>
              <Input
                id="workspace-slug"
                :model-value="slug"
                readonly
                tabindex="-1"
                aria-readonly="true"
                class="font-mono text-sm text-muted-foreground"
                :placeholder="t('workspace.create.slugPlaceholder')"
              />
              <p class="text-xs text-muted-foreground">
                {{ t("workspace.create.slugHint") }}
              </p>
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-2">
            <Label for="description">{{
              t("workspace.create.descriptionLabel")
            }}</Label>
            <Textarea
              id="description"
              v-model="description"
              :placeholder="t('workspace.create.descriptionPlaceholder')"
              class="min-h-[72px]"
              maxlength="200"
            />
          </div>

          <!-- Advanced Settings -->
          <Collapsible v-model:open="advancedOpen" class="space-y-3">
            <CollapsibleTrigger as-child>
              <button
                type="button"
                class="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {{ t("workspace.create.advancedSettings") }}
                <ChevronDown
                  :size="16"
                  class="transition-transform"
                  :class="advancedOpen ? 'rotate-180' : ''"
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent class="space-y-5">
              <!-- Raster policy -->
              <div class="flex items-center justify-between gap-4">
                <Label class="font-normal">{{
                  t("settings.workspace.options.raster.label")
                }}</Label>
                <Select v-model="raster">
                  <SelectTrigger class="h-9 w-[200px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="p in RASTER_POLICIES" :key="p" :value="p">
                      {{ t(`settings.workspace.options.raster.policies.${p}`) }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <!-- Retention -->
          <Collapsible v-model:open="retentionOpen" class="space-y-3">
            <CollapsibleTrigger as-child>
              <button
                type="button"
                class="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {{ t("settings.workspace.options.retention.label") }}
                <ChevronDown
                  :size="16"
                  class="transition-transform"
                  :class="retentionOpen ? 'rotate-180' : ''"
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <RetentionFields v-model:retention="retention" />
            </CollapsibleContent>
          </Collapsible>
        </div>

        <SheetFooter class="flex-row justify-end border-t border-border/50">
          <Button type="button" variant="outline" @click="open = false">
            {{ t("workspace.create.cancelButton") }}
          </Button>
          <Button
            type="submit"
            data-testid="workspace-submit"
            :disabled="!isFormValid || isCreating"
          >
            <Loader2 v-if="isCreating" class="mr-2 h-4 w-4 animate-spin" />
            {{ t("workspace.create.submitButton") }}
          </Button>
        </SheetFooter>
      </form>
    </SheetContent>
  </Sheet>
</template>
