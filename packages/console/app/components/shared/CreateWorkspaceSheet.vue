<script setup lang="ts">
import {
	Loader2,
	ChevronDown,
	HardDrive,
	Cloud,
	FolderOpen,
	Check,
} from "@lucide/vue";
import { toast } from "vue-sonner";
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
import { Switch } from "#console/components/ui/switch";
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
const { isAuthenticated } = useAuth();
const { host } = useNativeHost();

// The two workspace kinds, each available on its own axis: a local folder-
// workspace needs the native folder-picker capability (desktop, no account); a
// remote one needs a session. On signed-in desktop both are offered; on web only
// remote; on logged-out desktop only local.
const canLocal = computed(() => !!host.value.pickFolder);
const canRemote = isAuthenticated;
type Mode = "local" | "remote";
const mode = ref<Mode>("remote");
// Both kinds offered → a real choice; one kind → that one, no card row.
const showTypeChoice = computed(() => canLocal.value && canRemote.value);

// Shared form state
const displayName = ref("");
const description = ref("");

// Remote-only form state
const slug = ref("");
const raster = ref<RasterPolicy>("auto");
const retention = ref(defaultRetentionForm());

// Review approval policy (SDK defaults: one approval; the author may approve).
const minApprovals = ref(1);
const authorCanApprove = ref(true);

// Local-only form state
const folder = ref<string | null>(null);

// The slug is immutable and always derived from the workspace name.
watch(displayName, (value) => {
	slug.value = slugify(value);
});

// Collapsible sections (remote advanced)
const advancedOpen = ref(false);
const retentionOpen = ref(false);

const isFormValid = computed(() => {
	if (displayName.value.trim().length < 3) return false;
	// A local workspace also needs a folder chosen.
	if (mode.value === "local") return !!folder.value;
	return true;
});

function resetForm() {
	// Default the mode to the only (or the richer) option available.
	mode.value = canRemote.value ? "remote" : "local";
	displayName.value = "";
	slug.value = "";
	description.value = "";
	raster.value = "auto";
	retention.value = defaultRetentionForm();
	minApprovals.value = 1;
	authorCanApprove.value = true;
	folder.value = null;
	advancedOpen.value = false;
	retentionOpen.value = false;
}

// Reset form when the sheet closes (and initialize the mode on open).
watch(open, (isOpen) => {
	if (isOpen) {
		mode.value = canRemote.value ? "remote" : "local";
	} else {
		resetForm();
	}
});

// Pick the folder for a local workspace; default the name from its last segment.
const isChoosingFolder = ref(false);
async function chooseFolder() {
	const pickFolder = host.value.pickFolder;
	if (!pickFolder || isChoosingFolder.value) return;
	isChoosingFolder.value = true;
	try {
		const picked = await pickFolder();
		if (!picked) return; // Cancelled.
		folder.value = picked;
		if (!displayName.value.trim()) {
			displayName.value =
				picked.split(/[/\\]/).filter(Boolean).pop() ?? "Workspace";
		}
	} catch (error) {
		toast.error(t("workspace.create.folderError"), {
			description: getErrorMessage(error, t("common.errors.tryAgain")),
		});
	} finally {
		isChoosingFolder.value = false;
	}
}

async function createWorkspace() {
	const name = displayName.value.trim();
	// A local workspace carries its folder (and skips the server-only settings);
	// a remote one carries the slug + raster/retention.
	const workspaceData: CreateWorkspace =
		mode.value === "local"
			? ({ displayName: name, folder: folder.value } as CreateWorkspace)
			: {
					displayName: name,
					...(slug.value && { handle: slug.value }),
					description: description.value.trim() || undefined,
					settings: {
						raster: raster.value,
						retention: formToRetention(retention.value),
						review: {
							minApprovals: minApprovals.value,
							authorCanApprove: authorCanApprove.value,
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

/** The last two segments of the chosen folder path, for display. */
const folderDisplay = computed(() => {
	if (!folder.value) return "";
	const parts = folder.value.split(/[/\\]/).filter(Boolean);
	return parts.length <= 2 ? folder.value : `…/${parts.slice(-2).join("/")}`;
});
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

          <!-- Type choice (only when both kinds are available). -->
          <div v-if="showTypeChoice" class="grid grid-cols-2 gap-3">
            <button
              v-for="opt in [
                { value: 'local', icon: HardDrive, title: 'typeLocalTitle', hint: 'typeLocalHint' },
                { value: 'remote', icon: Cloud, title: 'typeRemoteTitle', hint: 'typeRemoteHint' },
              ]"
              :key="opt.value"
              type="button"
              class="flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-colors"
              :class="mode === opt.value
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border/60 hover:border-border hover:bg-muted/40'"
              @click="mode = opt.value as Mode"
            >
              <div class="flex w-full items-center gap-2">
                <component :is="opt.icon" :size="16" class="text-foreground" />
                <span class="text-sm font-medium">{{ t(`workspace.create.${opt.title}`) }}</span>
                <Check
                  v-if="mode === opt.value"
                  :size="15"
                  class="ml-auto text-primary"
                />
              </div>
              <span class="text-xs text-muted-foreground">
                {{ t(`workspace.create.${opt.hint}`) }}
              </span>
            </button>
          </div>

          <!-- LOCAL: a folder + a name. -->
          <template v-if="mode === 'local'">
            <div class="space-y-2">
              <Label>{{ t("workspace.create.folderLabel") }}</Label>
              <div
                v-if="folder"
                class="flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5"
              >
                <HardDrive :size="16" class="shrink-0 text-muted-foreground" />
                <span class="min-w-0 flex-1 truncate font-mono text-sm">{{ folderDisplay }}</span>
                <button
                  type="button"
                  class="shrink-0 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  @click="chooseFolder"
                >
                  {{ t("workspace.create.folderChange") }}
                </button>
              </div>
              <Button
                v-else
                type="button"
                variant="outline"
                class="h-10 w-full justify-start gap-2"
                :disabled="isChoosingFolder"
                @click="chooseFolder"
              >
                <Loader2 v-if="isChoosingFolder" :size="16" class="animate-spin" />
                <FolderOpen v-else :size="16" />
                {{ t("workspace.create.folderChoose") }}
              </Button>
              <p class="text-xs text-muted-foreground">
                {{ t("workspace.create.folderHint") }}
              </p>
            </div>

            <div class="space-y-2">
              <Label for="local-name" required>
                {{ t("workspace.create.nameLabel") }}
              </Label>
              <Input
                id="local-name"
                v-model="displayName"
                :placeholder="t('workspace.create.namePlaceholder')"
                maxlength="100"
              />
            </div>
          </template>

          <!-- REMOTE: the full server form. -->
          <template v-else>
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

              <!-- Review: required approvals -->
              <div class="flex items-center justify-between gap-4">
                <Label class="font-normal">{{
                  t("settings.workspace.reviews.minApprovals.label")
                }}</Label>
                <Input
                  v-model.number="minApprovals"
                  type="number"
                  min="1"
                  max="100"
                  class="h-9 w-20 shrink-0"
                />
              </div>

              <!-- Review: author can approve -->
              <div class="flex items-center justify-between gap-4">
                <Label class="font-normal">{{
                  t("settings.workspace.reviews.authorCanApprove.label")
                }}</Label>
                <Switch v-model="authorCanApprove" class="shrink-0" />
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
          </template>
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
            {{ mode === "local" ? t("workspace.create.submitLocalButton") : t("workspace.create.submitButton") }}
          </Button>
        </SheetFooter>
      </form>
    </SheetContent>
  </Sheet>
</template>
