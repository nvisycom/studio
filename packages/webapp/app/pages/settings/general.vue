<script setup lang="ts">
import { NvisyApiError } from "@nvisy/sdk";
import { Upload, Copy, Check, Loader2 } from "lucide-vue-next";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import EntityAvatar from "@/components/common/EntityAvatar.vue";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

definePageMeta({
	pageCategory: "Settings",
});

const { t } = useI18n();
const router = useRouter();

function getErrorMessage(err: unknown, fallback: string): string {
	if (err instanceof NvisyApiError) {
		return err.message;
	}
	if (err instanceof Error) {
		return err.message;
	}
	return fallback;
}

// Composables
const {
	currentWorkspace,
	currentWorkspaceId,
	isLoading: isLoadingWorkspaces,
	updateWorkspaceAsync,
	isUpdating,
	deleteWorkspaceAsync,
	isDeleting,
} = useWorkspaces();

const { leaveAsync, isLeaving } = useMembers();

// Form state - use null to indicate "not yet initialized"
const workspaceName = ref<string | null>(null);
const workspaceDescription = ref<string | null>(null);
const requireApproval = ref<boolean | null>(null);
const enableComments = ref<boolean | null>(null);
const copiedWorkspaceId = ref(false);

// Dialog state
const isLeaveDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const deleteConfirmName = ref("");

// Initialize form from workspace data
watch(
	() => currentWorkspace.value,
	(workspace) => {
		if (workspace) {
			// Only initialize if not already set (first load)
			if (workspaceName.value === null) {
				workspaceName.value = workspace.displayName;
			}
			if (workspaceDescription.value === null) {
				workspaceDescription.value = workspace.description ?? "";
			}
			if (requireApproval.value === null) {
				requireApproval.value = workspace.requireApproval;
			}
			if (enableComments.value === null) {
				enableComments.value = workspace.enableComments;
			}
		}
	},
	{ immediate: true },
);

// Reset form when workspace changes
watch(
	() => currentWorkspaceId.value,
	() => {
		// Reset to null so the next workspace data triggers re-initialization
		workspaceName.value = null;
		workspaceDescription.value = null;
		requireApproval.value = null;
		enableComments.value = null;
	},
);

// Check if current user is owner
const isOwner = computed(() => currentWorkspace.value?.memberRole === "owner");

// Check if info has changed
const hasInfoChanges = computed(() => {
	if (!currentWorkspace.value || workspaceName.value === null) return false;
	return (
		workspaceName.value !== currentWorkspace.value.displayName ||
		workspaceDescription.value !== (currentWorkspace.value.description ?? "")
	);
});

// Check if options have changed
const hasOptionsChanges = computed(() => {
	if (!currentWorkspace.value || requireApproval.value === null) return false;
	return (
		requireApproval.value !== currentWorkspace.value.requireApproval ||
		enableComments.value !== currentWorkspace.value.enableComments
	);
});

// Functions
function copyWorkspaceId() {
	if (!currentWorkspaceId.value) return;
	navigator.clipboard.writeText(currentWorkspaceId.value);
	copiedWorkspaceId.value = true;
	toast.success(t("settings.workspace.messages.idCopied"));
	setTimeout(() => {
		copiedWorkspaceId.value = false;
	}, 2000);
}

