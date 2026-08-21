<script setup lang="ts">
import type { OcrPolicy, Retention } from "@nvisy/sdk/datatypes";
import { Loader2 } from "@lucide/vue";
import { toast } from "vue-sonner";
import { Button } from "#console/components/ui/button";
import { Label } from "#console/components/ui/label";
import { Switch } from "#console/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";
import { RetentionFields } from "#console/components/common";
import { OCR_POLICIES } from "#console/utils/ocr";
import {
	RETENTION_TARGETS,
	defaultRetentionForm,
	formToRetention,
	retentionEquals,
	retentionToForm,
} from "#console/utils/retention";

useHead({ title: "Workspace Data" });

definePageMeta({
	pageCategory: "header.category.settings",
});

const { t } = useI18n();

const {
	currentWorkspace,
	currentWorkspaceSlug,
	isLoading: isLoadingWorkspaces,
	updateWorkspaceAsync,
	isUpdating,
} = useWorkspaces();

const requireApproval = ref<boolean | undefined>(undefined);
const ocr = ref<OcrPolicy>("auto");

// Retention state (shared model in utils/retention).
const retention = ref(defaultRetentionForm());

// Whether the form has been populated from a loaded workspace (change detection
// stays off until then).
const formInitialized = ref(false);

// Initialize the form from workspace data whenever the loaded workspace changes
// (first load or a workspace switch). A single watcher keyed on the workspace
// avoids a reset-then-init race: two separate watchers (on the workspace and its
// slug) both fire on a route change, and pre-flush order would let the reset run
// after the init and blank the just-filled form.
watch(
	() => currentWorkspace.value,
	(workspace) => {
		if (!workspace) return;
		requireApproval.value = workspace.settings.requireApproval;
		// `ocr` and `retention` are optional in the SDK; fall back to the SDK's
		// own defaults (ocr "auto"; retention "forever" per scope, in the helper).
		ocr.value = workspace.settings.ocr ?? "auto";
		retention.value = retentionToForm(workspace.settings.retention);
		formInitialized.value = true;
	},
	{ immediate: true },
);

// The full WorkspaceSettings the form currently represents, used both for change
// detection and for the save payload.
const editedSettings = computed(() => ({
	ocr: ocr.value,
	requireApproval: requireApproval.value ?? false,
	retention: formToRetention(retention.value),
}));

// The Options card (approval + OCR) and the Retention card each enable their own
// Save when their fields changed; both save the whole settings object.
const hasOptionsChanges = computed(() => {
	const ws = currentWorkspace.value;
	if (!ws || !formInitialized.value) return false;
	return (
		editedSettings.value.requireApproval !== ws.settings.requireApproval ||
		editedSettings.value.ocr !== ws.settings.ocr
	);
});
const hasRetentionChanges = computed(() => {
	const ws = currentWorkspace.value;
	if (!ws || !formInitialized.value) return false;
	const edited = editedSettings.value.retention;
	// Normalize the saved retention the same way the form is loaded, so missing
	// (SDK-defaulted) scopes compare against the form's "forever" defaults.
	const saved = formToRetention(retentionToForm(ws.settings.retention));
	return RETENTION_TARGETS.some(
		(target) => !retentionEquals(edited[target], saved[target]),
	);
});

async function saveWorkspaceSettings() {
	const workspaceSlug = currentWorkspaceSlug.value;
	const workspace = currentWorkspace.value;
	if (!workspaceSlug || !workspace) return;

	try {
		await updateWorkspaceAsync({
			workspaceSlug,
			updates: { settings: editedSettings.value },
		});
		toast.success(t("settings.workspace.messages.optionsSaved"));
	} catch (err) {
		toast.error(t("settings.workspace.errors.saveFailed"), {
			description: getErrorMessage(err, t("common.errors.tryAgain")),
		});
	}
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-3xl mx-auto w-full">
      <!-- Loading State -->
      <div
        v-if="isLoadingWorkspaces"
        class="flex items-center justify-center py-12"
      >
        <Loader2 :size="24" class="animate-spin text-muted-foreground" />
      </div>

      <div v-else-if="currentWorkspace" class="space-y-6">
        <!-- Workspace Options Card -->
        <Card class="py-0 pt-6 rounded-xl border-border/50">
          <CardHeader class="pb-4">
            <CardTitle
              class="text-xs font-medium tracking-wide uppercase text-muted-foreground"
              >{{ t("settings.workspace.options.title") }}</CardTitle
            >
            <CardDescription class="text-sm">{{
              t("settings.workspace.options.description")
            }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <!-- Require Approval -->
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label >{{
                  t("settings.workspace.options.requireApproval.label")
                }}</Label>
                <p class="text-xs text-muted-foreground">
                  {{
                    t("settings.workspace.options.requireApproval.description")
                  }}
                </p>
              </div>
              <Switch
                :model-value="requireApproval ?? false"
                @update:model-value="requireApproval = $event"
              />
            </div>

            <!-- OCR policy -->
            <div class="flex items-center justify-between gap-4">
              <div class="space-y-0.5">
                <Label >{{
                  t("settings.workspace.options.ocr.label")
                }}</Label>
                <p class="text-xs text-muted-foreground">
                  {{ t("settings.workspace.options.ocr.description") }}
                </p>
              </div>
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
          </CardContent>
          <CardFooter
            class="border-t border-border/50 pb-6 bg-muted/30 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-xs text-muted-foreground">
              {{ t("settings.workspace.options.footer") }}
            </p>
            <Button
              size="sm"
              @click="saveWorkspaceSettings"
              :disabled="isUpdating || !hasOptionsChanges"
            >
              <Loader2 v-if="isUpdating" :size="16" class="mr-2 animate-spin" />
              {{ t("common.save") }}
            </Button>
          </CardFooter>
        </Card>

        <!-- Retention Card -->
        <Card class="py-0 pt-6 rounded-xl border-border/50">
          <CardHeader class="pb-4">
            <CardTitle
              class="text-xs font-medium tracking-wide uppercase text-muted-foreground"
              >{{ t("settings.workspace.options.retention.label") }}</CardTitle
            >
            <CardDescription class="text-sm">{{
              t("settings.workspace.options.retention.description")
            }}</CardDescription>
          </CardHeader>
          <CardContent>
            <RetentionFields v-model:retention="retention" />
          </CardContent>
          <CardFooter
            class="border-t border-border/50 pb-6 bg-muted/30 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-xs text-muted-foreground">
              {{ t("settings.workspace.options.retention.footer") }}
            </p>
            <Button
              size="sm"
              @click="saveWorkspaceSettings"
              :disabled="isUpdating || !hasRetentionChanges"
            >
              <Loader2 v-if="isUpdating" :size="16" class="mr-2 animate-spin" />
              {{ t("common.save") }}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
</template>
