<script setup lang="ts">
import AppSidebar from "#console/components/layout/sidebar/AppSidebar.vue";
import AppHeader from "#console/components/layout/AppHeader.vue";
import AppChat from "#console/components/layout/AppChat.vue";
import CommandMenu from "#console/components/layout/CommandMenu.vue";
import CreateWorkspaceSheet from "#console/components/shared/CreateWorkspaceSheet.vue";
import { CreatePolicyDialog } from "#console/components/pages/policies";
import { CreatePipelineDialog } from "#console/components/pages/workflows";
import { Loader2 } from "@lucide/vue";
import {
	SidebarInset,
	SidebarProvider,
	SidebarRail,
} from "#console/components/ui/sidebar";
import { Toaster } from "#console/components/ui/sonner";
import "vue-sonner/style.css";

// The command palette and the create-workspace sheet are shell-wide singletons
// (driven by useCommandMenu / useCreateWorkspace), mounted once here rather than
// inside a sidebar item — any trigger anywhere opens the one instance.
const { isOpen: createWorkspaceOpen } = useCreateWorkspace();

const { workspaces, currentWorkspaceSlug } = useWorkspaces();

// Guard the workspace slug in the URL. Once the list loads, if the
// /w/[workspace] slug isn't one the user belongs to (foreign or stale), send
// them to "/", which re-resolves a valid workspace (or onboarding). Done in the
// layout because membership can only be checked once the async list loads.
const isValidWorkspace = computed(() => {
	const list = workspaces.value;
	const slug = currentWorkspaceSlug.value;
	if (!list || !slug) return true; // not yet known — don't redirect
	return list.some((w) => w.slug === slug);
});

watch(
	isValidWorkspace,
	(valid) => {
		if (!valid) navigateTo("/", { replace: true });
	},
	{ immediate: true },
);

// Only mount the page once the workspace slug is known-valid, so pages don't
// fire data queries against a workspace the user can't access (which would
// error) while the guard above redirects.
const showPage = computed(
	() =>
		!currentWorkspaceSlug.value ||
		(!!workspaces.value && isValidWorkspace.value),
);
</script>

<template>
  <SidebarProvider>
    <!-- The three grid tracks of the shell: sidebar, the toggle rail (in the
         gap), and the content card. See SidebarProvider for the grid. -->
    <AppSidebar />
    <SidebarRail />
    <SidebarInset>
      <AppHeader />
      <div class="relative flex flex-1 flex-col min-h-0 overflow-y-auto">
        <slot v-if="showPage" />
        <div v-else class="flex flex-1 items-center justify-center">
          <Loader2 :size="24" class="animate-spin text-muted-foreground" />
        </div>
      </div>
    </SidebarInset>
    <!-- The global chat rail: the shell's `[chat]` grid track on desktop, an
         overlay sheet on mobile. Mounted once so it's available on every page,
         but only while a workspace is active — the chat is workspace-scoped and
         its open watcher fetches sessions for the current workspace. -->
    <AppChat v-if="currentWorkspaceSlug" />
  </SidebarProvider>

  <!-- Shell-wide singletons: the ⌘K palette and the create dialogs, so any
       trigger (palette, page button, overview step) opens the one instance. -->
  <CommandMenu />
  <CreateWorkspaceSheet v-model:open="createWorkspaceOpen" />
  <CreatePolicyDialog />
  <CreatePipelineDialog />

  <ClientOnly>
    <Toaster />
  </ClientOnly>
</template>