async function saveWorkspaceInfo() {
	const workspaceId = currentWorkspaceId.value;
	if (!workspaceId) return;

	try {
		await updateWorkspaceAsync({
			workspaceId,
			updates: {
				displayName: workspaceName.value,
				description: workspaceDescription.value || null,
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
	const workspaceId = currentWorkspaceId.value;
	if (!workspaceId) return;

	try {
		await updateWorkspaceAsync({
			workspaceId,
			updates: {
				requireApproval: requireApproval.value,
				enableComments: enableComments.value,
			},
		});
		toast.success(t("settings.workspace.messages.optionsSaved"));
	} catch (err) {
		toast.error(t("settings.workspace.errors.saveFailed"), {
			description: getErrorMessage(err, t("common.errors.tryAgain")),
		});
	}
}

function uploadAvatar() {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = "image/*";
	input.onchange = (e) => {
		const file = (e.target as HTMLInputElement)?.files?.[0];
		if (file) {
			// TODO: Implement avatar upload when API supports it
			toast.info(t("settings.workspace.messages.avatarNotSupported"));
		}
	};
	input.click();
}

async function handleLeaveWorkspace() {
	try {
		await leaveAsync();
		isLeaveDialogOpen.value = false;
		toast.success(t("settings.workspace.messages.left"));
		router.push("/");
	} catch (err) {
		toast.error(t("settings.workspace.errors.leaveFailed"), {
			description: getErrorMessage(err, t("common.errors.tryAgain")),
		});
	}
}

async function handleDeleteWorkspace() {
	if (!currentWorkspaceId.value) return;

	try {
		await deleteWorkspaceAsync(currentWorkspaceId.value);
		isDeleteDialogOpen.value = false;
		deleteConfirmName.value = "";
		toast.success(t("settings.workspace.messages.deleted"));
		router.push("/");
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
    <div class="max-w-4xl mx-auto w-full">
      <!-- Loading State -->
      <div
        v-if="isLoadingWorkspaces"
        class="flex items-center justify-center py-12"
      >
        <Loader2 :size="32" class="animate-spin text-neutral-400" />
      </div>

      <div v-else-if="currentWorkspace" class="space-y-6">
        <!-- Workspace Avatar -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
        >
          <CardContent>
            <div class="flex items-start justify-between">
              <div class="space-y-1">
                <Label>{{ t("settings.workspace.avatar.label") }}</Label>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">
                  {{ t("settings.workspace.avatar.description") }}
                </p>
              </div>
              <button
                @click="uploadAvatar"
                class="group relative hover:opacity-80 transition-opacity cursor-pointer block"
              >
                <EntityAvatar :name="currentWorkspace.displayName" size="lg" />
                <div
                  class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                >
                  <Upload :size="20" class="text-white" />
                </div>
              </button>
            </div>
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
          >
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
              {{ t("settings.workspace.avatar.footer") }}
            </p>
          </CardFooter>
        </Card>

        <!-- Workspace Info Card -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
        >
          <CardContent class="space-y-6">
            <!-- Workspace Name -->
            <div class="space-y-2">
              <Label for="workspaceName">{{
                t("settings.workspace.name.label")
              }}</Label>
              <Input
                id="workspaceName"
                v-model="workspaceName"
                :placeholder="t('settings.workspace.name.placeholder')"
                class="max-w-md"
              />
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                {{ t("settings.workspace.name.description") }}
              </p>
            </div>

            <!-- Workspace Description -->
            <div class="space-y-2">
              <Label for="workspaceDescription">{{
                t("settings.workspace.description.label")
              }}</Label>
              <Textarea
                id="workspaceDescription"
                v-model="workspaceDescription"
                :placeholder="t('settings.workspace.description.placeholder')"
                class="max-w-md resize-none"
                :rows="3"
              />
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                {{ t("settings.workspace.description.description") }}
              </p>
            </div>

            <!-- Workspace ID -->
            <div class="space-y-2">
              <Label for="workspaceId">{{
                t("settings.workspace.id.label")
              }}</Label>
              <div class="flex gap-2 max-w-md">
                <Input
                  id="workspaceId"
                  :model-value="currentWorkspaceId ?? ''"
                  readonly
                  class="flex-1 font-mono text-sm bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                />
                <Button
                  variant="outline"
                  size="sm"
                  @click="copyWorkspaceId"
                  class="flex items-center justify-center w-10 h-10 p-0"
                >
                  <Check
                    v-if="copiedWorkspaceId"
                    :size="16"
                    class="text-green-500"
                  />
                  <Copy v-else :size="16" />
                </Button>
              </div>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                {{ t("settings.workspace.id.description") }}
              </p>
            </div>
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
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
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
        >
          <CardHeader>
            <CardTitle>{{ t("settings.workspace.options.title") }}</CardTitle>
            <CardDescription>{{
              t("settings.workspace.options.description")
            }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <!-- Require Approval -->
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label>{{
                  t("settings.workspace.options.requireApproval.label")
                }}</Label>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">
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

            <!-- Enable Comments -->
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <Label>{{
                  t("settings.workspace.options.enableComments.label")
                }}</Label>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">
                  {{
                    t("settings.workspace.options.enableComments.description")
                  }}
                </p>
              </div>
              <Switch
                :model-value="enableComments ?? false"
                @update:model-value="enableComments = $event"
              />
            </div>
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
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
          class="py-0 pt-6 border border-red-200 dark:border-red-900 rounded-xl"
        >
          <CardHeader>
            <CardTitle>{{ t("settings.workspace.leave.title") }}</CardTitle>
            <CardDescription>{{
              t("settings.workspace.leave.description")
            }}</CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              {{ t("settings.workspace.leave.content") }}
            </p>
          </CardContent>
          <CardFooter
            class="border-t pb-6 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-sm text-red-600 dark:text-red-400">
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
          class="py-0 pt-6 border border-red-200 dark:border-red-900 rounded-xl"
        >
          <CardHeader>
            <CardTitle>{{ t("settings.workspace.delete.title") }}</CardTitle>
            <CardDescription>{{
              t("settings.workspace.delete.description")
            }}</CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              {{ t("settings.workspace.delete.content") }}
            </p>
          </CardContent>
          <CardFooter
            class="border-t pb-6 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-sm text-red-600 dark:text-red-400">
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
        <p class="text-neutral-500 dark:text-neutral-400">
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
