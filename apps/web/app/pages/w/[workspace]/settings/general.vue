<script setup lang="ts">
import { Upload, Copy, Check, Loader2 } from "@lucide/vue";
import { toast } from "vue-sonner";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { Textarea } from "#console/components/ui/textarea";
import { Switch } from "#console/components/ui/switch";
import EntityAvatar from "#console/components/common/EntityAvatar.vue";
import { Avatar, AvatarImage } from "#console/components/ui/avatar";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "#console/components/ui/alert-dialog";

useHead({ title: "Workspace Settings" });

definePageMeta({
	pageCategory: "Settings",
});

const { t } = useI18n();

// Composables
const {
	currentWorkspace,
	currentWorkspaceSlug,
	isLoading: isLoadingWorkspaces,
	updateWorkspaceAsync,
	isUpdating,
	deleteWorkspaceAsync,
	isDeleting,
	uploadAvatarAsync,
	isUploadingAvatar,
	deleteAvatarAsync,
	isDeletingAvatar,
} = useWorkspaces();
const { resolveAvatarUrl } = useAvatarUrl();

const { leaveAsync, isLeaving } = useMembers();

// Local object-URL for instant feedback while an upload is in flight; cleared
// once the refreshed workspace carries the server-side avatarUrl.
const avatarPreview = ref("");
const avatarSrc = computed(
	() =>
		avatarPreview.value || resolveAvatarUrl(currentWorkspace.value?.avatarUrl),
);

// Form state - use empty string as initial value
const workspaceName = ref("");
const workspaceDescription = ref("");
const requireApproval = ref<boolean | undefined>(undefined);
const copiedWorkspaceId = ref(false);

// Dialog state
const isLeaveDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const deleteConfirmName = ref("");

// Track if form has been initialized
const formInitialized = ref(false);

// Initialize form from workspace data
watch(
	() => currentWorkspace.value,
	(workspace) => {
		if (workspace && !formInitialized.value) {
			workspaceName.value = workspace.displayName;
			workspaceDescription.value = workspace.description ?? "";
			requireApproval.value = workspace.requireApproval;
			formInitialized.value = true;
		}
	},
	{ immediate: true },
);

// Reset form when workspace changes
watch(
	() => currentWorkspaceSlug.value,
	() => {
		// Reset so the next workspace data triggers re-initialization
		formInitialized.value = false;
		workspaceName.value = "";
		workspaceDescription.value = "";
		requireApproval.value = undefined;
	},
);

// Check if current user is owner
const isOwner = computed(() => currentWorkspace.value?.memberRole === "owner");

// Check if info has changed
const hasInfoChanges = computed(() => {
	if (!currentWorkspace.value || !formInitialized.value) return false;
	return (
		workspaceName.value !== currentWorkspace.value.displayName ||
		workspaceDescription.value !== (currentWorkspace.value.description ?? "")
	);
});

// Check if options have changed
const hasOptionsChanges = computed(() => {
	if (!currentWorkspace.value || requireApproval.value === undefined)
		return false;
	return requireApproval.value !== currentWorkspace.value.requireApproval;
});

// Functions
function copyWorkspaceId() {
	if (!currentWorkspaceSlug.value) return;
	navigator.clipboard.writeText(currentWorkspaceSlug.value);
	copiedWorkspaceId.value = true;
	toast.success(t("settings.workspace.messages.idCopied"));
	setTimeout(() => {
		copiedWorkspaceId.value = false;
	}, 2000);
}

async function saveWorkspaceInfo() {
	const workspaceSlug = currentWorkspaceSlug.value;
	if (!workspaceSlug) return;

	try {
		await updateWorkspaceAsync({
			workspaceSlug,
			updates: {
				displayName: workspaceName.value,
				description: workspaceDescription.value || undefined,
			},
		});
		toast.success(t("settings.workspace.messages.saved"));
	} catch (err) {
		toast.error(t("settings.workspace.errors.saveFailed"), {
			description: getErrorMessage(err, t("common.errors.tryAgain")),
		});
	}
}

