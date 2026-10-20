<script setup lang="ts">
import type { CreateWorkspace } from "@nvisy/sdk/datatypes";
import { FolderOpen, Layers, Loader2, User } from "@lucide/vue";
import { toast } from "vue-sonner";
import { Button } from "#console/components/ui/button";
import CreateWorkspaceSheet from "#console/components/shared/CreateWorkspaceSheet.vue";

const { t } = useI18n();
const { firstName } = useAccount();
const { isAuthenticated } = useAuth();
const { createWorkspaceAsync } = useWorkspaces();
const { host } = useNativeHost();

const isCreateWorkspaceSheetOpen = ref(false);

// Two onboarding paths, on their own axes:
//  - "Open a folder" is gated on the host capability, not the platform: it shows
//    wherever the native folder picker exists (desktop), no account needed.
//  - "Create workspace" is a server action, shown when signed in.
// On signed-in desktop both appear; on web only create; logged-out desktop only
// the folder path.
const canOpenFolder = computed(() => !!host.value.pickFolder);
const canCreateServer = isAuthenticated;
const isOpeningFolder = ref(false);

async function openFolder() {
	const pickFolder = host.value.pickFolder;
	if (!pickFolder || isOpeningFolder.value) return;
	isOpeningFolder.value = true;
	try {
		const folder = await pickFolder();
		if (!folder) return; // Cancelled the picker.
		// Name the workspace after the folder's last path segment.
		const name = folder.split(/[/\\]/).filter(Boolean).pop() ?? "Workspace";
		await createWorkspaceAsync({
			displayName: name,
			folder,
		} as CreateWorkspace);
	} catch (error) {
		toast.error(t("overview.welcome.openFolderFailed"), {
			description: getErrorMessage(error, t("common.errors.tryAgain")),
		});
	} finally {
		isOpeningFolder.value = false;
	}
}
</script>

<template>
  <div class="flex min-h-[60vh] flex-col items-center justify-center">
    <div class="mx-auto w-full max-w-md text-center">
      <h1 class="mb-3 text-2xl font-semibold tracking-tight text-foreground">
        {{ t("overview.welcome.titleFirst")
        }}<span v-if="firstName">, {{ firstName }}</span
        >!
      </h1>
      <p class="mb-8 text-sm leading-relaxed text-muted-foreground">
        {{ canCreateServer ? t("overview.welcome.description") : t("overview.welcome.localDescription") }}
      </p>

      <div class="flex items-center justify-center gap-3">
        <!-- Open a folder (desktop): creates a local folder-workspace, no account. -->
        <Button
          v-if="canOpenFolder"
          size="default"
          class="cursor-pointer gap-2"
          :disabled="isOpeningFolder"
          data-testid="onboarding-open-folder"
          @click="openFolder"
        >
          <Loader2 v-if="isOpeningFolder" :size="16" class="animate-spin" />
          <FolderOpen v-else :size="16" />
          {{ t("overview.welcome.openFolder") }}
        </Button>

        <!-- Create a server workspace (signed in). -->
        <Button
          v-if="canCreateServer"
          size="default"
          :variant="canOpenFolder ? 'outline' : 'default'"
          class="cursor-pointer gap-2"
          data-testid="onboarding-create-workspace"
          @click="isCreateWorkspaceSheetOpen = true"
        >
          <Layers :size="16" />
          {{ t("overview.welcome.createWorkspace") }}
        </Button>

        <!-- Profile setup (web onboarding only — desktop leads with the folder). -->
        <Button
          v-if="canCreateServer && !canOpenFolder"
          as-child
          size="default"
          variant="outline"
          class="gap-2"
        >
          <NuxtLink to="/account/general">
            <User :size="16" />
            {{ t("overview.welcome.setupProfile") }}
          </NuxtLink>
        </Button>
      </div>
    </div>

    <CreateWorkspaceSheet v-model:open="isCreateWorkspaceSheetOpen" />
  </div>
</template>
