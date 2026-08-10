<script setup lang="ts">
import type { OcrPolicy, Retention } from "@nvisy/sdk/datatypes";
import { Loader2 } from "@lucide/vue";
import { toast } from "vue-sonner";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
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

// Retention is modelled per target as a mode + day count; only "days" uses the
// count. Targets: audit logs, original documents, redacted documents.
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

function retentionToField(r: Retention): RetentionField {
	return r.mode === "days"
		? { mode: "days", days: r.days }
		: { mode: r.mode, days: 30 };
}
function fieldToRetention(f: RetentionField): Retention {
	return f.mode === "days" ? { mode: "days", days: f.days } : { mode: f.mode };
}

/**
 * Structural equality for two `Retention` values — same mode, and same day
 * count when the mode is "days". Avoids JSON.stringify, whose key order differs
 * between the form-built object and the SDK's, which made the form look dirty.
 */
function retentionEquals(a: Retention, b: Retention): boolean {
	if (a.mode !== b.mode) return false;
	return a.mode === "days" && b.mode === "days" ? a.days === b.days : true;
}

// Initialize the form from workspace data (once it loads / the workspace
// changes).
const formInitialized = ref(false);
watch(
	() => currentWorkspace.value,
	(workspace) => {
		if (workspace && !formInitialized.value) {
			requireApproval.value = workspace.settings.requireApproval;
			ocr.value = workspace.settings.ocr;
			const r = workspace.settings.retention;
			retention.value = {
				auditLogs: retentionToField(r.auditLogs),
				originalDocuments: retentionToField(r.originalDocuments),
				redactedDocuments: retentionToField(r.redactedDocuments),
			};
			formInitialized.value = true;
		}
	},
	{ immediate: true },
);

// Re-initialize when the workspace changes.
watch(
	() => currentWorkspaceSlug.value,
	() => {
		formInitialized.value = false;
		requireApproval.value = undefined;
		ocr.value = "auto";
		retention.value = {
			auditLogs: newRetentionField(),
			originalDocuments: newRetentionField(),
			redactedDocuments: newRetentionField(),
		};
	},
);

// The full WorkspaceSettings the form currently represents, used both for change
// detection and for the save payload.
const editedSettings = computed(() => ({
	ocr: ocr.value,
	requireApproval: requireApproval.value ?? false,
	retention: {
		auditLogs: fieldToRetention(retention.value.auditLogs),
		originalDocuments: fieldToRetention(retention.value.originalDocuments),
		redactedDocuments: fieldToRetention(retention.value.redactedDocuments),
	},
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
	const saved = ws.settings.retention;
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
        <Loader2 :size="32" class="animate-spin text-muted-foreground" />
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
                <Label class="text-sm font-medium">{{
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
                <Label class="text-sm font-medium">{{
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
          <CardContent class="space-y-2.5">
            <div
              v-for="target in RETENTION_TARGETS"
              :key="target"
              class="flex items-center justify-between gap-3"
            >
              <span class="text-sm text-muted-foreground">
                {{ t(`settings.workspace.options.retention.targets.${target}`) }}
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
                    <SelectItem v-for="m in RETENTION_MODES" :key="m" :value="m">
                      {{ t(`settings.workspace.options.retention.modes.${m}`) }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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