async function saveWorkspaceOptions() {
	const workspaceSlug = currentWorkspaceSlug.value;
	if (!workspaceSlug) return;

	try {
		await updateWorkspaceAsync({
			workspaceSlug,
			updates: {
				requireApproval: requireApproval.value,
			},
		});
		toast.success(t("settings.workspace.messages.optionsSaved"));
	} catch (err) {
		toast.error(t("settings.workspace.errors.saveFailed"), {
			description: getErrorMessage(err, t("common.errors.tryAgain")),
		});
	}
}

function pickAvatar() {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = "image/*";
	input.onchange = (e) => {
		const file = (e.target as HTMLInputElement)?.files?.[0];
		if (file) uploadAvatar(file);
	};
	input.click();
}

async function uploadAvatar(file: File) {
	const workspaceSlug = currentWorkspaceSlug.value;
	if (!workspaceSlug) return;
	avatarPreview.value = URL.createObjectURL(file);
	try {
		await uploadAvatarAsync({ workspaceSlug, avatar: file });
		toast.success(t("settings.workspace.messages.avatarUploaded"));
	} catch (error) {
		toast.error(t("settings.workspace.errors.avatarUploadFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	} finally {
		URL.revokeObjectURL(avatarPreview.value);
		avatarPreview.value = "";
	}
}

async function removeAvatar() {
	const workspaceSlug = currentWorkspaceSlug.value;
	if (!workspaceSlug) return;
	try {
		await deleteAvatarAsync(workspaceSlug);
		toast.success(t("settings.workspace.messages.avatarRemoved"));
	} catch (error) {
		toast.error(t("settings.workspace.errors.avatarRemoveFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}

async function handleLeaveWorkspace() {
	try {
		await leaveAsync();
		isLeaveDialogOpen.value = false;
		toast.success(t("settings.workspace.messages.left"));
		navigateTo("/");
	} catch (err) {
		toast.error(t("settings.workspace.errors.leaveFailed"), {
			description: getErrorMessage(err, t("common.errors.tryAgain")),
		});
	}
}

async function handleDeleteWorkspace() {
	if (!currentWorkspaceSlug.value) return;

	try {
		await deleteWorkspaceAsync(currentWorkspaceSlug.value);
		isDeleteDialogOpen.value = false;
		deleteConfirmName.value = "";
		toast.success(t("settings.workspace.messages.deleted"));
		navigateTo("/");
	} catch (err) {
		toast.error(t("settings.workspace.errors.deleteFailed"), {
			description: getErrorMessage(err, t("common.errors.tryAgain")),
		});
	}
}

// Validate delete confirmation
const canDelete = computed(() => {
	if (!currentWorkspace.value) return false;
	return deleteConfirmName.value === currentWorkspace.value.displayName;
});
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
        <!-- Workspace Avatar -->
        <Card class="py-0 pt-6 rounded-xl border-border/50">
          <CardContent>
            <div class="flex items-start justify-between">
              <div class="space-y-1">
                <Label class="text-sm font-medium">{{
                  t("settings.workspace.avatar.label")
                }}</Label>
                <p class="text-xs text-muted-foreground">
                  {{ t("settings.workspace.avatar.description") }}
                </p>
                <Button
                  v-if="avatarSrc"
                  variant="ghost"
                  size="sm"
                  class="-ml-2 h-7 font-normal text-muted-foreground"
                  :disabled="isDeletingAvatar || isUploadingAvatar"
                  @click="removeAvatar"
                >
                  <Loader2
                    v-if="isDeletingAvatar"
                    :size="14"
                    class="mr-1.5 animate-spin"
                  />
                  {{ t("settings.workspace.avatar.remove") }}
                </Button>
              </div>
              <button
                type="button"
                :disabled="isUploadingAvatar || isDeletingAvatar"
                @click="pickAvatar"
                class="group relative hover:opacity-80 transition-opacity cursor-pointer block disabled:cursor-default disabled:opacity-60"
              >
                <Avatar v-if="avatarSrc" class="size-12">
                  <AvatarImage
                    :src="avatarSrc"
                    :alt="currentWorkspace.displayName"
                  />
                </Avatar>
                <EntityAvatar
                  v-else
                  :name="currentWorkspace.displayName"
                  size="lg"
                />
                <div
                  class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full transition-opacity"
                  :class="
                    isUploadingAvatar
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100'
                  "
                >
                  <Loader2
                    v-if="isUploadingAvatar"
                    :size="20"
                    class="animate-spin text-white"
                  />
                  <Upload v-else :size="20" class="text-white" />
                </div>
              </button>
            </div>
          </CardContent>
          <CardFooter
            class="border-t border-border/50 pb-6 bg-muted/30 rounded-b-xl"
          >
            <p class="text-xs text-muted-foreground">
              {{ t("settings.workspace.avatar.footer") }}
            </p>
          </CardFooter>
        </Card>

        <!-- Workspace Info Card -->
        <Card class="py-0 pt-6 rounded-xl border-border/50">
          <CardContent class="space-y-6">
            <!-- Workspace Name -->
            <div class="space-y-2">
              <Label for="workspaceName" class="text-sm font-medium">{{
                t("settings.workspace.name.label")
              }}</Label>
              <Input
                id="workspaceName"
                v-model="workspaceName"
                :placeholder="t('settings.workspace.name.placeholder')"
                class="max-w-md h-9"
              />
              <p class="text-xs text-muted-foreground">
                {{ t("settings.workspace.name.description") }}
              </p>
            </div>

            <!-- Workspace Description -->
            <div class="space-y-2">
              <Label for="workspaceDescription" class="text-sm font-medium">{{
                t("settings.workspace.description.label")
              }}</Label>
              <Textarea
                id="workspaceDescription"
                v-model="workspaceDescription"
                :placeholder="t('settings.workspace.description.placeholder')"
                class="max-w-md resize-none"
                :rows="3"
              />
              <p class="text-xs text-muted-foreground">
                {{ t("settings.workspace.description.description") }}
              </p>
            </div>

            <!-- Workspace ID -->
            <div class="space-y-2">
              <Label for="workspaceId" class="text-sm font-medium">{{
                t("settings.workspace.id.label")
              }}</Label>
              <div class="flex gap-2 max-w-md">
                <Input
                  id="workspaceId"
                  :model-value="currentWorkspaceSlug ?? ''"
                  readonly
                  class="flex-1 font-mono text-sm h-9 bg-muted/50 border-border/50 text-muted-foreground"
                />
                <Button
                  variant="outline"
                  size="sm"
                  @click="copyWorkspaceId"
                  class="flex items-center justify-center size-9 p-0"
                >
                  <Check
                    v-if="copiedWorkspaceId"
                    :size="16"
                    class="text-green-500"
                  />
                  <Copy v-else :size="16" />
                </Button>
              </div>
              <p class="text-xs text-muted-foreground">
                {{ t("settings.workspace.id.description") }}
              </p>
            </div>
          </CardContent>
          <CardFooter
            class="border-t border-border/50 pb-6 bg-muted/30 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-xs text-muted-foreground">
              {{ t("settings.workspace.info.footer") }}
            </p>
            <Button
              size="sm"
              @click="saveWorkspaceInfo"
              :disabled="isUpdating || !hasInfoChanges"
            >
              <Loader2 v-if="isUpdating" :size="16" class="mr-2 animate-spin" />
              {{ t("common.save") }}
            </Button>
          </CardFooter>
        </Card>

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

          </CardContent>
          <CardFooter
            class="border-t border-border/50 pb-6 bg-muted/30 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-xs text-muted-foreground">
              {{ t("settings.workspace.options.footer") }}
            </p>
            <Button
              size="sm"
              @click="saveWorkspaceOptions"
              :disabled="isUpdating || !hasOptionsChanges"
            >
              <Loader2 v-if="isUpdating" :size="16" class="mr-2 animate-spin" />
              {{ t("common.save") }}
            </Button>
          </CardFooter>
        </Card>

        <!-- Leave Workspace -->
        <Card
          class="py-0 pt-6 border border-red-200 dark:border-red-900/50 rounded-xl"
        >
          <CardHeader class="pb-4">
            <CardTitle
              class="text-xs font-medium tracking-wide uppercase text-muted-foreground"
              >{{ t("settings.workspace.leave.title") }}</CardTitle
            >
            <CardDescription class="text-sm">{{
              t("settings.workspace.leave.description")
            }}</CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-xs text-muted-foreground">
              {{ t("settings.workspace.leave.content") }}
            </p>
          </CardContent>
          <CardFooter
            class="border-t pb-6 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-xs text-red-600 dark:text-red-400">
              {{ t("settings.workspace.leave.warning") }}
            </p>
            <Button
              size="sm"
              variant="destructive"
              @click="isLeaveDialogOpen = true"
              :disabled="isLeaving"
            >
              <Loader2 v-if="isLeaving" :size="16" class="mr-2 animate-spin" />
              {{ t("settings.workspace.leave.button") }}
            </Button>
          </CardFooter>
        </Card>

        <!-- Delete Workspace (only shown for owners) -->
        <Card
          v-if="isOwner"
          class="py-0 pt-6 border border-red-200 dark:border-red-900/50 rounded-xl"
        >
          <CardHeader class="pb-4">
            <CardTitle
              class="text-xs font-medium tracking-wide uppercase text-muted-foreground"
              >{{ t("settings.workspace.delete.title") }}</CardTitle
            >
            <CardDescription class="text-sm">{{
              t("settings.workspace.delete.description")
            }}</CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-xs text-muted-foreground">
              {{ t("settings.workspace.delete.content") }}
            </p>
          </CardContent>
          <CardFooter
            class="border-t pb-6 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-xs text-red-600 dark:text-red-400">
              {{ t("settings.workspace.delete.warning") }}
            </p>
            <Button
              size="sm"
              variant="destructive"
              @click="isDeleteDialogOpen = true"
              :disabled="isDeleting"
            >
              <Loader2 v-if="isDeleting" :size="16" class="mr-2 animate-spin" />
              {{ t("settings.workspace.delete.button") }}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <!-- No workspace state -->
      <div v-else class="flex items-center justify-center py-12">
        <p class="text-sm text-muted-foreground">
          {{ t("settings.workspace.noWorkspace") }}
        </p>
      </div>
    </div>

    <!-- Leave Workspace Dialog -->
    <AlertDialog v-model:open="isLeaveDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{
            t("settings.workspace.leave.dialog.title")
          }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t("settings.workspace.leave.dialog.description") }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isLeaving">{{
            t("common.cancel")
          }}</AlertDialogCancel>
          <AlertDialogAction
            @click="handleLeaveWorkspace"
            :disabled="isLeaving"
            class="bg-red-600 hover:bg-red-700"
          >
            <Loader2 v-if="isLeaving" :size="16" class="mr-2 animate-spin" />
            {{ t("settings.workspace.leave.button") }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Delete Workspace Dialog -->
    <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{
            t("settings.workspace.delete.dialog.title")
          }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{
              t("settings.workspace.delete.dialog.description", {
                name: currentWorkspace?.displayName,
              })
            }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div class="py-4">
          <Label for="deleteConfirm" class="text-sm font-medium">
            {{
              t("settings.workspace.delete.dialog.confirmLabel", {
                name: currentWorkspace?.displayName,
              })
            }}
          </Label>
          <Input
            id="deleteConfirm"
            v-model="deleteConfirmName"
            :placeholder="currentWorkspace?.displayName"
            class="mt-2"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel
            :disabled="isDeleting"
            @click="deleteConfirmName = ''"
            >{{ t("common.cancel") }}</AlertDialogCancel
          >
          <AlertDialogAction
            @click="handleDeleteWorkspace"
            :disabled="isDeleting || !canDelete"
            class="bg-red-600 hover:bg-red-700"
          >
            <Loader2 v-if="isDeleting" :size="16" class="mr-2 animate-spin" />
            {{ t("settings.workspace.delete.button") }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
